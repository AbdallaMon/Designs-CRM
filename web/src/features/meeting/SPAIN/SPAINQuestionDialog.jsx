"use client";
import { getData } from "@/app/helpers/functions/getData";
import { useAuth } from "@/app/providers/AuthProvider";
import { useEffect, useState } from "react";
import { CategorySection } from "@/features/meeting/SPAIN/utility.jsx";

import {
  Button,
  Box,
  Alert,
  CircularProgress,
  DialogContent,
  IconButton,
  Typography,
  Dialog,
  Container,
  Stack,
  alpha,
} from "@mui/material";
import { MdQuestionAnswer, MdClose } from "react-icons/md";
import { checkIfAdmin } from "@/app/helpers/functions/utility";

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
      if (response.status === 200) {
        setCategories(response.data);
      }
    };

    fetchCategories();
  }, [open, clientLeadId]);

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      {/* Calm header bar — icon tile · title · close. No gradient takeover. */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1.5,
          bgcolor: "background.paper",
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
              fontSize: 21,
            }}
          >
            <MdQuestionAnswer />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              SPIN Questions
            </Typography>
            <Typography variant="caption" color="text.secondary">
              سؤال اسبين
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} aria-label="Close">
          <MdClose />
        </IconButton>
      </Stack>

      <DialogContent sx={{ p: 0, bgcolor: "background.default" }}>
        <Container maxWidth="lg" sx={{ py: 3, direction: "rtl" }}>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 320,
              }}
            >
              <CircularProgress />
            </Box>
          ) : categories && categories.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No question categories found for this meeting.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {categories &&
                categories.map((category) => (
                  <CategorySection
                    key={category.id}
                    category={category}
                    clientLeadId={clientLeadId}
                  />
                ))}
            </Stack>
          )}
        </Container>
      </DialogContent>
    </Dialog>
  );
};

// Main Component with Trigger Button
export const SPAINQuestionsDialog = ({ clientLeadId }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  if (!isAdmin && user.role !== "STAFF") {
    return null;
  }

  return (
    <>
      <Button
        color="primary"
        variant="contained"
        fullWidth
        onClick={() => setDialogOpen(true)}
        startIcon={<MdQuestionAnswer />}
        sx={{ textTransform: "none", fontWeight: 600 }}
      >
        Open SPIN Questions
      </Button>

      <SPAINQuestionsComponent
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        clientLeadId={clientLeadId}
      />
    </>
  );
};
