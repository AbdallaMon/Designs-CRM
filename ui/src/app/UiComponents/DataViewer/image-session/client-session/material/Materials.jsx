"use client";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { useEffect, useState, useRef } from "react";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid2 as Grid,
  Typography,
} from "@mui/material";
import { gsap } from "gsap";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { FloatingActionButton } from "../Utility";
import { SharedCardItem } from "../shared/SharedCardItem";
import { PreviewItemDialog } from "../shared/PreviewItemDialog";

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
  const cardsRef = useRef([]);
  const containerRef = useRef(null);
  async function getMaterials() {
    await getDataAndSet({
      url: `client/image-session/materials?lng=${lng}&`,
      setLoading,
      setData: setMaterials,
    });
  }

  useEffect(() => {
    getMaterials();
  }, [lng]);
  useEffect(() => {
    if (materials.length > 0 && !loading) {
      // Create a timeline for better control
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        cardsRef.current,
        {
          opacity: 0,
          y: 60,
          scale: 0.8,
          rotationX: 15,
          filter: "blur(8px) brightness(0.7)",
          transformOrigin: "center bottom",
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          filter: "blur(0px) brightness(1)",
          duration: 0.6,
          stagger: {
            amount: 0.2,
            from: "start",
            ease: "power2.out",
          },
          ease: "back.out(1.2)",
        },
        "-=0.2"
      );

      return () => {
        tl.kill();
      };
    }
  }, [materials, loading]);

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
    <>
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
        onItemSelect={(material) => {
          setSelectedMaterials((prev) => {
            const exists = prev.find((m) => m.id === material.id);
            if (exists) {
              return prev.filter((m) => m.id !== material.id);
            } else {
              return [...prev, material];
            }
          });
        }}
      />
      <Grid container ref={containerRef} sx={{ overflow: "hidden" }}>
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
              ref={(el) => (cardsRef.current[index] = el)}
              sx={{
                opacity: 0,

                cursor: "pointer",
                transition: "transform 0.2s ease",
                "& .MuiPaper-root": {
                  height: "100%",
                },
                overflow: "hidden",
                maxHeight: "300px",
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
                handlePreviewClick={() => {
                  handlePreviewOpen(index);
                }}
                height={"300px"}
                isSelected={selectedMaterials?.find(
                  (m) => m.id === material.id
                )}
                onSelect={() => {
                  setSelectedMaterials((prev) => {
                    const exists = prev.find((m) => m.id === material.id);
                    if (exists) {
                      return prev.filter((m) => m.id !== material.id);
                    } else {
                      return [...prev, material];
                    }
                  });
                }}
              />
            </Grid>
          );
        })}
      </Grid>
      <Box
        sx={{
          pt: 2,
        }}
      >
        {selectedMaterials && selectedMaterials.length > 0 ? (
          <>
            <FloatingActionButton
              disabled={toastLoading}
              handleClick={handleMaterialSubmit}
              type="NEXT"
              isText={true}
              label={lng === "ar" ? "التالي" : "Next"}
              isOverItems={true}
            />
            <FloatingActionButton
              disabled={disabled}
              handleClick={handleBack}
              type="BACK"
              sx={{ position: "fixed", bottom: "15px", left: "15px" }}
            />
          </>
        ) : (
          <FloatingActionButton
            disabled={disabled}
            handleClick={handleBack}
            type="BACK"
          />
        )}
      </Box>
    </>
  );
}
