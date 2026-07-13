"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  IconButton,
  Container,
  Stack,
  Grid,
  Skeleton,
  alpha,
} from "@mui/material";

import { MdClose, MdTouchApp } from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";

import { Transition } from "@/features/meeting/VERSA/Transition.jsx";
import { CategoriesGrid } from "@/features/meeting/VERSA/CategoriesGrid.jsx";

// Calm fullscreen category picker: header bar · one-line subtitle · grid of category
// cards. Ready (has a model) categories sort first — mid-meeting the prepared scripts
// are what the rep reaches for. The Ready/New chip carries the status (no legend prose).
export const CategoriesDialog = ({
  clientLeadId,
  open,
  onClose,
  onCategorySelect,
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    const request = await getData({
      url: `shared/questions/versa/${clientLeadId}?`,
      setLoading,
    });
    if (request.status === 200) {
      setCategories(request.data);
    }
  };

  const sortedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) => (b.hasVersa ? 1 : 0) - (a.hasVersa ? 1 : 0)
      ),
    [categories]
  );

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
    >
      {/* Calm header bar */}
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
            <MdTouchApp />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              VERSA Objections
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pick the objection you&apos;re hearing
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} aria-label="Close">
          <MdClose />
        </IconButton>
      </Stack>

      <DialogContent sx={{ p: 0, bgcolor: "background.default" }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {loading ? (
            <Grid container spacing={2}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                  <Skeleton
                    variant="rounded"
                    height={78}
                    sx={{ borderRadius: 2.5 }}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <CategoriesGrid
              categories={sortedCategories}
              onCategoryClick={onCategorySelect}
            />
          )}
        </Container>
      </DialogContent>
    </Dialog>
  );
};
