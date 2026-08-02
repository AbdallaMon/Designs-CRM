"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextField,
} from "@mui/material";
import { MdTask } from "react-icons/md";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { getPriorityOrder } from "@/app/helpers/constants";

// Arabic copy. `name` is the singular noun the call site passes ("Modification" / "Task").
const arName = (name) => (name === "Modification" ? "Modification" : "Task");

export function CreateTaskModal({
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
      `tasks`,
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
      <DialogTitle>{`Create ${arName(name)}`}</DialogTitle>
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

export default CreateTaskModal;
