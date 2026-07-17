import LesssonView from "@/app/UiComponents/DataViewer/lessons/staff/Lessons";
import { Suspense } from "react";

export default async function Course({ params }) {
  const awaitedParams = await params;
  const courseId = awaitedParams.courseId;
  return (
    <Suspense>
      <LesssonView courseId={courseId} />
    </Suspense>
  );
}
