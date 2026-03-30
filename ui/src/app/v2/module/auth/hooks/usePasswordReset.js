"use client";
import { useRouter } from "next/navigation";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import {
  requestPasswordReset,
  resetPassword as resetPasswordService,
} from "@/app/v2/module/auth/auth.service";

/**
 * Hook that exposes password reset flows.
 *
 * requestReset  — sends a reset-link email
 * resetPassword — sets a new password using a token, then redirects to /login
 */
export function usePasswordReset() {
  const { setLoading } = useToastContext();
  const router = useRouter();

  async function requestReset(formData) {
    return requestPasswordReset(formData, setLoading);
  }

  async function resetPassword(formData, token) {
    const response = await resetPasswordService(
      { ...formData, token },
      setLoading,
    );
    if (response.status === 200) {
      router.push("/login");
    }

    return response;
  }

  return { requestReset, resetPassword };
}
