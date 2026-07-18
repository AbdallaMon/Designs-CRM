import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Fade,
  Stack,
  Avatar,
} from "@mui/material";
import {
  MdPlayArrow as PlayArrow,
  MdPictureAsPdf as PictureAsPdf,
  MdOpenInNew as OpenInNew,
  MdOndemandVideo,
  MdTimer,
} from "react-icons/md";

import { getEmbedUrlWithParams } from "../helpers";

const VideoItem = ({ video }) => {
  const renderPdfAttachments = () => {
    if (!video.pdfs || video.pdfs.length === 0) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            mb: 1.5,
            color: "text.secondary",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <PictureAsPdf style={{ fontSize: "18px" }} />
          Related PDFS ({video.pdfs.length})
        </Typography>
        <Stack spacing={1}>
          {video.pdfs.map((pdf) => (
            <Card
              key={pdf.id}
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "action.hover",
                  transform: "translateX(4px)",
                },
              }}
            >
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar
                    sx={{
                      bgcolor: "error.main",
                      width: 32,
                      height: 32,
                      fontSize: "16px",
                    }}
                  >
                    <PictureAsPdf />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {pdf.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.75rem",
                      }}
                    >
                      Added {new Date(pdf.uploadedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <IconButton
                    component="a"
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{
                      color: "primary.main",
                      "&:hover": {
                        bgcolor: "primary.50",
                      },
                    }}
                  >
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    );
  };

  if (video.videoType === "IFRAME") {
    return (
      <Fade in timeout={300} key={video.id}>
        <Box sx={{ mb: 3 }}>
          <Card
            elevation={0}
            sx={{
              overflow: "hidden",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: (theme) => theme.shadows[8],
                transform: "translateY(-2px)",
              },
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 2 }}
              >
                <Avatar
                  sx={{ bgcolor: "primary.main", width: 40, height: 40 }}
                >
                  <MdOndemandVideo />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Video {video.order + 1}
                  </Typography>
                  {video.pdfs && video.pdfs.length > 0 && (
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {video.pdfs.length} attachment
                      {video.pdfs.length !== 1 ? "s" : ""} available
                    </Typography>
                  )}
                </Box>
              </Stack>
              <Box
                sx={{
                  position: "relative",
                  paddingBottom: "56.25%",
                  height: 0,
                  background: "linear-gradient(45deg, #f5f5f5, #e0e0e0)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <iframe
                  src={getEmbedUrlWithParams(video.url)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                  allowFullScreen
                  title={`Video ${video.order + 1}`}
                />
              </Box>
              {renderPdfAttachments()}
            </CardContent>
          </Card>
        </Box>
      </Fade>
    );
  } else {
    return (
      <Fade in timeout={300} key={video.id}>
        <Box sx={{ mb: 3 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: (theme) => theme.shadows[4],
                transform: "translateY(-1px)",
              },
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 2 }}
              >
                <Avatar
                  sx={{ bgcolor: "primary.main", width: 40, height: 40 }}
                >
                  <MdOndemandVideo />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Video {video.order + 1}
                  </Typography>
                  {video.pdfs && video.pdfs.length > 0 && (
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {video.pdfs.length} attachment
                      {video.pdfs.length !== 1 ? "s" : ""} available
                    </Typography>
                  )}
                </Box>
                <Chip
                  icon={<MdTimer />}
                  label="Watch Now"
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Stack>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                endIcon={<OpenInNew />}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                }}
              >
                Watch Video
              </Button>
              {renderPdfAttachments()}
            </CardContent>
          </Card>
        </Box>
      </Fade>
    );
  }
};

export default VideoItem;
