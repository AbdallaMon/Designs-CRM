import { Lessons } from "@/features/lessons/admin/Lessons";
import HomeworkTable from "@/features/lessons/admin/StaffHomeWorks";
import { Tests } from "@/features/tests/admin/Tests";
import { Suspense } from "react";

export default async function TestsPage({ params }) {
  const awaitedParams = await params;
  const lessonId = awaitedParams.lessonId;
  const courseId = awaitedParams.courseId;

  return (
    <Suspense>
      <HomeworkTable courseId={courseId} lessonId={lessonId} />
    </Suspense>
  );
}
