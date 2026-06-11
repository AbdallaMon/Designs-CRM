import { Suspense } from "react";
import { LearnerCoursePage } from "@/app/v2/features/courses";

// Learner course detail route shell. Next 16: params is async.
export default async function Page({ params }) {
  const { courseId } = await params;
  return (
    <Suspense>
      <LearnerCoursePage courseId={courseId} />
    </Suspense>
  );
}
