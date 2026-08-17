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
import { SharedCardItem } from "@/features/image-session/client-session/shared/SharedCardItem.jsx";
import { PreviewItemDialog } from "@/features/image-session/client-session/shared/PreviewItemDialog.jsx";
import { getCachedStepData } from "@/features/image-session/client-session/helpers.js";

export function Materials({
  session,
  handleBack,
  disabled,
  nextStatus,
  onUpdate,
}) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const handlePreviewOpen = (startIndex) => {
    setCurrentPreviewIndex(startIndex);
    setPreviewOpen(true);
  };

  const { loading: toastLoading, setLoading: setToastLoading } =
    useToastContext();
  const { lng } = useLanguageSwitcherContext();
  const containerRef = useRef(null);

  async function getMaterials() {
    await getCachedStepData({
      url: `client/image-session/materials?lng=${lng}&token=${encodeURIComponent(session.token)}`,
      setLoading,
      setData: setMaterials,
    });
  }

  useEffect(() => {
    getMaterials();
  }, [lng]);

  const toggleMaterial = (material) => {
    setSelectedMaterials((prev) => {
      const exists = prev.find((m) => m.id === material.id);
      return exists
        ? prev.filter((m) => m.id !== material.id)
        : [...prev, material];
    });
  };

  async function handleMaterialSubmit() {
    const req = await handleRequestSubmit(
      { session, selectedMaterials, status: nextStatus },
      setToastLoading,
      `client/image-session/materials`,
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
        items={materials}
        currentIndex={currentPreviewIndex}
        onIndexChange={setCurrentPreviewIndex}
        selectedItems={selectedMaterials}
        type={"SELECT"}
        itemType="MATERIAL"
        onItemSelect={toggleMaterial}
      />
      <Grid container ref={containerRef}>
        {materials.map((material, index) => {
          let isFullWidth = false;
          if (index === 0) {
            isFullWidth = true;
          } else {
            const indexInGrid = index - 1;
            const isLast = index === materials.length - 1;
            const isFirstInRow = indexInGrid % 2 === 0;
            if (isLast && isFirstInRow) {
              isFullWidth = true;
            }
          }
          return (
            <Grid
              size={isFullWidth ? 12 : 6}
              key={material.id}
              sx={{
                cursor: "pointer",
                "& .MuiPaper-root": { height: "100%" },
                position: "relative",
              }}
            >
              <SharedCardItem
                item={material}
                template={material.template}
                type={"MATERIAL"}
                canSelect={true}
                isFullWidth={isFullWidth}
                canPreview={true}
                handlePreviewClick={() => handlePreviewOpen(index)}
                height={"300px"}
                isSelected={selectedMaterials?.find((m) => m.id === material.id)}
                onSelect={() => toggleMaterial(material)}
              />
            </Grid>
          );
        })}
      </Grid>

      <StepActionBar>
        <StepNav
          onBack={handleBack}
          onNext={
            selectedMaterials.length > 0 ? handleMaterialSubmit : undefined
          }
          backDisabled={disabled}
          disabled={toastLoading}
        />
      </StepActionBar>
    </Box>
  );
}
