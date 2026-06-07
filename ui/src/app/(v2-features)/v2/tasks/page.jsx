import { Suspense } from "react";
import { TasksPage } from "@/app/v2/features/tasks";

export default function Page() {
  return (
    <Suspense>
      <TasksPage />
    </Suspense>
  );
}
