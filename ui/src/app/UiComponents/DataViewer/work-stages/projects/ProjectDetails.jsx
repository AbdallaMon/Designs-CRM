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
} from "react-icons/md";
import { PROJECT_STATUSES, statusColors } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { TasksList } from "../../utility/TasksList";
import { getData } from "@/app/helpers/functions/getData";
import dayjs from "dayjs";
import colors from "@/app/helpers/colors";
import { RelatedLinks } from "../../utility/RelatedLinks";
import { AiOutlineSwap } from "react-icons/ai";
import { useAuth } from "@/app/providers/AuthProvider";
import { checkIfAdmin } from "@/app/helpers/functions/utility";

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
    <Box sx={{ width: "100%", mb: 2 }}>
      {/* Status Message for Hold or Rejected */}
      {isOnHold || isRejected ? (
        <Box
          sx={{
            p: 2,
            bgcolor: isOnHold ? "warning.light" : "error.light",
            borderRadius: 1,
            mb: 1,
          }}
        >
          <Typography variant="body2">
            {isOnHold
              ? "This project is currently on hold. Progress will resume when the hold is lifted."
              : "This project has been rejected and requires attention before proceeding."}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mb: 1 }}>
          {/* Combined Progress and Duration */}
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
          >
            <Typography variant="body2" fontWeight="medium">
              {percentageComplete}% Complete
            </Typography>
            <Typography variant="body2" color={duration.color}>
              {duration.text}
            </Typography>
          </Box>

          {/* Progress bar */}
          <LinearProgress
            variant="determinate"
            value={percentageComplete}
            sx={{ height: 8, borderRadius: 4, mb: 1 }}
          />

          {/* Ultra simplified stepper - just as a row of dots */}
          <Box
            sx={{ display: "flex", justifyContent: "space-between", px: 0.5 }}
          >
            {completionStatuses.map((label, index) => (
              <Box key={label} sx={{ textAlign: "center", flex: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor:
                      index <= currentStatusIndex ? "primary.main" : "grey.300",
                    mx: "auto",
                    mb: 0.5,
                  }}
                />
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ fontSize: "0.65rem" }}
                >
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
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
  const [tasksDialogOpen, setTasksDialogOpen] = useState(false);
  const [editedProject, setEditedProject] = useState({ ...project });
  const [open, setOpen] = useState(false);
  const { setLoading } = useToastContext();

  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = async (value) => {
    if (user.role === "SUPER_ADMIN") {
      return;
    }
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

  const renderEditForm = () => (
    <Paper sx={{ p: 2, mt: 2 }}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={editedProject.status}
                label="Status"
                onChange={(e) => handleInputChange("status", e.target.value)}
              >
                {PROJECT_STATUSES[project.type].map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                value={editedProject.priority}
                label="Priority"
                onChange={(e) => handleInputChange("priority", e.target.value)}
              >
                <MenuItem value="VERY_LOW">Very Low</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="VERY_HIGH">Very High</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Delivery Time"
              type="datetime-local"
              value={
                editedProject.deliveryTime
                  ? new Date(editedProject.deliveryTime)
                      .toISOString()
                      .slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                handleInputChange("deliveryTime", e.target.value)
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Area (m²)"
              type="number"
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
            <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<MdCancel />}
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<MdSave />}
              >
                Save Changes
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );

  const renderProjectInfo = () => (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor: "background.paper",
                p: 1,
                borderRadius: 1,
                boxShadow: 1,
                minWidth: 150,
              }}
            >
              <MdOutlineCalendarToday color={colors.primary} size={20} />
              <Box sx={{ ml: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Delivery Time
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {project.deliveryTime
                    ? dayjs(project.deliveryTime).format("DD/MM/YYYY")
                    : "Not set"}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor: "background.paper",
                p: 1,
                borderRadius: 1,
                boxShadow: 1,
                minWidth: 120,
              }}
            >
              <MdOutlineSquareFoot color={colors.primary} size={20} />
              <Box sx={{ ml: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Area
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {project.area ? `${project.area} m²` : "Not set"}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor: "background.paper",
                p: 1,
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <MdOutlineAccessTime color={colors.primary} size={20} />
              <Box sx={{ ml: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Timeline
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {project.startedAt
                    ? dayjs(project.startedAt).format("DD/MM/YY")
                    : "Not started"}
                  {project.endedAt
                    ? ` - ${dayjs(project.endedAt).format("DD/MM/YY")}`
                    : " - Ongoing"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        <Grid size={12} sx={{ mt: 2 }}>
          <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <MdPerson color={colors.primary} size={20} />
                <Typography variant="subtitle2" sx={{ ml: 1 }}>
                  Designer
                </Typography>
              </Box>

              {!isStaff && (
                <Button
                  onClick={() => setOpen(true)}
                  variant="outlined"
                  color="primary"
                  size="small"
                >
                  {!project.user ? "Assign" : "Change"}
                </Button>
              )}
            </Box>

            <Typography variant="body2" sx={{ mt: 1 }}>
              {project.user
                ? `${project.user.name} - ${project.user.email}`
                : "Not assigned yet"}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      {withReleventLinks && (
        <RelatedLinks clientLeadId={project.clientLeadId} />
      )}
      {open && (
        <AssignDesignerModal
          open={open}
          project={project}
          setOpen={setOpen}
          onUpdate={onUpdate}
        />
      )}
    </Box>
  );

  const TasksDialog = () => (
    <Dialog
      fullScreen
      open={tasksDialogOpen}
      onClose={() => setTasksDialogOpen(false)}
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setTasksDialogOpen(false)}
            aria-label="close"
          >
            <MdClose />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Project Tasks
          </Typography>
        </Toolbar>
      </AppBar>
      <DialogContent sx={{ p: 3 }}>
        <Container maxWidth="lg">
          <TasksList projectId={project.id} type="PROJECT" />
        </Container>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <ProjectProgressTracker project={project} />

        {isEditing ? (
          renderEditForm()
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                startIcon={!isAdmin && <AiOutlineSwap />}
                aria-controls={menuOpen ? "basic-menu" : undefined}
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
                  fontWeight: 500,
                  borderRadius: "50px",
                }}
              >
                {project.status}
              </Button>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                key={project.id}
                open={menuOpen}
                onClose={() => setAnchorEl(null)}
                MenuListProps={{
                  "aria-labelledby": "basic-button",
                }}
              >
                {PROJECT_STATUSES[project.type].map((status) => (
                  <MenuItem
                    key={status}
                    value={status}
                    onClick={() => handleMenuClose(status)}
                  >
                    {status}
                  </MenuItem>
                ))}
              </Menu>
              <Chip
                label={project.priority}
                variant="outlined"
                color={
                  project.priority.includes("HIGH") ||
                  project.priority.includes("VERY_HIGH")
                    ? "error"
                    : project.priority.includes("MEDIUM")
                    ? "warning"
                    : "success"
                }
              />
            </Box>

            {!isStaff && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<MdEdit />}
                size="small"
                onClick={() => {
                  setIsEditing(true);
                  setEditedProject({ ...project });
                }}
              >
                Edit
              </Button>
            )}
          </Box>
        )}

        {!isEditing && renderProjectInfo()}
      </Box>

      {renderTasks && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<MdList />}
            fullWidth
            onClick={() => setTasksDialogOpen(true)}
          >
            View Project Tasks
          </Button>
        </Paper>
      )}

      {/* Tasks Dialog */}
      <TasksDialog />
    </>
  );
};

