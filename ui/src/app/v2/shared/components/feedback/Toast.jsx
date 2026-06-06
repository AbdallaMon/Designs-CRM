"use client";
import {
  alpha,
  Box,
  CircularProgress,
  IconButton,
  LinearProgress,
  Typography,
} from "@mui/material";
import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { MdCheck, MdClose, MdError, MdInfo } from "react-icons/md";
import { ZINDEXS } from "../../constants";

export function Toast({
  message,
  severity = "info",
  onClose,
  duration = 3000,
  isOpen,
  position = "center",
  positionY = "top",
}) {
  const [progress, setProgress] = useState(0);
  const boxRef = useRef(null);

  const handleClose = useCallback(() => {
    if (!boxRef.current) return onClose();
    gsap.to(boxRef.current, {
      opacity: 0,
      scale: 0.8,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        onClose();
        setProgress(0);
      },
    });
  }, [onClose]);

  useEffect(() => {
    if (isOpen && boxRef.current) {
      gsap.fromTo(
        boxRef.current,
        {
          opacity: 0,
          scale: 0.8,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.25,
          ease: "power2.out",
          ...(position === "center"
            ? {
                [positionY]: 16,
                left: "50%",
                transform: "translateX(-50%)",
              }
            : position === "left"
              ? {
                  [positionY]: 16,
                  left: 15,
                }
              : {
                  [positionY]: 16,
                  right: 15,
                }),
        },
      );
    }
  }, [isOpen, severity, message]);

  useEffect(() => {
    if (isOpen && severity !== "loading") {
      const timerInterval = setInterval(() => {
        setProgress((oldProgress) => {
          const diff = 100 / (duration / 500);
          return Math.min(oldProgress + diff, 100);
        });
      }, 500);
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => {
        clearTimeout(timer);
        clearInterval(timerInterval);
        setProgress(0);
      };
    }
  }, [isOpen, duration, severity, handleClose]);

  if (!isOpen) return null;

  return (
    <Box
      ref={boxRef}
      sx={{
        position: "fixed",

        color:
          severity === "error"
            ? "error.main"
            : severity === "success"
              ? "success.main"
              : severity === "loading"
                ? "info.main"
                : "text.primary",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        borderRadius: 3,
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.9),
        boxShadow: 3,
        zIndex: ZINDEXS.TOAST,
        minWidth: 300,
        px: 3,
        opacity: 0,
        py: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          justifyContent: "center",
          p: 1,
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flex: 1,
          }}
        >
          <Box>
            {severity === "loading" ? (
              ""
            ) : severity === "error" ? (
              <MdError size={24} />
            ) : severity === "success" ? (
              <MdCheck size={24} />
            ) : (
              <MdInfo size={24} />
            )}
          </Box>
          <Typography variant="body1">{message}</Typography>
        </Box>
        {severity === "loading" ? (
          <CircularProgress size={20} color="info" />
        ) : (
          onClose && (
            <IconButton size="small" onClick={handleClose}>
              <MdClose size={20} />
            </IconButton>
          )
        )}
      </Box>
      {severity !== "info" && (
        <Box sx={{ width: "100%" }}>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}
    </Box>
  );
}
