// Frontend: src/components/ClientProjects/TasksList.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  Divider,
  Chip,
  LinearProgress,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextField,
  Menu,
} from "@mui/material";

import {
  MdAccessTime,
  MdEdit,
  MdExpandLess,
  MdExpandMore,
  MdTask,
} from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useAuth } from "@/app/providers/AuthProvider";
import { TaskActions } from "./TaskActions";
import { NotesComponent } from "./Notes";

export const TasksList = ({
  projectId = null,
  type = "NORMAL",
  userId = null,
  clientLeadId = null,
  name = "Task",
}) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskOpen, setTaskOpen] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      const tasksData = await getData({
        url: `shared/tasks?projectId=${projectId}&type=${type}&userId=${userId}&clientLeadId=${clientLeadId}&`,
        setLoading,
      });
      if (tasksData && tasksData.status === 200) {
        setTasks(tasksData.data);
      }
    };
    loadTasks();
  }, [clientLeadId, projectId, userId]);

  if (loading) {
    return <LinearProgress />;
  }

  if (tasks.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="textSecondary">
          No {name}s found .
        </Typography>
        <CreatTaskModel
          open={taskOpen}
          projectId={projectId}
          setOpen={setTaskOpen}
          setTasks={setTasks}
          type={type}
          clientLeadId={clientLeadId}
          name={name}
        />
        <Button
          variant="contained"
          startIcon={<MdTask />}
          sx={{ mt: 2 }}
          onClick={() => {
            setTaskOpen(true);
          }}
        >
          Create First {name}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <CreatTaskModel
        open={taskOpen}
        projectId={projectId}
        setOpen={setTaskOpen}
        setTasks={setTasks}
        type={type}
        clientLeadId={clientLeadId}
        name={name}
      />
      <Button
        variant="contained"
        startIcon={<MdTask />}
        sx={{ mb: 2 }}
        onClick={() => {
          setTaskOpen(true);
        }}
      >
        Create {name}
      </Button>
      {tasks.map((task) => (
        <TaskItem name={name} key={task.id} task={task} setTasks={setTasks} />
      ))}
    </Box>
  );
};

const TaskItem = ({ task, setTasks, name }) => {
  const [expanded, setExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState({ status: false, priority: false });
  const { setLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  const { user } = useAuth();

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        title={
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="subtitle1">{task.title}</Typography>
            <TaskActions name={name} task={task} setTasks={setTasks} />
          </Box>
        }
        subheader={
          <>
            <Typography variant="caption" color="textSecondary">
              Due:{" "}
              {task.dueDate
                ? dayjs(task.dueDate).format("DD/MM/YYYY")
                : "Not set"}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {" "}
              Created By:{" "}
              {task.createdBy
                ? task.createdBy.role === "ADMIN" ||
                  task.createdBy.role === "SUPER_ADMIN"
                  ? "Admin - " + task.createdBy.name
                  : task.createdBy.name
                : "Not set"}
            </Typography>
            {task.finishedAt && (
              <Typography variant="caption" color="textSecondary">
                {" "}
                Finished At: {dayjs(task.finishedAt).format("DD/MM/YYYY")}
              </Typography>
            )}
          </>
        }
        action={
          <Button
            onClick={() => setExpanded(!expanded)}
            startIcon={expanded ? <MdExpandLess /> : <MdExpandMore />}
            size="small"
          >
            {expanded ? "Hide" : "Details"}
          </Button>
        }
        sx={{ py: 1 }}
      />

      <Collapse in={expanded}>
        <Divider />
        <CardContent sx={{ pt: 2 }}>
          {task.description && (
            <Box mb={2}>
              <Typography variant="subtitle2">Description</Typography>
              <Typography variant="body2">{task.description}</Typography>
            </Box>
          )}

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Notes
          </Typography>
          <NotesComponent
            showAddNotes={true}
            idKey={"taskId"}
            id={task.id}
            slug="shared"
          />
        </CardContent>
      </Collapse>
    </Card>
  );
};

function CreatTaskModel({
  open,
  setOpen,
  setTasks,
  projectId,
  type,
  clientLeadId,
  name,
}) {
  const { setLoading } = useToastContext();
  const { setAlertError } = useAlertContext();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [priority, setPriority] = useState("MEDIUM");

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setDueDate(null);
      setPriority("MEDIUM");
    }
  }, [open]);

  // Memoize handlers to prevent recreation on every render
  const handleTitleChange = useCallback((e) => {
    setTitle(e.target.value);
  }, []);

  const handleDescriptionChange = useCallback((e) => {
    setDescription(e.target.value);
  }, []);

  const handlePriorityChange = useCallback((e) => {
    setPriority(e.target.value);
  }, []);

  const handleDueDateChange = useCallback((newValue) => {
    setDueDate(newValue);
  }, []);
  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const handleSubmit = useCallback(async () => {
    if (!dueDate) {
      setAlertError("Due date is required");
      return;
    }
    if (!title || !description) {
      setAlertError("Title and description are required");
      return;
    }
    const data = {
      title,
      dueDate,
      description,
      priority,
    };
    if (projectId) {
      data.projectId = projectId;
    }
    if (clientLeadId) {
      data.clientLeadId = clientLeadId;
    }
    if (type) {
      data.type = type;
    }
    const request = await handleRequestSubmit(
      data,
      setLoading,
      `shared/tasks`,
      false,
      "Creating",
      false,
      "POST"
    );
    if (request.status === 200) {
      setTasks((prev) => [...prev, request.data]);
      setOpen(false);
    }
  }, [
    title,
    description,
    dueDate,
    priority,
    projectId,
    clientLeadId,
    type,
    setLoading,
    setTasks,
    setOpen,
    setAlertError,
  ]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Create {name}</DialogTitle>
      <DialogContent>
        <Box>
          <Box mb={2} py={2}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              required
              id="title"
              value={title}
              onChange={handleTitleChange}
            />
          </Box>
          <Box mb={2}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              required
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              multiline
              rows={4}
            />
          </Box>
          <Box mb={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Due Date"
                name="dueDate"
                renderInput={(params) => <TextField {...params} />}
                value={dueDate}
                onChange={handleDueDateChange}
                format="DD/MM/YYYY"
                required
              />
            </LocalizationProvider>
          </Box>
          <Box mb={2}>
            <TextField
              fullWidth
              label="Priority"
              select
              name="priority"
              required
              id="priority"
              value={priority}
              onChange={handlePriorityChange}
            >
              <MenuItem value="VERY_LOW">Very Low</MenuItem>
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="VERY_HIGH">Very High</MenuItem>
            </TextField>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit" onClick={handleSubmit} startIcon={<MdTask />}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
