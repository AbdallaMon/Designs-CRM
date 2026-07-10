"use client";

import React from "react";
import {
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grow,
  useTheme,
  alpha,
} from "@mui/material";

import { MdAdd, MdCheckCircle } from "react-icons/md";

// CategoryCard Component - Enhanced
export const CategoryCard = ({ category, onClick, index }) => {
  const theme = useTheme();

  return (
    <Grow in timeout={300 + index * 100}>
      <Card
        sx={{
          cursor: "pointer",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          height: "100%",
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
          background: category.hasVersa
            ? `linear-gradient(135deg, ${alpha(
                theme.palette.success.main,
                0.1
              )} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`
            : `linear-gradient(135deg, ${alpha(
                theme.palette.warning.main,
                0.1
              )} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
          border: `2px solid ${
            category.hasVersa
              ? alpha(theme.palette.success.main, 0.2)
              : alpha(theme.palette.warning.main, 0.2)
          }`,
          "&:hover": {
            transform: "translateY(-8px) scale(1.02)",
            boxShadow: `0 16px 40px ${alpha(
              category.hasVersa
                ? theme.palette.success.main
                : theme.palette.warning.main,
              0.25
            )}`,
            border: `2px solid ${
              category.hasVersa
                ? theme.palette.success.main
                : theme.palette.warning.main
            }`,
          },
        }}
        onClick={() => onClick(category)}
      >
        {/* Decorative corner element */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 60,
            height: 60,
            background: `linear-gradient(135deg, ${
              category.hasVersa
                ? theme.palette.success.main
                : theme.palette.warning.main
            }, ${
              category.hasVersa
                ? theme.palette.success.dark
                : theme.palette.warning.dark
            })`,
            clipPath: "polygon(100% 0, 0 0, 100% 100%)",
            opacity: 0.8,
          }}
        />

        <CardContent
          sx={{
            p: 3,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box mb={3}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1.5,
                lineHeight: 1.3,
              }}
            >
              {category.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                lineHeight: 1.5,
                fontSize: "0.9rem",
              }}
            >
              {category.label}
            </Typography>
          </Box>

          <Box mb={3}>
            <Chip
              label={category.hasVersa ? "VERSA Ready" : "Create New"}
              color={category.hasVersa ? "success" : "warning"}
              icon={category.hasVersa ? <MdCheckCircle /> : <MdAdd />}
              variant={category.hasVersa ? "filled" : "outlined"}
              sx={{
                fontWeight: 600,
                fontSize: "0.8rem",
                height: 32,
                "& .MuiChip-icon": {
                  fontSize: "1.1rem",
                },
              }}
            />
          </Box>

          <Box mt="auto">
            <Button
              variant={category.hasVersa ? "contained" : "outlined"}
              color={category.hasVersa ? "success" : "warning"}
              fullWidth
              size="large"
              startIcon={category.hasVersa ? <MdCheckCircle /> : <MdAdd />}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
                py: 1.5,
                boxShadow: category.hasVersa
                  ? `0 4px 16px ${alpha(theme.palette.success.main, 0.3)}`
                  : "none",
              }}
            >
              {category.hasVersa ? "View & Edit" : "Create VERSA"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grow>
  );
};
