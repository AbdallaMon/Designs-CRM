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
import { MdCheckCircle, MdRadioButtonUnchecked } from "react-icons/md";
import { ensureHttps } from "@/app/helpers/functions/utility";
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
  const [selectedMaterial, setSelectedMaterial] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const handlePreviewOpen = (startIndex) => {
    console.log(startIndex, "startIndex");
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

      // Set initial states with more dramatic effects
      gsap.set(cardsRef.current, {
        opacity: 0,
        y: 60,
        scale: 0.8,
        rotationX: 15,
        filter: "blur(8px) brightness(0.7)",
        transformOrigin: "center bottom",
      });

      // Modern card entrance with layered effects
      tl.to(
        cardsRef.current,
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
      { session, selectedMaterial, status: nextStatus },
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
        selectedItems={selectedMaterial ? [selectedMaterial] : []}
        type={"SELECT"}
        itemType="MATERIAL"
        onItemSelect={(material) => {
          if (selectedMaterial && selectedMaterial.id === material.id) {
            setSelectedMaterial(null);
          } else {
            setSelectedMaterial(material);
          }
        }}
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
                isSelected={selectedMaterial?.id === material.id}
                onSelect={() => {
                  if (selectedMaterial && selectedMaterial.id === material.id) {
                    setSelectedMaterial(null);
                  } else {
                    setSelectedMaterial(material);
                  }
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
        {selectedMaterial ? (
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
              sx={{ position: "fixed", bottom: "15px", right: "15px" }}
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

function MaterialItem({ material, isFullWidth, isSelected, onSelect }) {
  const [word1, word2] = material.title[0].text.split(" ");
  const { lng } = useLanguageSwitcherContext();
  const label = isSelected
    ? lng === "ar"
      ? "تم الاختيار"
      : "Selected"
    : lng === "ar"
    ? "اختار"
    : "Select";
  return (
    <Card
      sx={{
        backgroundImage: material.imageUrl
          ? `url(${ensureHttps(material.imageUrl)})`
          : material.template.backgroundImage
          ? `url(${material.template.backgroundImage})`
          : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        maxHeight: "400px",
        minHeight: "300px",
        height: "100%",
        position: "relative",
        display: "flex",
        justifyContent: isFullWidth ? "center" : "flex-end",
        alignItems: isFullWidth ? "center" : "flex-end",
        px: 2,
        pb: 2,
        borderRadius: 0,
      }}
    >
      <Button
        variant={isSelected ? "contained" : "outlined"}
        color={isSelected ? "success" : "primary"}
        startIcon={isSelected ? <MdCheckCircle /> : <MdRadioButtonUnchecked />}
        onClick={() => onSelect(material)}
        sx={{
          borderColor: "white",
          color: isSelected ? "white" : "white",
          borderRadius: 3,
          px: 3,
          py: 1,
          position: "absolute",
          top: 15,
          right: 15,
          zIndex: 100,
          "&:hover": {
            borderColor: "white",
            bgcolor: isSelected ? "success.dark" : "rgba(255,255,255,0.1)",
            transform: "translateY(-2px)",
          },
        }}
      >
        {label}
      </Button>
      <CardContent
        sx={{
          position: "absolute",
          bottom: isFullWidth ? "50%" : 16,
          left: isFullWidth ? "50%" : 16,
          transform: isFullWidth ? "translate(-50%, 50%)" : "none",
          textAlign: isFullWidth ? "center" : "right",
        }}
      >
        {isFullWidth ? (
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              color: "#fff",
              fontSize: "1.6rem",
              lineHeight: 1.3,
            }}
          >
            {word1} {word2}
          </Typography>
        ) : (
          <>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#fff",
                fontSize: "1.6rem",
                lineHeight: 1.3,
              }}
            >
              {word1}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#fff",
                fontSize: "1.6rem",
                lineHeight: 1.3,
              }}
            >
              {word2}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}
