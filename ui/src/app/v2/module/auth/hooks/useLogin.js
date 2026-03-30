"use client";
import { useRouter } from "next/navigation";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { loginUser } from "@/app/v2/module/auth/auth.service";
import { useAuth } from "@/app/v2/providers/AuthProvider";

/**
 * Hook that exposes a `login` function.
 * On success, sets the authenticated user in global auth state and redirects.
 */
export function useLogin() {
  const { setAuthUser } = useAuth();
  const { setLoading } = useToastContext();
  const router = useRouter();

  async function login(formData) {
    const response = await loginUser(formData, setLoading);
    console.log(response, "response");
    if (response.status === 200) {
      setAuthUser(response.user);
      console.log("Login successful, redirecting...");
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get("redirect") || "/dashboard";
      console.log("Redirecting to:", redirectTo);
      window.location.href = redirectTo;
    }

    return response;
  }

  return { login };
}
