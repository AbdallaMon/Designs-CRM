import { Lessons } from "@/features/lessons/admin/Lessons";
import { Tests } from "@/features/tests/admin/Tests";
import { Suspense } from "react";

export default async function TestsPage({ params }) {
  const awaitedParams = await params;
  const lessonId = awaitedParams.lessonId;
  return (
    <Suspense>
      <Tests type={"LESSON"} id={lessonId} />;
    </Suspense>
  );
}
