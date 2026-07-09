"use client";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";
import {
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaTimes,
} from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { isPdf } from "../fileTypes";
import { RenderFileAccordingToType } from "./RenderFileAccordingToType";

export function AttachmentViewer({
  open,
  onClose,
  attachments,
  startIndex,
  onNearToEnd,
  hasMore,
  loadingMore,
  setViewerIndex,
  index,
  setIndex,
}) {
  const [mediaReady, setMediaReady] = useState(false);
  const [loadingMoreState, setLoadingMoreState] = useState(false);
  const swipeState = useRef({
    startX: 0,
    startY: 0,
    isDown: false,
    activePointerId: null,
  });
  const SWIPE_THRESHOLD = 60;

  const att = attachments?.[index];
  const fileUrl = att?.fileUrl;
  const mimeType = att?.fileMimeType || "";
  // useEffect(() => {
  //   if (!open) return;
  //   setIndex(startIndex || 0);
  // }, [open, startIndex]);
  useEffect(() => {
    if (!open) return;
    setMediaReady(false);
  }, [open, index, fileUrl]);
  function handleMediaReady() {
    setMediaReady(true);
  }
  useEffect(() => {
    if (loadingMore) {
      setLoadingMoreState(true);
    }
  }, [loadingMore]);
  useEffect(() => {
    if (!loadingMore && loadingMoreState) {
      goNext();
      setLoadingMoreState(false);
    }
  }, [loadingMoreState]);
  const canPrev = index > 0;
  const canNext = index < (attachments?.length || 0) - 1 || hasMore;
  function goPrev() {
    if (canPrev) {
      setIndex((v) => v - 1);
    }
  }
  async function goNext() {
    if (canNext) {
      setIndex((v) => v + 1);
    }
    if (onNearToEnd && hasMore && index >= (attachments?.length || 0) - 3) {
      await onNearToEnd();
      // if (!loadingMore) goNext();
    }
  }
  const onPointerDown = (e) => {
    // capture pointer so we keep getting moves even if cursor leaves
    const isInteractive = e.target.closest?.(
      'button, a, input, textarea, select, [role="button"]'
    );

    if (isInteractive) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);

    swipeState.current.isDown = true;
    swipeState.current.activePointerId = e.pointerId;
    swipeState.current.startX = e.clientX;
    swipeState.current.startY = e.clientY;
  };

  const onPointerMove = (e) => {
    if (!swipeState.current.isDown) return;
    if (swipeState.current.activePointerId !== e.pointerId) return;
  };

  const onPointerUp = (e) => {
    if (!swipeState.current.isDown) return;
    if (swipeState.current.activePointerId !== e.pointerId) return;

    swipeState.current.isDown = false;
    swipeState.current.activePointerId = null;

    const deltaX = e.clientX - swipeState.current.startX;
    const deltaY = e.clientY - swipeState.current.startY;

    // ignore mostly-vertical gestures (so scrolling doesn't trigger slide)
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;

    // Direction:
    // deltaX < 0 => finger moved RIGHT -> LEFT  (swipe left)
    // deltaX > 0 => finger moved LEFT -> RIGHT  (swipe right)
    if (deltaX <= -SWIPE_THRESHOLD) {
      // swipe LEFT (right-to-left)
      if (canNext) goNext();
    } else if (deltaX >= SWIPE_THRESHOLD) {
      // swipe RIGHT (left-to-right)
      if (canPrev) goPrev();
    }
  };

  const onPointerCancel = () => {
    swipeState.current.isDown = false;
    swipeState.current.activePointerId = null;
  };
  useEffect(() => {
    function onKeyDown(e) {
      // if you want only when slider is focused, remove window listener
      // and instead attach onKeyDown to the container + give it tabIndex=0
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (canNext) goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (canPrev) goPrev();
      }
    }

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev]);
  if (!att) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen
      sx={{
        zIndex: 1302,
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          position: "relative",
          bgcolor: "background.default",
        }}
      >
        <Box
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          style={{
            userSelect: "none",
            touchAction: "pan-y", // allow vertical scroll, still lets us detect horizontal swipes
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Top bar */}
          {!isPdf(mimeType) && (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                right: 8,
                zIndex: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                backdropFilter: "blur(8px)",
                bgcolor: "rgba(17, 14, 14, 0.25)",
                p: 1,
                borderRadius: 2,
              }}
            >
              <Chip
                size="small"
                label={`${index + 1}/${attachments.length}`}
                sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "#fff" }}
              />

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {!!fileUrl && (
                  <IconButton
                    onClick={() => window.open(fileUrl, "_blank")}
                    sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.08)" }}
                  >
                    <FaDownload />
                  </IconButton>
                )}

                <IconButton
                  onClick={onClose}
                  sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.08)" }}
                >
                  <FaTimes />
                </IconButton>
              </Box>
            </Box>
          )}
          {/* Prev/Next */}
          <IconButton
            onClick={goPrev}
            disabled={!canPrev}
            sx={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 5,
              color: "primary.main",
              bgcolor: canPrev
                ? "rgba(25,118,210,0.08)"
                : "rgba(25,118,210,0.02)",
            }}
          >
            <FaChevronLeft />
          </IconButton>

          <IconButton
            onClick={goNext}
            disabled={!canNext || loadingMore}
            sx={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 5,
              color: "primary.main",
              bgcolor: canNext
                ? "rgba(25,118,210,0.08)"
                : "rgba(25,118,210,0.02)",
            }}
          >
            {loadingMore ? <CircularProgress size={20} /> : <FaChevronRight />}
          </IconButton>

          {/* Content */}
          <Box
            sx={{
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              p: 1,
            }}
          >
            <RenderFileAccordingToType
              att={att}
              onPreview={() => {}}
              index={index}
              iframe={true}
              handleMediaReady={handleMediaReady}
            />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
