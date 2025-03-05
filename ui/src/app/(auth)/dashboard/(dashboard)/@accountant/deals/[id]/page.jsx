import PreviewDialog from "@/app/UiComponents/DataViewer/leads/PreviewLead.jsx";
import React from "react";

export default function page({ params: { id } }) {
  return <PreviewDialog open={true} page={true} id={id} />;
}
