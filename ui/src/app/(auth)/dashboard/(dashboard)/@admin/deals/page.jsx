import DealsKanbanBoard from "@/app/UiComponents/DataViewer/leads/ClientLeadKanban.jsx";

export default async function page(props) {
  const searchParams = await props.searchParams;
  return <DealsKanbanBoard staffId={searchParams.staffId} />;
}
