import { useAuth } from "@/app/v2/providers/AuthProvider";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { useRouter } from "next/navigation";
import {
  requestPasswordReset,
  resetPassword as resetPasswordService,
  loginUser,
} from "@/app/v2/features/auth/auth.service";

export function useAuthHooks() {
  const { setAuthUser } = useAuth();
  const { setLoading } = useToastContext();
  const router = useRouter();

  async function login(formData) {
    const response = await loginUser(formData, setLoading);
    if (response.status === 200) {
      // Backend envelope is { success, message, data, translationKey } — the user
      // lives under data.user, not at the top level.
      setAuthUser(response.data?.user);
      const searchParams = new URLSearchParams(window.location.search);
      // Real app routes live under /v2/* ; "/v2" redirects to the landing screen.
      const redirectTo = searchParams.get("redirect") || "/v2";
      window.location.href = redirectTo;
    }

    return response;
  }
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
  return { login, requestReset, resetPassword };
}
