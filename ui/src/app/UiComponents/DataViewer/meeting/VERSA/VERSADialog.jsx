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
  Divider,
  Fade,
  Grow,
  Avatar,
  Stack,
  useTheme,
  alpha,
} from "@mui/material";

import {
  MdAdd,
  MdCheckCircle,
  MdClose,
  MdSave,
  MdArrowBack,
  MdInfo,
  MdTrendingUp,
  MdHandshake,
  MdSupport,
  MdQuestionAnswer,
  MdPsychology,
  MdTouchApp,
} from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

// Transition for full screen dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// VersaStep Component - Enhanced with theme
const VersaStep = ({ step, stepKey, onSave }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    question: step?.question || "",
    answer: step?.answer || "",
    clientResponse: step?.clientResponse || "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const { loading, setLoading } = useToastContext();

  const stepConfig = {
    v: {
      label: "Validate",
      color: theme.palette.info.main,
      lightColor: alpha(theme.palette.info.main, 0.1),
      icon: <MdQuestionAnswer />,
      description:
        "Acknowledge the client's concern and show you understand their objection.",
    },
    e: {
      label: "Empathize",
      color: theme.palette.warning.main,
      lightColor: alpha(theme.palette.warning.main, 0.1),
      icon: <MdPsychology />,
      description:
        "Connect emotionally by recognizing the client’s feelings and point of view.",
    },
    r: {
      label: "Reframe",
      color: theme.palette.primary.main,
      lightColor: alpha(theme.palette.primary.main, 0.1),
      icon: <MdHandshake />,
      description:
        "Shift the client’s perspective by presenting the objection in a new light.",
    },
    s: {
      label: "Show value",
      color: theme.palette.success.main,
      lightColor: alpha(theme.palette.success.main, 0.1),
      icon: <MdSupport />,
      description:
        "Demonstrate the unique benefits and solutions your offer provides.",
    },
    a: {
      label: "Ask",
      color: theme.palette.secondary.main,
      lightColor: alpha(theme.palette.secondary.main, 0.1),
      icon: <MdTrendingUp />,
      description:
        "Prompt the client to take the next step or confirm understanding.",
    },
  };

  const currentStep = stepConfig[stepKey];

  const handleSave = async () => {
    const request = await handleRequestSubmit(
      formData,
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
    <Grow in timeout={300}>
      <Paper
        elevation={hasChanges ? 8 : 2}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          background: `linear-gradient(135deg, ${
            currentStep.lightColor
          } 0%, ${alpha(currentStep.color, 0.05)} 100%)`,
          border: `2px solid ${
            hasChanges ? currentStep.color : alpha(currentStep.color, 0.2)
          }`,
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: theme.shadows[12],
          },
        }}
      >
        {/* Decorative background element */}
        <Box
          sx={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: `linear-gradient(45deg, ${alpha(
              currentStep.color,
              0.1
            )}, ${alpha(currentStep.color, 0.05)})`,
            zIndex: 0,
          }}
        />

        <Box position="relative" zIndex={1}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={3}
          >
            <Box display="flex" alignItems="center" gap={3}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: currentStep.color,
                  color: "white",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  boxShadow: `0 4px 20px ${alpha(currentStep.color, 0.3)}`,
                }}
              >
                {stepKey.toUpperCase()}
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: currentStep.color,
                    mb: 0.5,
                  }}
                >
                  {currentStep.label}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  {currentStep.description}
                </Typography>
              </Box>
            </Box>

            <Button
              variant={hasChanges ? "contained" : "outlined"}
              size="large"
              sx={{
                minWidth: 140,
                height: 48,
                borderRadius: 3,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
                boxShadow: hasChanges
                  ? `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`
                  : "none",
                ...(hasChanges && {
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                }),
              }}
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <MdSave />
                )
              }
              onClick={handleSave}
              disabled={loading || !hasChanges}
            >
              {loading ? "Saving..." : hasChanges ? "Save Changes" : "Saved"}
            </Button>
          </Box>

          <Divider sx={{ mb: 3, bgcolor: alpha(currentStep.color, 0.2) }} />

          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Question (Optional)"
              placeholder="Enter the question you would ask the client..."
              multiline
              rows={2}
              value={formData.question}
              onChange={(e) => handleChange("question", e.target.value)}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: currentStep.color,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: currentStep.color,
                    borderWidth: 2,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: currentStep.color,
                },
              }}
            />

            <TextField
              fullWidth
              label="Your Response (Optional)"
              placeholder="Enter your response or approach..."
              multiline
              rows={3}
              value={formData.answer}
              onChange={(e) => handleChange("answer", e.target.value)}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: currentStep.color,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: currentStep.color,
                    borderWidth: 2,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: currentStep.color,
                },
              }}
            />

            <TextField
              fullWidth
              label="Expected Client Response (Optional)"
              placeholder="What response do you expect from the client..."
              multiline
              rows={2}
              value={formData.clientResponse}
              onChange={(e) => handleChange("clientResponse", e.target.value)}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: currentStep.color,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: currentStep.color,
                    borderWidth: 2,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: currentStep.color,
                },
              }}
            />
          </Stack>
        </Box>
      </Paper>
    </Grow>
  );
};

