import { Suspense } from "react";
import { TestTakerPage } from "@/app/v2/features/courses";

// ★ Learner test-taker route shell. Next 16: params is async.
export default async function Page({ params }) {
  const { courseId, testId } = await params;
  return (
    <Suspense>
      <TestTakerPage courseId={courseId} testId={testId} />
    </Suspense>
  );
}
