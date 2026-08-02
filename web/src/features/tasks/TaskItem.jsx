"use client";

import React from "react";
import { Box, useTheme } from "@mui/material";
import {
  RecordCard,
  MetaItem,
  CardBlock,
  NameAvatar,
  StatusPill,
} from "@/features/leads/shared/tabKit.jsx";
import { MdAccessTime, MdCalendarToday, MdPerson } from "react-icons/md";
import dayjs from "dayjs";
import { TaskActions } from "@/features/tasks/TaskActions.jsx";
import { NotesComponent } from "@/shared/components/common/Notes.jsx";

// status → { label (ar), color } for the StatusPill in each task card header.
const taskStatusPill = (theme, status) => {
  switch (status) {
    case "DONE":
      return { label: "Done", color: theme.palette.success.main };
    case "IN_PROGRESS":
      return { label: "In Progress", color: theme.palette.info.main };
    case "TODO":
    default:
      return { label: "To Do", color: theme.palette.text.secondary };
  }
};

export const TaskItem = ({ task, setTasks, name }) => {
  const theme = useTheme();
  const pill = taskStatusPill(theme, task.status);
  const accent =
    task.status === "DONE"
      ? theme.palette.success.main
      : task.status === "IN_PROGRESS"
      ? theme.palette.info.main
      : theme.palette.divider;

  const createdByLabel = task.createdBy
    ? task.createdBy.currentProfile?.isAdminTier
      ? "Admin - " + task.createdBy.name
      : task.createdBy.name
    : null;

  return (
    <RecordCard
      sx={{ height: "100%" }}
      accent={accent}
      leading={task.user ? <NameAvatar name={task.user.name} /> : undefined}
      title={task.title}
      subtitle={`Type: ${(task.type || "").replace(/_/g, " ")}`}
      status={<StatusPill label={pill.label} color={pill.color} />}
      meta={
        <>
          <MetaItem
            icon={<MdCalendarToday size={14} />}
            label="Due"
            value={
              task.dueDate ? dayjs(task.dueDate).format("DD/MM/YYYY") : "Not set"
            }
          />
          <MetaItem
            icon={<MdAccessTime size={14} />}
            label="Updated"
            value={
              task.updatedAt
                ? dayjs(task.updatedAt).format("DD/MM/YYYY")
                : "Not available"
            }
          />
          {task.finishedAt && (
            <MetaItem
              icon={<MdAccessTime size={14} />}
              label="Finished"
              value={dayjs(task.finishedAt).format("DD/MM/YYYY")}
              color={theme.palette.success.main}
            />
          )}
          {createdByLabel && (
            <MetaItem
              icon={<MdPerson size={14} />}
              label="Created by"
              value={createdByLabel}
            />
          )}
        </>
      }
      actions={<TaskActions name={name} task={task} setTasks={setTasks} />}
    >
      {task.description && (
        <CardBlock label="Description">
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

export default TaskItem;
