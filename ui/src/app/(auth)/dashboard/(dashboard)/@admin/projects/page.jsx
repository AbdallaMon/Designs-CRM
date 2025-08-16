import FinalizedLeadKanban from "@/app/UiComponents/DataViewer/Kanban/staff/FinalizedLeadKanban";

export default async function page(props) {
  const searchParams = await props.searchParams;
  return <FinalizedLeadKanban staffId={searchParams.staffId} />;
}
