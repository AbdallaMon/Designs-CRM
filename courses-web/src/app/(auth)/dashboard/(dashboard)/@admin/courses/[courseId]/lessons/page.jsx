import { Lessons } from "@/app/UiComponents/DataViewer/lessons/admin/Lessons";
import { Suspense } from "react";

export default async function Lesssons({ params }) {
  const awaitedParams = await params;
  const courseId = awaitedParams.courseId;
  return (
    <Suspense>
      <Lessons courseId={courseId} />;
    </Suspense>
  );
}
