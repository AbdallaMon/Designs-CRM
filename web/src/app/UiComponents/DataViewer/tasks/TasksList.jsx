"use client";
// Shared tasks/modifications dashboard. Reused by:
//   • leads/config/leadSections.jsx (Modifications tab)
//   • work-stages/PreviewWorkStage.jsx (Tasks + Modifications tabs)
//   • work-stages/utility/ProjectTasksDialog.jsx (fullscreen)
//   • re-exported from tasks/index.js
// Presentation is built from the shared lead tabKit so it reads as the same system.

import React, { useState, useEffect, useCallback } from "react";
import { TabLoading } from "../leads/shared/TabLoading";
import { EmptyState } from "../leads/shared/EmptyState";
import {
  TabSection,
  RecordCard,
  MetaItem,
  CardBlock,
  NameAvatar,
  StatusPill,
} from "../leads/shared/tabKit";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextField,
  Grid,
  useTheme,
} from "@mui/material";

import {
  MdAccessTime,
  MdTask,
  MdCalendarToday,
  MdPerson,
} from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { TaskActions } from "./TaskActions";
import { NotesComponent } from "../utility/Notes";
import { getPriorityOrder } from "@/app/helpers/constants";

// Arabic copy. `name` is the singular noun the call site passes ("Modification" / "Task").
const arName = (name) => (name === "Modification" ? "التعديل" : "المهمة");
const arNamePlural = (name) =>
  name === "Modification" ? "التعديلات" : "المهام";

// status → { label (ar), color } for the StatusPill in each task card header.
const taskStatusPill = (theme, status) => {
  switch (status) {
    case "DONE":
      return { label: "مكتملة", color: theme.palette.success.main };
    case "IN_PROGRESS":
      return { label: "قيد التنفيذ", color: theme.palette.info.main };
    case "TODO":
    default:
      return { label: "قيد الانتظار", color: theme.palette.text.secondary };
  }
};

