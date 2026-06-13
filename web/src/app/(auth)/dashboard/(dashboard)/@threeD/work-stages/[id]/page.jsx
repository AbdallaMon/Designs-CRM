import PreviewWorkStage from "@/app/UiComponents/DataViewer/work-stages/PreviewWorkStage";
import React from "react";

export default async function page(props) {
  const params = await props.params;

  const { id } = params;
  return <PreviewWorkStage type="three-d" open={true} page={true} id={id} />;
}
