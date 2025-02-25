import ThreeDWorkStagesKanban from "@/app/UiComponents/DataViewer/work-stages/ThreeDWorkStagesKanban";
import TwoDWorkStagesKanban from "@/app/UiComponents/DataViewer/work-stages/TwoDWorkStagesKanban";

export default function page({ searchParams }) {
  return <TwoDWorkStagesKanban staffId={searchParams.staffId} />;
}
