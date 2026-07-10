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
  AppBar,
  Toolbar,
  Fade,
  useTheme,
  alpha,
} from "@mui/material";

import { MdClose } from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";

import { Transition } from "@/app/UiComponents/DataViewer/meeting/VERSA/Transition.jsx";
import { CategoriesGrid } from "@/app/UiComponents/DataViewer/meeting/VERSA/CategoriesGrid.jsx";

// CategoriesDialog Component - Enhanced
export const CategoriesDialog = ({
  clientLeadId,
  open,
  onClose,
  onCategorySelect,
}) => {
  const theme = useTheme();
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
      <AppBar
        sx={{
          position: "relative",
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
            sx={{
              mr: 2,
              "&:hover": {
                backgroundColor: alpha(theme.palette.common.white, 0.1),
              },
            }}
          >
            <MdClose />
          </IconButton>
          <Box flex={1}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              VERSA Objection Management System
            </Typography>
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 500,
              opacity: 0.9,
            }}
          >
            نموذج الاعتراضات
          </Typography>
        </Toolbar>
      </AppBar>

      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.05
            )} 0%, ${alpha(theme.palette.background.default, 1)} 30%)`,
            minHeight: "100vh",
          }}
        >
          <Container maxWidth="lg" sx={{ py: 6 }}>
            <Fade in timeout={500}>
              <Box mb={6}>
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.secondary,
                    mb: 3,
                    fontSize: "1.2rem",
                  }}
                >
                  Select a category to view or create its VERSA model
                </Typography>
                <Alert
                  severity="info"
                  sx={{
                    mb: 4,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    backgroundColor: alpha(theme.palette.info.main, 0.05),
                  }}
                >
                  <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                    <strong>Green categories</strong> have existing VERSA models
                    you can view and edit.
                    <br />
                    <strong>Orange categories</strong> need new VERSA models to
                    be created.
                  </Typography>
                </Alert>
              </Box>
            </Fade>

            {loading ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                p={8}
              >
                <CircularProgress size={60} sx={{ mb: 3 }} />
                <Typography variant="h6" color="text.secondary">
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
        </Box>
      </DialogContent>
    </Dialog>
  );
};
