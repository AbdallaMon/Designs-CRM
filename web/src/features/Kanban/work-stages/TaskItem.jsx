import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { MdVisibility } from "react-icons/md";
import dayjs from "dayjs";
import {
  PriorityBadge,
  TaskCard,
  TaskStatusChip,
} from "@/features/Kanban/work-stages/workStageKanbanStyles.js";

// Task Item Component
const TaskItem = ({ task, onPreview }) => {
  return (
    <TaskCard>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={1}
      >
        <Typography variant="body2" fontWeight="medium" sx={{ flex: 1, mr: 1 }}>
          {task.title}
        </Typography>

        <Box display="flex" gap={0.5} alignItems="center">
          <PriorityBadge
            priority={task.priority}
            label={task.priority.replace("_", " ")}
            size="small"
            task={true}
          />
          <IconButton size="small" onClick={() => onPreview(task)}>
            <MdVisibility size={14} />
          </IconButton>
        </Box>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <TaskStatusChip
          taskstatus={task.status}
          label={task.status.replace("_", " ")}
          size="small"
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.3,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Updated at:
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {dayjs(task.updatedAt).format("MMM D")}
          </Typography>
        </Box>
      </Box>

      {task.description && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            mt: 0.5,
          }}
        >
          {task.description.length > 50
            ? `${task.description.slice(0, 50)}...`
            : task.description}
        </Typography>
      )}
    </TaskCard>
  );
};

export default TaskItem;
