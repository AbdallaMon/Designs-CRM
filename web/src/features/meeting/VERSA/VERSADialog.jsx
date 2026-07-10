import React, { useState } from "react";
import {
  Dialog,
  Button,
  Typography,
  Box,
  CircularProgress,
  LinearProgress,
  useTheme,
  alpha,
} from "@mui/material";

import { MdTouchApp } from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

import { Transition } from "@/features/meeting/VERSA/Transition.jsx";
import { CategoriesDialog } from "@/features/meeting/VERSA/CategoriesDialog.jsx";
import { VersaModelEditor } from "@/features/meeting/VERSA/VersaModelEditor.jsx";

// Main VersaObjectionSystem Component - Enhanced
const VersaObjectionSystem = ({ clientLeadId }) => {
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [versaData, setVersaData] = useState(null);
  const [loadingVersa, setLoadingVersa] = useState(false);
  const { setLoading } = useToastContext();
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCategory(null);
    setVersaData(null);
  };

  const handleCategorySelect = async (category) => {
    const getCatData = async () => {
      const request = await getData({
        url: `shared/questions/versa/${clientLeadId}/category/${category.id}`,
        setLoading: setLoadingVersa,
      });
      if (request.status === 200) {
        setVersaData(request.data);
      }
    };

    if (!category.hasVersa) {
      const newVersa = await handleRequestSubmit(
        { categoryId: category.id },
        setLoading,
        `shared/questions/versa/${clientLeadId}/category/${category.id}`
      );
      if (!newVersa || newVersa.status !== 200) {
        return;
      }
    }
    await getCatData();
    setSelectedCategory(category);
    setDialogOpen(false);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setVersaData(null);
    setDialogOpen(true);
  };

  return (
    <Box>
      <Button
        variant="contained"
        size="large"
        startIcon={<MdTouchApp />}
        onClick={handleOpenDialog}
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
        Manage Objections
      </Button>

      <CategoriesDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onCategorySelect={handleCategorySelect}
        clientLeadId={clientLeadId}
      />

      <Dialog
        fullScreen
        open={!!selectedCategory}
        onClose={handleBackToCategories}
        TransitionComponent={Transition}
      >
        {loadingVersa ? (
          <Box>
            <LinearProgress
              sx={{
                height: 4,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                "& .MuiLinearProgress-bar": {
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                },
              }}
            />
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              sx={{ height: "50vh" }}
            >
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6" color="text.secondary">
                Loading VERSA model...
              </Typography>
            </Box>
          </Box>
        ) : (
          selectedCategory && (
            <VersaModelEditor
              category={selectedCategory}
              versaData={versaData}
              onSave={async () => await handleCategorySelect(selectedCategory)}
              onClose={handleBackToCategories}
            />
          )
        )}
      </Dialog>
    </Box>
  );
};

export default VersaObjectionSystem;
