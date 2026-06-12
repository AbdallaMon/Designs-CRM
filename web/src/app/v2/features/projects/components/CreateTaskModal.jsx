"use client";

// Create a task (or modification) — migrated from the legacy CreatTaskModel in
// TasksList.jsx. POST /v2/tasks. The create body is loose on the BE (.passthrough()), so
// we send title/description/dueDate/priority + the optional projectId/clientLeadId/type
// links the caller provides. Gated on PERMISSIONS.TASK.CREATE at the call site.

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { MdTask } from "react-icons/md";
import { useT } from "@/app/v2/lib/i18n";
import { projectsService } from "../projects.service.js";
import { runProjectMutation } from "../projects.mutations.js";

export function CreateTaskModal({
  open,
  onClose,
  onCreated,
  projectId = null,
  clientLeadId = null,
  type = "NORMAL",
  name,
}) {
  const { t } = useT();
  const displayName = name ?? t("projects.createTask.defaultName");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("MEDIUM");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!title) return;
    const data = { title, description, priority };
    if (dueDate) data.dueDate = dueDate;
    if (projectId) data.projectId = projectId;
    if (clientLeadId) data.clientLeadId = clientLeadId;
    if (type) data.type = type;
    const res = await runProjectMutation(() => projectsService.createTask(data), {
      loading: t("projects.createTask.loading.create"),
      setLoading: setSubmitting,
    });
    if (res) {
      onCreated?.(res.data);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("projects.createTask.title").replace("{name}", displayName)}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Box mb={2}>
            <TextField fullWidth required label={t("projects.createTask.titleField")} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Box>
          <Box mb={2}>
            <TextField
              fullWidth
              label={t("projects.createTask.description")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={4}
            />
          </Box>
          <Box mb={2}>
            <TextField
              fullWidth
              label={t("projects.createTask.dueDate")}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
          <Box mb={2}>
            <TextField fullWidth select label={t("projects.createTask.priority")} value={priority} onChange={(e) => setPriority(e.target.value)}>
              <MenuItem value="VERY_LOW">{t("projects.priority.veryLow")}</MenuItem>
              <MenuItem value="LOW">{t("projects.priority.low")}</MenuItem>
              <MenuItem value="MEDIUM">{t("projects.priority.medium")}</MenuItem>
              <MenuItem value="HIGH">{t("projects.priority.high")}</MenuItem>
              <MenuItem value="VERY_HIGH">{t("projects.priority.veryHigh")}</MenuItem>
            </TextField>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t("projects.createTask.cancel")}
        </Button>
        <Button onClick={handleSubmit} startIcon={<MdTask />} disabled={submitting || !title} variant="contained">
          {t("projects.createTask.create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateTaskModal;
