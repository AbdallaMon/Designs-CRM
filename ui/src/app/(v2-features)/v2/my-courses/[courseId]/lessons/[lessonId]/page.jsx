import { Suspense } from "react";
import { LearnerLessonPage } from "@/app/v2/features/courses";

// Learner lesson player route shell. Next 16: params is async.
export default async function Page({ params }) {
  const { courseId, lessonId } = await params;
  return (
    <Suspense>
      <LearnerLessonPage courseId={courseId} lessonId={lessonId} />
    </Suspense>
  );
}
