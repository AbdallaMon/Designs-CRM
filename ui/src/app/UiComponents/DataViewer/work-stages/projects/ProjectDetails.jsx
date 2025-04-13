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
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  styled,
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
} from "react-icons/md";
import { PROJECT_STATUSES } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { TasksList } from "./TasksList";
import { getData } from "@/app/helpers/functions/getData";
import dayjs from "dayjs";

// Custom connector for the stepper
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: "linear-gradient(to right, #4caf50, #2196f3)",
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: "linear-gradient(to right, #4caf50, #2196f3)",
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor:
      theme.palette.mode === "dark" ? theme.palette.grey[800] : "#eaeaf0",
    borderRadius: 1,
  },
}));

// Custom styled step icon
const ColorlibStepIconRoot = styled("div")(({ theme, ownerState }) => ({
  backgroundColor:
    theme.palette.mode === "dark" ? theme.palette.grey[700] : "#ccc",
  zIndex: 1,
  color: "#fff",
  width: 40,
  height: 40,
  display: "flex",
  borderRadius: "50%",
  justifyContent: "center",
  alignItems: "center",
  ...(ownerState.active && {
    backgroundImage: "linear-gradient(136deg, #2196f3 0%, #4caf50 100%)",
    boxShadow: "0 4px 10px 0 rgba(0,0,0,.25)",
  }),
  ...(ownerState.completed && {
    backgroundImage: "linear-gradient(136deg, #4caf50 0%, #2196f3 100%)",
  }),
  ...(ownerState.status === "hold" && {
    backgroundImage: "linear-gradient(136deg, #ff9800 0%, #ffc107 100%)",
  }),
  ...(ownerState.status === "rejected" && {
    backgroundImage: "linear-gradient(136deg, #f44336 0%, #e91e63 100%)",
  }),
}));

function ColorlibStepIcon(props) {
  const { active, completed, className, icon, status } = props;

  // Custom icon based on status
  let displayIcon = String(icon);
  if (status === "hold") {
    return (
      <ColorlibStepIconRoot
        ownerState={{ active, completed, status }}
        className={className}
      >
        <MdPause />
      </ColorlibStepIconRoot>
    );
  } else if (status === "Rejected") {
    return (
      <ColorlibStepIconRoot
        ownerState={{ active, completed, status }}
        className={className}
      >
        <MdError />
      </ColorlibStepIconRoot>
    );
  }

  return (
    <ColorlibStepIconRoot
      ownerState={{ active, completed, status }}
      className={className}
    >
      {displayIcon}
    </ColorlibStepIconRoot>
  );
}

