import TestAttempts from "@/features/tests/admin/TestAttempts";
import { Suspense } from "react";

export default async function TestAttemptsPage({ params }) {
  const awaitedParams = await params;
  const testId = awaitedParams.testId;
  return (
    <Suspense>
      <TestAttempts  testId={testId} />;
    </Suspense>
  );
}
