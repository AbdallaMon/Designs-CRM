import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import mime from "mime-types";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { env } from "../../config/env.js";

const DEFAULT_UPLOAD_DIR = env.UPLOAD_DIR;
const DEFAULT_THUMBS_DIR = env.THUMBNAIL_DIR;
const DEFAULT_TMP_DIR = env.TEMP_UPLOAD_DIR;

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function sanitizeRelativeSegment(value = "") {
  return value
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");
}

function buildUniqueFilename(originalName) {
  return `${uuidv4()}-${Date.now()}${path.extname(originalName || "")}`;
}

function buildPublicUrl(basePath, storageKey) {
  const trimmedBasePath = basePath.replace(/\/+$/, "");
  const normalizedKey = String(storageKey || "").replace(/\\/g, "/");
  return `${trimmedBasePath}/${normalizedKey}`;
}

class LocalDiskStorageProvider {
  constructor({
    uploadDir = DEFAULT_UPLOAD_DIR,
    thumbsDir = DEFAULT_THUMBS_DIR,
    tempDir = DEFAULT_TMP_DIR,
  } = {}) {
    this.uploadDir = uploadDir;
    this.thumbsDir = thumbsDir;
    this.tempDir = tempDir;

    ensureDir(this.uploadDir);
    ensureDir(this.thumbsDir);
    ensureDir(this.tempDir);
  }

  createStorageTarget({ originalName, folder = "" }) {
    const uniqueFilename = buildUniqueFilename(originalName);
    const safeFolder = sanitizeRelativeSegment(folder);
    const storageKey = safeFolder
      ? `${safeFolder}/${uniqueFilename}`
      : uniqueFilename;
    const finalPath = path.join(this.uploadDir, ...storageKey.split("/"));

    ensureDir(path.dirname(finalPath));

    return {
      uniqueFilename,
      storageKey,
      finalPath,
      folder: safeFolder,
    };
  }

  getPublicUrl(storageKey) {
    return buildPublicUrl("/uploads", storageKey);
  }

  getThumbnailUrl(thumbnailKey) {
    return thumbnailKey ? buildPublicUrl("/uploads/thumb", thumbnailKey) : null;
  }

  async saveBuffer(buffer, originalName, options = {}) {
    const { storageKey, finalPath } = this.createStorageTarget({
      originalName,
      folder: options.folder,
    });

    await fs.promises.writeFile(finalPath, buffer);

    const fileMimeType = mime.lookup(originalName || storageKey) || null;
    const thumbnailKey =
      options.createThumbnail === false
        ? null
        : await this.createThumbnailIfImage(
            finalPath,
            storageKey,
            fileMimeType,
          );

    return {
      storageKey,
      fileMimeType,
      thumbnailKey,
      fileSize: Buffer.byteLength(buffer),
      fileUrl: this.getPublicUrl(storageKey),
      thumbnailUrl: this.getThumbnailUrl(thumbnailKey),
    };
  }

  async saveStream(readableStream, originalName, options = {}) {
    const { storageKey, finalPath } = this.createStorageTarget({
      originalName,
      folder: options.folder,
    });

    await pipeline(readableStream, fs.createWriteStream(finalPath));

    const stat = await fs.promises.stat(finalPath);
    const fileMimeType = mime.lookup(originalName || storageKey) || null;
    const thumbnailKey =
      options.createThumbnail === false
        ? null
        : await this.createThumbnailIfImage(
            finalPath,
            storageKey,
            fileMimeType,
          );

    return {
      storageKey,
      fileMimeType,
      thumbnailKey,
      fileSize: stat.size,
      fileUrl: this.getPublicUrl(storageKey),
      thumbnailUrl: this.getThumbnailUrl(thumbnailKey),
    };
  }

