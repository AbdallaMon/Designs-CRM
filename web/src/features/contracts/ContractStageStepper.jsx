"use client";
import { WORK_STAGE_STATUSES } from "@dms/shared";

// Horizontal pipeline of a contract's stages. Replaces the old ContractStage grid card:
// the stages are an `order`ed pipeline, so a stepper is the honest, compact shape for them.
// Each node uses that level's own icon (from the `contractLevel` constants map), coloured by
// stageStatus. Every node shows its level name + status underneath (the in-progress node is
// visually dominant); the raw `LEVEL_N` key is never shown.
// Crash-safe: `stage.title` is a free-text String column, so an off-convention title falls back
// to a neutral node instead of throwing (the old ChipWithIcon lookup was unguarded).

import { Box, Stack, Tooltip, Typography, alpha, useTheme } from "@mui/material";
import { FaCheck, FaRegCircle } from "react-icons/fa";
import { contractLevel } from "@/app/helpers/constants";

// Palette family per status. Deliberately NOT contractLevelStatus, which maps
// NOT_STARTED → error (red): a not-yet-started stage is not an error.
function nodeColors(theme, stageStatus) {
  switch (stageStatus) {
    case WORK_STAGE_STATUSES.COMPLETED:
      return { main: theme.palette.success.main, filled: true };
    case WORK_STAGE_STATUSES.IN_PROGRESS:
      return { main: theme.palette.primary.main, filled: false, active: true };
    default:
      return { main: theme.palette.text.disabled, filled: false };
  }
}

function StageNode({ stage, isLast }) {
  const theme = useTheme();
  const conf = contractLevel[stage?.title]; // may be undefined for off-convention titles
  const { main, filled, active } = nodeColors(theme, stage?.stageStatus);
  const LevelIcon = conf?.icon;

  const label = conf?.name || stage?.title || "Stage";
  const isCompleted = stage?.stageStatus === WORK_STAGE_STATUSES.COMPLETED;
  const statusLabel = isCompleted
    ? "Completed"
    : stage?.stageStatus === WORK_STAGE_STATUSES.IN_PROGRESS
    ? "In progress"
    : "Not started";
  // Name color: in-progress dominant (primary), completed success-green, not-started a
  // readable grey (NOT text.disabled — the name must stay legible on every node).
  const nameColor = active || isCompleted ? main : theme.palette.text.secondary;

  return (
    <Stack direction="row" alignItems="center" sx={{ flex: isLast ? "0 0 auto" : 1, minWidth: 0 }}>
      <Tooltip title={`${label} · ${statusLabel}`} placement="top" arrow>
        <Stack alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
          <Box
            sx={{
              width: active ? 38 : 32,
              height: active ? 38 : 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: active ? 16 : 14,
              color: filled ? theme.palette.common.white : main,
              bgcolor: filled ? main : alpha(main, 0.12),
              border: `2px solid ${filled ? main : alpha(main, active ? 0.9 : 0.35)}`,
              boxShadow: active ? `0 0 0 4px ${alpha(main, 0.12)}` : "none",
              transition: "all .2s ease",
            }}
          >
            {stage?.stageStatus === WORK_STAGE_STATUSES.COMPLETED ? (
              <FaCheck />
            ) : LevelIcon ? (
              <LevelIcon />
            ) : (
              <FaRegCircle />
            )}
          </Box>
          <Stack alignItems="center" spacing={0.1} sx={{ maxWidth: 92 }}>
            <Typography
              variant="caption"
              sx={{
                maxWidth: 92,
                color: nameColor,
                fontWeight: active ? 700 : 600,
                lineHeight: 1.2,
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.65rem",
                lineHeight: 1.1,
                color: active ? main : theme.palette.text.disabled,
                fontWeight: active ? 600 : 400,
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              {statusLabel}
            </Typography>
          </Stack>
        </Stack>
      </Tooltip>
      {!isLast && (
        <Box
          sx={{
            flex: 1,
            height: 2,
            mx: 0.75,
            minWidth: 12,
            borderRadius: 1,
            alignSelf: "flex-start",
            mt: active ? "18px" : "15px", // centre the connector on the node circle
            bgcolor:
              stage?.stageStatus === WORK_STAGE_STATUSES.COMPLETED
                ? theme.palette.success.main
                : alpha(theme.palette.text.disabled, 0.35),
          }}
        />
      )}
    </Stack>
  );
}

export default function ContractStageStepper({ stages }) {
  const theme = useTheme();
  if (!stages?.length) {
    return (
      <Typography variant="caption" color="text.secondary">
        No stages
      </Typography>
    );
  }
  // The service returns stages `order`-sorted; sort defensively in case a caller doesn't.
  const ordered = [...stages].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        width: "100%",
        overflowX: "auto",
        py: 0.5,
        "&::-webkit-scrollbar": { height: 4 },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: alpha(theme.palette.primary.main, 0.3),
          borderRadius: 3,
        },
      }}
    >
      {ordered.map((stage, i) => (
        <StageNode key={stage?.id ?? i} stage={stage} isLast={i === ordered.length - 1} />
      ))}
    </Box>
  );
}
