import React, { useState } from "react";
import {
  Dialog,
  Button,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";

import { MdTouchApp } from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

import { Transition } from "@/features/meeting/VERSA/Transition.jsx";
import { CategoriesDialog } from "@/features/meeting/VERSA/CategoriesDialog.jsx";
import { VersaModelEditor } from "@/features/meeting/VERSA/VersaModelEditor.jsx";

// Main VersaObjectionSystem Component
const VersaObjectionSystem = ({ clientLeadId }) => {
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
        fullWidth
        startIcon={<MdTouchApp />}
        onClick={handleOpenDialog}
        sx={{ textTransform: "none", fontWeight: 600 }}
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
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            sx={{ height: "50vh" }}
          >
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading VERSA model...
            </Typography>
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
