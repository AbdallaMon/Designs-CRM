"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  Dialog,
  DialogContent,
  CircularProgress,
  Backdrop,
  Skeleton,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  FaEllipsisV,
  FaReply,
  FaTrash,
  FaDownload,
  FaPlay,
  FaFile,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { MdPushPin } from "react-icons/md";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FILE_TYPE_CONFIG } from "@/app/helpers/constants";

dayjs.extend(relativeTime);

/* ===================== Helpers ===================== */

function getFileConfig(mimeType) {
  return (
    FILE_TYPE_CONFIG[mimeType] || {
      icon: FaFile,
      color: "#757575",
      label: "File",
    }
  );
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

function truncateText(text = "", max = 90) {
  const t = String(text || "");
  if (t.length <= max) return t;
  return t.slice(0, max).trim() + "…";
}

function normalizeUploadsUrl(url) {
  return url;
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

async function warmResource(url, mime) {
  if (!url) return;

  if (isImage(mime)) {
    await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(true);
      img.src = url;
    });
    return;
  }

  try {
    const abs = new URL(url, window.location.origin).href;
    await fetch(abs, { method: "GET", cache: "force-cache" });
  } catch {
    try {
      await fetch(url, { method: "GET", cache: "force-cache" });
    } catch {}
  }
}

/* ===================== Reply Preview ===================== */

function ReplyPreview({
  loadingReplayJump,
  replyTo,
  isOwnMessage,
  onJumpToMessage,
}) {
  if (!replyTo) return null;

  const repliedName =
    replyTo?.sender?.name || replyTo?.senderClient?.name || "Unknown";

  const repliedContent = replyTo?.isDeleted
    ? "(Deleted message)"
    : replyTo?.content?.trim()
    ? truncateText(replyTo.content, 110)
    : "(No text)";

  return (
    <Box
      onClick={() => onJumpToMessage?.(replyTo.id)}
      sx={{
        mb: 1,
        px: 1,
        py: 0.75,
        borderRadius: 1,
        cursor: onJumpToMessage ? "pointer" : "default",
        borderLeft: "4px solid",
        borderLeftColor: isOwnMessage
          ? "rgba(255,255,255,0.8)"
          : "primary.main",
        bgcolor: isOwnMessage
          ? "rgba(255,255,255,0.12)"
          : "rgba(25,118,210,0.08)",
        position: "relative",
      }}
    >
      {loadingReplayJump && (
        <Box sx={{ position: "absolute", top: 8, right: 8 }}>
          <CircularProgress size={12} />
        </Box>
      )}

      <Typography
        variant="caption"
        sx={{
          display: "block",
          fontWeight: 700,
          opacity: isOwnMessage ? 0.95 : 0.9,
        }}
      >
        Replying to {repliedName}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          display: "block",
          opacity: isOwnMessage ? 0.85 : 0.8,
        }}
      >
        {repliedContent}
      </Typography>
    </Box>
  );
}

/* ===================== Attachments ===================== */

/**
 * Image tile states:
 * - "checking": initial cache check
 * - "thumb": show thumbnail + download overlay
 * - "loading": warm fileUrl
 * - "full": show fileUrl, click opens viewer
 */
