"use client";
import React from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import { FaCheckCircle, FaTimes } from "react-icons/fa";
import { formatDate } from "../helpers";

const getTestStatusIcon = (passed) => {
  return passed ? (
    <FaCheckCircle color="#4caf50" size={20} />
  ) : (
    <FaTimes color="#f44336" size={20} />
  );
};

const RecentTestResultsCard = ({ recentTestAttempts }) => {
  const theme = useTheme();

  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Card
        sx={{
          background: "background.paper",
          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: `0 12px 24px ${alpha(theme.palette.info.main, 0.1)}`,
          },
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight="700" sx={{ mb: 3 }}>
            📝 Recent Test Results
          </Typography>
          <List sx={{ p: 0 }}>
            {recentTestAttempts.map((attempt, index) => (
              <React.Fragment key={attempt.id}>
                <ListItem
                  sx={{
                    px: 0,
                    py: 2,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.info.main, 0.03),
                      borderRadius: 2,
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: "transparent",
                        width: 40,
                        height: 40,
                      }}
                    >
                      {getTestStatusIcon(attempt.passed)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        fontWeight="600"
                        sx={{ mb: 0.5 }}
                      >
                        {attempt.testTitle}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          {attempt.courseTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(attempt.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ textAlign: "right" }}>
                    <Chip
                      label={`${attempt.score || 0}%`}
                      size="small"
                      color={attempt.passed ? "success" : "error"}
                      sx={{
                        fontWeight: "bold",
                        mb: 0.5,
                      }}
                    />
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                      sx={{ textTransform: "capitalize" }}
                    >
                      {attempt.testType.toLowerCase()}
                    </Typography>
                  </Box>
                </ListItem>
                {index < recentTestAttempts.length - 1 && (
                  <Divider
                    sx={{
                      mx: 2,
                      backgroundColor: alpha(theme.palette.divider, 0.3),
                    }}
                  />
                )}
              </React.Fragment>
            ))}
            {recentTestAttempts.length === 0 && (
              <Box
                textAlign="center"
                sx={{
                  py: 4,
                  color: "text.secondary",
                }}
              >
                <Typography variant="body1" fontWeight="500">
                  No test attempts yet
                </Typography>
                <Typography variant="body2">
                  Start taking tests to see your results here
                </Typography>
              </Box>
            )}
          </List>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default RecentTestResultsCard;
