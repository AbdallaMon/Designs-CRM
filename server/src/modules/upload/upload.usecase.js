import path from "path";
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
import { authMessagesCodes, generalMessagesCodes } from "@dms/shared";
import { env } from "../../config/env.js";

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

export class UploadUsecase {
  issuePublicCapability({ purpose, subject }) {
    return {
      token: JwtService.signUploadCapability({ purpose, subject }),
      purpose,
      expiresIn: env.JWT_UPLOAD_EXPIRES_IN,
    };
  }

  async authorizePublicUpload({ purpose, token }) {
    if (!token) throw new AppError({ code: authMessagesCodes.INVALID_TOKEN, statusCode: 401 });
    if (purpose === "PUBLIC_LEAD") {
      let payload;
      try {
        payload = JwtService.verifyUploadCapability(token);
      } catch {
        throw new AppError({ code: authMessagesCodes.INVALID_TOKEN, statusCode: 401 });
      }
      if (payload.purpose !== purpose || !payload.subject) {
        throw new AppError({ code: authMessagesCodes.INVALID_TOKEN, statusCode: 401 });
      }
      return {
        purpose,
        subject: payload.subject,
        namespace: `${purpose}:${payload.subject}`,
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

  async uploadSingleFile({ file, body = {} }) {
    if (!file?.buffer) {
      throw new AppError({ code: generalMessagesCodes.FILE_UPLOAD_ERROR, statusCode: 400 });
    }

    const result = await LocalStorageProvider.saveBuffer(
      file.buffer,
      file.originalname,
      {
        folder: normalizeFolder(body.folder),
        createThumbnail: body.createThumbnail,
      },
    );

    return mapUploadResponse(result, file.originalname);
  }

  async uploadAsChunks({ file, body = {}, accessScope }) {
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

    const chunkSize = body.chunkSize || file.size || 0;
    const chunkStart = performance.now();

    await LocalStorageProvider.storeChunkPart({
      sourcePath: file.path,
      uploadSessionId,
      chunkIndex: body.chunkIndex,
    });

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

    const result = await LocalStorageProvider.finalizeChunkedUpload({
      uploadSessionId,
      originalName: body.filename,
      totalChunks: body.totalChunks,
      folder: normalizeFolder(body.folder),
      createThumbnail: body.createThumbnail,
    });

    return {
      completed: true,
      chunkIndex: body.chunkIndex + 1,
      totalChunks: body.totalChunks,
      uploadSpeed,
      ...mapUploadResponse(result, body.filename, uploadSessionId),
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

    const result = await LocalStorageProvider.saveBuffer(buffer, originalName, {
      folder: normalizeFolder(folder),
      createThumbnail,
    });

    return mapUploadResponse(result, originalName);
  }
}

export const uploadUsecase = new UploadUsecase();
