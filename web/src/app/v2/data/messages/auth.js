// Central Arabic map for the AUTH message CODES
// (packages/shared/messages-codes/auth/auth.js → authMessagesCodes).
// translationKey namespace: "authMessages". Emitted by the auth middleware, JWT
// verification, and scope checkers — returned across EVERY authenticated request, so
// these previously fell through feature resolvers and leaked the raw code. CODE → عربي.

export const authMessages = {
  // ── authentication ───────────────────────────────────────────────────────────
  UNAUTHORIZED: "انتهت الجلسة، يرجى تسجيل الدخول من جديد",
  INVALID_TOKEN: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول من جديد",
  INVALID_CREDENTIALS: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  ACCOUNT_BLOCKED: "تم إيقاف هذا الحساب، تواصل مع المسؤول",
  REFRESH_TOKEN_MISSING: "انتهت الجلسة، يرجى تسجيل الدخول من جديد",
  RESET_TOKEN_MISSING: "رابط إعادة التعيين غير صالح أو منتهٍ",
  PASSWORD_MUST_DIFFER: "يجب أن تختلف كلمة المرور الجديدة عن القديمة",
  RATE_LIMIT_EXCEEDED: "محاولات كثيرة، يرجى المحاولة لاحقاً",

  // ── authorization ────────────────────────────────────────────────────────────
  FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء",
  ACCESS_DENIED: "لا تملك صلاحية الوصول إلى هذا العنصر",

  // ── success ──────────────────────────────────────────────────────────────────
  LOGIN_SUCCESS: "تم تسجيل الدخول بنجاح",
  LOGOUT_SUCCESS: "تم تسجيل الخروج بنجاح",
  TOKENS_REFRESHED: "تم تجديد الجلسة",
  PASSWORD_RESET_REQUESTED: "تم إرسال رابط إعادة تعيين كلمة المرور",
  PASSWORD_CHANGED: "تم تغيير كلمة المرور بنجاح",
  CURRENT_USER_RETRIEVED: "تم جلب بيانات المستخدم",
};
