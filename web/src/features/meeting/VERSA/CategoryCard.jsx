"use client";

import React from "react";
import { Button, Typography, Box, Chip, Stack, alpha } from "@mui/material";

import { MdAdd, MdCheckCircle } from "react-icons/md";

// Calm category card: accent rail (success/warning), title, label, status pill, one action.
export const CategoryCard = ({ category, onClick }) => {
  const accent = category.hasVersa ? "success" : "warning";

  return (
    <Box
      onClick={() => onClick(category)}
      sx={{
        height: "100%",
        cursor: "pointer",
        borderRadius: 2.5,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderLeft: (theme) => `3px solid ${theme.palette[accent].main}`,
        bgcolor: "background.paper",
        p: 2.25,
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow .2s ease, border-color .2s ease",
        "&:hover": {
          boxShadow: (theme) => theme.shadows[3],
          borderColor: (theme) => alpha(theme.palette[accent].main, 0.5),
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 1.5 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
            {category.title}
          </Typography>
          {category.label && (
            <Typography variant="caption" color="text.secondary">
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
      </Stack>

      <Box sx={{ mt: "auto" }}>
        <Button
          variant={category.hasVersa ? "contained" : "outlined"}
          color={accent}
          fullWidth
          startIcon={category.hasVersa ? <MdCheckCircle /> : <MdAdd />}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {category.hasVersa ? "View & Edit" : "Create VERSA"}
        </Button>
      </Box>
    </Box>
  );
};
