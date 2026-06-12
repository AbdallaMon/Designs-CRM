"use client";

// Tasks of a project — migrated from the legacy TasksList rendered via ProjectTasksDialog.
// GET /v2/tasks?projectId=&type= → data: { items }. Each task card carries the inline
// status/priority actions (TaskActions) + a delete button, both capability-gated. Create
// is gated on PERMISSIONS.TASK.CREATE × project.capabilities.canAddTask.

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  LinearProgress,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { MdDelete, MdTask } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useT } from "@/app/v2/lib/i18n";
import { projectsService } from "../projects.service.js";
import { runProjectMutation } from "../projects.mutations.js";
import { TaskActions } from "./TaskActions.jsx";
import { CreateTaskModal } from "./CreateTaskModal.jsx";

export function ProjectTasksPanel({ project, type = "PROJECT", name }) {
  const projectId = project?.id;
  const { hasPermission } = usePermission();
  const { t } = useT();
  const displayName = name ?? t("projects.tasks.defaultName");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const canCreate = hasPermission(PERMISSIONS.TASK.CREATE) && project?.capabilities?.canAddTask;

  const load = async () => {
    setLoading(true);
    try {
      const res = await projectsService.listTasks({ extra: { projectId, type } });
      const items = Array.isArray(res?.data?.items) ? res.data.items : [];
      // legacy sort: DONE last, then by updatedAt desc.
      items.sort((a, b) => {
        const aDone = a.status === "DONE";
        const bDone = b.status === "DONE";
        if (aDone && !bDone) return 1;
        if (!aDone && bDone) return -1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
      setTasks(items);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, type]);

  const handleDelete = async (task) => {
    const res = await runProjectMutation(() => projectsService.deleteTask(task.id), {
      loading: t("projects.tasks.loading.delete"),
    });
    if (res) load();
  };

  return (
    <Card sx={{ mt: 3, borderRadius: 3 }}>
      <CardHeader
        title={<Typography variant="h6" fontWeight={600}>{type === "MODIFICATION" ? t("projects.tasks.modificationsTitle") : t("projects.tasks.projectTasksTitle")}</Typography>}
        action={
          canCreate && (
            <Button variant="contained" startIcon={<MdTask />} onClick={() => setCreateOpen(true)}>
              {t("projects.tasks.create").replace("{name}", displayName)}
            </Button>
          )
        }
      />
      <Divider />
      <CardContent>
        {loading ? (
          <LinearProgress />
        ) : tasks.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="textSecondary">
              {t("projects.tasks.empty")}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {tasks.map((task) => {
              const canDelete = hasPermission(PERMISSIONS.TASK.DELETE) && task.capabilities?.canDelete;
              return (
                <Grid key={task.id} size={{ xs: 12, md: 6, lg: 4 }}>
                  <Card variant="outlined" sx={{ height: "100%" }}>
                    <CardHeader
                      title={<Typography variant="subtitle1" fontWeight={600}>{task.title}</Typography>}
                      subheader={t("projects.tasks.type").replace("{type}", task.type)}
                      action={<TaskActions task={task} onChanged={load} />}
                    />
                    <CardContent sx={{ pt: 0 }}>
                      <Typography variant="body2" color="textSecondary">
                        {t("projects.tasks.due").replace(
                          "{value}",
                          task.dueDate ? dayjs(task.dueDate).format("DD/MM/YYYY") : t("projects.tasks.dueUnset"),
                        )}
                      </Typography>
                      {task.user && (
                        <Typography variant="body2" color="textSecondary">
                          {t("projects.tasks.assignedTo").replace("{name}", task.user.name)}
                        </Typography>
                      )}
                      {task.description && (
                        <>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2" color="textSecondary">
                            {task.description.length > 100
                              ? `${task.description.substring(0, 100)}...`
                              : task.description}
                          </Typography>
                        </>
                      )}
                      {canDelete && (
                        <Box sx={{ mt: 2, textAlign: "end" }}>
                          <Button size="small" color="error" startIcon={<MdDelete />} onClick={() => handleDelete(task)}>
                            {t("projects.tasks.delete")}
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
      </CardContent>
      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
        projectId={projectId}
        type={type === "MODIFICATION" ? "MODIFICATION" : "NORMAL"}
        name={name}
      />
    </Card>
  );
}

export default ProjectTasksPanel;
