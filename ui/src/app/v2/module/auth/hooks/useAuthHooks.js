import { useAuth } from "@/app/v2/providers/AuthProvider";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { useRouter } from "next/navigation";
import {
  requestPasswordReset,
  resetPassword as resetPasswordService,
  loginUser,
} from "@/app/v2/module/auth/auth.service";

export function useAuthHooks() {
  const { setAuthUser } = useAuth();
  const { setLoading } = useToastContext();
  const router = useRouter();

  async function login(formData) {
    const response = await loginUser(formData, setLoading);
    if (response.status === 200) {
      setAuthUser(response.user);
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get("redirect") || "/dashboard";
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
