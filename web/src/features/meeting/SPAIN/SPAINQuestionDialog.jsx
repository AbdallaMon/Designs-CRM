"use client";
import { getData } from "@/app/helpers/functions/getData";
import { useAuth } from "@/app/providers/AuthProvider";
import { useEffect, useState, useCallback, useMemo } from "react";
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
  LinearProgress,
  alpha,
} from "@mui/material";
import { MdQuestionAnswer, MdClose, MdCheckCircle } from "react-icons/md";
import { checkIfAdmin } from "@/app/helpers/functions/utility";

const SPAINQuestionsComponent = ({ open, onClose, clientLeadId }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  // Which category is expanded — only ONE at a time (mid-meeting focus).
  const [openCategoryId, setOpenCategoryId] = useState(null);
  // answered/total per category, reported up by each CategorySection.
  const [counts, setCounts] = useState({});

  useEffect(() => {
    if (!open || !clientLeadId) return;

    const fetchCategories = async () => {
      const response = await getData({
        url: `questions/question-types/${clientLeadId}?`,
        setLoading,
      });
      if (response.status === 200) {
        setCategories(response.data);
        // Open the first category by default.
        setOpenCategoryId(response.data?.[0]?.id ?? null);
      }
    };

    fetchCategories();
  }, [open, clientLeadId]);

  const handleCountsChange = useCallback((categoryId, next) => {
    setCounts((prev) => {
      const current = prev[categoryId];
      if (current && current.answered === next.answered && current.total === next.total) {
        return prev;
      }
      return { ...prev, [categoryId]: next };
    });
  }, []);

  const totals = useMemo(() => {
    return Object.values(counts).reduce(
      (acc, c) => ({
        answered: acc.answered + c.answered,
        total: acc.total + c.total,
      }),
      { answered: 0, total: 0 }
    );
  }, [counts]);

  const allDone = totals.total > 0 && totals.answered === totals.total;
  const progress = totals.total ? (totals.answered / totals.total) * 100 : 0;

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      {/* Calm header bar — icon tile · title · progress · close. */}
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1.5,
          bgcolor: "background.paper",
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1.5}
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
              <Typography variant="caption" color="text.secondary" dir="auto">
                سؤال اسبين
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {totals.total > 0 && (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 1.5,
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  color: allDone ? "success.main" : "primary.main",
                  bgcolor: (theme) =>
                    alpha(
                      theme.palette[allDone ? "success" : "primary"].main,
                      0.12
                    ),
                }}
              >
                {allDone && <MdCheckCircle size={15} />}
                {totals.answered} / {totals.total} answered
              </Box>
            )}
            <IconButton onClick={onClose} aria-label="Close">
              <MdClose />
            </IconButton>
          </Stack>
        </Stack>

        {totals.total > 0 && (
          <LinearProgress
            variant="determinate"
            value={progress}
            color={allDone ? "success" : "primary"}
            sx={{ mt: 1.25, height: 6, borderRadius: 3 }}
          />
        )}
      </Box>

      <DialogContent sx={{ p: 0, bgcolor: "background.default" }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
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
                    expanded={openCategoryId === category.id}
                    onToggle={() =>
                      setOpenCategoryId((prev) =>
                        prev === category.id ? null : category.id
                      )
                    }
                    onCountsChange={handleCountsChange}
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
  if (!isAdmin && !["NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES"].includes(user.profile)) {
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
