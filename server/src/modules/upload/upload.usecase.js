import path from "path";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import {
  LocalStorageProvider,
  sanitizeRelativeSegment,
} from "../../infra/upload/local-disk-storage.provider.js";
import { AppError } from "../../shared/errors/AppError.js";
import { mapUploadResponse } from "./upload.dto.js";
import { JwtService } from "../../infra/security/jwt.js";
import { uploadRepository } from "./upload.repo.js";
import { PUBLIC_UPLOAD_PURPOSES, authMessagesCodes, generalMessagesCodes, messagesNames } from "@dms/shared";
import {
  issuePublicFunnelCapability,
  PUBLIC_FUNNEL_PURPOSES,
  verifyPublicFunnelCapability,
} from "../../infra/upload/public-funnel-capability.js";
import {
  assertChunkUploadBounds,
  validatePublicUploadContent,
} from "./upload.security.js";
import { verifyAssetAccess } from "../../infra/upload/asset-access.js";

function normalizeFolder(folder) {
  return sanitizeRelativeSegment(folder || "");
}

function buildChunkSessionId(filename, explicitSessionId, accessScope) {
  const namespace = createHash("sha256")
    .update(String(accessScope || "authenticated"))
    .digest("hex")
    .slice(0, 16);
  return sanitizeRelativeSegment(
    `${namespace}-${explicitSessionId || path.parse(path.basename(filename)).name}`,
  );
}

function uploadError(statusCode = 422) {
  return new AppError({
    code: generalMessagesCodes.FILE_UPLOAD_ERROR,
    statusCode,
    translationKey: messagesNames.generalMessages,
  });
}

function mapStoredUpload(result, originalName, uploadSessionId, purpose) {
  const response = mapUploadResponse(result, originalName, uploadSessionId);
  if (purpose) delete response.storageKey;
  return response;
}

export class UploadUsecase {
  async issuePublicCapability({ purpose, funnelToken }) {
    if (purpose !== PUBLIC_FUNNEL_PURPOSES.PUBLIC_LEAD_UPLOAD) {
      throw new AppError({
        code: authMessagesCodes.INVALID_TOKEN,
        statusCode: 401,
        translationKey: messagesNames.authMessages,
      });
    }
    const funnel = verifyPublicFunnelCapability(funnelToken, {
      purpose: PUBLIC_FUNNEL_PURPOSES.PUBLIC_REGISTER,
    });
    const draft = await uploadRepository.findPublicLeadDraftById({ id: funnel.leadId });
    if (!draft) {
      throw new AppError({
        code: authMessagesCodes.INVALID_TOKEN,
        statusCode: 401,
        translationKey: messagesNames.authMessages,
      });
    }

    return issuePublicFunnelCapability({
      purpose: PUBLIC_FUNNEL_PURPOSES.PUBLIC_LEAD_UPLOAD,
      leadId: draft.id,
    });
  }

  async authorizePublicUpload({ purpose, token }) {
    if (!token) throw new AppError({ code: authMessagesCodes.INVALID_TOKEN, statusCode: 401 });
    if (purpose === PUBLIC_UPLOAD_PURPOSES.PUBLIC_LEAD) {
      const payload = verifyPublicFunnelCapability(token, { purpose });
      const draft = await uploadRepository.findPublicLeadDraftById({ id: payload.leadId });
      if (!draft) throw new AppError({ code: authMessagesCodes.INVALID_TOKEN, statusCode: 401 });
      return {
        purpose,
        subject: String(payload.leadId),
        namespace: `${purpose}:${payload.leadId}`,
      };
    }

    const finders = {
      CONTRACT: () => uploadRepository.findContractByToken({ token }),
      IMAGE_SESSION: () => uploadRepository.findImageSessionByToken({ token }),
      CHAT: () => uploadRepository.findChatRoomByToken({ token }),
      CALENDAR: () => uploadRepository.findCalendarSessionByToken({ token }),
    };
    const session = await finders[purpose]?.();
    if (!session) throw new AppError({ code: authMessagesCodes.INVALID_TOKEN, statusCode: 401 });
    return {
      purpose,
      sessionId: session.id,
      namespace: `${purpose}:${session.id}`,
    };
  }

  authorizeInternalUpload({ token }) {
    if (!token) throw new AppError({ code: authMessagesCodes.INVALID_TOKEN, statusCode: 401 });
    let payload;
    try {
      payload = JwtService.verifyUploadCapability(token);
    } catch {
      throw new AppError({ code: authMessagesCodes.INVALID_TOKEN, statusCode: 401 });
    }
    if (payload.purpose !== "INTERNAL_PDF" || !payload.subject) {
      throw new AppError({ code: authMessagesCodes.INVALID_TOKEN, statusCode: 401 });
    }
    return {
      purpose: payload.purpose,
      subject: payload.subject,
      namespace: `${payload.purpose}:${payload.subject}`,
    };
  }

  async uploadHttp({ file, body = {} }) {
    return this.uploadSingleFile({ file, body });
  }

