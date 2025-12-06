"use client";

import { PRIORITY, TASKSTATUS } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useAuth } from "@/app/providers/AuthProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { Box, Chip, Menu, MenuItem, Tooltip } from "@mui/material";
import { useState, useCallback } from "react";
import { MdEdit } from "react-icons/md";

const MENU_TYPES = {
  STATUS: "status",
  PRIORITY: "priority",
};

const PRIORITY_COLORS = {
  VERY_HIGH: "error",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "success",
  VERY_LOW: "default",
};

const STATUS_COLORS = {
  TODO: "default",
  IN_PROGRESS: "primary",
  COMPLETED: "success",
};

export function TaskActions({ name, task, setTasks, setTask }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const { setLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  const { user } = useAuth();
  const handleMenuOpen = useCallback((event, menuType) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu(menuType);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setOpenMenu(null);
  }, []);

  const handleValueChange = useCallback(
    async (value, type) => {
      // Check permissions for priority changes
      if (
        type === MENU_TYPES.PRIORITY &&
        user.role !== "ADMIN" &&
        user.role !== "SUPER_ADMIN" &&
        user.id !== task.createdById
      ) {
        setAlertError(
          `You are not allowed to change this ${name} priority. Only ${name} status can be changed.`
        );
        handleMenuClose();
        return;
      }

      // Make API request
      const request = await handleRequestSubmit(
        { [type]: value },
        setLoading,
        `shared/tasks/${task.id}`,
        false,
        "Updating",
        false,
        "PUT"
      );

      if (request.status === 200) {
        // Update task list if available
        if (setTasks) {
          setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, [type]: value } : t))
          );
        }

        if (setTask) {
          setTask((prev) => ({ ...prev, [type]: value }));
        }

        handleMenuClose();
      }
    },
    [
      task,
      setTasks,
      setTask,
      user,
      name,
      setLoading,
      setAlertError,
      handleMenuClose,
    ]
  );

  const canChangePriority =
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN" ||
    user.id === task.createdById;

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <Tooltip title="Change status">
        <Chip
          label={task.status}
          color={STATUS_COLORS[task.status] || "default"}
          icon={<MdEdit />}
          onClick={(event) => handleMenuOpen(event, MENU_TYPES.STATUS)}
          aria-label={`Change ${name} status, currently ${task.status}`}
          sx={{ cursor: "pointer" }}
        />
      </Tooltip>

      <Menu
        id="status-menu"
        anchorEl={anchorEl}
        open={openMenu === MENU_TYPES.STATUS}
        onClose={handleMenuClose}
        MenuListProps={{
          "aria-labelledby": "status-menu-button",
          dense: true,
        }}
      >
        {TASKSTATUS.map((status) => (
          <MenuItem
            key={status}
            value={status}
            onClick={() => handleValueChange(status, MENU_TYPES.STATUS)}
            selected={status === task.status}
          >
            {status}
          </MenuItem>
        ))}
      </Menu>

      <Tooltip
        title={
          canChangePriority
            ? "Change priority"
            : "You don't have permission to change priority"
        }
      >
        <Chip
          label={task.priority}
          color={PRIORITY_COLORS[task.priority] || "default"}
          icon={<MdEdit />}
          onClick={(event) => handleMenuOpen(event, MENU_TYPES.PRIORITY)}
          aria-label={`Change ${name} priority, currently ${task.priority}`}
          sx={{
            cursor: canChangePriority ? "pointer" : "not-allowed",
            opacity: canChangePriority ? 1 : 0.7,
          }}
        />
      </Tooltip>

      <Menu
        id="priority-menu"
        anchorEl={anchorEl}
        open={openMenu === MENU_TYPES.PRIORITY}
        onClose={handleMenuClose}
        MenuListProps={{
          "aria-labelledby": "priority-menu-button",
          dense: true,
        }}
      >
        {PRIORITY.map((priority) => (
          <MenuItem
            key={priority}
            value={priority}
            onClick={() => handleValueChange(priority, MENU_TYPES.PRIORITY)}
            selected={priority === task.priority}
          >
            {priority}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
