import OptimizedClientKanbanLead from "@/app/UiComponents/DataViewer/Kanban/staff/ClientKanbanLead";

export default async function page(props) {
  const searchParams = await props.searchParams;
  return <OptimizedClientKanbanLead staffId={searchParams.staffId} />;
}
