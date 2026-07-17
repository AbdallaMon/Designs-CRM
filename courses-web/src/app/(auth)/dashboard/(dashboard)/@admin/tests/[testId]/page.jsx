import TestQuestionManager from "@/app/UiComponents/DataViewer/test/admin/TestQuestionManager";
import { Suspense } from "react";

export default async function Test({ params }) {
  const awaitedParams = await params;
  const testId = awaitedParams.testId;
  return (
    <Suspense>
      <TestQuestionManager testId={testId} />;
    </Suspense>
  );
}
