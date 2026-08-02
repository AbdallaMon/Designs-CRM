import { uploadAsHttp } from "../../../infra/upload/ftp-upload.js";
import { uploadUsecase } from "../../upload/upload.usecase.js";

export class UploadsController {
  authorizeInternalUpload = (req) =>
    uploadUsecase.authorizeInternalUpload({
      token: req.get("x-upload-token"),
    });

  uploadHttp = async (req, res) => uploadAsHttp(req, res);
}

export const uploadsController = new UploadsController();