// Progress Tracker Component
const ProjectProgressTracker = ({ project }) => {
  // Filter out Hold and get only completion statuses
  const getCompletionStatuses = (projectType) => {
    return PROJECT_STATUSES[projectType].filter(
      (status) => status !== "Hold" && status !== "Rejected"
    );
  };

  const completionStatuses = getCompletionStatuses(project.type);
  const currentStatusIndex = completionStatuses.indexOf(project.status);

  const isOnHold = project.status === "Hold";

  return (
    <Box sx={{ width: "100%", mb: 2, mt: -0.5 }}>
      <Typography variant="h6" gutterBottom>
        {isOnHold && (
          <Typography component="span" color="warning.main" sx={{ ml: 2 }}>
            (On Hold)
          </Typography>
        )}
      </Typography>
      <Stepper
        alternativeLabel
        activeStep={currentStatusIndex}
        connector={<ColorlibConnector />}
      >
        {completionStatuses.map((label, index) => {
          const statusType =
            project.status === "Hold" && index === currentStatusIndex - 1
              ? "hold"
              : project.status === "Rejected"
              ? "rejected"
              : "normal";

          return (
            <Step key={label}>
              <StepLabel
                StepIconComponent={ColorlibStepIcon}
                StepIconProps={{ status: statusType }}
              >
                {label}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>

      {/* Additional status info */}
      {project.status === "Hold" && (
        <Box sx={{ mt: 2, p: 2, bgcolor: "warning.light", borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            This project is currently on hold. Progress will resume when the
            hold is lifted.
          </Typography>
        </Box>
      )}

      {project.status === "Rejected" && (
        <Box sx={{ mt: 2, p: 2, bgcolor: "error.light", borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            This project has been rejected and requires attention before
            proceeding.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export const ProjectDetails = ({ project, onUpdate, isStaff }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [editedProject, setEditedProject] = useState({ ...project });
  const [open, setOpen] = useState(false);
  const { setLoading } = useToastContext();
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
    }
  };

  const renderEditForm = () => (
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

        {/* Priority Field */}
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

        {/* Delivery Time */}
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
            onChange={(e) => handleInputChange("deliveryTime", e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Area */}
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

        {/* Buttons */}
        <Grid size={12}>
          <Box display="flex" justifyContent="flex-end" gap={2}>
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
  );

  const renderProjectInfo = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="subtitle2" color="textSecondary">
          Status
        </Typography>
        <Typography variant="body1">{project.status}</Typography>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="subtitle2" color="textSecondary">
          Priority
        </Typography>
        <Typography variant="body1">{project.priority}</Typography>
      </Grid>

      {/* Delivery Time */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="subtitle2" color="textSecondary">
          Delivery Time
        </Typography>
        <Typography variant="body1">
          {project.deliveryTime
            ? dayjs(project.deliveryTime).format("DD/MM/YYYY")
            : "Not set"}
        </Typography>
      </Grid>

      {/* Area */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="subtitle2" color="textSecondary">
          Area
        </Typography>
        <Typography variant="body1">
          {project.area ? `${project.area} m²` : "Not set"}
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }} container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Designer
          </Typography>
          <Typography variant="body1">
            {project.user
              ? `${project.user.name} - ${project.user.email}`
              : "Not set"}
          </Typography>
        </Grid>
        {!isStaff && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Button
              onClick={() => setOpen(true)}
              variant="outlined"
              color="primary"
            >
              {!project.user ? "Assign to" : "Change"} Designer
            </Button>
            {open && (
              <AssignDesignerModal
                open={open}
                project={project}
                setOpen={setOpen}
                onUpdate={onUpdate}
              />
            )}
          </Grid>
        )}
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="subtitle2" color="textSecondary">
          Start Date
        </Typography>
        <Typography variant="body1">
          {project.startedAt
            ? dayjs(project.startedAt).format("DD/MM/YYYY")
            : "Not started"}
        </Typography>
      </Grid>

      {/* Ended At */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="subtitle2" color="textSecondary">
          End Date
        </Typography>
        <Typography variant="body1">
          {project.endedAt
            ? dayjs(project.endedAt).format("DD/MM/YYYY")
            : "In progress"}
        </Typography>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ mt: 2 }}>
      <Card>
        <CardHeader
          title={project.type.replace(/_/g, " ")}
          subheader={``}
          action={
            <>
              {!isStaff && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={isEditing ? <MdCancel /> : <MdEdit />}
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setEditedProject({ ...project });
                  }}
                >
                  {isEditing ? "Cancel" : "Edit Details"}
                </Button>
              )}
            </>
          }
        />
        <CardContent>
          {/* Add the progress tracker component */}
          <ProjectProgressTracker project={project} />

          {isEditing ? renderEditForm() : renderProjectInfo()}
        </CardContent>
      </Card>
      {!isStaff && (
        <Card sx={{ mt: 3 }}>
          <CardHeader
            title="Tasks"
            subheader="Manage tasks for this project"
            action={
              <Box>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={showTasks ? <MdVisibilityOff /> : <MdVisibility />}
                  onClick={() => setShowTasks(!showTasks)}
                  sx={{ mr: 1 }}
                >
                  {showTasks ? "Hide Tasks" : "Show Tasks"}
                </Button>
              </Box>
            }
          />
          {showTasks && (
            <CardContent>
              <TasksList projectId={project.id} type="PROJECT" />
            </CardContent>
          )}
        </Card>
      )}
    </Box>
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
  }, [open]);
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
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="400px"
      >
        <CircularProgress />
      </Box>
    );
  }
  return (
    <Dialog
      sx={{ width: "400px", maxWidth: "100%" }}
      open={open}
      onClose={() => setOpen(false)}
    >
      <DialogTitle>Assign Designer</DialogTitle>
      <DialogContent>
        <FormControl fullWidth>
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
        <Button onClick={handleSubmit}>Assign</Button>
      </DialogActions>
    </Dialog>
  );
}
