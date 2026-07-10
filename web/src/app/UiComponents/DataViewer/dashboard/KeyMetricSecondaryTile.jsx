"use client";
import React from "react";
import {
  Box,
  Typography,
  Avatar,
  LinearProgress,
  useTheme,
} from "@mui/material";

const KeyMetricSecondaryTile = ({ metric, successRate }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        p: 1.5,
        height: "100%",
        boxShadow: 1,
        borderRadius: 2,
        bgcolor: "background.paper",
        transition: "transform 0.3s, box-shadow 0.3s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: 4,
        },
      }}
    >
      <Avatar
        sx={{
          bgcolor: metric.color,
          width: 40,
          height: 40,
          marginInlineEnd: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {metric.icon}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", display: "block" }}
        >
          {metric.title}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: "bold", color: "text.primary" }}
        >
          {metric.value}
        </Typography>
        {metric.isProgress && (
          <Box sx={{ width: "100%", mt: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={successRate}
              sx={{
                height: 6,
                borderRadius: 5,
                bgcolor: "action.disabledBackground",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 5,
                  backgroundColor: theme.palette.success.main,
                },
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default KeyMetricSecondaryTile;
