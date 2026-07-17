import { LessonManagement } from "@/app/UiComponents/DataViewer/lessons/admin/EditLesson";
import { Lessons } from "@/app/UiComponents/DataViewer/lessons/admin/Lessons";
import { Suspense } from "react";

export default async function Lesssons({ params }) {
  const awaitedParams = await params;
  const courseId = awaitedParams.courseId;
  const lessonId = awaitedParams.lessonId;

  return (
    <Suspense>
      <LessonManagement lessonId={lessonId} courseId={courseId} />;
    </Suspense>
  );
}
