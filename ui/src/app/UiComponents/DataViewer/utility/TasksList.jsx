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
  Grid,
  Paper,
  IconButton,
} from "@mui/material";

import {
  MdAccessTime,
  MdEdit,
  MdExpandLess,
  MdExpandMore,
  MdTask,
  MdCalendarToday,
  MdDescription,
  MdInfo,
  MdPerson,
  MdPriorityHigh,
} from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { TaskActions } from "./TaskActions";
import { NotesComponent } from "./Notes";
import { getPriorityOrder } from "@/app/helpers/constants";

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
        const tasks = tasksData.data;

        const sortedTasks = tasks.sort((a, b) => {
          const isADone = a.status === "DONE";
          const isBDone = b.status === "DONE";

          if (isADone && !isBDone) return 1;
          if (!isADone && isBDone) return -1;

          if (isADone && isBDone) {
            return new Date(b.updatedAt) - new Date(a.updatedAt);
          }

          // 3. Both TODO or IN_PROGRESS → sort by updatedAt descending
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        setTasks(sortedTasks);
      }
    };

    loadTasks();
  }, [clientLeadId, projectId, userId, type]);

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
        sx={{ mb: 3 }}
        onClick={() => {
          setTaskOpen(true);
        }}
      >
        Create {name}
      </Button>

      <Grid container spacing={2}>
        {tasks.map((task) => (
          <Grid key={task.id} size={{ xs: 12, md: 6, lg: 4 }}>
            <TaskItem name={name} task={task} setTasks={setTasks} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const TaskItem = ({ task, setTasks, name }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 3,
        },
      }}
    >
      <CardHeader
        title={
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            position="relative"
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, fontSize: "1.1rem" }}
            >
              {task.title}
            </Typography>
          </Box>
        }
        subheader={
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="textSecondary" display="block">
              Type: {task.type}
            </Typography>
          </Box>
        }
        action={<TaskActions name={name} task={task} setTasks={setTasks} />}
        sx={{ pb: 1 }}
      />

      <CardContent sx={{ flexGrow: 1, pt: 0 }}>
        <Grid container spacing={2}>
          <Grid size={12}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <MdCalendarToday
                sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }}
              />
              <Typography variant="body2" color="textSecondary">
                <strong>Due:</strong>{" "}
                {task.dueDate
                  ? dayjs(task.dueDate).format("DD/MM/YYYY")
                  : "Not set"}
              </Typography>
            </Box>
          </Grid>

          <Grid size={12}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <MdPerson
                sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }}
              />
              <Typography variant="body2" color="textSecondary">
                <strong>Created by:</strong>{" "}
                {task.createdBy
                  ? task.createdBy.role === "ADMIN" ||
                    task.createdBy.role === "SUPER_ADMIN"
                    ? "Admin - " + task.createdBy.name
                    : task.createdBy.name
                  : "Not set"}
              </Typography>
            </Box>
          </Grid>

          <Grid size={12}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <MdAccessTime
                sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }}
              />
              <Typography variant="body2" color="textSecondary">
                <strong>Updated:</strong>{" "}
                {task.updatedAt
                  ? dayjs(task.updatedAt).format("DD/MM/YYYY")
                  : "Not available"}
              </Typography>
            </Box>
          </Grid>

          {task.finishedAt && (
            <Grid size={12}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <MdAccessTime
                  sx={{ mr: 1, fontSize: "1rem", color: "success.main" }}
                />
                <Typography variant="body2" color="success.main">
                  <strong>Finished:</strong>{" "}
                  {dayjs(task.finishedAt).format("DD/MM/YYYY")}
                </Typography>
              </Box>
            </Grid>
          )}

          {task.user && (
            <Grid size={12}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <MdPerson
                  sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }}
                />
                <Typography variant="body2" color="textSecondary">
                  <strong>Assigned to:</strong> {task.user.name}
                </Typography>
              </Box>
            </Grid>
          )}

          {task.description && (
            <Grid size={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
                <MdDescription
                  sx={{
                    mr: 1,
                    fontSize: "1rem",
                    color: "text.secondary",
                    mt: 0.2,
                  }}
                />
                <Typography variant="body2" color="textSecondary">
                  <strong>Description:</strong>{" "}
                  {task.description.length > 100
                    ? `${task.description.substring(0, 100)}...`
                    : task.description}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        <Box sx={{ mt: 2 }}>
          <NotesComponent
            showAddNotes={true}
            idKey={"taskId"}
            id={task.id}
            slug="shared"
          />
        </Box>
      </CardContent>
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
    if (!title) {
      setAlertError("Title is required");
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
      // Insert new task in the correct position based on priority
      setTasks((prev) => {
        const newTasks = [...prev, request.data];
        return newTasks.sort(
          (a, b) => getPriorityOrder(b.priority) - getPriorityOrder(a.priority)
        );
      });
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
