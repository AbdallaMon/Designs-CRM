import TaskDetails from "@/app/UiComponents/DataViewer/utility/TaskDetails";

export default function TaskPage({ params }) {
  const { id } = params;
  return <TaskDetails id={id} />;
}
