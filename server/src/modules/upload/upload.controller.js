import { created, ok } from "../../shared/http/response.js";
import { uploadUsecase } from "./upload.usecase.js";
import { generalMessagesCodes, messagesNames } from "@dms/shared";

const TK = messagesNames.generalMessages;

class UploadController {
  authorizePublicUpload = (req) =>
    uploadUsecase.authorizePublicUpload({
      purpose: req.query.purpose,
      token: req.get("x-upload-token"),
    });

  issuePublicCapability = async (req, res) => {
    const result = uploadUsecase.issuePublicCapability(req.body);
    return created(res, result, generalMessagesCodes.CREATED, TK);
  };

  uploadHttp = async (req, res) => {
    const result = await uploadUsecase.uploadHttp({
      file: req.file,
      body: req.body,
    });

    return created(res, result, generalMessagesCodes.CREATED, TK);
  };

  uploadSingleFile = async (req, res) => {
    const result = await uploadUsecase.uploadSingleFile({
      file: req.file,
      body: req.body,
    });

    return created(res, result, generalMessagesCodes.CREATED, TK);
  };

  uploadAsChunks = async (req, res) => {
    const result = await uploadUsecase.uploadAsChunks({
      file: req.file,
      body: req.body,
      accessScope:
        req.scoped?.namespace ??
        (req.auth?.id ? `USER:${req.auth.id}` : null),
    });

    if (result.completed) {
      return created(res, result, generalMessagesCodes.CREATED, TK);
    }

    return ok(res, result, generalMessagesCodes.OK, TK);
  };
}
export const uploadController = new UploadController();
