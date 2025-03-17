import PreviewWorkStage from "@/app/UiComponents/DataViewer/work-stages/PreviewWorkStage";
import React from "react";

export default function page({ params: { id } }) {
  return <PreviewWorkStage type="exacuter" open={true} page={true} id={id} />;
}
