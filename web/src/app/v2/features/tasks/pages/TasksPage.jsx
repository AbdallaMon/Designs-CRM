"use client";

// Tasks list page. Collapses the legacy per-role-slot tasks screens
// (@{admin,super_admin,super_sales,threeD,twoD}/tasks) into ONE permission-gated feature:
// the BE list (GET /v2/tasks) narrows rows by role/self; per-row actions are gated on the
// task's capabilities.* combined with the matching permission code. A create modal posts
// a NORMAL task (PERMISSIONS.TASK.CREATE).

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import Link from "next/link";
import { MdDelete, MdOpenInNew, MdRefresh, MdTask } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useTasksList } from "../hooks/useTasksList.js";
import { TaskActions } from "../../projects/components/TaskActions.jsx";
import { CreateTaskModal } from "../../projects/components/CreateTaskModal.jsx";
import { projectsService } from "../../projects/projects.service.js";
import { runProjectMutation } from "../../projects/projects.mutations.js";

export function TasksPage() {
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.TASK.LIST);
  const canCreate = hasPermission(PERMISSIONS.TASK.CREATE);
  const [createOpen, setCreateOpen] = useState(false);

  const { items, isLoading, refetch } = useTasksList({ autoFetch: canList });

  const handleDelete = async (task) => {
    const res = await runProjectMutation(() => projectsService.deleteTask(task.id), {
      loading: "جاري الحذف...",
    });
    if (res) refetch();
  };

  if (!canList) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Typography color="textSecondary">لا تملك صلاحية الوصول إلى المهام</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">المهام</Typography>
        <Stack direction="row" spacing={1}>
          {canCreate && (
            <Button variant="contained" startIcon={<MdTask />} onClick={() => setCreateOpen(true)}>
              إنشاء مهمة
            </Button>
          )}
          <Tooltip title="تحديث">
            <IconButton onClick={refetch}>
              <MdRefresh />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {isLoading ? (
        <LinearProgress />
      ) : items.length === 0 ? (
        <Typography sx={{ py: 4, textAlign: "center" }} color="text.secondary">
          لا توجد مهام
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {items.map((task) => {
            const canDelete = hasPermission(PERMISSIONS.TASK.DELETE) && task.capabilities?.canDelete;
            return (
              <Grid key={task.id} size={{ xs: 12, md: 6, lg: 4 }}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardHeader
                    title={<Typography variant="subtitle1" fontWeight={600}>{task.title}</Typography>}
                    subheader={`النوع: ${task.type}`}
                    action={
                      <Tooltip title="فتح التفاصيل">
                        <IconButton component={Link} href={`/v2/tasks/${task.id}`} size="small">
                          <MdOpenInNew />
                        </IconButton>
                      </Tooltip>
                    }
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Box sx={{ mb: 1 }}>
                      <TaskActions task={task} onChanged={refetch} />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      الاستحقاق: {task.dueDate ? dayjs(task.dueDate).format("DD/MM/YYYY") : "غير محدد"}
                    </Typography>
                    {task.user && (
                      <Typography variant="body2" color="textSecondary">
                        معيّنة إلى: {task.user.name}
                      </Typography>
                    )}
                    {canDelete && (
                      <Box sx={{ mt: 1, textAlign: "end" }}>
                        <Button size="small" color="error" startIcon={<MdDelete />} onClick={() => handleDelete(task)}>
                          حذف
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} type="NORMAL" name="مهمة" />
    </Container>
  );
}

export default TasksPage;
