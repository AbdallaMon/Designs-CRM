import PreviewDialog from "@/app/UiComponents/DataViewer/leads/PreviewLead.jsx";
import React from "react";

export default async function page(props) {
    const params = await props.params;

    const {
        id
    } = params;

    return        <PreviewDialog
          open={true}
          page={true}
          id={id}
          admin={true}
    />
}