// CategoryCard Component - Enhanced
const CategoryCard = ({ category, onClick, index }) => {
  const theme = useTheme();

  return (
    <Grow in timeout={300 + index * 100}>
      <Card
        sx={{
          cursor: "pointer",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          height: "100%",
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
          background: category.hasVersa
            ? `linear-gradient(135deg, ${alpha(
                theme.palette.success.main,
                0.1
              )} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`
            : `linear-gradient(135deg, ${alpha(
                theme.palette.warning.main,
                0.1
              )} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
          border: `2px solid ${
            category.hasVersa
              ? alpha(theme.palette.success.main, 0.2)
              : alpha(theme.palette.warning.main, 0.2)
          }`,
          "&:hover": {
            transform: "translateY(-8px) scale(1.02)",
            boxShadow: `0 16px 40px ${alpha(
              category.hasVersa
                ? theme.palette.success.main
                : theme.palette.warning.main,
              0.25
            )}`,
            border: `2px solid ${
              category.hasVersa
                ? theme.palette.success.main
                : theme.palette.warning.main
            }`,
          },
        }}
        onClick={() => onClick(category)}
      >
        {/* Decorative corner element */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 60,
            height: 60,
            background: `linear-gradient(135deg, ${
              category.hasVersa
                ? theme.palette.success.main
                : theme.palette.warning.main
            }, ${
              category.hasVersa
                ? theme.palette.success.dark
                : theme.palette.warning.dark
            })`,
            clipPath: "polygon(100% 0, 0 0, 100% 100%)",
            opacity: 0.8,
          }}
        />

        <CardContent
          sx={{
            p: 3,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box mb={3}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1.5,
                lineHeight: 1.3,
              }}
            >
              {category.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                lineHeight: 1.5,
                fontSize: "0.9rem",
              }}
            >
              {category.label}
            </Typography>
          </Box>

          <Box mb={3}>
            <Chip
              label={category.hasVersa ? "VERSA Ready" : "Create New"}
              color={category.hasVersa ? "success" : "warning"}
              icon={category.hasVersa ? <MdCheckCircle /> : <MdAdd />}
              variant={category.hasVersa ? "filled" : "outlined"}
              sx={{
                fontWeight: 600,
                fontSize: "0.8rem",
                height: 32,
                "& .MuiChip-icon": {
                  fontSize: "1.1rem",
                },
              }}
            />
          </Box>

          <Box mt="auto">
            <Button
              variant={category.hasVersa ? "contained" : "outlined"}
              color={category.hasVersa ? "success" : "warning"}
              fullWidth
              size="large"
              startIcon={category.hasVersa ? <MdCheckCircle /> : <MdAdd />}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
                py: 1.5,
                boxShadow: category.hasVersa
                  ? `0 4px 16px ${alpha(theme.palette.success.main, 0.3)}`
                  : "none",
              }}
            >
              {category.hasVersa ? "View & Edit" : "Create VERSA"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grow>
  );
};

// VersaModelEditor Component - Enhanced
const VersaModelEditor = ({ category, versaData, onSave, onClose }) => {
  const theme = useTheme();
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
            <MdArrowBack />
          </IconButton>
          <Box flex={1}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              VERSA Model - {category.title}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Validate → Empathize → Reframe → Show value → Ask
            </Typography>
          </Box>
          <Button
            color="inherit"
            onClick={onClose}
            startIcon={<MdClose />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              "&:hover": {
                backgroundColor: alpha(theme.palette.common.white, 0.1),
              },
            }}
          >
            Close
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.05
          )} 0%, ${alpha(theme.palette.background.default, 1)} 30%)`,
          height: "auto",
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Fade in timeout={500}>
            <Box mb={6} display="flex" gap={2} alignItems="center">
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {category.title}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 400,
                }}
              >
                {category.label}
              </Typography>
            </Box>
          </Fade>

          {versaData && (
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  mb: 4,
                }}
              >
                VERSA Steps
              </Typography>
              {versaSteps.map((stepKey, index) => (
                <VersaStep
                  key={stepKey}
                  step={versaData?.[stepKey]}
                  stepKey={stepKey}
                  onSave={handleSaveStep}
                />
              ))}
            </Box>
          )}

          <Fade in timeout={1000}>
            <Paper
              elevation={4}
              sx={{
                p: 4,
                mt: 6,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.05
                )} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <Box display="flex" justifyContent="center" gap={3}>
                <Button
                  variant="outlined"
                  onClick={onClose}
                  size="large"
                  startIcon={<MdArrowBack />}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "1.1rem",
                  }}
                >
                  Back to Categories
                </Button>
              </Box>
            </Paper>
          </Fade>
        </Container>
      </Box>
    </>
  );
};

const CategoriesGrid = ({ categories, onCategoryClick }) => {
  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Grid container spacing={4}>
        {categories.map((category, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={category.id}>
            <CategoryCard
              category={category}
              onClick={onCategoryClick}
              index={index}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

// CategoriesDialog Component - Enhanced
const CategoriesDialog = ({
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
        { categoryId: category.id, clientLeadId },
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
