// Frontend: src/components/ClientProjects/ProjectDetails.tsx

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
} from "@mui/material";

import {
  MdAdd,
  MdCancel,
  MdEdit,
  MdSave,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import { PROJECT_STATUSES } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { TasksList } from "./TasksList";
import { getData } from "@/app/helpers/functions/getData";
import dayjs from "dayjs";

export const ProjectDetails = ({ project, onUpdate }) => {
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

  const formatDate = (dateString) => {
    return dateString.split("T")[0]; // Format YYYY-MM-DD
  };

  const renderEditForm = () => (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        {/* Status Field */}
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
      {/* Status */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="subtitle2" color="textSecondary">
          Status
        </Typography>
        <Typography variant="body1">{project.status}</Typography>
      </Grid>

      {/* Priority */}
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
          }
        />
        <CardContent>
          {isEditing ? renderEditForm() : renderProjectInfo()}
        </CardContent>
      </Card>

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
