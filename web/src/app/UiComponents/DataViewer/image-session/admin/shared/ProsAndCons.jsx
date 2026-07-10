import React, { useState } from "react";
import { Button, Box, Typography } from "@mui/material";
import { MdThumbUp, MdThumbDown } from "react-icons/md";
import ProsConsDialog from "./ProsConsDialog";

// Example usage component
const ProsAndConsDialogButton = ({
  isEditing = false,
  type,
  materialId,
  styleId,
  customStyle,
  lng = "en",
}) => {
  const [open, setOpen] = useState(false);
  const label = isEditing
    ? lng === "ar"
      ? "تعديل المميزات والعيوب"
      : "Edit Pros & Cons"
    : lng === "ar"
    ? "عرض المميزات والعيوب"
    : "View Pros & Cons";
  return (
    <Box>
      {customStyle ? (
        <Button
          variant="contained"
          sx={customStyle}
          onClick={() => {
            setOpen(true);
          }}
        >
          {label}
        </Button>
      ) : (
        <Button
          variant="contained"
          onClick={() => {
            setOpen(true);
          }}
          sx={(theme) => ({
            position: "relative",
            overflow: "hidden",
            minWidth: 200,
            height: 48,
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.error.main} 100%)`,
            backgroundSize: "200% 100%",
            backgroundPosition: "100% 0",
            color: theme.palette.primary.contrastText,
            fontWeight: 600,
            textTransform: "none",
            borderRadius: theme.shape.borderRadius,
            boxShadow: theme.shadows[4],
            transition: theme.transitions.create(["all"], {
              duration: theme.transitions.duration.standard,
              easing: theme.transitions.easing.easeInOut,
            }),

            // Shimmer effect
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: "-100%",
              width: "100%",
              height: "100%",
              background: `linear-gradient(90deg, transparent, ${theme.palette.common.white}30, transparent)`,
              transition: theme.transitions.create(["left"], {
                duration: theme.transitions.duration.complex,
                easing: theme.transitions.easing.easeOut,
              }),
            },

            // Pros/Cons indicators
            "&::after": {
              content: '""',
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              width: 24,
              height: 24,
              background: `linear-gradient(45deg, ${theme.palette.success.main} 50%, ${theme.palette.error.main} 50%)`,
              borderRadius: "50%",
              opacity: 0.8,
              transition: theme.transitions.create(["all"], {
                duration: theme.transitions.duration.short,
                easing: theme.transitions.easing.easeInOut,
              }),
            },

            "&:hover": {
              backgroundPosition: "0% 0",
              boxShadow: theme.shadows[8],
              transform: "translateY(-2px)",

              "&::before": {
                left: "100%",
              },

              "&::after": {
                transform: "translateY(-50%) scale(1.1)",
                opacity: 1,
              },
            },

            "&:active": {
              transform: "translateY(0px)",
              boxShadow: theme.shadows[2],
            },

            // Pulse animation on focus
            "&:focus": {
              animation: "pulse 2s infinite",
            },

            "@keyframes pulse": {
              "0%": {
                boxShadow: theme.shadows[4],
              },
              "50%": {
                boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
              },
              "100%": {
                boxShadow: theme.shadows[4],
              },
            },

            // Loading state (optional)
            "&.loading": {
              pointerEvents: "none",
              "&::before": {
                animation: "shimmer 1.5s infinite",
              },
            },

            "@keyframes shimmer": {
              "0%": { left: "-100%" },
              "100%": { left: "100%" },
            },

            // Dark mode adaptations
            ...(theme.palette.mode === "dark" && {
              "&::before": {
                background: `linear-gradient(90deg, transparent, ${theme.palette.common.white}20, transparent)`,
              },
              "@keyframes pulse": {
                "0%": {
                  boxShadow: theme.shadows[4],
                },
                "50%": {
                  boxShadow: `0 4px 12px ${theme.palette.primary.main}60`,
                },
                "100%": {
                  boxShadow: theme.shadows[4],
                },
              },
            }),
          })}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="button" sx={{ fontWeight: 600 }}>
              {label}
            </Typography>
            <Box
              sx={(theme) => ({
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                opacity: 0.9,
                fontSize: "0.75rem",
              })}
            >
              <MdThumbUp
                sx={(theme) => ({
                  fontSize: 14,
                  color: theme.palette.success.main,
                })}
              />
              <MdThumbDown
                sx={(theme) => ({
                  fontSize: 14,
                  color: theme.palette.error.main,
                })}
              />
            </Box>
          </Box>
        </Button>
      )}
      <ProsConsDialog
        open={open}
        onClose={() => setOpen(false)}
        type={type}
        materialId={materialId}
        styleId={styleId}
        isEditing={isEditing}
        lng={lng}
      />
    </Box>
  );
};

export default ProsAndConsDialogButton;
