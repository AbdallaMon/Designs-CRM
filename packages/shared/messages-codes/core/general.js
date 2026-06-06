// Core, language-neutral message CODES. SCREAMING_SNAKE_CASE, key === value
// (the string IS the code). The client resolves (translationKey, code) to a
// displayed string via a single-language (Arabic) lookup map.
//
// SEED for Stage 1 — area-specific code files are added as modules migrate.
export const generalMessagesCodes = {
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  BAD_REQUEST: "BAD_REQUEST",
  CONFLICT: "CONFLICT",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
  OK: "OK",
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  DELETED: "DELETED",
  FILE_UPLOAD_ERROR: "FILE_UPLOAD_ERROR",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  TOO_MANY_FILES: "TOO_MANY_FILES",
  UNEXPECTED_FILE_FIELD: "UNEXPECTED_FILE_FIELD",
};
