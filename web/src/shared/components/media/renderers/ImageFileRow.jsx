"use client";
import { Box, Skeleton, Typography } from "@mui/material";
import { FaDownload, FaFile } from "react-icons/fa";
import { useEffect, useState } from "react";
import { isImage, isInCache, isPdf } from "@/shared/components/media/fileTypes.js";

export function ImageFileRow({
  att,
  overlayText,
  onOpen,
  handleMediaReady,
  shouldLoadImmediately,
  iframe,
  groupByMonth,
}) {
  const mime = att?.fileMimeType || "";
  const fileUrl = att?.fileUrl;
  const thumbUrl = att?.thumbnailUrl;
  const isImg = isImage(mime);

  const [stage, setStage] = useState(isImg ? "checking" : "full");
  const [imgSrc, setImgSrc] = useState(isImg ? thumbUrl || "" : "");

  useEffect(() => {
    let mounted = true;
    setStage("checking");

    (async () => {
      const cached = await isInCache(fileUrl);
      if (!mounted) return;

      if (cached) {
        setStage("full");
        setImgSrc(fileUrl);
      } else {
        setStage("thumb");
        setImgSrc(thumbUrl || "");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isImg, fileUrl, thumbUrl]);

  const handleTileClick = async () => {
    // Non-image media tile (video/pdf) opens viewer directly
    if (!isImg) {
      onOpen?.();
      return;
    }

    // Image full -> open viewer
    if (stage === "full") {
      onOpen?.();
      return;
    }

    // If still checking/loading, ignore
    if (stage === "checking" || stage === "loading") return;

    // thumb -> first click warm and swap to full
    if (!fileUrl) return;

    try {
      setStage("loading");
      await warmResource(fileUrl, mime);

      setImgSrc(fileUrl);
      setStage("full");
    } catch {
      setImgSrc(fileUrl);
      setStage("full");
    }
  };

  const showDownloadOverlay = isImg && stage === "thumb" && !overlayText;
  useEffect(() => {
    if (handleMediaReady) {
      handleMediaReady();
    }
  }, [att, handleMediaReady]);

  useEffect(() => {
    if (shouldLoadImmediately && stage !== "full") {
      handleTileClick();
    }
  }, [shouldLoadImmediately, att, stage]);

  useEffect(() => {
    function onKeyDown(e) {
      // if you want only when slider is focused, remove window listener
      // and instead attach onKeyDown to the container + give it tabIndex=0
      if ((e.code === "Space" || e.key === "Enter") && iframe) {
        e.preventDefault();
        handleTileClick();
      }
    }

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [att, handleTileClick, iframe]);
  return (
    <Box
      onClick={handleTileClick}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: 1.5,
        overflow: "hidden",
        cursor: "pointer",
        bgcolor: "grey.200",
        ...(groupByMonth && {
          aspectRatio: "1 / 1",
        }),
      }}
    >
      {isImg ? (
        imgSrc ? (
          <Box
            component="img"
            src={imgSrc}
            alt={att?.fileName || "image"}
            loading="lazy"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              maxHeight: "100vh",
              display: "block",
              filter: stage !== "full" ? "saturate(0.95)" : "none",
              transform: "scale(1.001)",
            }}
          />
        ) : (
          <>
            sskkk
            <Skeleton variant="rectangular" width="100%" height="100%" />
          </>
        )
      ) : (
        <Box
          sx={{
            p: 1.1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 0.6,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaFile color="#757575" />
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {isPdf(mime) ? "PDF" : "Media"}
            </Typography>
          </Box>

          <Typography
            variant="caption"
            sx={{ opacity: 0.85, wordBreak: "break-word" }}
          >
            {att?.fileName}
          </Typography>

          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Tap to view
          </Typography>
        </Box>
      )}

      {overlayText && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 900,
            fontSize: 22,
            zIndex: 4,
          }}
        >
          {overlayText}
        </Box>
      )}

      {/* WhatsApp-like download overlay (first click for images) */}
      {showDownloadOverlay && (
        <Box
          component="button"
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0,0,0,0.18)",
            zIndex: 3,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "999px",
              bgcolor: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            }}
          >
            <FaDownload />
          </Box>
        </Box>
      )}

      {/* Loading overlay on first click */}
    </Box>
  );
}
