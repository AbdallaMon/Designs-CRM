"use client";

import { Box, ButtonBase, Chip, Typography, alpha } from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  MdAccessTime,
  MdHistory,
  MdOutlinePhoneForwarded,
  MdWarningAmber,
  MdWorkOutline,
} from "react-icons/md";

dayjs.extend(relativeTime);

export function formatAed(value) {
  const amount = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? `AED ${amount.toLocaleString()}` : "Value not set";
}

export function DealNextActionLine({ action, onOpenCalls }) {
  const missing = action?.kind === "MISSING";
  const overdue = Boolean(action?.overdue);
  const tone = overdue ? "error" : missing ? "warning" : "primary";
  const label = overdue
    ? `Call overdue · ${dayjs(action.dueAt).fromNow()}`
    : missing
      ? "Next: Schedule follow-up"
      : `Next: Call client · ${dayjs(action?.dueAt).fromNow()}`;

  return (
    <ButtonBase
      aria-label={missing ? "Schedule follow-up" : "Open call history"}
      onClick={onOpenCalls}
      sx={{
        width: "100%",
        justifyContent: "flex-start",
        textAlign: "left",
        gap: 0.75,
        px: 1,
        py: 0.75,
        mb: 1,
        borderRadius: "9px",
        color: `${tone}.dark`,
        bgcolor: (theme) => alpha(theme.palette[tone].main, 0.09),
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette[tone].main, 0.28),
      }}
    >
      {overdue ? <MdWarningAmber /> : <MdOutlinePhoneForwarded />}
      <Typography variant="caption" noWrap sx={{ minWidth: 0, fontWeight: 700 }}>
        {label}
      </Typography>
    </ButtonBase>
  );
}

export function LatestActivityLine({ activity, ageDays }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        minWidth: 0,
        mb: 1,
        color: "text.secondary",
      }}
    >
      <MdHistory style={{ flexShrink: 0 }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" component="div" noWrap sx={{ fontWeight: 600 }}>
          {activity?.label ?? "No activity yet"}
        </Typography>
        {activity?.at && (
          <Typography variant="caption" component="div" color="text.disabled">
            {dayjs(activity.at).fromNow()}
          </Typography>
        )}
      </Box>
      {ageDays != null && (
        <Chip
          size="small"
          icon={<MdAccessTime size={13} />}
          label={`${ageDays}d open`}
          variant="outlined"
          sx={{ height: 22, flexShrink: 0, fontSize: "0.68rem" }}
        />
      )}
    </Box>
  );
}

export function ContractWorkSummary({ stage }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        px: 1,
        py: 0.75,
        mb: 1,
        borderRadius: "9px",
        bgcolor: "action.hover",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <MdWorkOutline style={{ flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" component="div" color="text.secondary">
          Current work
        </Typography>
        <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
          {stage || "No active contract stage"}
        </Typography>
      </Box>
    </Box>
  );
}

