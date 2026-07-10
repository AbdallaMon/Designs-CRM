"use client";
import React from "react";
import {
  Box,
  CardContent,
  Typography,
  Chip,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material";
import { MdPause, MdError } from "react-icons/md";
import { PROJECT_STATUSES } from "@/app/helpers/constants";
import dayjs from "dayjs";
import {
  StyledCard,
  StyledProgressBar,
  ProgressDot,
} from "@/features/work-stages/projects/projectDetailsStyles.js";

// Display-only Arabic labels for the project statuses. Keys remain the English
// enum values used everywhere in logic/comparisons; only the shown text changes.
const STATUS_LABELS_AR = {
  "To Do": "To Do",
  "3D": "3D",
  Render: "Render",
  Modification: "Modification",
  Delivery: "Delivery",
  Hold: "Hold",
  Completed: "Completed",
  Rejected: "Rejected",
  Studying: "Studying",
  Electricity: "Electricity",
  Started: "Started",
  "In Progress": "In Progress",
};
export const labelForStatus = (status) => STATUS_LABELS_AR[status] || status;

// Project Progress Tracker Component
export const ProjectProgressTracker = ({ project }) => {
  const theme = useTheme();
  // Filter out Hold and get only completion statuses
  const getCompletionStatuses = (projectType) => {
    return PROJECT_STATUSES[projectType].filter(
      (status) => status !== "Hold" && status !== "Rejected"
    );
  };

  const completionStatuses = getCompletionStatuses(project.type);
  const currentStatusIndex = completionStatuses.indexOf(project.status);

  // Calculate percentage completion
  const calculatePercentage = () => {
    if (currentStatusIndex === -1) return 0;
    if (completionStatuses.length <= 1) return 100;
    return Math.round(
      (currentStatusIndex / (completionStatuses.length - 1)) * 100
    );
  };

  // Calculate project duration
  const calculateProjectDuration = (startDate, endDate) => {
    if (!startDate) {
      return { text: "Not started yet", color: "text.secondary" };
    }

    if (!endDate) {
      const start = dayjs(startDate);
      const now = dayjs();
      const days = now.diff(start, "day");

      return {
        text: `In progress (${days} days so far)`,
        color: "info.main",
      };
    }

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const days = end.diff(start, "day");
    const months = end.diff(start, "month");

    if (days < 0) {
      return { text: "Invalid dates", color: "error.main" };
    }

    if (days > 30) {
      return {
        text: `Completed in ${months} ${
          months === 1 ? "month" : "months"
        } (${days} days)`,
        color: "success.main",
      };
    }

    return {
      text: `Completed in ${days} days`,
      color: "success.main",
    };
  };

  const percentageComplete = calculatePercentage();
  const isOnHold = project.status === "Hold";
  const isRejected = project.status === "Rejected";
  const duration = calculateProjectDuration(project.startedAt, project.endedAt);

  return (
    <StyledCard
      elevation={0}
      sx={{
        mb: 3,
        overflow: "visible",
        "&.MuiPaper-root": {
          height: "fit-content",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Status Message for Hold or Rejected */}
        {isOnHold || isRejected ? (
          <Box
            sx={{
              p: 2.25,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: alpha(
                isOnHold ? theme.palette.warning.main : theme.palette.error.main,
                0.1
              ),
              border: `1px solid ${alpha(
                isOnHold ? theme.palette.warning.main : theme.palette.error.main,
                0.3
              )}`,
              color: isOnHold
                ? theme.palette.warning.dark
                : theme.palette.error.dark,
            }}
          >
            {isOnHold ? <MdPause size={22} /> : <MdError size={22} />}
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {isOnHold
                ? "This project is currently on hold. Progress will resume when the hold is lifted."
                : "This project has been rejected and requires attention before proceeding."}
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Combined Progress and Duration */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1.5,
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                Project Progress
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
              >
                <Tooltip title="Progress percentage">
                  <Chip
                    label={`${percentageComplete}%`}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 700, borderRadius: 1.5 }}
                  />
                </Tooltip>
                <Typography
                  variant="body2"
                  color={duration.color}
                  sx={{ fontWeight: 600 }}
                >
                  {duration.text}
                </Typography>
              </Box>
            </Box>

            {/* Progress bar */}
            <StyledProgressBar
              variant="determinate"
              value={percentageComplete}
              sx={{ mb: 3 }}
            />

            {/* Enhanced stepper with dots */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                px: 0.5,
                mt: 1.5,
              }}
            >
              {completionStatuses.map((label, index) => (
                <Box key={label} sx={{ textAlign: "center", flex: 1 }}>
                  <Tooltip title={labelForStatus(label)}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <ProgressDot active={index <= currentStatusIndex} />
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.7rem",
                          mt: 0.7,
                          fontWeight: index <= currentStatusIndex ? 700 : 500,
                          color:
                            index <= currentStatusIndex
                              ? "primary.main"
                              : "text.secondary",
                        }}
                      >
                        {labelForStatus(label)}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
};
