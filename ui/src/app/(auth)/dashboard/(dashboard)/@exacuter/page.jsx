import NewWrokstagesLeadsPage from "@/app/UiComponents/DataViewer/work-stages/WorkStagesLeads";

export default function Page({ searchParams }) {
  return (
    <NewWrokstagesLeadsPage
      searchParams={searchParams}
      staff={true}
      nextCall={true}
      type="exacuter"
    />
  );
}