function AssignDesignerModal({ open, setOpen, project, onUpdate }) {
  const [designerId, setDesignerId] = useState("");
  const [users, setUsers] = useState([]);
  const { setLoading: setToastLoading } = useToastContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUsers() {
      const usersRequest = await getData({
        url: `admin/all-users?role=${project.role}&`,
        setLoading,
      });
      if (usersRequest.status === 200) {
        setUsers(usersRequest.data);
      }
    }
    if (open) {
      getUsers();
    }
  }, [open, project.role]);

  const handleDesignerChange = (event) => {
    setDesignerId(event.target.value);
  };

  const handleSubmit = async () => {
    const updatedProject = await handleRequestSubmit(
      { designerId },
      setToastLoading,
      `shared/projects/${project.id}/assign-designer`,
      false,
      "Assigning Designer",
      false,
      "PUT"
    );
    if (updatedProject.status === 200) {
      onUpdate(updatedProject.data);
      setOpen(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      PaperProps={{ sx: { width: "400px", maxWidth: "100%" } }}
    >
      <DialogTitle>Assign Designer</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 1 }}>
          <InputLabel id="designer-label">Select Designer</InputLabel>
          <Select
            labelId="designer-label"
            value={designerId}
            label="Select Designer"
            onChange={handleDesignerChange}
          >
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.name} - {user.email}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
}
