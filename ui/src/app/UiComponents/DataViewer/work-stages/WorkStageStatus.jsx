import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  Tooltip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Collapse,
  IconButton,
} from "@mui/material";
import { BiCheckCircle, BiChevronDown, BiChevronUp } from "react-icons/bi";
import { MdPending, MdTimeline } from "react-icons/md";
import dayjs from "dayjs";
import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAuth } from "@/app/providers/AuthProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";

const WorkStagesComponent = ({ clientLeadId, stage, userId }) => {
  const [workStages, setWorkStages] = useState([]);
  const [currentStage, setCurrentStage] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setLoading: setToastLoading } = useToastContext();
  const { user } = useAuth();
  const { setAlertError } = useAlertContext();

  useEffect(() => {
    const fetchWorkStages = async () => {
      try {
        const response = await getData({
          url: `shared/work-stages/${clientLeadId}/status`,
          setLoading,
        });

        let stageToShow = response.data.find((s) => s.stage === stage);

        if (!stageToShow) {
          stageToShow = {
            clientLeadId,
            stage: "Initial Stage",
            communicationStatus: false,
            designStageStatus: false,
            renderStatus: false,
          };
        }
        setWorkStages(response.data.filter((s) => s.stage !== stage));
        setCurrentStage(stageToShow);
      } catch (error) {
        console.error("Error fetching work stages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkStages();
  }, [clientLeadId]);

  const handleStatusUpdate = async (field) => {
    if (!currentStage) return;
    if (user.id !== parseInt(userId)) {
      setAlertError("You are not allowed to take this action");
      return;
    }

    if (field === "designStageStatus" && !currentStage.communicationStatus) {
      return;
    }

    if (field === "renderStatus" && !currentStage.designStageStatus) {
      return;
    }

    try {
      const response = await handleRequestSubmit(
        {
          [field]: true,
          stage,
        },
        setToastLoading,
        `shared/work-stages/${clientLeadId}/work-status`,
        false,
        "Updating"
      );

      if (response.status === 200) {
        setCurrentStage(response.data);
      }
    } catch (error) {
      console.error("Error updating stage status:", error);
    }
  };

  const calculateStageProgress = () => {
    if (!currentStage) return 0;
    let completedSteps = 0;
    if (currentStage.communicationStatus) completedSteps++;
    if (currentStage.designStageStatus) completedSteps++;
    if (currentStage.renderStatus) completedSteps++;
    return (completedSteps / 3) * 100;
  };

  const renderStageStatus = (
    label,
    status,
    updatedAt,
    field,
    isCurrentStage = false
  ) => {
    const canUpdate =
      isCurrentStage &&
      !status &&
      (field === "communicationStatus" ||
        (field === "designStageStatus" && currentStage?.communicationStatus) ||
        (field === "renderStatus" && currentStage?.designStageStatus)) &&
      user.id === parseInt(userId);

    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        my={2}
        sx={{
          backgroundColor: status
            ? "rgba(76, 175, 80, 0.1)"
            : "rgba(244, 67, 54, 0.1)",
          padding: 2,
          borderRadius: 2,
          transition: "background-color 0.3s ease",
        }}
      >
        <Box display="flex" alignItems="center">
          {status ? (
            <BiCheckCircle
              color="#4CAF50"
              size={24}
              style={{
                marginRight: 8,
                animation: "fadeIn 0.5s ease-in-out",
              }}
            />
          ) : (
            <MdPending
              color="#F44336"
              size={24}
              style={{
                marginRight: 8,
                animation: "pulse 1.5s infinite",
              }}
            />
          )}
          <Typography
            sx={{
              fontWeight: status ? 600 : 400,
              color: status ? "success.main" : "error.main",
            }}
          >
            {label}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center">
          {updatedAt && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mr: 2,
                fontSize: "0.75rem",
              }}
            >
              Updated: {dayjs(updatedAt).format("DD/MM/YYYY")}
            </Typography>
          )}

          {canUpdate && (
            <Tooltip title="Mark as Complete" placement="top" arrow>
              <Switch
                checked={status}
                onChange={() => handleStatusUpdate(field)}
                color="primary"
                sx={{
                  "& .MuiSwitch-switchBase": {
                    "&.Mui-checked": {
                      color: "#4CAF50",
                      "& + .MuiSwitch-track": {
                        backgroundColor: "#4CAF50",
                      },
                    },
                  },
                }}
              />
            </Tooltip>
          )}
        </Box>
      </Box>
    );
  };

  if (loading)
    return (
      <Box sx={{ width: "100%", py: 2 }}>
        <LinearProgress color="primary" />
      </Box>
    );

  return (
    <Card
      sx={{
        maxWidth: 600,
        margin: "auto",
        boxShadow: 3,
        borderRadius: 2,
      }}
    >
      <CardContent>
        {/* Progress Indicator */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <MdTimeline size={24} style={{ marginRight: 8 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Current Work Stage: {stage}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {`${Math.round(calculateStageProgress())}% Complete`}
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={calculateStageProgress()}
          sx={{
            height: 8,
            borderRadius: 4,
            mb: 2,
          }}
        />

        {/* Current Stage Section */}
        {currentStage && (
          <>
            {renderStageStatus(
              "Communication",
              currentStage.communicationStatus,
              currentStage.communicationUpdatedAt,
              "communicationStatus",
              true
            )}
            {renderStageStatus(
              "Design Stage",
              currentStage.designStageStatus,
              currentStage.designStageUpdatedAt,
              "designStageStatus",
              true
            )}
            {renderStageStatus(
              "Render",
              currentStage.renderStatus,
              currentStage.renderUpdatedAt,
              "renderStatus",
              true
            )}
          </>
        )}

        {/* Previous Stages Section */}
        {workStages.length > 0 && (
          <>
            <Divider sx={{ my: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Previous Stages
              </Typography>
            </Divider>
            <List>
              {workStages.map((stage, index) => (
                <React.Fragment key={stage.id || index}>
                  <ListItem>
                    <ListItemText
                      primary={`Stage: ${stage.stage}`}
                      secondary={`
                            Communication Updated: ${
                              stage.communicationUpdatedAt
                                ? dayjs(stage.communicationUpdatedAt).format(
                                    "DD/MM/YYYY"
                                  )
                                : "Not available"
                            }
                            | Design Updated: ${
                              stage.designStageUpdatedAt
                                ? dayjs(stage.designStageUpdatedAt).format(
                                    "DD/MM/YYYY"
                                  )
                                : "Not available"
                            }
                            | Render Updated: ${
                              stage.renderUpdatedAt
                                ? dayjs(stage.renderUpdatedAt).format(
                                    "DD/MM/YYYY"
                                  )
                                : "Not available"
                            }
                          `}
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </CardContent>

      {/* Optional: Add some subtle animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </Card>
  );
};

export default WorkStagesComponent;
