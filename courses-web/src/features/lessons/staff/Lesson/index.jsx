import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  Container,
  Fade,
  Slide,
  Stack,
  Avatar,
  Badge,
  alpha,
  useTheme,
} from "@mui/material";
import {
  MdExpandMore as ExpandMore,
  MdTimer as Timer,
  MdCheckCircle as CheckCircle,
  MdOndemandVideo,
  MdDescription,
  MdLaunch,
} from "react-icons/md";

import FullScreenLoader from "@/shared/components/feedback/loaders/FullscreenLoader";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useAuth } from "@/app/providers/AuthProvider";
import { baseRoleOf } from "@/app/helpers/functions/utility";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import CombinedHomeWork from "../CombinedHomeWork";
import VideoItem from "./components/VideoItem";
import PdfItem from "./components/PdfItem";
import LinkItem from "./components/LinkItem";

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
      url: `shared/courses/${courseId}/lessons/${lessonId}?role=${baseRoleOf(user)}&`,
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
                        .map((video) => (
                          <VideoItem key={video.id} video={video} />
                        ))}
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
                        .map((pdf, index) => (
                          <PdfItem key={pdf.id} pdf={pdf} index={index} />
                        ))}
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
                        .map((link) => (
                          <LinkItem key={link.id} link={link} />
                        ))}
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
