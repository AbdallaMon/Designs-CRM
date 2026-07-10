"use client";

import WorkStageKanban from "@/app/UiComponents/DataViewer/Kanban/work-stages/WorkStageKanban.jsx";

function WorkStagesKanban({ staffId, type }) {
  return <WorkStageKanban staffId={staffId} type={type} />;
}

export default WorkStagesKanban;
