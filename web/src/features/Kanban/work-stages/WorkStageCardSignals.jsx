"use client";
import React from "react";
import { Box, Chip, LinearProgress, Tooltip, Typography, alpha } from "@mui/material";
import { MdOutlineAccessTime, MdOutlineFlag, MdWarningAmber } from "react-icons/md";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { agingSeverity } from "@/features/Kanban/work-stages/cardMeta.js";

dayjs.extend(relativeTime);

// Highlighted "single most urgent thing" line: next delivery/task + due date, or a
// red Overdue flag when the project delivery date has passed.
export function NextActionLine({ cardMeta }) {
  if (!cardMeta) return null;
  const { nextAction, overdue } = cardMeta;
  if (!nextAction && !overdue) return null;
  const isOverdue = overdue || (nextAction?.dueAt && dayjs(nextAction.dueAt).isBefore(dayjs()));
  return (
    <Box
      sx={{
        display: "flex", alignItems: "center", gap: 0.75, px: 1, py: 0.5, mb: 1,
        borderRadius: 1.5,
        bgcolor: (t) => alpha(isOverdue ? t.palette.error.main : t.palette.primary.main, 0.08),
        border: (t) => `1px solid ${alpha(isOverdue ? t.palette.error.main : t.palette.primary.main, 0.25)}`,
      }}
    >
      {isOverdue ? <MdWarningAmber color="#d32f2f" /> : <MdOutlineFlag />}
      <Typography variant="caption" sx={{ fontWeight: 600 }} noWrap>
        {overdue && !nextAction
          ? "Delivery overdue"
          : `${nextAction.kind === "DELIVERY" ? "Delivery" : nextAction.title}${
              nextAction.dueAt ? ` · ${dayjs(nextAction.dueAt).fromNow()}` : ""
            }`}
        {overdue && nextAction ? " · OVERDUE" : ""}
      </Typography>
    </Box>
  );
}

// "In <stage> · Nd" chip, amber/red past the aging thresholds.
export function AgingBadge({ status, cardMeta }) {
  const days = cardMeta?.timeInStageDays;
  if (days == null) return null;
  const severity = agingSeverity(days);
  return (
    <Tooltip title={`In "${status}" for ${days} day${days === 1 ? "" : "s"}`}>
      <Chip
        size="small"
        icon={<MdOutlineAccessTime size={14} />}
        label={`${days}d in stage`}
        color={severity === "default" ? "default" : severity}
        variant={severity === "default" ? "outlined" : "filled"}
        sx={{ height: 22, fontSize: "0.7rem" }}
      />
    </Tooltip>
  );
}

// Slim progress bar derived from the status position in the stage pipeline.
export function StageProgress({ status, statusArray }) {
  const idx = statusArray?.indexOf(status) ?? -1;
  if (idx < 0 || !statusArray || statusArray.length < 2) return null;
  const pct = Math.round((idx / (statusArray.length - 1)) * 100);
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, my: 0.75 }}>
      <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
      <Typography variant="caption" color="text.secondary">{pct}%</Typography>
    </Box>
  );
}
