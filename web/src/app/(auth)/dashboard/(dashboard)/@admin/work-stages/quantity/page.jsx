import { PROJECT_TYPES_ENUM } from "@/app/helpers/constants";
import WorkStagesKanban from "@/app/UiComponents/DataViewer/work-stages/WorkStageKanban";

export default function page() {
  return (
    <WorkStagesKanban type={PROJECT_TYPES_ENUM.TwoD.QUANTITY_CALCULATION} />
  );
}
