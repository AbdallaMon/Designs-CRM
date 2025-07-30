"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid2 as Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  DialogActions,
  DialogContent,
  DialogTitle,
  Dialog,
  CircularProgress,
  styled,
  LinearProgress,
  Collapse,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  AppBar,
  Toolbar,
  Container,
  Menu,
  Avatar,
  Badge,
} from "@mui/material";

import {
  MdAdd,
  MdCancel,
  MdEdit,
  MdSave,
  MdVisibility,
  MdVisibilityOff,
  MdPause,
  MdError,
  MdOutlineCalendarToday,
  MdOutlineSquareFoot,
  MdPerson,
  MdOutlineAccessTime,
  MdCheck,
  MdClose,
  MdList,
  MdCalendarMonth,
  MdPriorityHigh,
  MdSwapHoriz,
  MdAssignment,
  MdDelete,
  MdAssignmentInd,
  MdGroup,
} from "react-icons/md";
import { PROJECT_STATUSES, statusColors } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import dayjs from "dayjs";
import colors from "@/app/helpers/colors";
import { RelatedLinks } from "../../utility/RelatedLinks";
import { AiOutlineSwap } from "react-icons/ai";
import { useAuth } from "@/app/providers/AuthProvider";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { AssignDesignerModal } from "./AssignDesignerModal";
import { ProjectTasksDialog, TasksDialog } from "../utility/ProjectTasksDialog";

// Styled components
export const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
  // height: "100%",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  overflow: "visible",
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  textTransform: "none",
  fontWeight: 600,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  transition: "all 0.2s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
  },
}));

const InfoCard = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: 12,
  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
  transition: "transform 0.2s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
  },
  minWidth: 160,
}));

const PriorityChip = styled(Chip)(({ theme, priority }) => ({
  borderRadius: 16,
  height: 32,
  fontWeight: 500,
  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.08)",
  marginLeft: theme.spacing(1),
}));

const StyledProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  backgroundColor: theme.palette.grey[200],
  "& .MuiLinearProgress-bar": {
    borderRadius: 5,
  },
}));

const ProgressDot = styled(Box)(({ theme, active }) => ({
  width: 14,
  height: 14,
  borderRadius: "50%",
  backgroundColor: active
    ? theme.palette.primary.main
    : theme.palette.grey[300],
  transition: "all 0.3s ease",
  transform: active ? "scale(1.1)" : "scale(1)",
  boxShadow: active ? "0 0 0 2px rgba(25, 118, 210, 0.2)" : "none",
}));

export const StyledDesignerCard = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: 10,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
  width: "100%",
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    backgroundColor: theme.palette.grey[50],
  },
}));

