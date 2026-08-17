import { buildAssetAccessUrl } from "../../infra/upload/asset-access.js";

export function mapUploadResponse(
  result,
  originalName,
  uploadSessionId = null,
) {
  return {
    originalName,
    storageKey: result.storageKey,
    url: result.fileUrl,
    accessUrl: buildAssetAccessUrl(result.fileUrl),
    thumbnailUrl: result.thumbnailUrl,
    thumbnailAccessUrl: result.thumbnailUrl
      ? buildAssetAccessUrl(result.thumbnailUrl)
      : null,
    fileMimeType: result.fileMimeType,
    fileSize: result.fileSize,
    uploadSessionId,
  };
}