function AttachmentTile({ att, overlayText, onOpen }) {
  const mime = att?.fileMimeType || "";
  const fileUrl = normalizeUploadsUrl(att?.fileUrl);
  const thumbUrl = normalizeUploadsUrl(att?.thumbnailUrl);

  const isImg = isImage(mime);

  const [stage, setStage] = useState(isImg ? "checking" : "full");
  const [imgSrc, setImgSrc] = useState(isImg ? thumbUrl || "" : "");

  useEffect(() => {
    if (!isImg || !fileUrl) {
      setStage("full");
      return;
    }

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
  const showLoadingOverlay = isImg && stage === "loading" && !overlayText;

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
              objectFit: "cover",
              display: "block",
              filter: stage !== "full" ? "saturate(0.95)" : "none",
              transform: "scale(1.001)",
            }}
          />
        ) : (
          <Skeleton variant="rectangular" width="100%" height="100%" />
        )
      ) : // video/pdf tiles: show thumbnail if exists, else icon block
      thumbUrl ? (
        <Box
          component="img"
          src={thumbUrl}
          alt={att?.fileName || "preview"}
          loading="lazy"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transform: "scale(1.001)",
          }}
        />
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

      {/* Video play overlay */}
      {isVideo(mime) && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0,0,0,0.2)",
          }}
        >
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: "999px",
              bgcolor: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <FaPlay />
          </Box>
        </Box>
      )}

      {/* +N overlay */}
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
      {showLoadingOverlay && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0,0,0,0.28)",
            zIndex: 3,
          }}
        >
          <CircularProgress size={34} sx={{ color: "#fff" }} />
        </Box>
      )}
    </Box>
  );
}

function AudioAttachmentRow({ att }) {
  const mime = att?.fileMimeType || "";
  const fileUrl = normalizeUploadsUrl(att?.fileUrl);
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

      <audio src={fileUrl} controls style={{ width: "100%" }} />
    </Box>
  );
}

