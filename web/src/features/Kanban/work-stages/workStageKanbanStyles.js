import { Box, Card, Chip } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  groupColors,
  priorityColors,
  statusColors,
  taskStatusColors,
} from "@/app/helpers/constants";

// Custom style props (status/groupId/priority/task/extra/taskstatus) are consumed by the
// style factory and must NOT reach the DOM (React warns on unknown attributes in v7).
const blockStyleProps = (...names) => ({
  shouldForwardProp: (prop) => !names.includes(prop),
});

export const StyledCard = styled(Card, blockStyleProps("status", "groupId"))(({ theme, status, groupId }) => {
  const groupColor = groupColors[groupId] || groupColors[0];

  return {
    margin: theme.spacing(1),
    padding: 1,
    paddingLeft: theme.spacing(0.15),
    borderLeft: `5px solid ${statusColors[status] || theme.palette.primary.main}`,
    borderTop: `3px solid ${groupColor.border}`,
    backgroundColor: groupColor.bg,
    transition: "all 0.3s",
    cursor: "grab",
    position: "relative",
    overflow: "unset",
    paddingTop: "15px",
    "& .MuiCardContent-root": {
      paddingLeft: "10px",
      paddingRight: "4px",
      overflow: "hidden",
    },
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: theme.shadows[4],
    },
    "&:active": {
      cursor: "grabbing",
    },
  };
});

export const PriorityBadge = styled(Chip, blockStyleProps("priority", "task", "extra"))(
  ({ theme, priority, task = false, extra }) => ({
    position: "absolute",
    top: 8,
    right: task ? 32 : 8,
    zIndex: 2,
    fontSize: "0.7rem",
    height: "22px",
    ...(extra && extra),
    backgroundColor: priorityColors[priority]?.bg || priorityColors.MEDIUM.bg,
    color: priorityColors[priority]?.color || priorityColors.MEDIUM.color,
    border: `1px solid ${
      priorityColors[priority]?.border || priorityColors.MEDIUM.border
    }`,
    fontWeight: 600,
    "& .MuiChip-label": {
      padding: "0 6px",
    },
  })
);

export const GroupTitleChip = styled(Chip, blockStyleProps("groupId", "extra"))(({ theme, groupId, extra }) => {
  const groupColor = groupColors[groupId] || groupColors[0];

  return {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 2,
    fontSize: "0.65rem",
    height: "20px",
    backgroundColor: groupColor.border,
    color: "white",
    fontWeight: 600,
    ...(extra && extra),
    "& .MuiChip-label": {
      padding: "0 4px",
    },
  };
});

export const TaskCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: "#fafafa",
  border: "1px solid #e0e0e0",
  borderRadius: theme.spacing(1),
  transition: "all 0.2s",
  position: "relative",

  "&:hover": {
    backgroundColor: "#f5f5f5",
    borderColor: "#d0d0d0",
  },
}));

export const TaskStatusChip = styled(Chip, blockStyleProps("taskstatus"))(({ theme, taskstatus }) => ({
  fontSize: "0.65rem",
  height: "18px",
  backgroundColor: taskStatusColors[taskstatus]?.bg || taskStatusColors.TODO.bg,
  color: taskStatusColors[taskstatus]?.color || taskStatusColors.TODO.color,
  border: `1px solid ${
    taskStatusColors[taskstatus]?.border || taskStatusColors.TODO.border
  }`,
  "& .MuiChip-label": {
    padding: "0 4px",
  },
}));

export const TasksContainer = styled(Box)(({ theme }) => ({
  maxHeight: "200px",
  overflowY: "auto",
  padding: theme.spacing(1),
  backgroundColor: "#f9f9f9",
  borderRadius: theme.spacing(1),
  border: "1px solid #e0e0e0",
}));
