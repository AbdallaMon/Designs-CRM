import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid2 as Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Box,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  Container,
  Slide,
  AppBar,
  Toolbar,
  LinearProgress,
} from "@mui/material";

import {
  MdAdd,
  MdCheckCircle,
  MdClose,
  MdSave,
  MdArrowBack,
  MdInfo,
} from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

// Transition for full screen dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// VersaStep Component - Direct editing
const VersaStep = ({ step, stepKey, onSave }) => {
  const [formData, setFormData] = useState({
    question: step?.question || "",
    answer: step?.answer || "",
    clientResponse: step?.clientResponse || "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const { loading, setLoading } = useToastContext();
  const stepLabels = {
    v: "Validate",
    e: "Empathize",
    r: "Respond",
    s: "Support",
    a: "Advance",
  };

  const handleSave = async () => {
    const request = await handleRequestSubmit(
      { formData },
      setLoading,
      `shared/questions/versa/steps/${step.id}`,
      false,
      "Saving",
      false,
      "PUT"
    );
    if (request.status === 200) {
      if (onSave) {
        await onSave();
      }
      setHasChanges(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        mb: 3,
        borderLeft: 4,
        borderLeftColor: "primary.main",
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "1.2rem",
            }}
          >
            {stepKey.toUpperCase()}
          </Box>
          <Typography variant="h5" color="primary" fontWeight="bold">
            {stepLabels[stepKey]}
          </Typography>
        </Box>

        <Button
          variant={hasChanges ? "contained" : "outlined"}
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <MdSave />}
          onClick={handleSave}
          disabled={loading || !hasChanges}
          sx={{ minWidth: 120 }}
        >
          {loading ? "Saving..." : hasChanges ? "Save Changes" : "Saved"}
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid>
          <TextField
            fullWidth
            label="Question (Optional)"
            placeholder="Enter the question you would ask the client..."
            multiline
            rows={2}
            value={formData.question}
            onChange={(e) => handleChange("question", e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid>
          <TextField
            fullWidth
            label="Your Response (Optional)"
            placeholder="Enter your response or approach..."
            multiline
            rows={3}
            value={formData.answer}
            onChange={(e) => handleChange("answer", e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid>
          <TextField
            fullWidth
            label="Expected Client Response (Optional)"
            placeholder="What response do you expect from the client..."
            multiline
            rows={2}
            value={formData.clientResponse}
            onChange={(e) => handleChange("clientResponse", e.target.value)}
            variant="outlined"
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

// CategoryCard Component
const CategoryCard = ({ category, onClick }) => {
  return (
    <Card
      sx={{
        cursor: "pointer",
        transition: "all 0.3s ease",
        height: "100%",
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: 6,
        },
        border: 2,
        borderColor: category.hasVersa ? "success.main" : "warning.main",
        bgcolor: category.hasVersa ? "success.light" : "warning.light",
        "&:hover": {
          bgcolor: category.hasVersa ? "success.lighter" : "warning.lighter",
        },
      }}
      onClick={() => onClick(category)}
    >
      <CardContent
        sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Box
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
          mb={2}
        >
          <Box flex={1}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              {category.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {category.label}
            </Typography>
          </Box>
          <Box>
            {category.hasVersa ? (
              <Chip
                label="VERSA Ready"
                color="success"
                icon={<MdCheckCircle />}
                variant="filled"
              />
            ) : (
              <Chip
                label="Create New"
                color="warning"
                variant="outlined"
                icon={<MdAdd />}
              />
            )}
          </Box>
        </Box>

        <Box mt="auto">
          <Button
            variant={category.hasVersa ? "contained" : "outlined"}
            color={category.hasVersa ? "success" : "warning"}
            fullWidth
            startIcon={category.hasVersa ? <MdCheckCircle /> : <MdAdd />}
          >
            {category.hasVersa ? "View & Edit" : "Create VERSA"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// VersaModelEditor Component
const VersaModelEditor = ({
  category,
  versaData,
  onSave,
  onClose,
  handleCreateVersa,
}) => {
  const versaSteps = ["v", "e", "r", "s", "a"];

  const handleSaveStep = async (stepKey, stepData) => {
    try {
      await onSave(category.id, stepKey, stepData);
    } catch (error) {
      throw error;
    }
  };

  return (
    <>
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <MdArrowBack />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            VERSA Model - {category.title}
          </Typography>
          <Button
            autoFocus
            color="inherit"
            onClick={onClose}
            startIcon={<MdClose />}
          >
            Close
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography
            variant="h3"
            color="primary"
            gutterBottom
            fontWeight="bold"
          >
            {category.title}
          </Typography>
          <Typography variant="h6" color="text.secondary" mb={3}>
            {category.label}
          </Typography>

          <Alert severity="info" icon={<MdInfo />} sx={{ mb: 3, p: 2 }}>
            <Typography variant="body1" fontWeight="medium">
              All fields are optional - fill in what&apos;s relevant for your
              sales process
            </Typography>
            <Typography variant="body2" color="text.secondary">
              VERSA: Validate → Empathize → Respond → Support → Advance
            </Typography>
          </Alert>
        </Box>

        {versaData && (
          <Box>
            <Typography variant="h4" gutterBottom mb={3} fontWeight="medium">
              VERSA Steps
            </Typography>
            {versaSteps.map((stepKey) => (
              <VersaStep
                key={stepKey}
                step={versaData?.[stepKey]}
                stepKey={stepKey}
                onSave={handleSaveStep}
              />
            ))}
          </Box>
        )}

        <Box display="flex" justifyContent="center" mt={4} gap={2}>
          <Button
            variant="outlined"
            onClick={onClose}
            size="large"
            startIcon={<MdArrowBack />}
          >
            Back to Categories
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<MdSave />}
          >
            Save All Changes
          </Button>
        </Box>
      </Container>
    </>
  );
};

const CategoriesGrid = ({ categories, onCategoryClick }) => {
  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Grid container spacing={4}>
        {categories.map((category) => (
          <Grid size={{ xs: 6, md: 4 }} key={category.id}>
            <CategoryCard category={category} onClick={onCategoryClick} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

// CategoriesDialog Component
const CategoriesDialog = ({
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
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <MdClose />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            VERSA Objection Management System
          </Typography>
          <Typography variant="subtitle1">نموذج الاعتراضات</Typography>
        </Toolbar>
      </AppBar>

      <DialogContent sx={{ p: 0 }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box mb={4}>
            <Typography variant="h6" color="text.secondary" mb={3}>
              Select a category to view or create its VERSA model
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body1">
                <strong>Green categories</strong> have existing VERSA models you
                can view and edit.
                <br />
                <strong>Orange categories</strong> need new VERSA models to be
                created.
              </Typography>
            </Alert>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={8}>
              <CircularProgress size={60} />
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
    setSelectedCategory(category);
    setDialogOpen(false);
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
        { categoryId: category.id, clientLeadId },
        setLoading,
        `shared/versa/${clientLeadId}/category/${category.id}`
      );
      if (newVersa.status !== 200) {
        return;
      }
    }
    await getCatData();
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setVersaData(null);
    setDialogOpen(true);
  };

  return (
    <Box p={3}>
      <Button
        variant="contained"
        size="large"
        startIcon={<MdAdd />}
        onClick={handleOpenDialog}
        sx={{
          ml: "auto",
          height: "fit-content",
          px: 4,
          py: 1.5,
          fontSize: "1.1rem",
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
          <LinearProgress />
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
