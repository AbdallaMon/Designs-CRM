"use client";
import React, { useState } from "react";
import {
  alpha,
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
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
import { useLeadTab } from "@/app/UiComponents/DataViewer/leads/context/LeadDetailsContext.jsx";
import { TabSection, RecordCard, MetaItem, StatusPill } from "@/app/UiComponents/DataViewer/leads/shared/tabKit.jsx";
import { TabLoading } from "@/app/UiComponents/DataViewer/leads/shared/TabLoading.jsx";
import { EmptyState } from "@/app/UiComponents/DataViewer/leads/shared/EmptyState.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { NotesComponent } from "@/app/UiComponents/DataViewer/utility/Notes.jsx";

const SalesStageComponent = ({ clientLeadId }) => {
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [currentStageId, setCurrentStageId] = useState(null);
  const { loading: actionLoading, setLoading: setActionLoading } =
    useToastContext();
  // Unified on the lead-detail per-tab cache (LeadDetailsContext): lazy fetch on first
  // open, cached across tab switches, silent reconcile after a stage change (no flicker).
  const {
    data: salesStages,
    showLoading: loading,
    error,
    refetch: fetchSalesStages,
  } = useLeadTab("salesStage");

  const updateSalesStage = async (stageType, action = "next", item) => {
    // v2 renamed this to a workflow action: POST /sales-stages/:id/actions/set-stage.
    // Advancing is driven purely by nextStage.key; `action`/`currentStageType` are only
    // sent on roll-back (the backend body is .strict() and only accepts action: "back").
    const data = { nextStage: item };
    if (action === "back") {
      data.action = "back";
      data.currentStageType = stageType;
    }
    const req = await handleRequestSubmit(
      data,
      setActionLoading,
      `shared/sales-stages/${clientLeadId}/actions/set-stage`,
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

  if (loading) {
    return <TabLoading />;
  }

  if (error) {
    return (
      <TabSection icon={<MdTimeline />} title="مراحل البيع">
        <EmptyState
          icon={<MdTimeline />}
          title="Failed to load sales stages"
          description="An error occurred while fetching the stages. Please try again."
          action={
            <Button
              variant="outlined"
              onClick={fetchSalesStages}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Retry
            </Button>
          }
        />
      </TabSection>
    );
  }

  const currentStageIndex = getCurrentStageIndex();
  const currentStage =
    currentStageIndex >= 0 ? salesStageEnum[currentStageIndex] : null;
  const currentStageData = currentStage ? getStageData(currentStage.key) : null;

  if (!salesStageEnum || salesStageEnum.length === 0) {
    return (
      <TabSection icon={<MdTimeline />} title="مراحل البيع" description="مراحل البيع">
        <EmptyState
          icon={<MdTimeline />}
          title="Sales stages haven't started yet"
          description="Stages will appear here once work begins on this lead."
        />
      </TabSection>
    );
  }

  return (
    <TabSection icon={<MdTimeline />} title="مراحل البيع" description="مراحل البيع">
      <Box sx={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Current Stage Banner */}
        {currentStage && (
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2.5,
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
                    backgroundColor: alpha(theme.palette.common.white, 0.2),
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.common.white, 0.3),
                    },
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
            </Box>
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* Stages list */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {salesStageEnum.map((stage, index) => {
            const isCompleted = isStageCompleted(stage.key);
            const stageData = getStageData(stage.key);
            const isCurrentStage = index === currentStageIndex;
            const canShowArrows =
              isCurrentStage || (currentStageIndex === -1 && index === 0);

            const accent = isCompleted
              ? theme.palette.success.main
              : isCurrentStage
              ? theme.palette.info.main
              : theme.palette.divider;

            return (
              <Box key={stage.key}>
                {canShowArrows && index > 0 && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mb: 0.5 }}
                  >
                    <IconButton
                      onClick={() =>
                        handleStageAction(stage.key, "back", index)
                      }
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

                <RecordCard
                  accent={accent}
                  leading={
                    isCompleted ? (
                      <CheckCircle
                        style={{
                          color: theme.palette.success.main,
                          fontSize: 28,
                        }}
                      />
                    ) : isCurrentStage ? (
                      <PlayArrow
                        style={{ color: theme.palette.info.main, fontSize: 28 }}
                      />
                    ) : (
                      <RadioButtonUnchecked
                        style={{
                          color: theme.palette.grey[400],
                          fontSize: 28,
                        }}
                      />
                    )
                  }
                  title={stage.label}
                  status={
                    isCompleted ? (
                      <StatusPill
                        label="Completed"
                        color={theme.palette.success.main}
                      />
                    ) : isCurrentStage ? (
                      <StatusPill
                        label="المرحلة الحالية"
                        color={theme.palette.info.main}
                      />
                    ) : undefined
                  }
                  meta={
                    isCompleted && stageData ? (
                      <MetaItem
                        label="Created At"
                        value={dayjs(stageData.createdAt).format("DD MMMM YYYY")}
                      />
                    ) : undefined
                  }
                  actions={
                    isCompleted ? (
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(stageData, stageData.id);
                        }}
                        size="small"
                        sx={{
                          color: theme.palette.success.main,
                          backgroundColor: alpha(
                            theme.palette.success.main,
                            0.12
                          ),
                          "&:hover": {
                            backgroundColor: theme.palette.success.main,
                            color: theme.palette.success.contrastText,
                          },
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    ) : undefined
                  }
                />

                {canShowArrows && index !== salesStageEnum.length - 1 && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 0.5 }}
                  >
                    <IconButton
                      onClick={() =>
                        handleStageAction(stage.key, "next", index)
                      }
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
