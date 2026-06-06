import { created, ok } from "../../shared/http/response.js";
import { uploadUsecase } from "./upload.usecase.js";

class UploadController {
  uploadHttp = async (req, res) => {
    const result = await uploadUsecase.uploadHttp({
      file: req.file,
      body: req.body,
    });

    return created(res, result, "File uploaded successfully");
  };

  uploadSingleFile = async (req, res) => {
    const result = await uploadUsecase.uploadSingleFile({
      file: req.file,
      body: req.body,
    });

    return created(res, result, "File uploaded successfully");
  };

  uploadAsChunks = async (req, res) => {
    const result = await uploadUsecase.uploadAsChunks({
      file: req.file,
      body: req.body,
    });

    if (result.completed) {
      return created(res, result, "Chunked upload completed successfully");
    }

    return ok(res, result, `Chunk ${result.chunkIndex + 1} received`);
  };
}
export const uploadController = new UploadController();
