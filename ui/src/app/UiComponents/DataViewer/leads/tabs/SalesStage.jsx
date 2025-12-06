"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  Chip,
  Divider,
} from "@mui/material";
import {
  MdArrowUpward as ArrowUpward,
  MdArrowDownward as ArrowDownward,
  MdVisibility as Visibility,
  MdCheckCircle as CheckCircle,
  MdRadioButtonUnchecked as RadioButtonUnchecked,
  MdPlayArrow as PlayArrow,
} from "react-icons/md";
import dayjs from "dayjs";
import { salesStageEnum } from "@/app/helpers/constants";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { NotesComponent } from "../../utility/Notes";

const SalesStageComponent = ({ clientLeadId }) => {
  const theme = useTheme();
  const [salesStages, setSalesStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [currentStageId, setCurrentStageId] = useState(null);
  const { loading: actionLoading, setLoading: setActionLoading } =
    useToastContext();
  const fetchSalesStages = async () => {
    await getDataAndSet({
      url: `shared/sales-stages/${clientLeadId}`,
      setLoading,
      setData: setSalesStages,
    });
  };

  const updateSalesStage = async (stageType, action = "next", item) => {
    const data = {
      action,
      curentStageType: stageType,
      nextStage: item,
    };
    const req = await handleRequestSubmit(
      data,
      setActionLoading,
      `shared/sales-stages/${clientLeadId}`,
      false,
      "Updating"
    );
    if (req.status === 200) {
      await fetchSalesStages();
    }
  };

  const handleStageAction = (stageKey, actionType, index) => {
    updateSalesStage(
      stageKey,
      actionType,
      actionType === "back"
        ? salesStageEnum[index - 1]
        : salesStageEnum[index + 1]
    );
  };

  const handleViewDetails = (stageData, stageId) => {
    setSelectedStage(stageData);
    setCurrentStageId(stageId);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedStage(null);
    setCurrentStageId(null);
  };

  const getCurrentStageIndex = () => {
    if (salesStages.length === 0) return -1;
    const lastStage = salesStages[salesStages.length - 1];
    return salesStageEnum.findIndex((s) => s.key === lastStage.stage);
  };

  const isStageCompleted = (stageKey) => {
    return salesStages.some((s) => s.stage === stageKey);
  };

  const getStageData = (stageKey) => {
    return salesStages.find((s) => s.stage === stageKey);
  };

  useEffect(() => {
    if (clientLeadId) {
      fetchSalesStages(clientLeadId);
    }
  }, [clientLeadId]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  const currentStageIndex = getCurrentStageIndex();
  const currentStage =
    currentStageIndex >= 0 ? salesStageEnum[currentStageIndex] : null;
  const currentStageData = currentStage ? getStageData(currentStage.key) : null;

  return (
    <Box sx={{ p: 3, maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            color: theme.palette.primary.main,
            fontWeight: "bold",
            mb: 2,
          }}
        >
          مراحل البيع
        </Typography>

        {/* Current Stage Indicator */}
        {currentStage && (
          <Paper
            elevation={3}
            sx={{
              p: 2,
              backgroundColor: theme.palette.primary.main,
              borderRadius: 2,
              maxWidth: 400,
              margin: "0 auto",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <IconButton
                size="medium"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(currentStage, currentStageData.id);
                }}
                sx={{
                  color: theme.palette.success.contrastText,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.3)",
                  },
                  border: "2px solid rgba(255,255,255,0.3)",
                }}
              >
                <Visibility />
              </IconButton>{" "}
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                المرحلة الحالية: {currentStage.label}
              </Typography>
            </Box>
            {currentStageData && (
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                Created at:{" "}
                {dayjs(currentStageData.createdAt).format("DD MMMM YYYY")}
              </Typography>
            )}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
          </Paper>
        )}
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Sales Stages List */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {salesStageEnum.map((stage, index) => {
          const isCompleted = isStageCompleted(stage.key);
          const stageData = getStageData(stage.key);
          const isCurrentStage = index === currentStageIndex;
          const canShowArrows =
            isCurrentStage || (currentStageIndex === -1 && index === 0);
          return (
            <Box key={stage.key}>
              {/* Up Arrow */}
              {canShowArrows && index > 0 && (
                <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                  <IconButton
                    onClick={() => handleStageAction(stage.key, "back", index)}
                    disabled={actionLoading}
                    sx={{
                      color: theme.palette.success.main,
                      backgroundColor: theme.palette.success.light,
                      "&:hover": {
                        backgroundColor: theme.palette.success.main,
                        color: theme.palette.success.contrastText,
                      },
                      boxShadow: theme.shadows[2],
                      border: `2px solid ${theme.palette.success.main}`,
                    }}
                  >
                    <ArrowUpward />
                  </IconButton>
                </Box>
              )}

              {/* Stage Card */}
              <Paper
                elevation={isCompleted ? 4 : 2}
                sx={{
                  p: 3,
                  backgroundColor: isCompleted
                    ? theme.palette.success.main
                    : isCurrentStage
                    ? theme.palette.info.light
                    : theme.palette.grey[50],
                  border: isCompleted
                    ? `3px solid ${theme.palette.success.dark}`
                    : isCurrentStage
                    ? `3px solid ${theme.palette.info.main}`
                    : `2px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  position: "relative",
                  cursor: "pointer",
                  transition: theme.transitions.create(["all"], {
                    duration: theme.transitions.duration.shorter,
                  }),
                  "&:hover": {
                    boxShadow: theme.shadows[6],
                    transform: "translateY(-2px)",
                    backgroundColor: isCompleted
                      ? theme.palette.success.dark
                      : isCurrentStage
                      ? theme.palette.info.main
                      : theme.palette.grey[100],
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    {/* Stage Icon */}
                    <Box>
                      {isCompleted ? (
                        <CheckCircle
                          sx={{
                            color: theme.palette.success.contrastText,
                            fontSize: 32,
                          }}
                        />
                      ) : isCurrentStage ? (
                        <PlayArrow
                          sx={{
                            color: theme.palette.info.main,
                            fontSize: 32,
                          }}
                        />
                      ) : (
                        <RadioButtonUnchecked
                          sx={{
                            color: theme.palette.grey[400],
                            fontSize: 32,
                          }}
                        />
                      )}
                    </Box>

                    {/* Stage Info */}
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: isCompleted
                            ? theme.palette.success.contrastText
                            : isCurrentStage
                            ? theme.palette.info.contrastText
                            : theme.palette.text.primary,
                          fontWeight:
                            isCompleted || isCurrentStage ? "bold" : "medium",
                          mb: 0.5,
                        }}
                      >
                        {stage.label}
                      </Typography>
                      {isCompleted && stageData && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.success.contrastText,
                            opacity: 0.9,
                          }}
                        >
                          Created At:{" "}
                          {dayjs(stageData.createdAt).format("DD MMMM YYYY")}
                        </Typography>
                      )}
                      {isCurrentStage && !isCompleted && (
                        <Chip
                          label="المرحلة الحالية"
                          size="small"
                          sx={{
                            backgroundColor: theme.palette.info.main,
                            color: theme.palette.info.contrastText,
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Action Button */}
                  {isCompleted && (
                    <IconButton
                      size="medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(stageData, stageData.id);
                      }}
                      sx={{
                        color: theme.palette.success.contrastText,
                        backgroundColor: "rgba(255,255,255,0.2)",
                        "&:hover": {
                          backgroundColor: "rgba(255,255,255,0.3)",
                        },
                        border: "2px solid rgba(255,255,255,0.3)",
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  )}
                </Box>
              </Paper>

              {/* Down Arrow */}
              {canShowArrows && index !== salesStageEnum.length - 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                  <IconButton
                    onClick={() => handleStageAction(stage.key, "next", index)}
                    disabled={actionLoading}
                    sx={{
                      color: theme.palette.warning.main,
                      backgroundColor: theme.palette.warning.light,
                      "&:hover": {
                        backgroundColor: theme.palette.warning.main,
                        color: theme.palette.warning.contrastText,
                      },
                      boxShadow: theme.shadows[2],
                      border: `2px solid ${theme.palette.warning.main}`,
                    }}
                  >
                    <ArrowDownward />
                  </IconButton>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Dialog for Stage Details */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          تفاصيل المرحلة
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box>
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                color: theme.palette.primary.main,
                fontWeight: "bold",
                mb: 2,
              }}
            >
              {selectedStage &&
                salesStageEnum.find((s) => s.key === selectedStage.stage)
                  ?.label}
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              gutterBottom
              sx={{ mb: 3 }}
            >
              تم في:{" "}
              {selectedStage &&
                dayjs(selectedStage.createdAt).format("DD MMMM YYYY - HH:mm")}
            </Typography>

            <Divider sx={{ mb: 3 }} />

            {currentStageId && (
              <NotesComponent
                id={currentStageId}
                idKey={"salesStageId"}
                showAddNotes={true}
                slug="shared"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: "center" }}>
          <Button
            onClick={handleCloseDialog}
            variant="contained"
            sx={{
              minWidth: 120,
              borderRadius: 2,
              fontWeight: "bold",
            }}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesStageComponent;
