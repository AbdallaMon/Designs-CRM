import ThreeDWorkStagesKanban from "@/app/UiComponents/DataViewer/work-stages/ThreeDWorkStagesKanban";

export default async function page(props) {
  const searchParams = await props.searchParams;
  return <ThreeDWorkStagesKanban staffId={searchParams.staffId} />;
}