// Project Progress Tracker Component
const ProjectProgressTracker = ({ project }) => {
  // Filter out Hold and get only completion statuses
  const getCompletionStatuses = (projectType) => {
    return PROJECT_STATUSES[projectType].filter(
      (status) => status !== "Hold" && status !== "Rejected"
    );
  };

  const completionStatuses = getCompletionStatuses(project.type);
  const currentStatusIndex = completionStatuses.indexOf(project.status);

  // Calculate percentage completion
  const calculatePercentage = () => {
    if (currentStatusIndex === -1) return 0;
    if (completionStatuses.length <= 1) return 100;
    return Math.round(
      (currentStatusIndex / (completionStatuses.length - 1)) * 100
    );
  };

  // Calculate project duration
  const calculateProjectDuration = (startDate, endDate) => {
    if (!startDate) {
      return { text: "Not started yet", color: "text.secondary" };
    }

    if (!endDate) {
      const start = dayjs(startDate);
      const now = dayjs();
      const days = now.diff(start, "day");

      return {
        text: `In progress (${days} days so far)`,
        color: "info.main",
      };
    }

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const days = end.diff(start, "day");
    const months = end.diff(start, "month");

    if (days < 0) {
      return { text: "Invalid dates", color: "error.main" };
    }

    if (days > 30) {
      return {
        text: `Completed in ${months} ${
          months === 1 ? "month" : "months"
        } (${days} days)`,
        color: "success.main",
      };
    }

    return {
      text: `Completed in ${days} days`,
      color: "success.main",
    };
  };

  const percentageComplete = calculatePercentage();
  const isOnHold = project.status === "Hold";
  const isRejected = project.status === "Rejected";
  const duration = calculateProjectDuration(project.startedAt, project.endedAt);

  return (
    <StyledCard
      elevation={2}
      sx={{
        mb: 3,
        overflow: "visible",
        "&.MuiPaper-root": {
          height: "fit-content",
        },
        "&. MuiPaper-root": {
          height: "fit-content",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Status Message for Hold or Rejected */}
        {isOnHold || isRejected ? (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: isOnHold ? "warning.light" : "error.light",
              borderRadius: 2,
              mb: 2,
              display: "flex",
              alignItems: "center",
            }}
          >
            {isOnHold ? <MdPause size={22} /> : <MdError size={22} />}
            <Typography variant="body1" sx={{ ml: 1.5, fontWeight: 500 }}>
              {isOnHold
                ? "This project is currently on hold. Progress will resume when the hold is lifted."
                : "This project has been rejected and requires attention before proceeding."}
            </Typography>
          </Paper>
        ) : (
          <Box>
            {/* Combined Progress and Duration */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1,
                alignItems: "center",
              }}
            >
              <Typography variant="h6" fontWeight="medium">
                Project Progress
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Tooltip title="Progress percentage">
                  <Chip
                    label={`${percentageComplete}%`}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: "bold", mr: 1 }}
                  />
                </Tooltip>
                <Typography
                  variant="body2"
                  color={duration.color}
                  sx={{ fontWeight: 500 }}
                >
                  {duration.text}
                </Typography>
              </Box>
            </Box>

            {/* Progress bar */}
            <StyledProgressBar
              variant="determinate"
              value={percentageComplete}
              sx={{ mb: 2.5 }}
            />

            {/* Enhanced stepper with dots */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                px: 0.5,
                mt: 1.5,
              }}
            >
              {completionStatuses.map((label, index) => (
                <Box key={label} sx={{ textAlign: "center", flex: 1 }}>
                  <Tooltip title={label}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <ProgressDot active={index <= currentStatusIndex} />
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.7rem",
                          mt: 0.7,
                          fontWeight: index <= currentStatusIndex ? 600 : 400,
                          color:
                            index <= currentStatusIndex
                              ? "primary.main"
                              : "text.secondary",
                        }}
                      >
                        {label}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
};

