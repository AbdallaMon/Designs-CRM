"use client";
import { getData } from "@/app/helpers/functions/getData";
import { useAuth } from "@/app/providers/AuthProvider";
import { useEffect, useState } from "react";
import { CategorySection } from "./utility";

import {
  Fab,
  Button,
  DialogActions,
  Box,
  Alert,
  CircularProgress,
  DialogContent,
  IconButton,
  Typography,
  DialogTitle,
  Dialog,
  Slide,
  useTheme,
  alpha,
  Container,
} from "@mui/material";
import { MdQuestionAnswer, MdClose } from "react-icons/md";
const SPAINQuestionsComponent = ({ open, onClose, clientLeadId }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!open || !clientLeadId) return;

    const fetchCategories = async () => {
      const response = await getData({
        url: `shared/questions/question-types/${clientLeadId}?`,
        setLoading,
      });
      console.log(response, "response2");
      if (response.status === 200) {
        setCategories(response.data);
      }
    };

    fetchCategories();
  }, [open, clientLeadId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen
      PaperProps={{
        sx: {
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(
              theme.palette.background.default,
              0.95
            )} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          backdropFilter: "blur(20px)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.1
            )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderBottom: (theme) =>
            `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: "white",
              boxShadow: (theme) =>
                `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <MdQuestionAnswer size={24} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            SPIN
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="large"
          sx={{
            borderRadius: 2,
            "&:hover": {
              background: (theme) => alpha(theme.palette.action.hover, 0.08),
            },
          }}
        >
          <MdClose size={24} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, py: 5, overflow: "auto" }}>
        <Container maxWidth="xxl" sx={{ py: 5 }}>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 400,
              }}
            >
              <CircularProgress size={64} thickness={4} />
            </Box>
          ) : categories && categories.length === 0 ? (
            <Alert
              severity="info"
              sx={{
                borderRadius: 3,
                fontSize: "1.1rem",
                p: 3,
              }}
            >
              No question categories found for this meeting.
            </Alert>
          ) : (
            <Box>
              {categories &&
                categories.map((category, index) => (
                  <CategorySection
                    key={category.id}
                    category={category}
                    clientLeadId={clientLeadId}
                  />
                ))}
            </Box>
          )}
        </Container>
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: (theme) =>
            `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          p: 3,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.8
            )} 0%, ${alpha(theme.palette.background.default, 0.6)} 100%)`,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          size="large"
          sx={{
            minWidth: 120,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main Component with Trigger Button
export const SPAINQuestionsDialog = ({ clientLeadId }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();

  if (
    user.role !== "ADMIN" &&
    user.role !== "SUPER_ADMIN" &&
    user.role !== "STAFF"
  )
    return null;

  return (
    <>
      <Button
        color="primary"
        variant="contained"
        onClick={() => setDialogOpen(true)}
        startIcon={<MdQuestionAnswer />}
        sx={{
          borderRadius: 3,
          textTransform: "none",
          fontWeight: 600,
          px: 3,
          py: 1.5,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          boxShadow: (theme) =>
            `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: (theme) =>
              `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
          },
        }}
      >
        Open SPAIN Questions & Results
      </Button>

      <SPAINQuestionsComponent
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        clientLeadId={clientLeadId}
      />
    </>
  );
};
