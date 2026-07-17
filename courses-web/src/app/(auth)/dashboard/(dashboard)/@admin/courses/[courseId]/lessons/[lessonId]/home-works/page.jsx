import { Lessons } from "@/app/UiComponents/DataViewer/lessons/admin/Lessons";
import HomeworkTable from "@/app/UiComponents/DataViewer/lessons/admin/StaffHomeWorks";
import { Tests } from "@/app/UiComponents/DataViewer/test/admin/Tests";
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
