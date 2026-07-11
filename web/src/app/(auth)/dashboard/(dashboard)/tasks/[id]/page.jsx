import TaskDetails from "@/features/tasks/TaskDetails";

export default async function TaskPage({ params }) {
  const { id } = await params;
  return <TaskDetails id={id} />;
}
