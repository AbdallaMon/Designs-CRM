import TwoDExacuterKanban from "@/app/UiComponents/DataViewer/work-stages/TwoDExacuterStagesKanban";

export default function page({ searchParams }) {
  return <TwoDExacuterKanban staffId={searchParams.staffId} />;
}
