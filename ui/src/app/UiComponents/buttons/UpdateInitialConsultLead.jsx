"use client";
import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Fade,
  IconButton,
  Paper,
  Stack,
  Chip,
} from "@mui/material";
import { FaCheckCircle, FaArrowRight } from "react-icons/fa";
import { MdClose, MdTrendingUp } from "react-icons/md";
import { useAuth } from "@/app/providers/AuthProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

function UpdateInitialConsultButton({ clientLead }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { setLoading } = useToastContext();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = async () => {
    try {
      const response = await handleRequestSubmit(
        { initialConsult: true },
        setLoading,
        `admin/leads/update/${clientLead.id}`,
        false,
        "Updating"
      );
      if (response.status === 200) {
        window.location.reload(); // Refresh the page after success
      } else {
        console.error("Failed to update initial consult");
      }
    } catch (error) {
      console.error("Error occurred while updating:", error);
    }
  };

  if (user.role !== "ADMIN") return null;

  return (
    <>
      {clientLead.initialConsult === false && (
        <Button
          variant="contained"
          onClick={handleOpen}
          startIcon={<MdTrendingUp />}
          endIcon={<FaArrowRight size={14} />}
          sx={{
            borderRadius: 3,
            px: 4,
            py: 1.5,
            fontWeight: 700,
            textTransform: "none",
            fontSize: "0.925rem",
            position: "relative",
            overflow: "hidden",

            "&:active": {
              transform: "translateY(-1px) scale(1.01)",
            },
          }}
        >
          Move to New Leads
        </Button>
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 24px 48px rgba(0, 0, 0, 0.12)",
            overflow: "visible",
          },
        }}
        TransitionComponent={Fade}
        transitionDuration={400}
      >
        <Box sx={{ position: "relative" }}>
          {/* Decorative Background Elements */}
          <Box
            sx={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)",
              filter: "blur(20px)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -30,
              left: -30,
              width: 80,
              height: 80,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
              filter: "blur(15px)",
            }}
          />

          <DialogTitle sx={{ pb: 2, position: "relative" }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    borderRadius: "50%",
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                  }}
                >
                  <FaCheckCircle color="white" size={24} />
                </Box>
                <Box>
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                      fontWeight: 700,
                      background:
                        "linear-gradient(135deg, #1f2937 0%, #4b5563 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      mb: 0.5,
                    }}
                  >
                    Lead Promotion
                  </Typography>
                  <Chip
                    label="Admin Action Required"
                    size="small"
                    sx={{
                      background:
                        "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)",
                      color: "#d97706",
                      fontWeight: 600,
                      border: "1px solid rgba(217, 119, 6, 0.2)",
                    }}
                  />
                </Box>
              </Stack>
              <IconButton
                onClick={handleClose}
                sx={{
                  color: "#6b7280",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    color: "#ef4444",
                    background: "rgba(239, 68, 68, 0.1)",
                    transform: "rotate(90deg)",
                  },
                }}
              >
                <MdClose size={24} />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ px: 3, pb: 2 }}>
            <Paper
              elevation={0}
              sx={{
                background:
                  "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)",
                border: "2px dashed rgba(99, 102, 241, 0.2)",
                borderRadius: 3,
                p: 3,
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Typography
                variant="h6"
                component="h3"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: "#374151",
                  mb: 2,
                }}
              >
                Confirm Lead Status Change
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#6b7280",
                  lineHeight: 1.6,
                  fontSize: "1rem",
                }}
              >
                Are you sure you want to move this lead to{" "}
                <Box
                  component="span"
                  sx={{
                    background:
                      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontWeight: 700,
                  }}
                >
                  New Leads
                </Box>
                ? This action will update the lead status and make it available
                for processing.
              </Typography>
            </Paper>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                borderColor: "#d1d5db",
                color: "#6b7280",
                borderRadius: 2.5,
                px: 4,
                py: 1.5,
                fontWeight: 600,
                textTransform: "none",
                borderWidth: 2,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  borderColor: "#9ca3af",
                  background: "rgba(107, 114, 128, 0.05)",
                  color: "#4b5563",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant="contained"
              startIcon={<FaCheckCircle />}
              sx={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                borderRadius: 2.5,
                px: 4,
                py: 1.5,
                fontWeight: 700,
                textTransform: "none",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Confirm & Move
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}

export default UpdateInitialConsultButton;
