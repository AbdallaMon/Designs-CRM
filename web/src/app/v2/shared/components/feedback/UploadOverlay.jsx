import colors from "@/app/v2/lib/theme/colors";
import {
  Box,
  Typography,
  Fade,
  Paper,
  Chip,
  IconButton,
  Portal,
} from "@mui/material";
import {
  MdOutlineUploadFile,
  MdSpeed,
  MdAccessTime,
  MdCheckCircle,
  MdClose,
} from "react-icons/md";
import { RiFileUploadLine } from "react-icons/ri";
import { ZINDEXS } from "../../constants";

function getProgressStage(progress) {
  if (progress === 0) return "init";
  if (progress < 33) return "early";
  if (progress < 66) return "mid";
  if (progress < 100) return "late";
  return "complete";
}

function getStageConfig(stage, themeColors) {
  const map = {
    init: {
      bar: themeColors.info,
      bg: themeColors.infoLight + "33",
      text: themeColors.infoDark,
      label: "Starting",
    },
    early: {
      bar: themeColors.primary,
      bg: themeColors.primaryAlt,
      text: themeColors.primaryDark,
      label: "In progress",
    },
    mid: {
      bar: themeColors.secondary,
      bg: themeColors.secondaryAlt,
      text: themeColors.secondaryDark,
      label: "Halfway",
    },
    late: {
      bar: themeColors.warning,
      bg: themeColors.primaryAlt,
      text: themeColors.warningDark,
      label: "Finishing up",
    },
    complete: {
      bar: themeColors.success,
      bg: themeColors.successLight + "44",
      text: themeColors.successDark,
      label: "Complete",
    },
  };
  return map[stage];
}

function getStatusMessage(progress) {
  if (progress === 0) return "Initializing upload...";
  if (progress < 66) return "Uploading file...";
  if (progress < 100) return "Almost done...";
  return "Upload complete!";
}

function getEta(progress, uploadSpeed) {
  if (!uploadSpeed || progress === 0) return "Estimating time...";
  if (progress >= 100) return "Finished";
  const mbps = parseFloat(uploadSpeed);
  if (!mbps) return null;
  return `About ${Math.ceil((100 - progress) / (mbps * 10))}s remaining`;
}

// ─── Icon Ring ───────────────────────────────────────────────────────────────

function IconRing({ stage, config }) {
  const isComplete = stage === "complete";
  return (
    <Box
      sx={{
        width: 68,
        height: 68,
        borderRadius: "50%",
        backgroundColor: config.bg,
        border: "1.5px solid",
        borderColor: config.bar + "55",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.4s ease",
        animation: isComplete ? "none" : "pulseRing 2s ease-in-out infinite",
        "@keyframes pulseRing": {
          "0%": { transform: "scale(0.93)", opacity: 0.8 },
          "50%": { transform: "scale(1.05)", opacity: 1 },
          "100%": { transform: "scale(0.93)", opacity: 0.8 },
        },
      }}
    >
      {isComplete ? (
        <MdCheckCircle size={30} color={config.bar} />
      ) : (
        <RiFileUploadLine size={30} color={config.bar} />
      )}
    </Box>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ progress, config }) {
  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
        <Typography variant="caption" color="text.secondary">
          Progress
        </Typography>
        <Typography
          variant="caption"
          fontWeight={500}
          sx={{ color: config.bar }}
        >
          {progress}%
        </Typography>
      </Box>
      <Box
        sx={{
          width: "100%",
          height: 8,
          backgroundColor: colors.bgTertiary,
          borderRadius: 99,
          overflow: "hidden",
          border: `0.5px solid ${colors.border}`,
        }}
      >
        <Box
          sx={{
            width: `${progress}%`,
            height: "100%",
            borderRadius: 99,
            backgroundColor: config.bar,
            transition:
              "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.4s ease",
          }}
        />
      </Box>
    </Box>
  );
}

