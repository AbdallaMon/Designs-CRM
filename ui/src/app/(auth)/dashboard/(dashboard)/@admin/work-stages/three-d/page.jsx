import ThreeDWorkStagesKanban from "@/app/UiComponents/DataViewer/work-stages/ThreeDWorkStagesKanban";

export default function page({ searchParams }) {
  return <ThreeDWorkStagesKanban staffId={searchParams.staffId} />;
}