export const ProjectDetails = ({
  project,
  onUpdate,
  isStaff,
  withReleventLinks,
  renderTasks = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState({ ...project });
  const [open, setOpen] = useState(false);
  const [assignmentId, setAssignmentId] = useState(null);
  const [deleteDesigner, setDeleteDesigner] = useState(false);
  const { setLoading } = useToastContext();
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = async (value) => {
    const request = await handleRequestSubmit(
      {
        status: value,
        oldStatus: project.status,
        isAdmin: isAdmin,
        id: project.id,
      },
      setLoading,
      `shared/client-leads/designers/${project.clientLeadId}/status`,
      false,
      "Updating",
      null,
      "PUT"
    );
    if (request.status === 200) {
      window.location.reload();
      setAnchorEl(null);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedProject({
      ...editedProject,
      [field]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedProject = await handleRequestSubmit(
      editedProject,
      setLoading,
      `shared/projects/${project.id}`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (updatedProject.status === 200) {
      onUpdate(updatedProject.data);
      setIsEditing(false);
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "VERY_HIGH":
      case "HIGH":
        return "error";
      case "MEDIUM":
        return "warning";
      case "LOW":
      case "VERY_LOW":
        return "success";
      default:
        return "primary";
    }
  };

  // Format priority label
  const formatPriority = (priority) => {
    return priority
      .replace("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderEditForm = () => (
    <StyledCard sx={{ p: 2, mt: 3 }}>
      <CardHeader
        title="Edit Project Details"
        titleTypographyProps={{
          variant: "h6",
          fontWeight: 600,
          color: "primary.main",
        }}
      />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="status-label">Project Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={editedProject.status}
                  label="Project Status"
                  onChange={(e) => handleInputChange("status", e.target.value)}
                >
                  {PROJECT_STATUSES[project.type].map((status) => (
                    <MenuItem key={status} value={status}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {status === "Hold" && (
                          <MdPause size={18} style={{ marginRight: 8 }} />
                        )}
                        {status === "Rejected" && (
                          <MdClose size={18} style={{ marginRight: 8 }} />
                        )}
                        {status === "Completed" && (
                          <MdCheck size={18} style={{ marginRight: 8 }} />
                        )}
                        {status}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="priority-label">Priority Level</InputLabel>
                <Select
                  labelId="priority-label"
                  value={editedProject.priority}
                  label="Priority Level"
                  onChange={(e) =>
                    handleInputChange("priority", e.target.value)
                  }
                >
                  <MenuItem value="VERY_LOW">Very Low</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="VERY_HIGH">Very High</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }} container spacing={2}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Delivery Date"
                  type="date"
                  variant="outlined"
                  value={
                    editedProject.deliveryTime
                      ? new Date(editedProject.deliveryTime)
                          .toISOString()
                          .slice(0, 10) // only YYYY-MM-DD
                      : ""
                  }
                  onChange={(e) =>
                    handleInputChange("deliveryTime", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Add Days to Delivery"
                  type="number"
                  variant="outlined"
                  inputProps={{ min: 0 }}
                  onChange={(e) => {
                    const daysToAdd = parseInt(e.target.value, 10);
                    if (!isNaN(daysToAdd)) {
                      const newDeliveryDate = dayjs()
                        .add(daysToAdd, "day")
                        .format("YYYY-MM-DD");
                      handleInputChange("deliveryTime", newDeliveryDate);
                    }
                  }}
                  placeholder="Enter number of days"
                />
              </Grid>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Area (m²)"
                type="number"
                variant="outlined"
                inputProps={{ step: 0.01 }}
                value={editedProject.area || ""}
                onChange={(e) =>
                  handleInputChange(
                    "area",
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
              />
            </Grid>

            <Grid size={12}>
              <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                <StyledButton
                  variant="outlined"
                  color="secondary"
                  startIcon={<MdCancel />}
                  onClick={() => setIsEditing(false)}
                  size="large"
                >
                  Cancel
                </StyledButton>
                <StyledButton
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<MdSave />}
                  size="large"
                >
                  Save Changes
                </StyledButton>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </StyledCard>
  );

  const renderProjectInfo = () => (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5 }}>
            <InfoCard>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "primary.light",
                  color: "primary.main",
                  p: 1.5,
                  borderRadius: 2,
                  mr: 2,
                }}
              >
                <MdCalendarMonth size={24} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Delivery Time
                </Typography>
                <Typography variant="subtitle1" fontWeight="600">
                  {project.deliveryTime
                    ? dayjs(project.deliveryTime).format("DD MMM, YYYY")
                    : "Not scheduled"}
                </Typography>
              </Box>
            </InfoCard>

            <InfoCard>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "primary.light",
                  color: "primary.main",
                  p: 1.5,
                  borderRadius: 2,
                  mr: 2,
                }}
              >
                <MdOutlineSquareFoot size={24} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Project Area
                </Typography>
                <Typography variant="subtitle1" fontWeight="600">
                  {project.area ? `${project.area} m²` : "Not specified"}
                </Typography>
              </Box>
            </InfoCard>

            <InfoCard>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "primary.light",
                  color: "primary.main",
                  p: 1.5,
                  borderRadius: 2,
                  mr: 2,
                }}
              >
                <MdOutlineAccessTime size={24} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Project Timeline
                </Typography>
                <Typography variant="subtitle1" fontWeight="600">
                  {project.startedAt
                    ? dayjs(project.startedAt).format("DD MMM, YY")
                    : "Not started"}
                  {project.endedAt
                    ? ` - ${dayjs(project.endedAt).format("DD MMM, YY")}`
                    : project.startedAt
                    ? " - Ongoing"
                    : ""}
                </Typography>
              </Box>
            </InfoCard>
          </Box>
        </Grid>

        {!isStaff && (
          <Grid size={12} sx={{ mt: 3 }}>
            <StyledCard sx={{ p: 0, overflow: "visible" }}>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <MdAssignmentInd size={22} color={colors.primary} />
                    <Typography variant="h6" sx={{ ml: 1.5, fontWeight: 600 }}>
                      Project Designers
                    </Typography>
                  </Box>
                }
                action={
                  <StyledButton
                    onClick={() => {
                      setOpen(true);
                      setAssignmentId(null);
                      setDeleteDesigner(false);
                    }}
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<MdAdd />}
                  >
                    Assign New Designer
                  </StyledButton>
                }
                sx={{ px: 3, pt: 2.5, pb: 1 }}
              />

              <Divider sx={{ mx: 3 }} />

              <CardContent sx={{ p: 3 }}>
                {project.assignments?.length ? (
                  project.assignments?.map((assignment) => (
                    <StyledDesignerCard key={assignment.id}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 40,
                            height: 40,
                          }}
                        >
                          {assignment.user.name.charAt(0)}
                        </Avatar>
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {assignment.user.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {assignment.user.email}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Remove from project">
                          <StyledButton
                            onClick={() => {
                              setOpen(true);
                              setAssignmentId(assignment.id);
                              setDeleteDesigner(true);
                            }}
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<MdDelete />}
                          >
                            Remove
                          </StyledButton>
                        </Tooltip>
                      </Box>
                    </StyledDesignerCard>
                  ))
                ) : (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body1" color="text.secondary">
                      No designers assigned to this project yet
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </StyledCard>
          </Grid>
        )}
      </Grid>
      {withReleventLinks && (
        <Box sx={{ mt: 3 }}>
          <RelatedLinks clientLeadId={project.clientLeadId} />
        </Box>
      )}
      {open && (
        <AssignDesignerModal
          open={open}
          project={project}
          setOpen={setOpen}
          onUpdate={onUpdate}
          assignmentId={assignmentId}
          deleteDesigner={deleteDesigner}
        />
      )}
    </Box>
  );

  return (
    <>
      <ProjectProgressTracker project={project} />

      {isEditing ? (
        renderEditForm()
      ) : (
        <StyledCard sx={{ mb: 3, overflow: "visible" }}>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PriorityChip
                  icon={<MdGroup />}
                  label={`(Group: ${project.groupTitle})`}
                  color="0d9488"
                />
                <StyledButton
                  variant="contained"
                  startIcon={!isAdmin && <AiOutlineSwap />}
                  aria-controls={menuOpen ? "status-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={menuOpen ? "true" : undefined}
                  onClick={handleClick}
                  color={
                    project.status === "Completed"
                      ? "success"
                      : project.status === "Hold"
                      ? "warning"
                      : project.status === "Rejected"
                      ? "error"
                      : "primary"
                  }
                  sx={{
                    background: statusColors[project.status],
                    fontWeight: 600,
                    borderRadius: 3,
                    px: 2,
                  }}
                >
                  {project.status}
                </StyledButton>
                <Menu
                  id="status-menu"
                  anchorEl={anchorEl}
                  key={project.id}
                  open={menuOpen}
                  onClose={() => setAnchorEl(null)}
                  PaperProps={{
                    sx: {
                      borderRadius: 2,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      mt: 1,
                    },
                  }}
                >
                  {PROJECT_STATUSES[project.type].map((status) => (
                    <MenuItem
                      key={status}
                      value={status}
                      onClick={() => handleMenuClose(status)}
                      sx={{
                        px: 2,
                        py: 1.2,
                        "&:hover": {
                          backgroundColor: "action.hover",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {status === "Hold" && (
                          <MdPause size={18} style={{ marginRight: 8 }} />
                        )}
                        {status === "Rejected" && (
                          <MdClose size={18} style={{ marginRight: 8 }} />
                        )}
                        {status === "Completed" && (
                          <MdCheck size={18} style={{ marginRight: 8 }} />
                        )}
                        {status}
                      </Box>
                    </MenuItem>
                  ))}
                </Menu>
                <PriorityChip
                  icon={<MdPriorityHigh />}
                  label={formatPriority(project.priority)}
                  color={getPriorityColor(project.priority)}
                  priority={project.priority}
                />
              </Box>

              {!isStaff && (
                <Box sx={{ display: "flex", gap: 2 }}>
                  <StyledButton
                    variant="outlined"
                    color="primary"
                    startIcon={<MdEdit />}
                    onClick={() => {
                      setIsEditing(true);
                      setEditedProject({ ...project });
                    }}
                  >
                    Edit Details
                  </StyledButton>

                  <StyledButton
                    variant="contained"
                    color="primary"
                    component="a"
                    href={`/dashboard/projects/grouped/${project.clientLeadId}`}
                  >
                    View All Lead Projects
                  </StyledButton>
                </Box>
              )}
            </Box>

            {renderProjectInfo()}
          </CardContent>
        </StyledCard>
      )}

      {renderTasks && <ProjectTasksDialog project={project} />}
    </>
  );
};
