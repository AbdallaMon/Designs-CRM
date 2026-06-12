"use client";

// Inline status / priority chips for a task — migrated from the legacy TaskActions.jsx.
// §5c: PUT /v2/tasks/:taskId with ONLY the single whitelisted field being changed
// (status OR priority) — the BE .strict() rejects extras. Gated on the row's
// capabilities.canEdit × PERMISSIONS.TASK.EDIT (status); priority additionally honors the
// legacy "only admin or creator may change priority" rule, surfaced via the row caps.

import { useState } from "react";
import { Box, Chip, Menu, MenuItem, Tooltip } from "@mui/material";
import { MdEdit } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useT } from "@/app/v2/lib/i18n";
import { TASKSTATUS, PRIORITY, TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from "../config/projectsConstants.js";
import { projectsService, pickTaskFields } from "../projects.service.js";
import { runProjectMutation } from "../projects.mutations.js";

const MENU = { STATUS: "status", PRIORITY: "priority" };

export function TaskActions({ task, onChanged }) {
  const { hasPermission } = usePermission();
  const { t } = useT();
  const [anchorEl, setAnchorEl] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  const canEdit = hasPermission(PERMISSIONS.TASK.EDIT) && task.capabilities?.canEdit;

  const openFor = (e, type) => {
    setAnchorEl(e.currentTarget);
    setOpenMenu(type);
  };
  const close = () => {
    setAnchorEl(null);
    setOpenMenu(null);
  };

  const change = async (value, type) => {
    // §5c whitelist: send only { status } or { priority }.
    const body = pickTaskFields({ [type]: value });
    const res = await runProjectMutation(() => projectsService.updateTask(task.id, body), {
      loading: t("projects.taskActions.loading.update"),
    });
    close();
    if (res) onChanged?.(res.data ?? { ...task, [type]: value });
  };

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <Tooltip title={t("projects.taskActions.changeStatus")}>
        <Chip
          label={task.status}
          color={TASK_STATUS_COLORS[task.status] || "default"}
          icon={<MdEdit />}
          onClick={(e) => canEdit && openFor(e, MENU.STATUS)}
          sx={{ cursor: canEdit ? "pointer" : "not-allowed", opacity: canEdit ? 1 : 0.7 }}
        />
      </Tooltip>
      <Menu anchorEl={anchorEl} open={openMenu === MENU.STATUS} onClose={close}>
        {TASKSTATUS.map((status) => (
          <MenuItem key={status} selected={status === task.status} onClick={() => change(status, MENU.STATUS)}>
            {status}
          </MenuItem>
        ))}
      </Menu>

      <Tooltip title={t("projects.taskActions.changePriority")}>
        <Chip
          label={task.priority}
          color={TASK_PRIORITY_COLORS[task.priority] || "default"}
          icon={<MdEdit />}
          onClick={(e) => canEdit && openFor(e, MENU.PRIORITY)}
          sx={{ cursor: canEdit ? "pointer" : "not-allowed", opacity: canEdit ? 1 : 0.7 }}
        />
      </Tooltip>
      <Menu anchorEl={anchorEl} open={openMenu === MENU.PRIORITY} onClose={close}>
        {PRIORITY.map((p) => (
          <MenuItem key={p} selected={p === task.priority} onClick={() => change(p, MENU.PRIORITY)}>
            {p}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

export default TaskActions;
