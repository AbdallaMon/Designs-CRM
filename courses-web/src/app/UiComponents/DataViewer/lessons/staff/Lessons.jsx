"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Button,
  Divider,
  useTheme,
  useMediaQuery,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  Alert,
  Fab,
} from "@mui/material";
import {
  MdPlayArrow as PlayArrow,
  MdLock as Lock,
  MdCheckCircle as CheckCircle,
  MdQuiz as Quiz,
  MdAssignment as Assignment,
  MdSchool as School,
  MdArrowBack as ArrowBack,
  MdMenu as Menu,
  MdClose as Close,
  MdList as ListIcon,
  MdWarning as Warning,
} from "react-icons/md";
import LessonComponent from "./Lesson";
import TestComponent from "../../test/staff/Test";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import { useAuth } from "@/app/providers/AuthProvider";
import { useSearchParams } from "next/navigation";

const DRAWER_WIDTH = 320;

// Course Navigation Sidebar Component
const CourseNavigation = ({
  course,
  userProgress,
  courseItems,
  selectedItem,
  onItemClick,
  calculateProgress,
  lastAvailableIndex,
  isItemAccessible,
  getStatusIcon,
  getStatusChip,
  getItemStatus,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Course Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: 1,
          borderColor: "divider",
          pt: { md: "80px" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <School sx={{ mr: 2, fontSize: 32, color: "primary.main" }} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", fontSize: "1.1rem" }}
              noWrap
            >
              {course?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {course?.description}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Progress: {Math.round(calculateProgress())}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={calculateProgress()}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          <Chip
            label={`${course?._count.lessons} Lessons`}
            variant="outlined"
            size="small"
            sx={{ fontSize: "0.7rem", height: 24 }}
          />
          <Chip
            label={`${userProgress?.completedLessons.length} Done`}
            variant="outlined"
            size="small"
            color="success"
            sx={{ fontSize: "0.7rem", height: 24 }}
          />
        </Box>
      </Box>

      {/* Course Content List */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <List sx={{ p: 0 }}>
          {courseItems?.map((item, index) => {
            const isAccessible = isItemAccessible(item, index, courseItems);
            const isSelected =
              selectedItem?.id === item.id && selectedItem?.type === item.type;

            return (
              <React.Fragment key={`${item.type}-${item.id}`}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => isAccessible && onItemClick(item)}
                    disabled={!isAccessible}
                    selected={isSelected}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderLeft: isSelected ? 3 : 0,
                      borderColor: "primary.main",
                      bgcolor: isSelected ? "action.selected" : "transparent",
                      "&:hover": {
                        bgcolor: isAccessible ? "action.hover" : "transparent",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {getStatusIcon(item, isAccessible)}
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight:
                                item.type === "lesson" ? "medium" : "normal",
                              color: !isAccessible
                                ? "text.disabled"
                                : "text.primary",
                              flex: 1,
                              fontSize: "0.875rem",
                            }}
                          >
                            {item.title}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          {getStatusChip(item, isAccessible)}
                          {item.duration && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "block",
                                mt: 0.5,
                                fontSize: "0.7rem",
                              }}
                            >
                              {item.duration} min
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {index < courseItems?.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>
      </Box>
    </Box>
  );
};

// Main Course View Component
const LesssonView = ({ courseId }) => {
  const [course, setCourse] = useState();
  const [userProgress, setUserProgress] = useState();
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewType, setViewType] = useState("course");
  const [loading, setLoading] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const { user } = useAuth();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const itemId = searchParams.get("itemId");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  let lastAvailableIndex = -1;

  async function getCourse() {
    await getDataAndSet({
      url: `shared/courses/${courseId}?role=${user.role}&`,
      setLoading,
      setData: setCourse,
    });
    await getDataAndSet({
      url: `shared/courses/${courseId}/progress?role=${user.role}&`,
      setLoading,
      setData: setUserProgress,
    });
  }
  const createCourseStructure = () => {
    if (!course || !course.lessons) return [];
    const items = [];
    let stop = false;

    course.lessons.forEach((lesson, index) => {
      const allowedLesson = lesson.allowedUsers.find(
        (allow) => allow.userId === user.id
      );
      const isCompleted =
        userProgress?.completedLessons.includes(lesson.id) ||
        lesson.tests.length > 0 ||
        !lesson.mustUploadHomework;

      const canPreviewLesson =
        allowedLesson && (index === 0 || items[lastAvailableIndex]?.canPreview);

      items.push({
        type: "lesson",
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        order: lesson.order,
        data: lesson,
        canPreview: canPreviewLesson && isCompleted,
        mustAddHomeWork: lesson.mustUploadHomework,
      });

      if (canPreviewLesson && !stop) {
        lastAvailableIndex++;
      }
      if (!canPreviewLesson) {
        stop = true;
      }

      if (lesson.tests && lesson.tests.length > 0) {
        lesson.tests.forEach((test, testIndex) => {
          const hasPassed =
            test.attempts?.some((attempt) => attempt.passed) ?? false;
          const isCompletedTest = !lesson.mustUploadHomework
            ? true
            : lesson.tests.length === testIndex + 1
            ? userProgress?.completedLessons.includes(lesson.id)
            : true;

          const canPreviewTest =
            allowedLesson &&
            isCompleted &&
            items[lastAvailableIndex]?.canPreview;

          items.push({
            type: "test",
            id: test.id,
            title: test.title,
            lessonId: lesson.id,
            order: lesson.order,
            data: test,
            canPreview: isCompletedTest && canPreviewTest && hasPassed,
            mustAddHomeWork:
              lesson.tests.length > 0 &&
              lesson.tests.length === testIndex + 1 &&
              lesson.mustUploadHomework,
          });
          if (canPreviewTest && !stop) {
            lastAvailableIndex++;
          }
          if (!canPreviewTest) {
            stop = true;
          }
        });
      }
    });

    if (
      items &&
      items.length > 0 &&
      lastAvailableIndex === items.length - 1 &&
      items[lastAvailableIndex].canPreview
    ) {
      lastAvailableIndex++;
    }

    course.tests.forEach((test) => {
      items.push({
        type: "test",
        id: test.id,
        title: test.title,
        isFinal: true,
        order: 999,
        data: test,
        canPreview: true,
      });
    });

    return items;
  };

  const courseItems = createCourseStructure();

  useEffect(() => {
    getCourse();
  }, [courseId]);

  useEffect(() => {
    if (
      course &&
      userProgress &&
      itemId &&
      type &&
      courseItems &&
      courseItems.length > 0 &&
      !selectedItem &&
      viewType !== "COURSE"
    ) {
      const item = courseItems?.find(
        (item) => item.id == itemId && type === item.type
      );

      setSelectedItem(item);
      setViewType(type);
    }
  }, [type, itemId, course, userProgress, courseItems, selectedItem]);

  const isItemAccessible = (item, index, items) => {
    return index <= lastAvailableIndex;
  };

  const getItemStatus = (item) => {
    if (item.type === "lesson") {
      return userProgress?.completedLessons?.includes(item.id)
        ? "completed"
        : "pending";
    }

    if (item.type === "test") {
      const attempt = userProgress?.testAttempts?.find(
        (a) => a.testId === item.id
      );
      if (attempt) {
        return attempt.passed ? "passed" : "failed";
      }
      return "pending";
    }

    return "pending";
  };

  const getStatusIcon = (item, isAccessible) => {
    if (!item) return;
    if (!isAccessible) return <Lock color="disabled" />;

    const status = getItemStatus(item);

    if (item.type === "lesson") {
      return status === "completed" ? (
        <CheckCircle color="success" />
      ) : (
        <PlayArrow color="primary" />
      );
    }

    if (item.type === "test") {
      if (status === "passed") return <CheckCircle color="success" />;
      if (status === "failed") return <Assignment color="error" />;
      return <Quiz color="primary" />;
    }
  };

  const getStatusChip = (item, isAccessible) => {
    if (!isAccessible)
      return (
        <Chip
          label="Locked"
          size="small"
          color="default"
          sx={{ height: 20, fontSize: "0.7rem" }}
        />
      );

    const status = getItemStatus(item);

    if (item.type === "lesson") {
      return status === "completed" ? (
        <Chip
          label="Completed"
          size="small"
          color="success"
          sx={{ height: 20, fontSize: "0.7rem" }}
        />
      ) : (
        <Chip
          label="Start"
          size="small"
          color="primary"
          sx={{ height: 20, fontSize: "0.7rem" }}
        />
      );
    }

    if (item.type === "test") {
      if (status === "passed")
        return (
          <Chip
            label="Passed"
            size="small"
            color="success"
            sx={{ height: 20, fontSize: "0.7rem" }}
          />
        );
      if (status === "failed")
        return (
          <Chip
            label="Retry"
            size="small"
            color="error"
            sx={{ height: 20, fontSize: "0.7rem" }}
          />
        );
      return (
        <Chip
          label="Take Test"
          size="small"
          color="primary"
          sx={{ height: 20, fontSize: "0.7rem" }}
        />
      );
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setViewType(item.type);
    setMobileDrawerOpen(false); // Close mobile drawer when item is selected

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("type", item.type);
    searchParams.set("itemId", item.id);

    const newRelativePathQuery = `${
      window.location.pathname
    }?${searchParams.toString()}`;
    window.history.pushState(null, "", newRelativePathQuery);
  };

  const handleBack = async () => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete("type");
    searchParams.delete("itemId");

    const newRelativePathQuery = `${window.location.pathname}${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;
    window.history.pushState(null, "", newRelativePathQuery);

    window.setTimeout(() => {
      setSelectedItem(null);
      setViewType("course");
    }, 50);
    await getCourse();
  };

  const calculateProgress = () => {
    const items = courseItems;
    if (lastAvailableIndex === -1) return 0;
    return items?.length > 0 ? (lastAvailableIndex / items.length) * 100 : 0;
  };

  const toggleMobileDrawer = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  // Course Overview Component (when no lesson/test is selected)
  const CourseOverview = () => (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
        <School sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
          {course?.title}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 600, mx: "auto" }}
        >
          {course?.description}
        </Typography>

        {lastAvailableIndex === -1 ? (
          <Alert severity="warning" sx={{ mb: 3, maxWidth: 500, mx: "auto" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              No Access Yet
            </Typography>
            <Typography variant="body2">
              You don't have permission to access any lessons in this course.
              Please contact your instructor.
            </Typography>
          </Alert>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "medium" }}>
              Ready to Start Learning?
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={() => {
                const firstAccessibleItem = courseItems.find((_, index) =>
                  isItemAccessible(courseItems[index], index, courseItems)
                );
                if (firstAccessibleItem) {
                  handleItemClick(firstAccessibleItem);
                }
              }}
              sx={{ px: 4, py: 1.5, fontSize: "1.1rem" }}
            >
              Start First Lesson
            </Button>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Chip
            icon={<School />}
            label={`${course?._count.lessons} Lessons`}
            variant="outlined"
            color="primary"
          />
          <Chip
            icon={<CheckCircle />}
            label={`${userProgress?.completedLessons?.length || 0} Completed`}
            variant="outlined"
            color="success"
          />
          <Chip
            icon={<Quiz />}
            label={`${course?._count.tests} Tests`}
            variant="outlined"
          />
        </Box>
      </Paper>
    </Container>
  );

  // Lesson View with enhanced layout
  const LessonView = ({ isCompleted, lesson, onComplete, mustAddHomeWork }) => (
    <Box sx={{ height: "100%" }}>
      <LessonComponent
        isCompleted={isCompleted}
        lessonId={lesson.id}
        courseId={lesson.courseId}
        onComplete={onComplete}
        noTest={lesson?.tests.length === 0}
        mustAddHomeWork={mustAddHomeWork}
      />
    </Box>
  );

  // Test View with enhanced layout
  const TestView = ({ test, mustAddHomeWork }) => (
    <Container maxWidth="md" sx={{ py: 2, px: 0 }}>
      <TestComponent
        testId={test.id}
        courseId={courseId}
        onComplete={getCourse}
        mustAddHomeWork={mustAddHomeWork}
      />
    </Container>
  );

  // Navigation Drawer
  const drawer = (
    <CourseNavigation
      course={course}
      userProgress={userProgress}
      courseItems={courseItems}
      selectedItem={selectedItem}
      onItemClick={handleItemClick}
      calculateProgress={calculateProgress}
      lastAvailableIndex={lastAvailableIndex}
      isItemAccessible={isItemAccessible}
      getStatusIcon={getStatusIcon}
      getStatusChip={getStatusChip}
      getItemStatus={getItemStatus}
    />
  );

  // Main Content Area
  const mainContent = () => {
    if (viewType === "lesson" && selectedItem) {
      return (
        <LessonView
          isCompleted={userProgress?.completedLessons?.includes(
            selectedItem.data.id
          )}
          lesson={selectedItem.data}
          mustAddHomeWork={selectedItem.mustAddHomeWork}
          onComplete={getCourse}
        />
      );
    }

    if (viewType === "test" && selectedItem) {
      return (
        <TestView
          test={selectedItem.data}
          mustAddHomeWork={selectedItem.mustAddHomeWork}
        />
      );
    }

    return <CourseOverview />;
  };

  return (
    <Box
      sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}
    >
      {loading && <FullScreenLoader />}

      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: 10, top: "80px" }}>
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={toggleMobileDrawer}
              sx={{ mr: 2 }}
            >
              <Menu />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1 }}
            >
              {selectedItem ? selectedItem.title : course?.title}
            </Typography>
            {selectedItem && (
              <IconButton color="inherit" onClick={handleBack}>
                <ArrowBack />
              </IconButton>
            )}
          </Toolbar>
        </AppBar>
      )}

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileDrawerOpen}
          onClose={toggleMobileDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              bgcolor: "background.paper",
            },
          }}
        >
          <Toolbar />
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              bgcolor: "background.paper",
              borderRight: 1,
              borderColor: "divider",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          height: "100vh",
          overflow: "auto",
          mt: { xs: 8, md: 0 }, // Account for mobile app bar
        }}
      >
        {mainContent()}
      </Box>

      {/* Mobile FAB for navigation */}
      {isMobile && !mobileDrawerOpen && (
        <Fab
          color="primary"
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: theme.zIndex.speedDial,
          }}
          onClick={toggleMobileDrawer}
        >
          <ListIcon />
        </Fab>
      )}
    </Box>
  );
};

export default LesssonView;
