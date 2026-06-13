import { TaskDetails } from "@/app/UiComponents/DataViewer/tasks";

export default function TaskPage({ params }) {
  const { id } = params;
  return <TaskDetails id={id} />;
}
