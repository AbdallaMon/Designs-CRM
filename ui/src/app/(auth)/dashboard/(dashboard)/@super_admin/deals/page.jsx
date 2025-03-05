import DealsKanbanBoard from "@/app/UiComponents/DataViewer/leads/ClientLeadKanban.jsx";

export default function page({ searchParams }) {
  return <DealsKanbanBoard staffId={searchParams.staffId} />;
}
