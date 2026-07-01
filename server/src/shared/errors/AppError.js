export class AppError extends Error {
  // Legacy positional form still works: new AppError(code, 403, details).
  // `options` adds the reason/redirect metadata (Transaction-app parity).
  constructor(message, statusCode = 400, details = null, options = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.code = options.code ?? message; // message already IS a code in this codebase
    this.translationKey = options.translationKey ?? null;
    this.redirectTo = options.redirectTo ?? null;
    this.redirectText = options.redirectText ?? null;
    this.dontRedirect = options.dontRedirect ?? false;
    this.reason = options.reason ?? null; // developer-facing; user reason = resolveMessage(code)
  }
}