  async createThumbnailIfImage(finalPath, storageKey, fileMimeType = null) {
    const resolvedMimeType = fileMimeType || mime.lookup(storageKey) || "";
    if (!resolvedMimeType.startsWith("image/")) {
      return null;
    }

    try {
      const thumbnailPath = path.join(this.thumbsDir, ...storageKey.split("/"));
      ensureDir(path.dirname(thumbnailPath));
      await sharp(finalPath)
        .resize(200, 200, { fit: "inside" })
        .toFile(thumbnailPath);
      return storageKey;
    } catch (error) {
      console.error(`Error creating thumbnail for ${storageKey}:`, error);
      return null;
    }
  }

  async storeChunkPart({
    sourcePath,
    uploadSessionId,
    chunkIndex,
    tmpDir = this.tempDir,
  }) {
    const sessionId = sanitizeRelativeSegment(uploadSessionId) || uuidv4();
    ensureDir(tmpDir);

    const chunkPath = path.join(tmpDir, `${sessionId}.part${chunkIndex}`);
    await fs.promises.rename(sourcePath, chunkPath);

    return {
      uploadSessionId: sessionId,
      chunkPath,
      chunkIndex,
    };
  }

  async mergeChunkParts({
    tmpDir = this.tempDir,
    uploadSessionId,
    totalChunks,
    finalPath,
  }) {
    const sessionId = sanitizeRelativeSegment(uploadSessionId);
    if (!sessionId) {
      throw new Error("uploadSessionId is required");
    }

    // Validate all chunks exist before starting
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(tmpDir, `${sessionId}.part${i}`);
      if (!fs.existsSync(chunkPath)) {
        throw new Error(`Missing chunk file: ${chunkPath}`);
      }
    }

    // Use a single write stream, piping one chunk at a time via appendFile
    // to avoid adding multiple pipeline listeners to the same WriteStream
    try {
      await fs.promises.writeFile(finalPath, Buffer.alloc(0)); // create/truncate
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(tmpDir, `${sessionId}.part${i}`);
        const chunkData = await fs.promises.readFile(chunkPath);
        await fs.promises.appendFile(finalPath, chunkData);
      }
    } catch (error) {
      await fs.promises.unlink(finalPath).catch(() => {});
      throw error;
    }
  }

  async finalizeChunkedUpload({
    uploadSessionId,
    originalName,
    totalChunks,
    folder,
    createThumbnail = true,
    tmpDir = this.tempDir,
  }) {
    const { storageKey, finalPath } = this.createStorageTarget({
      originalName,
      folder,
    });

    try {
      await this.mergeChunkParts({
        tmpDir,
        uploadSessionId,
        totalChunks,
        finalPath,
      });
    } finally {
      await this.deleteTempChunks({ tmpDir, uploadSessionId, totalChunks });
    }

    const stat = await fs.promises.stat(finalPath);
    const fileMimeType = mime.lookup(originalName || storageKey) || null;
    const thumbnailKey = createThumbnail
      ? await this.createThumbnailIfImage(finalPath, storageKey, fileMimeType)
      : null;

    return {
      storageKey,
      fileMimeType,
      thumbnailKey,
      fileSize: stat.size,
      fileUrl: this.getPublicUrl(storageKey),
      thumbnailUrl: this.getThumbnailUrl(thumbnailKey),
    };
  }

  async deleteTempChunks({
    tmpDir = this.tempDir,
    uploadSessionId,
    totalChunks,
  }) {
    const sessionId = sanitizeRelativeSegment(uploadSessionId);
    if (!sessionId || !Number.isInteger(totalChunks) || totalChunks < 0) {
      return;
    }

    const deletes = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(tmpDir, `${sessionId}.part${i}`);
      if (fs.existsSync(chunkPath)) {
        deletes.push(fs.promises.unlink(chunkPath));
      }
    }

    await Promise.all(deletes);
  }

  async tryMakeThumbnail(finalPath, uniqueFilename) {
    const fileMimeType = mime.lookup(uniqueFilename) || null;
    const thumbnailKey = await this.createThumbnailIfImage(
      finalPath,
      uniqueFilename,
      fileMimeType,
    );
    return this.getThumbnailUrl(thumbnailKey);
  }
}

export const LocalStorageProvider = new LocalDiskStorageProvider();

export { ensureDir, sanitizeRelativeSegment, buildUniqueFilename };
