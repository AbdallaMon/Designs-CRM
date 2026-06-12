import { handleRequestSubmit } from "@/app/v2/lib/api/handleRequestSubmit";

/**
 * Log in a user.
 * @param {{ email: string, password: string }} data
 * @param {Function} setLoading
 */
export async function loginUser(data, setLoading) {
  return handleRequestSubmit({
    data,
    setLoading,
    path: "auth/login",
    toastMessage: "جارٍ تسجيل الدخول...",
  });
}

/**
 * Request a password reset email.
 * @param {{ email: string }} data
 * @param {Function} setLoading
 */
export async function requestPasswordReset(data, setLoading) {
  return handleRequestSubmit({
    data,
    setLoading,
    path: "auth/request-password-reset",
    toastMessage: "جارٍ إرسال رابط إعادة التعيين...",
  });
}

/**
 * Reset password using the token received by email.
 * @param {{ password: string, confirmPassword: string, token: string }} data
 * @param {Function} setLoading
 */
export async function resetPassword(data, setLoading) {
  return handleRequestSubmit({
    data,
    setLoading,
    path: "auth/reset-password",
    toastMessage: "جارٍ إعادة تعيين كلمة المرور...",
  });
}
