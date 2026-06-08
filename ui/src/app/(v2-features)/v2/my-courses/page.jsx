import { Suspense } from "react";
import { MyCoursesPage } from "@/app/v2/features/courses";

export default function Page() {
  return (
    <Suspense>
      <MyCoursesPage />
    </Suspense>
  );
}
