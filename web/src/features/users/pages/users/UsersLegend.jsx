"use client";
import React from "react";
import {
  alpha,
  Box,
  Chip,
  Collapse,
  Divider,
  lighten,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { MdExpandMore } from "react-icons/md";
import { usersColors, usersColorsArray } from "@/app/helpers/constants";

export default function UsersLegend() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: "background.paper",
        mb: 2,
        overflow: "hidden",
      }}
    >
      <Box
        onClick={() => setOpen((v) => !v)}
        role="button"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          px: 2,
          py: 1.25,
          cursor: "pointer",
          userSelect: "none",
          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
          Users Type Colors Legend
        </Typography>
        <MdExpandMore
          style={{
            transition: "transform .2s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            fontSize: 20,
          }}
        />
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Divider />
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            p: 2,
          }}
        >
          {usersColorsArray.map((color, index) => {
            const safe = color || "#6b7280";
            return (
              <Chip
                key={index}
                size="small"
                label={usersColors[color]}
                sx={{
                  fontWeight: 700,
                  borderRadius: 1.5,
                  color: safe,
                  bgcolor: lighten(safe, 0.85),
                  border: `1px solid ${alpha(safe, 0.35)}`,
                }}
              />
            );
          })}
        </Box>
      </Collapse>
    </Paper>
  );
}
