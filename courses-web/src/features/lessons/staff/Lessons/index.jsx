"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Fab,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  MdPlayArrow as PlayArrow,
  MdLock as Lock,
  MdCheckCircle as CheckCircle,
  MdQuiz as Quiz,
  MdAssignment as Assignment,
  MdArrowBack as ArrowBack,
  MdMenu as Menu,
  MdList as ListIcon,
} from "react-icons/md";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import FullScreenLoader from "@/shared/components/feedback/loaders/FullscreenLoader";
import { useAuth } from "@/app/providers/AuthProvider";
import { baseRoleOf } from "@/app/helpers/functions/utility";
import { useSearchParams } from "next/navigation";
import CourseNavigation from "./components/CourseNavigation";
import CourseOverview from "./components/CourseOverview";
import LessonView from "./components/LessonView";
import TestView from "./components/TestView";

const DRAWER_WIDTH = 320;

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
      url: `shared/courses/${courseId}?role=${baseRoleOf(user)}&`,
      setLoading,
      setData: setCourse,
    });
    await getDataAndSet({
      url: `shared/courses/${courseId}/progress?role=${baseRoleOf(user)}&`,
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
          courseId={courseId}
          onComplete={getCourse}
        />
      );
    }

    return (
      <CourseOverview
        course={course}
        userProgress={userProgress}
        lastAvailableIndex={lastAvailableIndex}
        courseItems={courseItems}
        isItemAccessible={isItemAccessible}
        handleItemClick={handleItemClick}
      />
    );
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