// ─── Status Chip ──────────────────────────────────────────────────────────────

function StatusChip({ config }) {
  return (
    <Chip
      size="small"
      label={config.label}
      sx={{
        backgroundColor: config.bg,
        color: config.text,
        fontWeight: 500,
        fontSize: 12,
        height: 24,
        border: `0.5px solid ${config.bar}44`,
        "& .MuiChip-label": { px: 1.5 },
      }}
    />
  );
}

// ─── Meta Row ─────────────────────────────────────────────────────────────────

function MetaRow({ icon: Icon, children }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Icon size={15} color={colors.textMuted} />
      <Typography
        variant="body2"
        sx={{
          color: colors.textSecondary,
          fontSize: 13,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 240,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

// ─── Main Overlay ─────────────────────────────────────────────────────────────

export function UploadOverlay({
  showOverlay,
  progress,
  fileName,
  uploadSpeed,
  onCancel,
}) {
  const stage = getProgressStage(progress);
  const config = getStageConfig(stage, colors);
  const etaText = getEta(progress, uploadSpeed);
  const isComplete = stage === "complete";

  return (
    <Portal>
      <Fade in={showOverlay} timeout={300}>
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: `${colors.heading}99`,
            backdropFilter: "blur(6px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: ZINDEXS.OVERLAY,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              backgroundColor: colors.paperBg,
              border: `0.5px solid ${colors.border}`,
              borderRadius: 4,
              padding: "2rem 2.5rem",
              minWidth: 340,
              maxWidth: 420,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2.25,
              position: "relative",
              boxShadow: `0 24px 48px ${colors.shadowStrong}, 0 8px 16px ${colors.shadow}`,
              animation: "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              "@keyframes slideUp": {
                from: { opacity: 0, transform: "translateY(16px) scale(0.97)" },
                to: { opacity: 1, transform: "translateY(0) scale(1)" },
              },
            }}
          >
            {/* Close button */}
            {!isComplete && onCancel && (
              <IconButton
                size="small"
                onClick={onCancel}
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  color: colors.textMuted,
                  "&:hover": {
                    backgroundColor: colors.bgTertiary,
                    color: colors.textPrimary,
                  },
                }}
              >
                <MdClose size={18} />
              </IconButton>
            )}

            {/* Icon */}
            <IconRing stage={stage} config={config} />

            {/* Title + chip */}
            <Box
              sx={{
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <Typography
                variant="h6"
                fontWeight={500}
                sx={{ color: colors.heading }}
              >
                {getStatusMessage(progress)}
              </Typography>
              <StatusChip config={config} />
            </Box>

            {/* Progress bar */}
            <ProgressBar progress={progress} config={config} />

            {/* Divider */}
            <Box
              sx={{
                width: "100%",
                height: "0.5px",
                backgroundColor: colors.borderLight,
              }}
            />

            {/* Meta rows */}
            <Box
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {fileName && (
                <MetaRow icon={MdOutlineUploadFile}>{fileName}</MetaRow>
              )}
              {uploadSpeed && <MetaRow icon={MdSpeed}>{uploadSpeed}</MetaRow>}
              {etaText && <MetaRow icon={MdAccessTime}>{etaText}</MetaRow>}
            </Box>

            {/* Cancel button */}
            {!isComplete && onCancel && (
              <Box
                component="button"
                onClick={onCancel}
                sx={{
                  mt: 0.5,
                  fontSize: 13,
                  color: colors.textSecondary,
                  backgroundColor: "transparent",
                  border: `0.5px solid ${colors.border}`,
                  borderRadius: 2,
                  px: 3,
                  py: 0.75,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    backgroundColor: colors.bgTertiary,
                    color: colors.textPrimary,
                    borderColor: colors.borderDark,
                  },
                }}
              >
                Cancel upload
              </Box>
            )}
          </Paper>
        </Box>
      </Fade>
    </Portal>
  );
}
