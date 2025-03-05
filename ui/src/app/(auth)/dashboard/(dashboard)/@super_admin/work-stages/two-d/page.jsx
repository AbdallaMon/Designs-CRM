import TwoDWorkStagesKanban from "@/app/UiComponents/DataViewer/work-stages/TwoDWorkStagesKanban";

export default function page({ searchParams }) {
  return <TwoDWorkStagesKanban staffId={searchParams.staffId} />;
}
