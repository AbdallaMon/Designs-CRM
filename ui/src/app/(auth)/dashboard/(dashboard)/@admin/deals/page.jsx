import StaffLeadsKanbanBoard from "@/app/UiComponents/DataViewer/Kanban/staff/StaffLeadsKanbanBoard";

export default async function page(props) {
  const searchParams = await props.searchParams;
  return <StaffLeadsKanbanBoard staffId={searchParams.staffId} />;
}
