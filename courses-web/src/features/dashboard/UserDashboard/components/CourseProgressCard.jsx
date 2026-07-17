"use client";
import React from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import { FaTrophy } from "react-icons/fa";
import { formatDate } from "../helpers";

const CourseProgressCard = ({ courseProgress }) => {
  const theme = useTheme();

  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Card
        sx={{
          background: "background.paper",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
          },
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight="700" sx={{ mb: 3 }}>
            📚 My Course Progress
          </Typography>
          <List sx={{ p: 0 }}>
            {courseProgress.slice(0, 4).map((course, index) => (
              <React.Fragment key={course.id}>
                <ListItem
                  sx={{
                    px: 0,
                    py: 3,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.03),
                      borderRadius: 2,
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor:
                          course.completionPercentage === 100
                            ? "success.main"
                            : course.completionPercentage >= 50
                            ? "warning.main"
                            : "primary.main",
                        width: 48,
                        height: 48,
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                      }}
                    >
                      {course.completionPercentage}%
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="h6" fontWeight="600" sx={{ mb: 1 }}>
                        {course.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 1 }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight="500"
                          >
                            {course.completedLessons} of {course.totalLessons}{" "}
                            lessons
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight="500"
                          >
                            Last activity: {formatDate(course.lastActivity)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={course.completionPercentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.1
                            ),
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 4,
                              background:
                                course.completionPercentage === 100
                                  ? `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`
                                  : `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                            },
                          }}
                        />
                      </Box>
                    }
                  />
                  {course.completionPercentage === 100 && (
                    <Box sx={{ ml: 2 }}>
                      <FaTrophy color={theme.palette.warning.main} size={24} />
                    </Box>
                  )}
                </ListItem>
                {index < Math.min(courseProgress.length - 1, 3) && (
                  <Divider
                    sx={{
                      mx: 2,
                      backgroundColor: alpha(theme.palette.divider, 0.3),
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default CourseProgressCard;
