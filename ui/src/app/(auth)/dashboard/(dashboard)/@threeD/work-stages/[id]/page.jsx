import PreviewWorkStage from "@/app/UiComponents/DataViewer/work-stages/PreviewWorkStage";
import React from "react";

export default function page({ params: { id } }) {
  return <PreviewWorkStage type="three-d" open={true} page={true} id={id} />;
}
