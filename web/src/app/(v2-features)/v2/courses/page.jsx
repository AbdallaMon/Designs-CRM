import { Suspense } from "react";
import { CoursesPage } from "@/app/v2/features/courses";

export default function Page() {
  return (
    <Suspense>
      <CoursesPage />
    </Suspense>
  );
}
