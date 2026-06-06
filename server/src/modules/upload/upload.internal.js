import { uploadUsecase } from "./upload.usecase.js";

export async function uploadInternalFile({
  buffer,
  originalName,
  folder,
  createThumbnail = false,
}) {
  return uploadUsecase.uploadInternal({
    buffer,
    originalName,
    folder,
    createThumbnail,
  });
}

export { uploadUsecase };
