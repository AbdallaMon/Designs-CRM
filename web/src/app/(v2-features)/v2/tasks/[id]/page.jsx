import { Suspense } from "react";
import { TaskDetailsPage } from "@/app/v2/features/tasksDetails";

// Next 16: params is async.
export default async function Page({ params }) {
  const { id } = await params;
  return (
    <Suspense>
      <TaskDetailsPage taskId={id} />
    </Suspense>
  );
}
