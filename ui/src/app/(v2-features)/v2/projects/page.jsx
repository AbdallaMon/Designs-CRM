import { Suspense } from "react";
import { ProjectsPage } from "@/app/v2/features/projects";

export default function Page() {
  return (
    <Suspense>
      <ProjectsPage />
    </Suspense>
  );
}
