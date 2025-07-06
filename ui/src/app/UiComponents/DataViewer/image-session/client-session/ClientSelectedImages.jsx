import { Box, Paper, Typography, Grid2 as Grid } from "@mui/material";
import { ImagePreviewDialog } from "./ImagePreviewDialog";
import { useState } from "react";
import { ImageGroup } from "./ImageGroup";
import { NotesComponent } from "../../utility/Notes";
import { ActionButtons } from "./Utility";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";

export function ClientSelectedImages({
  session,
  loading,
  nextStatus,
  handleBack,
  handleNext,
  disabled,
  cardsRef,
  titleRef,
  withActions = true,
}) {
  const { lng } = useLanguageSwitcherContext();
  const uiText = {
    title: {
      ar: "راجع اختيارات الصور",
      en: "Review your images selections",
    },
  };
  return (
    <Box sx={{ p: 0 }}>
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography
            variant="h5"
            color="primary"
            gutterBottom
            sx={{ px: 1 }}
            ref={titleRef}
          >
            {uiText.title[lng]}
          </Typography>
          <NotesComponent
            id={session?.id}
            idKey="imageSessionId"
            slug="client"
            text={lng === "ar" ? "اضف ملاحظة عامة" : "Add general note"}
          />
        </Box>
      </Paper>

      <ImageGroup
        images={session?.selectedImages}
        loadingImages={loading}
        type="not-select"
        cardsRef={cardsRef}
      />
      {withActions && (
        <Paper
          elevation={2}
          sx={{
            position: "fixed",
            bottom: 0,
            py: 2,
            px: 2,
            backgroundColor: "white",
            width: "100%",
            left: 0,
          }}
        >
          <ActionButtons
            session={session}
            handleNext={handleNext}
            handleBack={handleBack}
            disabled={disabled}
          />
        </Paper>
      )}
    </Box>
  );
}