  async uploadSingleFile({
    file,
    body = {},
    purpose = null,
    storageFolder = null,
  }) {
    if (!file?.buffer) {
      throw new AppError({ code: generalMessagesCodes.FILE_UPLOAD_ERROR, statusCode: 400 });
    }

    if (purpose) {
      await validatePublicUploadContent({
        purpose,
        originalName: file.originalname,
        declaredMime: file.mimetype,
        buffer: file.buffer,
      });
    }

    let result;
    try {
      result = await LocalStorageProvider.saveBuffer(file.buffer, file.originalname, {
        folder: normalizeFolder(storageFolder ?? body.folder),
        createThumbnail: body.createThumbnail,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw uploadError(500);
    }

    return mapStoredUpload(result, file.originalname, null, purpose);
  }

  async uploadAsChunks({
    file,
    body = {},
    accessScope,
    purpose = null,
    storageFolder = null,
  }) {
    if (!file?.path) {
      throw new AppError({ code: generalMessagesCodes.FILE_UPLOAD_ERROR, statusCode: 400 });
    }
    body.chunkIndex = Number(body.chunkIndex);
    body.totalChunks = Number(body.totalChunks);
    body.chunkSize = Number(body.chunkSize);
    const uploadSessionId = buildChunkSessionId(
      body.filename,
      body.uploadSessionId,
      accessScope,
    );

    if (!uploadSessionId) {
      throw new AppError({ code: generalMessagesCodes.BAD_REQUEST, statusCode: 400 });
    }

    const existingBytes = await LocalStorageProvider.getChunkPartsTotalSize({
      uploadSessionId,
      totalChunks: body.totalChunks,
      excludeChunkIndex: body.chunkIndex,
    });
    try {
      assertChunkUploadBounds({
        purpose,
        totalChunks: body.totalChunks,
        totalBytes: existingBytes + (file.size || 0),
      });
    } catch (error) {
      await fs.promises.unlink(file.path).catch(() => {});
      throw error;
    }

    const chunkSize = body.chunkSize || file.size || 0;
    const chunkStart = performance.now();

    try {
      await LocalStorageProvider.storeChunkPart({
        sourcePath: file.path,
        uploadSessionId,
        chunkIndex: body.chunkIndex,
      });
    } catch {
      await fs.promises.unlink(file.path).catch(() => {});
      throw uploadError(500);
    }

    const durationMs = performance.now() - chunkStart;
    const uploadSpeed =
      durationMs > 0 ? Math.round((chunkSize / durationMs) * 1000) : 0; // bytes/second

    const isLastChunk = body.chunkIndex + 1 === body.totalChunks;
    if (!isLastChunk) {
      return {
        completed: false,
        uploadSessionId,
        chunkIndex: body.chunkIndex + 1,
        totalChunks: body.totalChunks,
        uploadSpeed,
      };
    }

    let result;
    try {
      result = await LocalStorageProvider.finalizeChunkedUpload({
        uploadSessionId,
        originalName: body.filename,
        totalChunks: body.totalChunks,
        folder: normalizeFolder(storageFolder ?? body.folder),
        createThumbnail: body.createThumbnail,
      });
    } catch {
      throw uploadError();
    }

    if (purpose) {
      try {
        const buffer = await fs.promises.readFile(result.finalPath);
        await validatePublicUploadContent({
          purpose,
          originalName: body.filename,
          declaredMime: file.mimetype,
          buffer,
          allowGenericMime: true,
        });
      } catch (error) {
        await LocalStorageProvider.deleteStoredFile(result);
        if (error instanceof AppError) throw error;
        throw uploadError(500);
      }
    }

    return {
      completed: true,
      chunkIndex: body.chunkIndex + 1,
      totalChunks: body.totalChunks,
      uploadSpeed,
      ...mapStoredUpload(result, body.filename, uploadSessionId, purpose),
    };
  }

  async uploadInternal({
    buffer,
    originalName,
    folder = "internal",
    createThumbnail = false,
  }) {
    if (!buffer) {
      throw new AppError({ code: generalMessagesCodes.BAD_REQUEST, statusCode: 400 });
    }

    let result;
    try {
      result = await LocalStorageProvider.saveBuffer(buffer, originalName, {
        folder: normalizeFolder(folder),
        createThumbnail,
      });
    } catch {
      throw uploadError(500);
    }

    return mapUploadResponse(result, originalName);
  }

  async authorizeContent({ storageKey, expires, signature }) {
    const access = verifyAssetAccess({ storageKey, expires, signature });
    if (!access) {
      throw new AppError({
        code: authMessagesCodes.INVALID_TOKEN,
        statusCode: 401,
        translationKey: messagesNames.authMessages,
      });
    }
    const file = await LocalStorageProvider.resolveStoredFile(access.storageKey);
    if (!file) {
      throw new AppError({ code: generalMessagesCodes.NOT_FOUND, statusCode: 404 });
    }
    return { ...file, expires: access.expires };
  }
}

export const uploadUsecase = new UploadUsecase();
