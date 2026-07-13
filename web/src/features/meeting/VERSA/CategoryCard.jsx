"use client";

import React from "react";
import { Typography, Box, Chip, Stack, alpha } from "@mui/material";

import { MdAdd, MdCheckCircle, MdChevronRight } from "react-icons/md";

// Calm category card: accent rail (success/warning), title, Arabic label, one status
// chip, and a chevron affordance. The whole card is the action — no redundant button.
export const CategoryCard = ({ category, onClick }) => {
  const accent = category.hasVersa ? "success" : "warning";

  const activate = () => onClick(category);

  return (
    <Box
      onClick={activate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      }}
      sx={{
        height: "100%",
        cursor: "pointer",
        borderRadius: 2.5,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderInlineStart: (theme) => `3px solid ${theme.palette[accent].main}`,
        bgcolor: "background.paper",
        p: 2.25,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        transition: "box-shadow .2s ease, border-color .2s ease",
        "&:hover, &:focus-visible": {
          boxShadow: (theme) => theme.shadows[3],
          borderColor: (theme) => alpha(theme.palette[accent].main, 0.5),
          outline: "none",
        },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{ lineHeight: 1.3 }}
        >
          {category.title}
        </Typography>
        {category.label && (
          <Typography variant="caption" color="text.secondary" dir="auto">
            {category.label}
          </Typography>
        )}
      </Box>

      <Chip
        size="small"
        label={category.hasVersa ? "Ready" : "New"}
        icon={category.hasVersa ? <MdCheckCircle /> : <MdAdd />}
        sx={{
          flexShrink: 0,
          fontWeight: 700,
          borderRadius: 1.5,
          color: `${accent}.main`,
          bgcolor: (theme) => alpha(theme.palette[accent].main, 0.12),
          border: (theme) => `1px solid ${alpha(theme.palette[accent].main, 0.3)}`,
          "& .MuiChip-icon": { color: `${accent}.main` },
        }}
      />
      <Box sx={{ display: "flex", color: "text.disabled", flexShrink: 0 }}>
        <MdChevronRight size={22} />
      </Box>
    </Box>
  );
};
