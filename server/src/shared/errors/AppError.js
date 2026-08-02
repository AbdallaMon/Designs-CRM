export class AppError extends Error {
  constructor({
    code,
    statusCode = 400,
    details = null,
    translationKey = null,
    redirectTo = null,
    redirectText = null,
    dontRedirect = false,
    reason = null,
  }) {
    if (
      typeof code !== "string" ||
      !/^[A-Z][A-Z0-9_]*$/.test(code)
    ) {
      throw new TypeError(
        "AppError code must be a SCREAMING_SNAKE_CASE message code",
      );
    }

    super(code);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
    this.translationKey = translationKey;
    this.redirectTo = redirectTo;
    this.redirectText = redirectText;
    this.dontRedirect = dontRedirect;
    this.reason = reason;
  }
}
