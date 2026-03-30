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
    toastMessage: "Logging in...",
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
    toastMessage: "Sending reset email...",
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
    toastMessage: "Resetting password...",
  });
}
