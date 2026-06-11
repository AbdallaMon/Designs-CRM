"use client";
import { createContext, useContext, useMemo, useState } from "react";
import {
  Backdrop,
  Box,
  LinearProgress,
  Typography,
  Paper,
  CircularProgress,
  Fade,
  Stack,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { MdCloud } from "react-icons/md";

// --- Styled components (module-level, created once) ---

const StyledBackdrop = styled(Backdrop)(() => ({
  zIndex: 9999998,
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  backdropFilter: "blur(4px)",
}));

const ProgressContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
  boxShadow: theme.shadows[10],
  minWidth: 400,
  maxWidth: 500,
  width: "90%",
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 12,
  borderRadius: 6,
  backgroundColor: theme.palette.grey[200],
  "& .MuiLinearProgress-bar": {
    borderRadius: 6,
    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  },
}));

const AnimatedIcon = styled(MdCloud)(({ theme }) => ({
  fontSize: 48,
  color: theme.palette.primary.main,
  animation: "bounce 2s infinite",
  "@keyframes bounce": {
    "0%, 20%, 50%, 80%, 100%": { transform: "translateY(0)" },
    "40%": { transform: "translateY(-8px)" },
    "60%": { transform: "translateY(-4px)" },
  },
}));

// --- Helpers ---

function getProgressColor(progress) {
  if (progress < 33) return "error";
  if (progress < 66) return "warning";
  return "success";
}

function getStatusMessage(progress) {
  if (progress === 0) return "Initializing upload...";
  if (progress < 100) return "Uploading file...";
  return "Upload complete!";
}

// --- Upload overlay (extracted from provider) ---

function UploadOverlay({ showOverlay, progress, fileName, uploadSpeed }) {
  return (
    <StyledBackdrop open={showOverlay} transitionDuration={300}>
      <Fade in={showOverlay} timeout={500}>
        <ProgressContainer elevation={10}>
          <Stack spacing={3} alignItems="center">
            <Box display="flex" alignItems="center" justifyContent="center">
              <AnimatedIcon />
            </Box>

            {fileName && (
              <Typography
                variant="h6"
                align="center"
                sx={{
                  fontWeight: 500,
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {fileName}
              </Typography>
            )}

            <Typography
              variant="body1"
              color="text.secondary"
              align="center"
              sx={{ fontWeight: 400 }}
            >
              {getStatusMessage(progress)}
            </Typography>

            <Box sx={{ width: "100%", position: "relative" }}>
              <StyledLinearProgress
                variant="determinate"
                value={progress}
                color={getProgressColor(progress)}
                sx={{ mb: 1 }}
              />
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  {Math.round(progress)}% complete
                </Typography>
                {uploadSpeed && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    {uploadSpeed}
                  </Typography>
                )}
              </Box>
            </Box>

            {progress === 100 && (
              <Box position="relative" display="inline-flex">
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={40}
                  thickness={4}
                  color="success"
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    component="div"
                    color="success.main"
                    fontWeight="bold"
                  >
                    ✓
                  </Typography>
                </Box>
              </Box>
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              sx={{ opacity: 0.8 }}
            >
              Please don&lsquo;t close this window while uploading
            </Typography>
          </Stack>
        </ProgressContainer>
      </Fade>
    </StyledBackdrop>
  );
}

// --- Provider ---

export const UploadingContext = createContext(null);

export function UploadingProvider({ children }) {
  const [progress, setProgress] = useState(0);
  const [showOverlay, setOverlay] = useState(false);
  const [fileName, setFileName] = useState("");
  const [uploadSpeed, setUploadSpeed] = useState("");

  const value = useMemo(
    () => ({
      progress,
      setProgress,
      setOverlay,
      fileName,
      setFileName,
      uploadSpeed,
      setUploadSpeed,
    }),
    [progress, fileName, uploadSpeed],
  );

  return (
    <UploadingContext.Provider value={value}>
      <UploadOverlay
        showOverlay={showOverlay}
        progress={progress}
        fileName={fileName}
        uploadSpeed={uploadSpeed}
      />
      {children}
    </UploadingContext.Provider>
  );
}

export function useUploadContext() {
  const context = useContext(UploadingContext);
  if (!context) {
    throw new Error(
      "useUploadContext must be used within an UploadingProvider",
    );
  }
  return context;
}
