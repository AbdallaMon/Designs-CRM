import multer from "multer";
import {
  generalMessagesCodes,
  messagesNames,
} from "@dms/shared";
import { AppError } from "./AppError.js";

const TK = messagesNames.generalMessages;

export function notFoundHandler(req, res, next) {
  next(
    new AppError({
      code: generalMessagesCodes.NOT_FOUND,
      statusCode: 404,
      translationKey: TK,
      reason: `route not found: ${req.method} ${req.originalUrl}`,
    }),
  );
}

function multerCode(error) {
  if (error.code === "LIMIT_FILE_SIZE") return generalMessagesCodes.FILE_TOO_LARGE;
  if (error.code === "LIMIT_FILE_COUNT") return generalMessagesCodes.TOO_MANY_FILES;
  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return generalMessagesCodes.UNEXPECTED_FILE_FIELD;
  }
  return generalMessagesCodes.FILE_UPLOAD_ERROR;
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  console.error("Error caught by errorHandler:", err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      data: null,
      translationKey: err.translationKey,
      reason: err.reason,
      redirectTo: err.redirectTo,
      redirectText: err.redirectText,
      dontRedirect: err.dontRedirect,
      details: err.details,
      route: `${req.method} ${req.originalUrl}`,
    });
  }

  if (err instanceof multer.MulterError) {
    const code = multerCode(err);
    return res.status(400).json({
      success: false,
      message: code,
      code,
      data: null,
      translationKey: TK,
      reason: err.code,
      redirectTo: null,
      redirectText: null,
      dontRedirect: false,
      details: null,
      route: `${req.method} ${req.originalUrl}`,
    });
  }

  if (Number.isInteger(err?.code) && err.code >= 400 && err.code <= 599) {
    const code =
      err.code >= 500
        ? generalMessagesCodes.INTERNAL_SERVER_ERROR
        : generalMessagesCodes.UNEXPECTED_ERROR;
    return res.status(err.code).json({
      success: false,
      message: code,
      code,
      data: null,
      translationKey: TK,
      reason: null,
      redirectTo: null,
      redirectText: null,
      dontRedirect: false,
      details: null,
      route: `${req.method} ${req.originalUrl}`,
    });
  }

  console.error("Unexpected error:", err);
  return res.status(500).json({
    success: false,
    message: generalMessagesCodes.INTERNAL_SERVER_ERROR,
    code: generalMessagesCodes.INTERNAL_SERVER_ERROR,
    data: null,
    translationKey: TK,
    reason: null,
    redirectTo: null,
    redirectText: null,
    dontRedirect: false,
    details: null,
    route: `${req.method} ${req.originalUrl}`,
  });
}
