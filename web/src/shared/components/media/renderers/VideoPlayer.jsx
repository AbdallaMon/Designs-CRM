"use client";
import { Box, CircularProgress, IconButton } from "@mui/material";
import { FaPlay } from "react-icons/fa";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCacheStatus } from "@/shared/components/media/hooks/useCacheState.js";

export function VideoPlayer({
  url,
  poster,
  mode = "direct", // "auto" | "click" | "direct"
  controls = true,
  muted = false,
  loop = false,
  playsInline = true,
  sx,
  onStartLoad,
  onClick,
  handleMediaReady,
  groupByMonth,
}) {
  const cached = useCacheStatus(url);

  // Decide initial behavior (best approach):
  // - direct: always set src
  // - click: never set src until click
  // - auto: if cached => set src; else wait click
  const shouldLoadImmediately = useMemo(() => {
    if (mode === "direct") return true;
    if (mode === "click") return false;
    // mode === "auto"
    return cached === true; // if unknown or false => don't load yet
  }, [mode, cached]);

  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(false);

  // Keep src in sync if should load immediately
  useEffect(() => {
    if (!url) {
      setSrc(null);
      setLoading(false);
      return;
    }

    if (shouldLoadImmediately) {
      setSrc(url);
    } else {
      // ensure we don't trigger network by having src
      setSrc(null);
      setLoading(false);
    }
  }, [url, shouldLoadImmediately]);

  const handleClickLoad = useCallback(() => {
    if (mode === "click" && onClick) {
      onClick();
      return;
    }
    if (!url) return;
    if (src) return;

    onStartLoad?.();
    setLoading(true);
    setSrc(url);
  }, [url, src, onStartLoad]);

  const showWrapper = mode === "click" || (mode === "auto" && cached !== true); // cached unknown/false => wrapper

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        ...(sx || {}),
        ...(groupByMonth && {
          aspectRatio: "1 / 1",
        }),
      }}
    >
      <video
        style={{ width: "100%", borderRadius: 12, height: "100%" }}
        // If wrapper is showing, controls would tempt user to click on native UI,
        // but we already overlay click-to-load. After src is set, controls appear.
        controls={controls && !!src}
        // preload="none"
        poster={poster}
        src={url || undefined}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        onCanPlay={() => {
          setLoading(false);
          handleMediaReady?.();
        }}
        onWaiting={() => setLoading(true)}
        onError={() => {
          setLoading(false);
          handleMediaReady?.();
        }}
      />

      {showWrapper && (
        <Box
          onClick={handleClickLoad}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleClickLoad();
          }}
          sx={{
            position: "absolute",
            inset: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // subtle dark overlay like whatsapp
            bgcolor: "rgba(0,0,0,0.25)",
            "&:hover": { bgcolor: "rgba(0,0,0,0.35)" },
            outline: "none",
            height: "100%",
          }}
        >
          <IconButton
            sx={{
              width: 64,
              height: 64,
              bgcolor: "rgba(0,0,0,0.55)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
            }}
          >
            <FaPlay color="#fff" />
          </IconButton>
        </Box>
      )}

      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}
