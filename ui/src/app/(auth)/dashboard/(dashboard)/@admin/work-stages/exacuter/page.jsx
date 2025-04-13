import TwoDExacuterKanban from "@/app/UiComponents/DataViewer/work-stages/TwoDExacuterStagesKanban";

export default async function page(props) {
  const searchParams = await props.searchParams;
  return <TwoDExacuterKanban staffId={searchParams.staffId} />;
}