export const TasksList = ({
  projectId = null,
  type = "NORMAL",
  userId = null,
  clientLeadId = null,
  name = "Task",
}) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const loadTasks = useCallback(async () => {
    setError(false);
    const tasksData = await getData({
      url: `shared/tasks?projectId=${projectId}&type=${type}&userId=${userId}&clientLeadId=${clientLeadId}&`,
      setLoading,
    });

    if (tasksData && tasksData.status === 200) {
      const data = tasksData.data;

      const sortedTasks = data.sort((a, b) => {
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
    } else {
      setError(true);
    }
  }, [clientLeadId, projectId, userId, type]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const createButton = (
    <Button
      variant="contained"
      startIcon={<MdTask />}
      onClick={() => setTaskOpen(true)}
      sx={{ textTransform: "none", fontWeight: 600 }}
    >
      {`إضافة ${arName(name)}`}
    </Button>
  );

  if (loading) {
    return <TabLoading />;
  }

  const modal = (
    <CreatTaskModel
      open={taskOpen}
      projectId={projectId}
      setOpen={setTaskOpen}
      setTasks={setTasks}
      type={type}
      clientLeadId={clientLeadId}
      name={name}
    />
  );

  if (error) {
    return (
      <TabSection icon={<MdTask />} title={arNamePlural(name)}>
        {modal}
        <EmptyState
          icon={<MdTask />}
          title="تعذّر تحميل البيانات"
          description="حدث خطأ أثناء جلب القائمة. يرجى المحاولة مرة أخرى."
          action={
            <Button
              variant="outlined"
              onClick={loadTasks}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              إعادة المحاولة
            </Button>
          }
        />
      </TabSection>
    );
  }

  if (tasks.length === 0) {
    return (
      <TabSection icon={<MdTask />} title={arNamePlural(name)} count={0}>
        {modal}
        <EmptyState
          icon={<MdTask />}
          title={`لا توجد ${arNamePlural(name)} بعد`}
          description={`ابدأ بإضافة ${arName(name)} لتظهر هنا.`}
          action={createButton}
        />
      </TabSection>
    );
  }

  return (
    <TabSection
      icon={<MdTask />}
      title={arNamePlural(name)}
      count={tasks.length}
      action={createButton}
    >
      {modal}
      <Grid container spacing={2}>
        {tasks.map((task) => (
          <Grid key={task.id} size={{ xs: 12, md: 6, lg: 4 }}>
            <TaskItem name={name} task={task} setTasks={setTasks} />
          </Grid>
        ))}
      </Grid>
    </TabSection>
  );
};

const TaskItem = ({ task, setTasks, name }) => {
  const theme = useTheme();
  const pill = taskStatusPill(theme, task.status);
  const accent =
    task.status === "DONE"
      ? theme.palette.success.main
      : task.status === "IN_PROGRESS"
      ? theme.palette.info.main
      : theme.palette.divider;

  const createdByLabel = task.createdBy
    ? task.createdBy.role === "ADMIN" || task.createdBy.role === "SUPER_ADMIN"
      ? "Admin - " + task.createdBy.name
      : task.createdBy.name
    : null;

  return (
    <RecordCard
      sx={{ height: "100%" }}
      accent={accent}
      leading={task.user ? <NameAvatar name={task.user.name} /> : undefined}
      title={task.title}
      subtitle={`النوع: ${(task.type || "").replace(/_/g, " ")}`}
      status={<StatusPill label={pill.label} color={pill.color} />}
      meta={
        <>
          <MetaItem
            icon={<MdCalendarToday size={14} />}
            label="الاستحقاق"
            value={
              task.dueDate ? dayjs(task.dueDate).format("DD/MM/YYYY") : "غير محدد"
            }
          />
          <MetaItem
            icon={<MdAccessTime size={14} />}
            label="آخر تحديث"
            value={
              task.updatedAt
                ? dayjs(task.updatedAt).format("DD/MM/YYYY")
                : "غير متوفر"
            }
          />
          {task.finishedAt && (
            <MetaItem
              icon={<MdAccessTime size={14} />}
              label="اكتملت في"
              value={dayjs(task.finishedAt).format("DD/MM/YYYY")}
              color={theme.palette.success.main}
            />
          )}
          {createdByLabel && (
            <MetaItem
              icon={<MdPerson size={14} />}
              label="بواسطة"
              value={createdByLabel}
            />
          )}
        </>
      }
      actions={<TaskActions name={name} task={task} setTasks={setTasks} />}
    >
      {task.description && (
        <CardBlock label="الوصف">
          {task.description.length > 160
            ? `${task.description.substring(0, 160)}...`
            : task.description}
        </CardBlock>
      )}
      <Box sx={{ mt: task.description ? 1.5 : 0 }}>
        <NotesComponent
          showAddNotes={true}
          idKey={"taskId"}
          id={task.id}
          slug="shared"
        />
      </Box>
    </RecordCard>
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
      <DialogTitle>{`إضافة ${arName(name)}`}</DialogTitle>
      <DialogContent>
        <Box>
          <Box mb={2} py={2}>
            <TextField
              fullWidth
              label="العنوان"
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
              label="الوصف"
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
                label="تاريخ الاستحقاق"
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
              label="الأولوية"
              select
              name="priority"
              required
              id="priority"
              value={priority}
              onChange={handlePriorityChange}
            >
              <MenuItem value="VERY_LOW">منخفضة جدًا</MenuItem>
              <MenuItem value="LOW">منخفضة</MenuItem>
              <MenuItem value="MEDIUM">متوسطة</MenuItem>
              <MenuItem value="HIGH">عالية</MenuItem>
              <MenuItem value="VERY_HIGH">عالية جدًا</MenuItem>
            </TextField>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>إلغاء</Button>
        <Button type="submit" onClick={handleSubmit} startIcon={<MdTask />}>
          إضافة
        </Button>
      </DialogActions>
    </Dialog>
  );
}
