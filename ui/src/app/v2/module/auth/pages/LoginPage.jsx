import AuthLayout from "@/app/v2/shared/components/AuthLayout";
import LoginForm from "@/app/v2/module/auth/components/LoginForm";

/**
 * Self-contained login page for v2.
 *
 * Drop-in migration — replace the old page with just:
 *   import LoginPage from "@/app/v2/module/auth/pages/LoginPage";
 *   export default LoginPage;
 */
export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
