import { generalMessagesCodes, messagesNames } from "@dms/shared";

const GENERAL_MESSAGES = messagesNames.generalMessages;

function assertMessageCode(message) {
  if (
    typeof message !== "string" ||
    !/^[A-Z][A-Z0-9_]*$/.test(message)
  ) {
    throw new TypeError(
      "Response message must be a SCREAMING_SNAKE_CASE message code",
    );
  }
}

function successResponse(res, data, message, translationKey) {
  assertMessageCode(message);
  return res
    .status(200)
    .json({ success: true, message, data, translationKey });
}

export function ok(
  res,
  data,
  message = generalMessagesCodes.OK,
  translationKey = GENERAL_MESSAGES,
) {
  return successResponse(res, data, message, translationKey);
}

// HTTP 200 is intentional. The frontend data layer expects 200 after creates.
export function created(
  res,
  data,
  message = generalMessagesCodes.CREATED,
  translationKey = GENERAL_MESSAGES,
) {
  return successResponse(res, data, message, translationKey);
}

export function updated(
  res,
  data,
  message = generalMessagesCodes.UPDATED,
  translationKey = GENERAL_MESSAGES,
) {
  return successResponse(res, data, message, translationKey);
}

export function deleted(
  res,
  message = generalMessagesCodes.DELETED,
  translationKey = GENERAL_MESSAGES,
) {
  return successResponse(res, null, message, translationKey);
}

export function noContent(res) {
  return res.status(204).send();
}

function errorResponse(res, statusCode, message, details) {
  assertMessageCode(message);
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    translationKey: GENERAL_MESSAGES,
    details,
  });
}

export function badRequest(
  res,
  message = generalMessagesCodes.BAD_REQUEST,
  details = null,
) {
  return errorResponse(res, 400, message, details);
}

export function unauthorized(
  res,
  message = generalMessagesCodes.UNAUTHORIZED,
  details = null,
) {
  return errorResponse(res, 401, message, details);
}

export function forbidden(
  res,
  message = generalMessagesCodes.FORBIDDEN,
  details = null,
) {
  return errorResponse(res, 403, message, details);
}

export function notFound(
  res,
  message = generalMessagesCodes.NOT_FOUND,
  details = null,
) {
  return errorResponse(res, 404, message, details);
}

export function conflict(
  res,
  message = generalMessagesCodes.CONFLICT,
  details = null,
) {
  return errorResponse(res, 409, message, details);
}

export function internalServerError(
  res,
  message = generalMessagesCodes.INTERNAL_SERVER_ERROR,
  details = null,
) {
  return errorResponse(res, 500, message, details);
}
