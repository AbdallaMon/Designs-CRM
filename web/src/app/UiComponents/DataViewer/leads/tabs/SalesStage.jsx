"use client";
import React, { useState, useEffect } from "react";
import {
  alpha,
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
  useTheme,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import {
  MdArrowUpward as ArrowUpward,
  MdArrowDownward as ArrowDownward,
  MdVisibility as Visibility,
  MdCheckCircle as CheckCircle,
  MdRadioButtonUnchecked as RadioButtonUnchecked,
  MdPlayArrow as PlayArrow,
} from "react-icons/md";
import { MdTimeline } from "react-icons/md";
import dayjs from "dayjs";
import { salesStageEnum } from "@/app/helpers/constants";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { TabSection } from "../shared/tabKit";
import { TabLoading } from "../shared/TabLoading";
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
    return <TabLoading />;
  }

  const currentStageIndex = getCurrentStageIndex();
  const currentStage =
    currentStageIndex >= 0 ? salesStageEnum[currentStageIndex] : null;
  const currentStageData = currentStage ? getStageData(currentStage.key) : null;

  return (
    <TabSection icon={<MdTimeline />} title="Sales stage" description="مراحل البيع">
      <Box sx={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Current Stage Banner */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
        {currentStage && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              maxWidth: 460,
              margin: "0 auto",
              background: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={1.5}
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(currentStage, currentStageData.id);
                }}
                sx={{
                  color: "inherit",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" },
                }}
              >
                <Visibility />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                المرحلة الحالية: {currentStage.label}
              </Typography>
            </Stack>
            {currentStageData && (
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                Created at:{" "}
                {dayjs(currentStageData.createdAt).format("DD MMMM YYYY")}
              </Typography>
            )}
          </Paper>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Stages list */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {salesStageEnum.map((stage, index) => {
          const isCompleted = isStageCompleted(stage.key);
          const stageData = getStageData(stage.key);
          const isCurrentStage = index === currentStageIndex;
          const canShowArrows =
            isCurrentStage || (currentStageIndex === -1 && index === 0);

          const borderColor = isCompleted
            ? theme.palette.success.main
            : isCurrentStage
            ? theme.palette.info.main
            : theme.palette.divider;
          const bg = isCompleted
            ? alpha(theme.palette.success.main, 0.08)
            : isCurrentStage
            ? alpha(theme.palette.info.main, 0.08)
            : alpha(theme.palette.background.default, 0.5);

          return (
            <Box key={stage.key}>
              {canShowArrows && index > 0 && (
                <Box sx={{ display: "flex", justifyContent: "center", mb: 0.5 }}>
                  <IconButton
                    onClick={() => handleStageAction(stage.key, "back", index)}
                    disabled={actionLoading}
                    sx={{
                      color: theme.palette.success.main,
                      backgroundColor: alpha(theme.palette.success.main, 0.12),
                      "&:hover": {
                        backgroundColor: theme.palette.success.main,
                        color: theme.palette.success.contrastText,
                      },
                    }}
                  >
                    <ArrowUpward />
                  </IconButton>
                </Box>
              )}

              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: bg,
                  border: `1px solid ${borderColor}`,
                  ...(isCurrentStage && {
                    borderWidth: 2,
                  }),
                  transition: "all 0.2s ease-in-out",
                  "&:hover": { boxShadow: theme.shadows[3] },
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={2}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    {isCompleted ? (
                      <CheckCircle
                        style={{
                          color: theme.palette.success.main,
                          fontSize: 30,
                        }}
                      />
                    ) : isCurrentStage ? (
                      <PlayArrow
                        style={{ color: theme.palette.info.main, fontSize: 30 }}
                      />
                    ) : (
                      <RadioButtonUnchecked
                        style={{
                          color: theme.palette.grey[400],
                          fontSize: 30,
                        }}
                      />
                    )}
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: isCompleted || isCurrentStage ? 700 : 500,
                          color: "text.primary",
                        }}
                      >
                        {stage.label}
                      </Typography>
                      {isCompleted && stageData && (
                        <Typography variant="caption" color="text.secondary">
                          Created At:{" "}
                          {dayjs(stageData.createdAt).format("DD MMMM YYYY")}
                        </Typography>
                      )}
                      {isCurrentStage && !isCompleted && (
                        <Chip
                          label="المرحلة الحالية"
                          size="small"
                          color="info"
                          sx={{ fontWeight: 700, mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </Stack>

                  {isCompleted && (
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(stageData, stageData.id);
                      }}
                      sx={{
                        color: theme.palette.success.main,
                        backgroundColor: alpha(theme.palette.success.main, 0.12),
                        "&:hover": {
                          backgroundColor: theme.palette.success.main,
                          color: theme.palette.success.contrastText,
                        },
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  )}
                </Stack>
              </Paper>

              {canShowArrows && index !== salesStageEnum.length - 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 0.5 }}>
                  <IconButton
                    onClick={() => handleStageAction(stage.key, "next", index)}
                    disabled={actionLoading}
                    sx={{
                      color: theme.palette.warning.main,
                      backgroundColor: alpha(theme.palette.warning.main, 0.12),
                      "&:hover": {
                        backgroundColor: theme.palette.warning.main,
                        color: theme.palette.warning.contrastText,
                      },
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

      {/* Stage details dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            textAlign: "center",
            fontWeight: 700,
          }}
        >
          تفاصيل المرحلة
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: "primary.main", fontWeight: 700, mb: 1 }}
            >
              {selectedStage &&
                salesStageEnum.find((s) => s.key === selectedStage.stage)
                  ?.label}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              sx={{ mb: 2 }}
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
            sx={{ minWidth: 120, fontWeight: 700, textTransform: "none" }}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </TabSection>
  );
};

export default SalesStageComponent;