function FileLinkRow({ att }) {
  const mime = att?.fileMimeType || "";
  const fileUrl = normalizeUploadsUrl(att?.fileUrl);
  const { icon: Icon, color, label } = getFileConfig(mime);

  if (!fileUrl) return null;

  return (
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
          Open
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Viewer: ONLY for image/video/pdf
 */
function AttachmentViewer({ open, onClose, attachments, startIndex }) {
  const [index, setIndex] = useState(startIndex || 0);
  const [mediaReady, setMediaReady] = useState(false);

  const att = attachments?.[index];
  const fileUrl = normalizeUploadsUrl(att?.fileUrl);
  const thumbUrl = normalizeUploadsUrl(att?.thumbnailUrl);
  const mime = att?.fileMimeType || "";

  useEffect(() => {
    if (!open) return;
    setIndex(startIndex || 0);
  }, [open, startIndex]);

  useEffect(() => {
    if (!open) return;
    setMediaReady(false);
  }, [open, index, fileUrl]);

  const canPrev = index > 0;
  const canNext = index < (attachments?.length || 0) - 1;

  if (!att) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogContent sx={{ p: 0, bgcolor: "black", position: "relative" }}>
        {/* Top bar */}
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

        {/* Prev/Next */}
        {canPrev && (
          <IconButton
            onClick={() => setIndex((v) => v - 1)}
            sx={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 5,
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.08)",
            }}
          >
            <FaChevronLeft />
          </IconButton>
        )}
        {canNext && (
          <IconButton
            onClick={() => setIndex((v) => v + 1)}
            sx={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 5,
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.08)",
            }}
          >
            <FaChevronRight />
          </IconButton>
        )}

        {/* Content */}
        <Box
          sx={{
            width: "100%",
            height: "90vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            p: 1,
          }}
        >
          {/* Background thumb blur */}
          {isImage(mime) && thumbUrl && (
            <Box
              component="img"
              src={thumbUrl}
              alt="preview"
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: "blur(10px)",
                opacity: 0.35,
              }}
            />
          )}

          {/* Main */}
          {isImage(mime) && (
            <Box
              component="img"
              src={fileUrl}
              alt={att.fileName}
              onLoad={() => setMediaReady(true)}
              onError={() => setMediaReady(true)}
              sx={{
                maxWidth: "100%",
                maxHeight: "90vh",
                objectFit: "contain",
                zIndex: 2,
              }}
            />
          )}

          {isVideo(mime) && (
            <video
              src={fileUrl}
              controls
              autoPlay
              preload="metadata"
              onLoadedData={() => setMediaReady(true)}
              onError={() => setMediaReady(true)}
              style={{ width: "100%", maxHeight: "90vh", zIndex: 2 }}
            />
          )}

          {isPdf(mime) && (
            <iframe
              src={fileUrl}
              onLoad={() => setMediaReady(true)}
              style={{
                width: "100%",
                height: "90vh",
                border: "none",
                zIndex: 2,
                background: "#fff",
              }}
            />
          )}

          <Backdrop
            open={!mediaReady}
            sx={{ position: "absolute", inset: 0, zIndex: 4, color: "#fff" }}
          >
            <CircularProgress />
          </Backdrop>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function AttachmentsRenderer({ attachments }) {
  const clean = useMemo(() => {
    const arr = Array.isArray(attachments) ? attachments : [];
    return arr.filter((a) => a?.fileUrl && a?.fileName);
  }, [attachments]);

  const media = useMemo(
    () =>
      clean.filter((a) => {
        const m = a?.fileMimeType || "";
        return isImage(m) || isVideo(m) || isPdf(m);
      }),
    [clean]
  );

  const audios = useMemo(
    () =>
      clean.filter((a) => {
        const m = a?.fileMimeType || "";
        return isAudio(m) && !isVideo(m);
      }),
    [clean]
  );

  const others = useMemo(
    () =>
      clean.filter((a) => {
        const m = a?.fileMimeType || "";
        return !isImage(m) && !isVideo(m) && !isPdf(m) && !isAudio(m);
      }),
    [clean]
  );

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  if (!clean.length) return null;

  const openViewer = (idx) => {
    setViewerIndex(idx);
    setViewerOpen(true);
  };

  const mediaTiles = media.slice(0, 4);
  const extraMedia = media.length - mediaTiles.length;

  const layout = (() => {
    const n = mediaTiles.length;
    if (n === 1) return { cols: 1, rows: 1, tileH: 260 };
    if (n === 2) return { cols: 2, rows: 1, tileH: 170 };
    if (n === 3) return { cols: 2, rows: 2, tileH: 140 };
    return { cols: 2, rows: 2, tileH: 140 };
  })();

  return (
    <>
      {/* Media grid (image/video/pdf) */}
      {!!mediaTiles.length && (
        <Box
          sx={{
            width: "100%",
            maxWidth: 360,
            display: "grid",
            gap: 0.75,
            gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
            gridTemplateRows: `repeat(${layout.rows}, ${layout.tileH}px)`,
            mb: audios.length || others.length ? 1 : 0,
          }}
        >
          {mediaTiles.map((att, i) => {
            const overlayText =
              extraMedia > 0 && i === 3 ? `+${extraMedia}` : null;
            const gridProps =
              mediaTiles.length === 3 && i === 0
                ? { gridRow: "span 2" }
                : undefined;

            return (
              <Box key={att.id || `${att.fileUrl}-${i}`} sx={gridProps}>
                <AttachmentTile
                  att={att}
                  overlayText={overlayText}
                  onOpen={() => openViewer(i)}
                />
              </Box>
            );
          })}
        </Box>
      )}

      {/* Audio: render directly */}
      {!!audios.length && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          {audios.map((a, i) => (
            <AudioAttachmentRow key={a.id || `${a.fileUrl}-${i}`} att={a} />
          ))}
        </Box>
      )}

      {/* Other files: direct URL open */}
      {!!others.length && (
        <Box sx={{ mt: audios.length ? 1 : 0 }}>
          {audios.length ? <Divider sx={{ my: 1 }} /> : null}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {others.map((a, i) => (
              <FileLinkRow key={a.id || `${a.fileUrl}-${i}`} att={a} />
            ))}
          </Box>
        </Box>
      )}

      {/* Viewer only for media */}
      <AttachmentViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        attachments={media}
        startIndex={viewerIndex}
      />
    </>
  );
}

/* ===================== Main Component ===================== */

