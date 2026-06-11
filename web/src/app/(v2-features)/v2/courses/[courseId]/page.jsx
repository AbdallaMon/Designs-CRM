import { Suspense } from "react";
import { CourseEditorPage } from "@/app/v2/features/courses";

// Admin course editor route shell. Next 16: params is async. The authed AppShell + provider
// stack come from the parent (v2/courses) layout.jsx.
export default async function Page({ params }) {
  const { courseId } = await params;
  return (
    <Suspense>
      <CourseEditorPage courseId={courseId} />
    </Suspense>
  );
}
