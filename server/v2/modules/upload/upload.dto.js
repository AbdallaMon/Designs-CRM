export function mapUploadResponse(
  result,
  originalName,
  uploadSessionId = null,
) {
  return {
    originalName,
    storageKey: result.storageKey,
    url: result.fileUrl,
    thumbnailUrl: result.thumbnailUrl,
    fileMimeType: result.fileMimeType,
    fileSize: result.fileSize,
    uploadSessionId,
  };
}
