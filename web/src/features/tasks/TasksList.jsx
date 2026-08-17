"use client";
import { TASK_STATUSES } from "@dms/shared";
// Shared tasks/modifications dashboard. Reused by:
//   • leads/config/leadSections.jsx (Modifications tab)
//   • work-stages/PreviewWorkStage.jsx (Tasks + Modifications tabs)
//   • work-stages/utility/ProjectTasksDialog.jsx (fullscreen)
//   • re-exported from tasks/index.js
// Presentation is built from the shared lead tabKit so it reads as the same system.

import React, { useState, useEffect, useCallback } from "react";
import { TabLoading } from "@/features/leads/shared/TabLoading.jsx";
import { EmptyState } from "@/features/leads/shared/EmptyState.jsx";
import { TabSection } from "@/features/leads/shared/tabKit.jsx";
import { Button, Grid } from "@mui/material";

import { MdTask } from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";
import { TaskItem } from "@/features/tasks/TaskItem.jsx";
import { CreateTaskModal } from "@/features/tasks/CreateTaskModal.jsx";

// Arabic copy. `name` is the singular noun the call site passes ("Modification" / "Task").
const arName = (name) => (name === "Modification" ? "Modification" : "Task");
const arNamePlural = (name) =>
  name === "Modification" ? "Modifications" : "Tasks";

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
      url: `tasks?projectId=${projectId}&type=${type}&userId=${userId}&clientLeadId=${clientLeadId}&`,
      setLoading,
    });

    if (tasksData && tasksData.status === 200) {
      const data = tasksData.data;

      const sortedTasks = data.sort((a, b) => {
        const isADone = a.status === TASK_STATUSES.DONE;
        const isBDone = b.status === TASK_STATUSES.DONE;

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
      {`Create ${arName(name)}`}
    </Button>
  );

  if (loading) {
    return <TabLoading />;
  }

  const modal = (
    <CreateTaskModal
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
          title="Failed to load data"
          description="An error occurred while loading the list. Please try again."
          action={
            <Button
              variant="outlined"
              onClick={loadTasks}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Retry
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
          title={`No ${arNamePlural(name)} yet`}
          description={`Start by adding a ${arName(name)} to see it here.`}
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
