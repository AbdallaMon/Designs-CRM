"use client";
import { createContext, useContext, useState } from "react";
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

// Custom styled components
const StyledBackdrop = styled(Backdrop)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
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
    "0%, 20%, 50%, 80%, 100%": {
      transform: "translateY(0)",
    },
    "40%": {
      transform: "translateY(-8px)",
    },
    "60%": {
      transform: "translateY(-4px)",
    },
  },
}));

export const UploadingContext = createContext(null);

export default function UploadingProvider({ children }) {
  const [progress, setProgress] = useState(0);
  const [overLay, setOverlay] = useState(false);
  const [fileName, setFileName] = useState("");
  const [uploadSpeed, setUploadSpeed] = useState("");

  const getProgressColor = () => {
    if (progress < 33) return "error";
    if (progress < 66) return "warning";
    return "success";
  };

  const getStatusMessage = () => {
    if (progress === 0) return "Initializing upload...";
    if (progress < 100) return "Uploading file...";
    return "Upload complete!";
  };

  return (
    <UploadingContext.Provider
      value={{
        progress,
        setProgress,
        setOverlay,
        fileName,
        setFileName,
        uploadSpeed,
        setUploadSpeed,
      }}
    >
      <>
        <StyledBackdrop open={overLay} transitionDuration={300}>
          <Fade in={overLay} timeout={500}>
            <ProgressContainer elevation={10}>
              <Stack spacing={3} alignItems="center">
                {/* Animated Upload Icon */}
                <Box display="flex" alignItems="center" justifyContent="center">
                  <AnimatedIcon />
                </Box>

                {/* File Name */}
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

                {/* Status Message */}
                <Typography
                  variant="body1"
                  color="text.secondary"
                  align="center"
                  sx={{ fontWeight: 400 }}
                >
                  {getStatusMessage()}
                </Typography>

                {/* Progress Bar Container */}
                <Box sx={{ width: "100%", position: "relative" }}>
                  <StyledLinearProgress
                    variant="determinate"
                    value={progress}
                    color={getProgressColor()}
                    sx={{ mb: 1 }}
                  />

                  {/* Progress Percentage */}
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

                    {/* Upload Speed */}
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

                {/* Circular Progress for Completion */}
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

                {/* Additional Info */}
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
        {children}
      </>
    </UploadingContext.Provider>
  );
}

export const useUploadContext = () => {
  const context = useContext(UploadingContext);
  if (!context) {
    throw new Error(
      "useUploadContext must be used within an UploadingProvider"
    );
  }
  return context;
};
