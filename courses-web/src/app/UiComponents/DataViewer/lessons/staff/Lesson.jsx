import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Chip,
  Link,
  IconButton,
  Divider,
  Grid,
  Paper,
  LinearProgress,
  Alert,
  Container,
  Fade,
  Slide,
  Stack,
  Avatar,
  Tooltip,
  Badge,
  alpha,
  useTheme,
} from "@mui/material";
import {
  MdExpandMore as ExpandMore,
  MdPlayArrow as PlayArrow,
  MdPictureAsPdf as PictureAsPdf,
  MdLink as LinkIcon,
  MdQuiz as Quiz,
  MdTimer as Timer,
  MdCheckCircle as CheckCircle,
  MdOpenInNew as OpenInNew,
  MdOndemandVideo,
  MdDescription,
  MdLaunch,
  MdTimer,
} from "react-icons/md";

import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useAuth } from "@/app/providers/AuthProvider";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import CombinedHomeWork from "./CombinedHomeWork";

const LessonComponent = ({
  lessonId,
  isCompleted,
  courseId,
  onComplete,
  noTest,
  mustAddHomeWork,
}) => {
  const [completed, setCompleted] = useState(isCompleted);
  const [expandedSection, setExpandedSection] = useState("videos");
  const [lesson, setLesson] = useState();
  const [loading, setLoading] = useState(false);
  const { setToastLoading } = useToastContext();
  const { user } = useAuth();
  const theme = useTheme();
  async function getLesson() {
    await getDataAndSet({
      url: `shared/courses/${courseId}/lessons/${lessonId}?role=${user.role}&`,
      setLoading,
      setData: setLesson,
    });
  }
  useEffect(() => {
    if (lessonId) {
      getLesson();
    }
  }, [lessonId]);

  const handleSectionChange = (section) => (event, isExpanded) => {
    setExpandedSection(isExpanded ? section : false);
  };

  function calculateProgress() {
    return completed ? "COMPLETED" : "IN PROGRESS";
  }
  const getEmbedUrlWithParams = (url) => {
    // Only process YouTube embeds
    if (url.includes("youtube.com/embed/")) {
      const hasParams = url.includes("?");
      const extraParams = "rel=0&modestbranding=1";
      return hasParams ? `${url}&${extraParams}` : `${url}?${extraParams}`;
    }

    // If it's not a YouTube embed, return as is
    return url;
  };

  const renderVideo = (video) => {
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

  const renderPDF = (pdf, index) => (
    <Fade in timeout={300} key={pdf.id}>
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
              justifyContent="space-between"
              spacing={2}
            >
              <Stack direction="row" alignItems="center" spacing={2} flex={1}>
                <Avatar sx={{ bgcolor: "error.main", width: 40, height: 40 }}>
                  <MdDescription />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    PDF {index + 1}
                  </Typography>
                </Box>
              </Stack>
              <Tooltip title="Open PDF in new tab">
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdf />}
                  endIcon={<OpenInNew />}
                  href={pdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    minWidth: 120,
                  }}
                >
                  Open PDF
                </Button>
              </Tooltip>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Fade>
  );

  const renderLink = (link) => (
    <Fade in timeout={300} key={link.id}>
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
              justifyContent="space-between"
              spacing={2}
            >
              <Stack direction="row" alignItems="center" spacing={2} flex={1}>
                <Avatar sx={{ bgcolor: "info.main", width: 40, height: 40 }}>
                  <MdLaunch />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {link.title}
                  </Typography>
                </Box>
              </Stack>
              <Tooltip title="Open link in new tab">
                <Button
                  variant="outlined"
                  startIcon={<LinkIcon />}
                  endIcon={<OpenInNew />}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    minWidth: 120,
                  }}
                >
                  Visit Link
                </Button>
              </Tooltip>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Fade>
  );

  const getSectionIcon = (section) => {
    switch (section) {
      case "videos":
        return <MdOndemandVideo />;
      case "pdfs":
        return <MdDescription />;
      case "links":
        return <MdLaunch />;
      default:
        return <MdOndemandVideo />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ p: 0, pb: 10 }}>
      {loading && <FullScreenLoader />}

      {!lesson && !loading && (
        <Slide direction="up" in timeout={500}>
          <Alert
            severity="error"
            sx={{
              borderRadius: 3,
              mb: 3,
              fontSize: "1rem",
              "& .MuiAlert-message": { fontSize: "inherit" },
            }}
          >
            You are not allowed to access this lesson
          </Alert>
        </Slide>
      )}

      {lesson && (
        <Fade in timeout={500}>
          <Box>
            {/* Lesson Header */}
            <Card
              elevation={0}
              sx={{
                mx: 1,
                mb: 6,
                borderRadius: 6,
                // background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                color: theme.palette.primary.contrastText,
                position: "relative",
                overflow: "hidden",
                border: 1,
                borderColor: alpha(theme.palette.common.white, 0.1),
              }}
            >
              <CardContent sx={{ p: 2, position: "relative", zIndex: 1 }}>
                <Stack spacing={3}>
                  <Box>
                    <Typography
                      variant="h2"
                      component="h1"
                      sx={{
                        fontWeight: 700,
                        mb: 2,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {lesson.title}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        opacity: 0.9,
                        lineHeight: 1.6,
                        fontWeight: 400,
                      }}
                    >
                      {lesson.description}
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    <Chip
                      icon={<Timer />}
                      label={`${lesson.duration} minutes`}
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        fontWeight: 600,
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    />
                    <Chip
                      icon={<CheckCircle />}
                      label={calculateProgress()}
                      color={completed ? "success" : "warning"}
                      sx={{
                        fontWeight: 600,
                        bgcolor: completed ? "success.main" : "warning.main",
                        color: "white",
                      }}
                    />
                  </Stack>

                  <Box sx={{ mt: 2 }}>
                    {noTest && mustAddHomeWork && (
                      <CombinedHomeWork
                        courseId={courseId}
                        lessonId={lessonId}
                        onUpdate={() => {
                          onComplete();
                          setCompleted(true);
                        }}
                      />
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Content Sections */}
            <Stack spacing={3}>
              {/* Videos Section */}
              {lesson.videos.length > 0 && (
                <Accordion
                  expanded={expandedSection === "videos"}
                  onChange={handleSectionChange("videos")}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    "&:before": { display: "none" },
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: (theme) => theme.shadows[4],
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                      px: 3,
                      py: 2,
                      "& .MuiAccordionSummary-content": {
                        alignItems: "center",
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar
                        sx={{ bgcolor: "primary.main", width: 32, height: 32 }}
                      >
                        {getSectionIcon("videos")}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Videos
                      </Typography>
                      <Badge
                        badgeContent={lesson.videos.length}
                        color="primary"
                        sx={{ "& .MuiBadge-badge": { fontWeight: 600 } }}
                      />
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{ px: { xs: 1.5, md: 3 }, py: 2, pt: 0 }}
                  >
                    <Stack spacing={2}>
                      {lesson.videos
                        .sort((a, b) => a.order - b.order)
                        .map((video) => renderVideo(video))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* PDFs Section */}
              {lesson.pdfs.length > 0 && (
                <Accordion
                  expanded={expandedSection === "pdfs"}
                  onChange={handleSectionChange("pdfs")}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    "&:before": { display: "none" },
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: (theme) => theme.shadows[4],
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                      px: 3,
                      py: 2,
                      "& .MuiAccordionSummary-content": {
                        alignItems: "center",
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar
                        sx={{ bgcolor: "error.main", width: 32, height: 32 }}
                      >
                        {getSectionIcon("pdfs")}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        PDF Resources
                      </Typography>
                      <Badge
                        badgeContent={lesson.pdfs.length}
                        color="error"
                        sx={{ "& .MuiBadge-badge": { fontWeight: 600 } }}
                      />
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{ px: { xs: 1.5, md: 3 }, py: 2, pt: 0 }}
                  >
                    <Stack spacing={2}>
                      {lesson.pdfs
                        .sort((a, b) => a.order - b.order)
                        .map((pdf, index) => renderPDF(pdf, index))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Links Section */}
              {lesson.links.length > 0 && (
                <Accordion
                  expanded={expandedSection === "links"}
                  onChange={handleSectionChange("links")}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    "&:before": { display: "none" },
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: (theme) => theme.shadows[4],
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                      px: 3,
                      py: 2,
                      "& .MuiAccordionSummary-content": {
                        alignItems: "center",
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar
                        sx={{ bgcolor: "info.main", width: 32, height: 32 }}
                      >
                        {getSectionIcon("links")}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Additional Links
                      </Typography>
                      <Badge
                        badgeContent={lesson.links.length}
                        color="info"
                        sx={{ "& .MuiBadge-badge": { fontWeight: 600 } }}
                      />
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{ px: { xs: 1.5, md: 3 }, py: 2, pt: 0 }}
                  >
                    <Stack spacing={2}>
                      {lesson.links
                        .sort((a, b) => a.order - b.order)
                        .map((link) => renderLink(link))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}
            </Stack>

            {/* Completion Alert */}
            {calculateProgress() === "COMPLETED" && (
              <Slide direction="up" in timeout={500}>
                <Alert
                  severity="success"
                  icon={<CheckCircle />}
                  sx={{
                    mt: 4,
                    borderRadius: 3,
                    py: 2,
                    background: "linear-gradient(135deg, #66bb6a, #4caf50)",
                    color: "white",
                    "& .MuiAlert-icon": { color: "white" },
                    "& .MuiAlert-message": { color: "white" },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    🎉 Congratulations! You've completed this lesson.
                  </Typography>
                  <Typography variant="body1">
                    You can now proceed to the next lesson or review the content
                    anytime.
                  </Typography>
                </Alert>
              </Slide>
            )}
          </Box>
        </Fade>
      )}
    </Container>
  );
};

export default LessonComponent;
