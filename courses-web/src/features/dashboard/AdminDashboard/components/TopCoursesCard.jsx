"use client";
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  alpha,
} from "@mui/material";
import { FaTrophy } from "react-icons/fa";

const TopCoursesCard = ({ dashboardData, theme }) => (
  <Card
    sx={{
      height: "100%",
      background: "background.paper",
      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
      transition: "all 0.3s ease",
      "&:hover": {
        boxShadow: `0 12px 24px ${alpha(theme.palette.success.main, 0.1)}`,
      },
    }}
  >
    <CardContent sx={{ p: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            borderRadius: "12px",
            p: 1.5,
            mr: 2,
            color: "white",
          }}
        >
          <FaTrophy size={24} />
        </Box>
        <Typography variant="h5" fontWeight="700">
          Top Performing Courses
        </Typography>
      </Box>
      <List sx={{ p: 0 }}>
        {dashboardData.topCourses.map((course, index) => (
          <React.Fragment key={course.id}>
            <ListItem
              sx={{
                px: 0,
                py: 2,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.success.main, 0.03),
                  borderRadius: 2,
                },
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    width: 40,
                    height: 40,
                    fontWeight: "bold",
                  }}
                >
                  {index + 1}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography
                    variant="body1"
                    fontWeight="600"
                    sx={{ mb: 0.5 }}
                  >
                    {course.title}
                  </Typography>
                }
                secondary={
                  <Box>
                    <Typography
                      variant="body2"
                      component="span"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {course.enrollments} enrollments •{" "}
                      {course.completionRate}% completion
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={course.completionRate}
                      sx={{
                        mt: 1,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(
                          theme.palette.primary.main,
                          0.1
                        ),
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 3,
                          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                        },
                      }}
                    />
                  </Box>
                }
              />
              <Box sx={{ textAlign: "right" }}>
                <Chip
                  label={`${course.averageScore}%`}
                  size="small"
                  color={
                    course.averageScore >= 80
                      ? "success"
                      : course.averageScore >= 70
                      ? "warning"
                      : "error"
                  }
                  sx={{ fontWeight: "bold" }}
                />
              </Box>
            </ListItem>
            {index < dashboardData.topCourses.length - 1 && (
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
);

export default TopCoursesCard;
