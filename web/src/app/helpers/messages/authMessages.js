// Single-language (Arabic) resolution for the AUTH surface and the common GENERIC
// envelope codes that the backend can emit on ANY endpoint. The backend stays
// language-neutral:
//   - auth codes:    packages/shared/messages-codes/auth/auth.js   (translationKey: authMessages)
//   - generic codes: packages/shared/messages-codes/core/general.js (shared envelope)
// This is the FE lookup. It mirrors the per-feature *Messages.js shape so the central
// resolver (lib/messages/resolveMessage.js) can fold it in alongside the feature maps.
// Authored here because, unlike every feature, the auth flow had NO message map and the
// generic data layer (handleRequestSubmit / getData / useRequest) surfaced the RAW code.

export const authMessages = {
  // ── auth: authentication errors ───────────────────────────────────────────────
  UNAUTHORIZED: "يجب تسجيل الدخول للمتابعة",
  INVALID_TOKEN: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول من جديد",
  TOKEN_EXPIRED: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول من جديد",
  INVALID_CREDENTIALS: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  ACCOUNT_BLOCKED: "تم إيقاف هذا الحساب، يرجى التواصل مع الإدارة",
  REFRESH_TOKEN_MISSING: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول من جديد",
  RESET_TOKEN_MISSING: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية",
  PASSWORD_MUST_DIFFER: "يجب أن تكون كلمة المرور الجديدة مختلفة عن السابقة",
  RATE_LIMIT_EXCEEDED: "عدد المحاولات كبير، يرجى المحاولة لاحقًا",

  // ── auth: authorization errors ────────────────────────────────────────────────
  FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء",
  ACCESS_DENIED: "لا تملك صلاحية الوصول إلى هذا العنصر",

  // ── auth: success ─────────────────────────────────────────────────────────────
  LOGIN_SUCCESS: "تم تسجيل الدخول بنجاح",
  LOGOUT_SUCCESS: "تم تسجيل الخروج بنجاح",
  TOKENS_REFRESHED: "تم تحديث الجلسة",
  PASSWORD_RESET_REQUESTED: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك",
  PASSWORD_RESET_REQUEST: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك",
  PASSWORD_CHANGED: "تم تغيير كلمة المرور بنجاح",
  PASSWORD_RESET_SUCCESS: "تم تغيير كلمة المرور بنجاح",
  CURRENT_USER_RETRIEVED: "تم جلب بيانات المستخدم",

  // ── generic envelope codes (shared core: messages-codes/core/general.js) ───────
  OK: "تمت العملية بنجاح",
  SUCCESS: "تمت العملية بنجاح",
  OPERATION_SUCCESS: "تمت العملية بنجاح",
  CREATED: "تم الإنشاء بنجاح",
  UPDATED: "تم التحديث بنجاح",
  DELETED: "تم الحذف بنجاح",
  NOT_FOUND: "العنصر المطلوب غير موجود",
  BAD_REQUEST: "طلب غير صالح",
  VALIDATION_ERROR: "بيانات غير صحيحة، يرجى مراجعة الحقول",
  CONFLICT: "تعارض في البيانات",
  TOO_MANY_REQUESTS: "عدد الطلبات كبير، يرجى المحاولة لاحقًا",
  SERVICE_UNAVAILABLE: "الخدمة غير متاحة حاليًا، يرجى المحاولة لاحقًا",
  INTERNAL_ERROR: "حدث خطأ في الخادم، يرجى المحاولة لاحقًا",
  INTERNAL_SERVER_ERROR: "حدث خطأ في الخادم، يرجى المحاولة لاحقًا",
  UNEXPECTED_ERROR: "حدث خطأ غير متوقع، يرجى المحاولة لاحقًا",

  // ── file upload (shared core) ─────────────────────────────────────────────────
  FILE_UPLOAD_ERROR: "فشل رفع الملف، يرجى المحاولة مرة أخرى",
  FILE_TOO_LARGE: "حجم الملف كبير جدًا",
  TOO_MANY_FILES: "عدد الملفات كبير جدًا",
  UNEXPECTED_FILE_FIELD: "حقل ملف غير متوقع",
};

/** Neutral Arabic fallback when a code is unknown and no explicit fallback is given. */
export const DEFAULT_FALLBACK_MESSAGE = "حدث خطأ ما، حاول مرة أخرى";

/**
 * Resolve an AUTH or GENERIC backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 * @returns {string}
 */
export function resolveAuthMessage(code, { fallback } = {}) {
  if (code && authMessages[code]) return authMessages[code];
  return fallback ?? DEFAULT_FALLBACK_MESSAGE;
}
