"use client";

// Single-task detail page (was the legacy TaskDetails for the @*/tasks/[id] role slots —
// collapsed into ONE permission-gated route). GET /v2/tasks/:id returns the task +
// capabilities.*; the inline status/priority actions gate on those caps × TASK.EDIT, and
// delete on capabilities.canDelete × TASK.DELETE.

import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, CardHeader, CircularProgress, Container, Divider, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { MdDelete } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { projectsService } from "../../projects/projects.service.js";
import { runProjectMutation } from "../../projects/projects.mutations.js";
import { TaskActions } from "../../projects/components/TaskActions.jsx";

export function TaskDetailsPage({ taskId }) {
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.TASK.VIEW);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await projectsService.getTask(taskId);
      setTask(res?.data ?? null);
    } catch {
      setTask(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId && canView) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, canView]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!task) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">هذه المهمة غير متاحة أو لا تملك صلاحية عرضها.</Alert>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button variant="outlined" onClick={() => window.history.back()}>
            رجوع
          </Button>
        </Box>
      </Box>
    );
  }

  const canDelete = hasPermission(PERMISSIONS.TASK.DELETE) && task.capabilities?.canDelete;

  const handleDelete = async () => {
    const res = await runProjectMutation(() => projectsService.deleteTask(task.id), {
      loading: "جاري الحذف...",
    });
    if (res) window.history.back();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardHeader
          title={<Typography variant="h6" fontWeight={600}>{task.title}</Typography>}
          subheader={`النوع: ${task.type}`}
          action={<TaskActions task={task} onChanged={load} />}
        />
        <Divider />
        <CardContent>
          <Stack spacing={1.2}>
            <Typography variant="body2" color="textSecondary">
              الاستحقاق: {task.dueDate ? dayjs(task.dueDate).format("DD/MM/YYYY") : "غير محدد"}
            </Typography>
            {task.user && (
              <Typography variant="body2" color="textSecondary">
                معيّنة إلى: {task.user.name}
              </Typography>
            )}
            {task.finishedAt && (
              <Typography variant="body2" color="success.main">
                أُنجزت: {dayjs(task.finishedAt).format("DD/MM/YYYY")}
              </Typography>
            )}
            {task.description && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  {task.description}
                </Typography>
              </>
            )}
            {canDelete && (
              <Box sx={{ mt: 2, textAlign: "end" }}>
                <Button color="error" startIcon={<MdDelete />} onClick={handleDelete}>
                  حذف المهمة
                </Button>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

export default TaskDetailsPage;