export function ChatMessage({
  message,
  currentUserId,
  isCurrentUserAdmin,
  currentUserRole,
  room,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onUnPin,
  onJumpToMessage,
  loadingReplayJump,
  setReplyLoaded,
  replyLoaded,
  replayLoadingMessageId,
  setReplayLoadingMessageId,
  onRemoveUnreadCount,
}) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [flashOn, setFlashOn] = useState(false);
  const [showUnreadCount, setShowUnreadCount] = useState(
    message.showUnreadCount || false
  );

  const isOwnMessage =
    message.sender?.id === currentUserId ||
    message.client?.id === currentUserId;

  const isDeleted = Boolean(message.isDeleted);

  const isGroupChat =
    room?.type === "PROJECT_GROUP" ||
    room?.type === "GROUP" ||
    room?.type === "MULTI_PROJECT";

  const canPin = isGroupChat
    ? currentUserRole === "ADMIN" || currentUserRole === "MODERATOR"
    : true;

  const hasContent = Boolean(message.content?.trim());

  const attachments = Array.isArray(message.attachments)
    ? message.attachments
    : [];

  const isFileLikeMessage =
    message.type !== "TEXT" && message.type !== "SYSTEM";
  const hasAttachments = isFileLikeMessage && attachments.length > 0;

  const shouldFlash =
    Boolean(replyLoaded) &&
    String(replayLoadingMessageId) === String(message.id);

  useEffect(() => {
    if (!shouldFlash) return;

    setFlashOn(true);

    const timer = setTimeout(() => {
      setFlashOn(false);
      setReplyLoaded?.(false);
      setReplayLoadingMessageId?.(null);
    }, 1200);

    return () => clearTimeout(timer);
  }, [shouldFlash, setReplyLoaded, setReplayLoadingMessageId]);

  useEffect(() => {
    if (showUnreadCount) {
      const timer = setTimeout(() => {
        setShowUnreadCount(false);
        onRemoveUnreadCount?.(message.id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showUnreadCount, message.id, onRemoveUnreadCount]);

  if (message.type === "SYSTEM") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
        <Chip label={message.content} size="small" />
      </Box>
    );
  }

  const dayDivider = message.showDayDivider && (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        my: 2,
        position: "sticky",
        top: 0,
        zIndex: 10,
        mx: "auto",
      }}
    >
      <Chip label={message.dayGroup} size="small" variant="outlined" />
    </Box>
  );

  return (
    <>
      {dayDivider}

      {showUnreadCount && message.unreadCount && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            my: 1,
            animation: "fadeOut 0.5s ease-out 2.5s forwards",
            "@keyframes fadeOut": {
              "0%": { opacity: 1 },
              "100%": { opacity: 0 },
            },
          }}
        >
          <Chip
            label={`${message.unreadCount} unread`}
            size="small"
            color="error"
            variant="outlined"
          />
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: isOwnMessage ? "flex-end" : "flex-start",
          mb: 2,
          gap: 1,
        }}
        id={`message-${message.id}`}
      >
        {!isOwnMessage && (
          <Avatar src={message.sender?.profilePicture}>
            {message.sender?.name?.[0]}
          </Avatar>
        )}

        <Box
          sx={(theme) => {
            const ringColor = alpha(theme.palette.primary.main, 0.65);
            const glowColor = isOwnMessage
              ? alpha(theme.palette.primary.main, 0.22)
              : alpha(theme.palette.primary.main, 0.18);

            return {
              maxWidth: "75%",
              p: 1.5,
              pr: isDeleted ? 1.5 : 4,
              borderRadius: 2,
              bgcolor: isOwnMessage ? "action.selected" : "grey.100",
              color: isOwnMessage ? "primary.contrastText" : "text.primary",
              position: "relative",
              overflow: "visible",
              zIndex: 0,

              "@keyframes replyGlow": {
                "0%": { opacity: 0, transform: "scale(1)" },
                "35%": { opacity: 1, transform: "scale(1.01)" },
                "100%": { opacity: 0, transform: "scale(1.04)" },
              },
              "@keyframes replyRing": {
                "0%": {
                  opacity: 0,
                  transform: "scale(0.96)",
                  boxShadow: `0 0 0 0 ${alpha(ringColor, 0.0)}`,
                },
                "30%": {
                  opacity: 1,
                  transform: "scale(1)",
                  boxShadow: `0 0 0 10px ${alpha(ringColor, 0.22)}`,
                },
                "100%": {
                  opacity: 0,
                  transform: "scale(1.03)",
                  boxShadow: `0 0 0 18px ${alpha(ringColor, 0.0)}`,
                },
              },

              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                pointerEvents: "none",
                opacity: 0,
                transform: "scale(1)",
                background: `radial-gradient(circle at 30% 25%, ${glowColor} 0%, transparent 55%)`,
                willChange: "transform, opacity",
                animation: flashOn ? "replyGlow 1.1s ease-out" : "none",
              },

              "&::before": {
                content: '""',
                position: "absolute",
                inset: -6,
                borderRadius: "inherit",
                pointerEvents: "none",
                opacity: 0,
                transform: "scale(0.96)",
                border: `2px solid ${alpha(ringColor, 0.55)}`,
                willChange: "transform, opacity, box-shadow",
                animation: flashOn ? "replyRing 1.1s ease-out" : "none",
              },

              "@media (prefers-reduced-motion: reduce)": {
                "&::after": { animation: "none" },
                "&::before": { animation: "none" },
              },
            };
          }}
        >
          {!isDeleted && (
            <>
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{ position: "absolute", top: 4, right: 4, zIndex: 2 }}
              >
                <FaEllipsisV />
              </IconButton>

              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
              >
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    onReply?.(message);
                  }}
                >
                  <FaReply style={{ marginRight: 8 }} /> Reply
                </MenuItem>

                {canPin && (
                  <MenuItem
                    onClick={() => {
                      setMenuAnchor(null);
                      if (message.isPinned) onUnPin?.(message);
                      else onPin?.(message);
                    }}
                  >
                    {message.isPinned ? (
                      <>
                        <MdPushPin style={{ marginRight: 8 }} /> Unpin
                      </>
                    ) : (
                      <>
                        <MdPushPin style={{ marginRight: 8 }} /> Pin
                      </>
                    )}
                  </MenuItem>
                )}

                {(isOwnMessage || isCurrentUserAdmin) && (
                  <MenuItem
                    onClick={() => {
                      setMenuAnchor(null);
                      onDelete?.(message.id);
                    }}
                  >
                    <FaTrash style={{ marginRight: 8 }} /> Delete
                  </MenuItem>
                )}
              </Menu>
            </>
          )}

          {isDeleted ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FaTrash style={{ opacity: 0.75 }} />
              <Typography
                variant="body2"
                sx={{
                  fontStyle: "italic",
                  opacity: isOwnMessage ? 0.9 : 0.8,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                This message was deleted
              </Typography>
            </Box>
          ) : (
            <>
              {message.replyTo && (
                <ReplyPreview
                  loadingReplayJump={loadingReplayJump}
                  replyTo={message.replyTo}
                  isOwnMessage={isOwnMessage}
                  onJumpToMessage={onJumpToMessage}
                />
              )}

              {hasAttachments ? (
                <>
                  <AttachmentsRenderer attachments={attachments} />

                  {hasContent && (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {message.content}
                    </Typography>
                  )}
                </>
              ) : (
                hasContent && (
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {message.content}
                  </Typography>
                )
              )}
            </>
          )}

          <Typography
            variant="caption"
            sx={{ display: "block", mt: 0.5, opacity: 0.6 }}
          >
            {dayjs(message.createdAt).format("HH:mm")}
            {message.isDeleted
              ? " • deleted"
              : message.isEdited
              ? " • edited"
              : ""}
          </Typography>
        </Box>

        {isOwnMessage && (
          <Avatar src={message.sender?.profilePicture}>
            {message.sender?.name?.[0]}
          </Avatar>
        )}
      </Box>
    </>
  );
}
