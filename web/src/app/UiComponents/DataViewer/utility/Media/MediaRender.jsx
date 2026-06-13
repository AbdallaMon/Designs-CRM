import { FILE_TYPE_CONFIG } from "@/app/helpers/constants";
import {
  Backdrop,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Skeleton,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaFile,
  FaPlay,
  FaTimes,
} from "react-icons/fa";
import { useCacheStatus } from "./hooks/useCacheState";
import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  Fragment,
} from "react";
dayjs.extend(relativeTime);

function getFileConfig(mimeType) {
  return (
    FILE_TYPE_CONFIG[mimeType] || {
      icon: FaFile,
      color: "#757575",
      label: "File",
    }
  );
}
async function isInCache(url) {
  try {
    if (!url || !("caches" in window)) return false;

    const candidates = new Set();

    try {
      const u = new URL(url, window.location.origin);
      candidates.add(u.href);
      candidates.add(u.pathname + u.search);
      candidates.add(u.pathname);
    } catch {
      candidates.add(url);
      try {
        const abs = new URL(url, window.location.origin);
        candidates.add(abs.href);
        candidates.add(abs.pathname + abs.search);
        candidates.add(abs.pathname);
      } catch {}
    }

    for (const c of candidates) {
      const hit = await caches.match(c);
      if (hit) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function isImage(mime) {
  return mime?.startsWith("image/");
}
function isVideo(mime) {
  return mime?.startsWith("video/");
}
function isAudio(mime) {
  return mime?.startsWith("audio/");
}
function isPdf(mime) {
  return mime === "application/pdf";
}
function isDOCX(mime) {
  return (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword"
  );
}
function GridFileItem({ file, onPreview }) {
  const config = getFileConfig(file.fileMimeType);
  const Icon = config.icon;

  const Image = isImage(file.fileMimeType);
  const Video = isVideo(file.fileMimeType);

  const handleClick = () => {
    if (Image || Video) {
      onPreview(file);
    } else {
      window.open(file.fileUrl, "_blank");
    }
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
        cursor: "pointer",
        bgcolor: "grey.100",
        aspectRatio: "1 / 1",
        "&:hover .overlay": {
          opacity: 1,
        },
      }}
    >
      {/* IMAGE */}
      {Image && (
        <img
          src={file.fileUrl}
          alt={file.fileName}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {/* VIDEO */}
      {Video && (
        <>
          <video
            src={file.fileUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            muted
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(0,0,0,0.4)",
            }}
          >
            <FaPlay size={36} color="white" />
          </Box>
        </>
      )}

      {/* OTHER FILE TYPES */}
      {!Image && !Video && (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: config.color,
            color: "white",
            p: 1,
            textAlign: "center",
          }}
        >
          <Icon size={36} />
          <Typography variant="caption" mt={1} noWrap>
            {file.fileName}
          </Typography>
        </Box>
      )}

      {/* HOVER OVERLAY */}
      <Box
        className="overlay"
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(0,0,0,0.55)",
          color: "white",
          opacity: 0,
          transition: "0.2s",
          display: "flex",
          alignItems: "flex-end",
          p: 1,
        }}
      >
        <Typography variant="caption" noWrap>
          {file.fileName}
        </Typography>
      </Box>

      {/* DOWNLOAD */}
      <IconButton
        size="small"
        component="a"
        href={file.fileUrl}
        download={file.fileName}
        target="_blank"
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: "absolute",
          top: 6,
          right: 6,
          bgcolor: "rgba(0,0,0,0.6)",
          color: "white",
          "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
        }}
      >
        <FaDownload size={12} />
      </IconButton>
    </Box>
  );
}
export function RenderListOfFiles({
  attachments,
  groupByMonth,
  currentRenderedMonths,
  onNearToEnd,
  hasMore,
  loadingMore,
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  function closeViewer() {
    setViewerOpen(false);
    setViewerIndex(0);
  }
  function openViewer(index) {
    setViewerIndex(index);
    setViewerOpen(true);
  }

  const mediaFiles = useMemo(
    () =>
      attachments.filter((a) => {
        const m = a?.fileMimeType || "";
        return isImage(m) || isVideo(m);
      }),
    [attachments]
  );

  const others = useMemo(
    () =>
      attachments.filter((a) => {
        const m = a?.fileMimeType || "";
        return !isImage(m) && !isVideo(m);
      }),
    [attachments]
  );
  const layout = (() => {
    const n = mediaFiles.length;
    if (n === 1) return { cols: 1, rows: 1, tileH: 260 };
    if (n === 2) return { cols: 2, rows: 1, tileH: 170 };
    if (n === 3) return { cols: 2, rows: 2, tileH: 140 };
    return { cols: 2, rows: 2, tileH: 140 };
  })();
  return (
    <>
      {groupByMonth && (
        <>
          <Grid container spacing={2}>
            {attachments?.map((att, idx) => {
              if (
                att.showMonthDivider &&
                currentRenderedMonths &&
                currentRenderedMonths[att.month] === 1
              ) {
                return (
                  <Fragment key={att.id}>
                    <Grid size={{ xs: 12, md: 12 }}>
                      <Typography variant="subtitle2" fontWeight={600} mb={1}>
                        {dayjs(att.month).format("MMMM YYYY")}
                      </Typography>
                    </Grid>
                    <Grid
                      key={att.id}
                      size={{ xs: 6, md: 3 }}
                      sx={{
                        maxHeight: 200,
                      }}
                    >
                      <RenderFileAccordingToType
                        att={att}
                        onPreview={openViewer}
                        index={idx}
                        groupByMonth={true}
                      />
                    </Grid>
                  </Fragment>
                );
              }
              return (
                <Grid
                  key={att.id}
                  size={{ xs: 6, md: 3 }}
                  sx={{
                    maxHeight: 200,
                  }}
                >
                  <RenderFileAccordingToType
                    key={att.id}
                    att={att}
                    onPreview={openViewer}
                    index={idx}
                    groupByMonth={true}
                  />
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
      {mediaFiles.length > 0 && !groupByMonth && (
        <Box
          sx={{
            width: "100%",
            maxWidth: 360,
            display: "grid",
            gap: 0.75,
            gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
            gridTemplateRows: `repeat(${layout.rows}, ${layout.tileH}px)`,
            mb: others.length ? 1 : 0,
          }}
        >
          {mediaFiles?.map((att, idx) => {
            return (
              <RenderFileAccordingToType
                key={att.id}
                att={att}
                onPreview={openViewer}
                index={idx}
              />
            );
          })}
        </Box>
      )}
      {!groupByMonth &&
        others?.map((att) => (
          <Box key={att.id} mb={1}>
            <RenderFileAccordingToType att={att} />
          </Box>
        ))}
      <AttachmentViewer
        open={viewerOpen}
        onClose={closeViewer}
        attachments={attachments}
        startIndex={viewerIndex}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onNearToEnd={onNearToEnd}
        index={viewerIndex}
        setIndex={setViewerIndex}
      />
    </>
  );
}
export function RenderFileAccordingToType({
  att,
  onPreview,
  index,
  iframe,
  handleMediaReady,
  currentIndex,
  groupByMonth,
}) {
  const mime = att?.fileMimeType || "";
  if (isImage(mime)) {
    return (
      <ImageFileRow
        att={att}
        onOpen={() => onPreview(index)}
        handleMediaReady={handleMediaReady}
        index={index}
        iframe={iframe}
        groupByMonth={groupByMonth}
        shouldLoadImmediately={iframe}
      />
    );
  } else if (isVideo(mime)) {
    return (
      <VideoPlayer
        url={att.fileUrl}
        mode={iframe ? "direct" : "click"}
        onClick={() => onPreview(index)}
        handleMediaReady={handleMediaReady}
        groupByMonth={groupByMonth}
      />
    );
  } else if (isAudio(mime)) {
    return groupByMonth ? (
      <GridFileItem file={att} onPreview={onPreview} />
    ) : (
      <AudioFileRow att={att} handleMediaReady={handleMediaReady} />
    );
  } else
    return groupByMonth ? (
      <GridFileItem file={att} onPreview={onPreview} />
    ) : (
      <FileLinkRow
        att={att}
        iframe={iframe}
        handleMediaReady={handleMediaReady}
      />
    );
}

function ImageFileRow({
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

function AudioFileRow({ att, handleMediaReady }) {
  const mime = att?.fileMimeType || "";
  const fileUrl = att?.fileUrl;
  const { icon: Icon, color, label } = getFileConfig(mime);

  if (!fileUrl) return null;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 360,
        borderRadius: 1.5,
        minWidth: 240,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        p: 1,
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Icon color={color} />
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          {label || "Audio"}
        </Typography>

        <Box sx={{ flex: 1 }} />

        <IconButton size="small" onClick={() => window.open(fileUrl, "_blank")}>
          <FaDownload />
        </IconButton>
      </Box>

      <Typography
        variant="caption"
        sx={{ opacity: 0.8, wordBreak: "break-word" }}
      >
        {att?.fileName}
      </Typography>

      <audio
        src={fileUrl}
        controls
        style={{ width: "100%" }}
        onCanPlay={() => {
          handleMediaReady?.();
        }}
        onError={() => {
          handleMediaReady?.();
        }}
      />
    </Box>
  );
}

function FileLinkRow({ att, iframe, handleMediaReady }) {
  const mime = att?.fileMimeType || "";
  const fileUrl = att?.fileUrl;
  const { icon: Icon, color, label } = getFileConfig(mime);

  if (!fileUrl) return null;
  useEffect(() => {
    if (!isPdf(mime)) {
      handleMediaReady?.();
    }
  }, [att]);
  return (
    <>
      {iframe && isPdf(mime) ? (
        <iframe
          src={fileUrl}
          onLoad={handleMediaReady}
          style={{
            width: "100%",
            height: "90vh",
            border: "none",
            zIndex: 2,
            background: "#fff",
          }}
        />
      ) : (
        <Box
          component="a"
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          sx={{
            width: "100%",
            maxWidth: 360,
            borderRadius: 1.5,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            p: 1,
            textDecoration: "none",
            color: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 1,
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 1.2,
              bgcolor: "grey.100",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon color={color} />
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 800, lineHeight: 1.2 }}
            >
              {label || "File"}
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.8, display: "block" }}
              noWrap
              title={att?.fileName}
            >
              {att?.fileName}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.6,
              px: 1,
              py: 0.5,
              borderRadius: "999px",
              bgcolor: "rgba(0,0,0,0.04)",
            }}
          >
            <FaDownload size={12} />
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              Download
            </Typography>
          </Box>
        </Box>
      )}
    </>
  );
}
function VideoPlayer({
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

function AttachmentViewer({
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
