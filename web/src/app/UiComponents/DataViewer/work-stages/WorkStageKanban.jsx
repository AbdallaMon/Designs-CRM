"use client";

import WorkStageKanban from "../Kanban/work-stages/WorkStageKanban";

function WorkStagesKanban({ staffId, type }) {
  return <WorkStageKanban staffId={staffId} type={type} />;
}

export default WorkStagesKanban;
