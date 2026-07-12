"use client";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { useEffect, useState, useRef } from "react";
import FullScreenLoader from "@/shared/components/feedback/loaders/FullscreenLoader";
import { Box, Grid } from "@mui/material";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  StepActionBar,
  StepNav,
  STEP_ACTION_BAR_SPACE,
} from "@/features/image-session/client-session/Utility.jsx";
import { PreviewItemDialog } from "@/features/image-session/client-session/shared/PreviewItemDialog.jsx";
import { SharedCardItem } from "@/features/image-session/client-session/shared/SharedCardItem.jsx";
import { getCachedStepData } from "@/features/image-session/client-session/helpers.js";

export function Styles({
  session,
  handleBack,
  disabled,
  nextStatus,
  onUpdate,
}) {
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(false);
  const { loading: toastLoading, setLoading: setToastLoading } =
    useToastContext();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const handlePreviewOpen = (startIndex) => {
    setCurrentPreviewIndex(startIndex);
    setPreviewOpen(true);
  };

  const { lng } = useLanguageSwitcherContext();
  const containerRef = useRef(null);

  async function getStyles() {
    await getCachedStepData({
      url: `client/image-session/styles?lng=${lng}&`,
      setLoading,
      setData: setStyles,
    });
  }

  useEffect(() => {
    getStyles();
  }, [lng]);

  const toggleStyle = (style) => {
    setSelectedStyle((prev) => (prev && prev.id === style.id ? null : style));
  };

  async function handleStyleSubmit() {
    const req = await handleRequestSubmit(
      { session, selectedStyle, status: nextStatus },
      setToastLoading,
      `client/image-session/styles`,
      false,
      "Saving your choice please wait..."
    );
    if (req.status === 200) {
      await onUpdate();
    }
  }

  return (
    <Box sx={{ pb: STEP_ACTION_BAR_SPACE }}>
      {loading && <FullScreenLoader />}
      <PreviewItemDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        items={styles}
        currentIndex={currentPreviewIndex}
        onIndexChange={setCurrentPreviewIndex}
        selectedItems={selectedStyle ? [selectedStyle] : []}
        type={"SELECT"}
        itemType="STYLE"
        onItemSelect={toggleStyle}
      />

      <Grid container ref={containerRef}>
        {styles.map((style, index) => (
          <Grid
            size={12}
            key={style.id}
            sx={{
              cursor: "pointer",
              "& .MuiPaper-root": { height: "100%" },
              position: "relative",
            }}
          >
            <SharedCardItem
              item={style}
              template={style.template}
              type={"MATERIAL"}
              canSelect={true}
              isFullWidth={false}
              canPreview={true}
              handlePreviewClick={() => handlePreviewOpen(index)}
              height={"300px"}
              isSelected={selectedStyle?.id === style.id}
              onSelect={() => toggleStyle(style)}
            />
          </Grid>
        ))}
      </Grid>

      <StepActionBar>
        <StepNav
          onBack={handleBack}
          onNext={selectedStyle ? handleStyleSubmit : undefined}
          backDisabled={disabled}
          disabled={toastLoading}
        />
      </StepActionBar>
    </Box>
  );
}
