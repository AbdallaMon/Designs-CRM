import TwoDWorkStagesKanban from "@/app/UiComponents/DataViewer/work-stages/TwoDWorkStagesKanban";

export default async function page(props) {
  const searchParams = await props.searchParams;
  return <TwoDWorkStagesKanban staffId={searchParams.staffId} />;
}
