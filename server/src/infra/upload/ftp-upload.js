import * as path from "node:path";
import { AppError } from "../../shared/errors/AppError.js";
import { ok } from "../../shared/http/response.js";
import { generalMessagesCodes, messagesNames } from "@dms/shared";
import { LocalStorageProvider } from "./local-disk-storage.provider.js";
import { buildAssetAccessUrl } from "./asset-access.js";
import { storageKeyFromUploadReference } from "./upload-reference.js";

const TK = messagesNames.generalMessages;

// used
export async function uploadAsHttp(req, res) {
  try {
    if (!req.file?.buffer || !req.file?.originalname) {
      throw new AppError({
        code: generalMessagesCodes.FILE_UPLOAD_ERROR,
        statusCode: 400,
        translationKey: TK,
      });
    }
    const filename = path.basename(req.file.originalname);
    const fileBuffer = req.file.buffer;
    const authorizedFilename = path.basename(String(req.scoped?.subject || ""));
    if (!authorizedFilename || authorizedFilename !== filename) {
      throw new AppError({
        code: generalMessagesCodes.FILE_UPLOAD_ERROR,
        statusCode: 401,
        translationKey: TK,
      });
    }

    await LocalStorageProvider.saveBufferAs(fileBuffer, filename);

    res.locals.preserveCanonicalAssetReferences = true;
    return ok(
      res,
      {
        originalName: filename,
        url: `/uploads/${filename}`,
        accessUrl: buildAssetAccessUrl(`/uploads/${filename}`),
      },
      generalMessagesCodes.CREATED,
      TK,
    );
  } catch (err) {
    console.error("? Upload error:", err.message);
    if (err instanceof AppError) throw err;
    throw new AppError({
      code: generalMessagesCodes.FILE_UPLOAD_ERROR,
      statusCode: 500,
      translationKey: TK,
      reason: err?.code || null,
    });
  }
}
// used
export async function uploadToFTPHttpAsBuffer(
  source,
  remoteFilename,
  isBuffer = false,
) {
  console.log("Uploading to FTP via HTTP as buffer:", remoteFilename);
  console.log(source.length, "Buffer size in bytes");
  try {
    let buffer;

    if (isBuffer) {
      if (Buffer.isBuffer(source)) {
        buffer = source;
      } else if (source instanceof Uint8Array) {
        buffer = Buffer.from(source.buffer);
      } else {
        throw new Error("Invalid buffer source type.");
      }
    } else {
      throw new Error("HTTP upload expects a buffer.");
    }

    const storageKey = storageKeyFromUploadReference(remoteFilename, {
      allowAnyOrigin: true,
    });
    if (!storageKey) throw new Error("Invalid upload destination.");
    await LocalStorageProvider.saveBufferAs(buffer, storageKey);
    const url = `/uploads/${storageKey}`;

    console.log(`? Uploaded via HTTP: ${url}`);
  } catch (err) {
    console.error(`? Failed to upload ${remoteFilename}:`, err.message);
    throw err;
  }
}
