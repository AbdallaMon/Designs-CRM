import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { Alert, Box, Grid, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import TemplateEditor, { PreviewTemplateCard } from "./Template";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";

export default function Templates({ type }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  async function getTemplates() {
    await getDataAndSet({
      url: `admin/image-session/templates?type=${type}&`,
      setLoading,
      setData: setTemplates,
    });
  }
  useEffect(() => {
    getTemplates();
  }, [type]);
  return (
    <>
      {loading && <FullScreenLoader />}
      <TemplateEditor onSave={getTemplates} type={type} />
      <Grid container spacing={1} px={1}>
        {templates?.map((template) => {
          return (
            <Grid key={template.id} size={{ md: 4 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 1.5,
                }}
              >
                <Alert severity="info">Template id # {template.id}</Alert>
                <PreviewTemplateCard
                  onSave={getTemplates}
                  type={type}
                  template={template}
                  isEditItem={true}
                  customStyles={template.customStyle}
                  layout={template.layout}
                />
                <TemplateEditor
                  onSave={getTemplates}
                  initialTemplate={template}
                  type={type}
                  isEdit={true}
                />
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}
