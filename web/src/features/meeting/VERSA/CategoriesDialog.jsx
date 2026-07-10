"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  IconButton,
  Alert,
  CircularProgress,
  Container,
  Stack,
  alpha,
} from "@mui/material";

import { MdClose, MdTouchApp } from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";

import { Transition } from "@/features/meeting/VERSA/Transition.jsx";
import { CategoriesGrid } from "@/features/meeting/VERSA/CategoriesGrid.jsx";

// Calm fullscreen category picker: header bar · legend · grid of category cards.
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
              نموذج الاعتراضات
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} aria-label="Close">
          <MdClose />
        </IconButton>
      </Stack>

      <DialogContent sx={{ p: 0, bgcolor: "background.default" }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Pick a category to view or create its VERSA model.{" "}
            <strong>Green</strong> categories already have a model;{" "}
            <strong>amber</strong> ones need one created.
          </Alert>

          {loading ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              sx={{ py: 8 }}
            >
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Loading categories...
              </Typography>
            </Box>
          ) : (
            <CategoriesGrid
              categories={categories}
              onCategoryClick={onCategorySelect}
            />
          )}
        </Container>
      </DialogContent>
    </Dialog>
  );
};
