import NewWrokstagesLeadsPage from "@/app/UiComponents/DataViewer/work-stages/WorkStagesLeads";

export default async function Page(props) {
  const searchParams = await props.searchParams;
  return (
    <NewWrokstagesLeadsPage
      searchParams={searchParams}
      staff={true}
      nextCall={true}
      type="exacuter"
    />
  );
}
