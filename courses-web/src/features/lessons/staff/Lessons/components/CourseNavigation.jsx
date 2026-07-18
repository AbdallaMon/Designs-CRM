"use client";
import React from "react";
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
} from "@mui/material";
import { MdSchool as School } from "react-icons/md";

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

export default CourseNavigation;
