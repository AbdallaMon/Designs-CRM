import { Lessons } from "@/app/UiComponents/DataViewer/lessons/admin/Lessons";
import { Tests } from "@/app/UiComponents/DataViewer/test/admin/Tests";
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
