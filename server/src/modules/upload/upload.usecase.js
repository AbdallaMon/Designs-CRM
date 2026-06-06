import path from "path";
import { performance } from "node:perf_hooks";
import {
  LocalStorageProvider,
  sanitizeRelativeSegment,
} from "../../infra/upload/local-disk-storage.provider.js";
import { AppError } from "../../shared/errors/AppError.js";
import { mapUploadResponse } from "./upload.dto.js";

function normalizeFolder(folder) {
  return sanitizeRelativeSegment(folder || "");
}

function buildChunkSessionId(filename, explicitSessionId) {
  return sanitizeRelativeSegment(
    explicitSessionId || path.parse(path.basename(filename)).name,
  );
}

export class UploadUsecase {
  async uploadHttp({ file, body = {} }) {
    return this.uploadSingleFile({ file, body });
  }

  async uploadSingleFile({ file, body = {} }) {
    if (!file?.buffer) {
      throw new AppError("No file uploaded", 400);
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

  async uploadAsChunks({ file, body = {} }) {
    if (!file?.path) {
      throw new AppError("No chunk uploaded", 400);
    }
    body.chunkIndex = Number(body.chunkIndex);
    body.totalChunks = Number(body.totalChunks);
    body.chunkSize = Number(body.chunkSize);
    const uploadSessionId = buildChunkSessionId(
      body.filename,
      body.uploadSessionId,
    );

    if (!uploadSessionId) {
      throw new AppError("uploadSessionId could not be resolved", 400);
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
      throw new AppError("buffer is required", 400);
    }

    const result = await LocalStorageProvider.saveBuffer(buffer, originalName, {
      folder: normalizeFolder(folder),
      createThumbnail,
    });

    return mapUploadResponse(result, originalName);
  }
}

export const uploadUsecase = new UploadUsecase();
