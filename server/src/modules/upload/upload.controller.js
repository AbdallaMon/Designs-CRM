import { created, ok } from "../../shared/http/response.js";
import { uploadUsecase } from "./upload.usecase.js";
import { generalMessagesCodes, messagesNames } from "@dms/shared";

const TK = messagesNames.generalMessages;

class UploadController {
  authorizeAttachment = (req) =>
    uploadUsecase.authorizeAttachment({
      type: req.params.type,
      id: req.params.id,
      authUser: req.auth,
    });

  redirectAttachment = (req, res) => res.redirect(302, req.scoped.url);

  authorizePublicUpload = (req) =>
    uploadUsecase.authorizePublicUpload({
      purpose: req.query.purpose,
      token: req.get("x-upload-token"),
    });

  issuePublicCapability = async (req, res) => {
    const result = await uploadUsecase.issuePublicCapability(req.body);
    return created(res, result, generalMessagesCodes.CREATED, TK);
  };

  uploadHttp = async (req, res) => {
    const result = await uploadUsecase.uploadHttp({
      file: req.file,
      body: req.body,
    });

    res.locals.preserveCanonicalAssetReferences = true;
    return created(res, result, generalMessagesCodes.CREATED, TK);
  };

  uploadSingleFile = async (req, res) => {
    const result = await uploadUsecase.uploadSingleFile({
      file: req.file,
      body: req.body,
      purpose: req.scoped?.purpose ?? null,
      storageFolder: req.scoped
        ? `public/${req.scoped.purpose.toLowerCase().replaceAll("_", "-")}/${
            req.scoped.subject ?? req.scoped.sessionId
          }`
        : null,
    });

    res.locals.preserveCanonicalAssetReferences = true;
    return created(res, result, generalMessagesCodes.CREATED, TK);
  };

  uploadAsChunks = async (req, res) => {
    const result = await uploadUsecase.uploadAsChunks({
      file: req.file,
      body: req.body,
      accessScope:
        req.scoped?.namespace ??
        (req.auth?.id ? `USER:${req.auth.id}` : null),
      purpose: req.scoped?.purpose ?? null,
      storageFolder: req.scoped
        ? `public/${req.scoped.purpose.toLowerCase().replaceAll("_", "-")}/${
            req.scoped.subject ?? req.scoped.sessionId
          }`
        : null,
    });

    if (result.completed) {
      res.locals.preserveCanonicalAssetReferences = true;
      return created(res, result, generalMessagesCodes.CREATED, TK);
    }

    return ok(res, result, generalMessagesCodes.OK, TK);
  };

  authorizeContent = (req) =>
    uploadUsecase.authorizeContent({
      storageKey: req.params[0],
      expires: req.query.expires,
      signature: req.query.signature,
    });

  serveContent = async (req, res) => {
    const file = req.scoped;
    const isInline =
      /^(image|audio|video)\//.test(file.fileMimeType) ||
      file.fileMimeType === "application/pdf";
    const disposition = isInline ? "inline" : "attachment";
    const safeFilename = file.filename.replace(/["\\\r\n]/g, "_");
    const remainingSeconds = Math.max(
      0,
      file.expires - Math.floor(Date.now() / 1000),
    );

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cache-Control", `private, max-age=${remainingSeconds}`);
    res.setHeader("Content-Type", file.fileMimeType);
    res.setHeader("Content-Disposition", `${disposition}; filename="${safeFilename}"`);

    await new Promise((resolve, reject) => {
      res.sendFile(file.finalPath, (error) => (error ? reject(error) : resolve()));
    });
  };
}
export const uploadController = new UploadController();
