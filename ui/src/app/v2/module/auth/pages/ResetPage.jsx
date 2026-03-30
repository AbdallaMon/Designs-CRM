"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthLayout from "@/app/v2/shared/components/AuthLayout";
import RequestResetForm from "@/app/v2/module/auth/components/RequestResetForm";
import ResetPasswordForm from "@/app/v2/module/auth/components/ResetPasswordForm";

/**
 * Reads the `token` query param from the URL.
 * - No token  → shows the "request reset" (send email) form
 * - Has token → shows the "reset password" (new password) form
 */
function ResetContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  return token ? <ResetPasswordForm token={token} /> : <RequestResetForm />;
}

/**
 * Self-contained reset page for v2.
 *
 * Drop-in migration — replace the old page with just:
 *   import ResetPage from "@/app/v2/module/auth/pages/ResetPage";
 *   export default ResetPage;
 */
export default function ResetPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <ResetContent />
      </Suspense>
    </AuthLayout>
  );
}
