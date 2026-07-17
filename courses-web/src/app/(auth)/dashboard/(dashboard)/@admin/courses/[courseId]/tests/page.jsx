import { Tests } from "@/app/UiComponents/DataViewer/test/admin/Tests";
import { Suspense } from "react";

export default async function TestsPage({ params }) {
  const awaitedParams = await params;
  const courseId = awaitedParams.courseId;
  return (
    <Suspense>
      <Tests type={"COURSE"} id={courseId} />;
    </Suspense>
  );
}
