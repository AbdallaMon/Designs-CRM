import PreviewDialog from "@/app/UiComponents/DataViewer/leads/PreviewLead.jsx";
import PreviewWorkStage from "@/app/UiComponents/DataViewer/work-stages/PreviewWorkStage";
import React from "react";

export default function page({ params: { id } }) {
  return <PreviewWorkStage type="two-d" open={true} page={true} id={id} />;
}
