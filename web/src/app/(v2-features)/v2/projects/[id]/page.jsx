import { Suspense } from "react";
import { ProjectDetailsPage } from "@/app/v2/features/projectsDetails";

// Next 16: params is async.
export default async function Page({ params }) {
  const { id } = await params;
  return (
    <Suspense>
      <ProjectDetailsPage projectId={id} />
    </Suspense>
  );
}
