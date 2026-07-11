"use client";
// DealHealthBar — the compact deal-health summary at the top of the cockpit strip.
//
// Renders, from the cockpit `health` payload:
//   • the sales-stage progression (current → next stage, index/count as a progress bar),
//   • the lead `status` chip (reusing the shared status labels + colors), and
//   • the `paymentStatus` chip, plus an "Offer accepted" marker when applicable.
//
// Pure presentation — all data comes from `health` (computed by the backend).
import { Box, Chip, LinearProgress, Stack, Typography, alpha, useTheme } from "@mui/material";
import { MdCheckCircle } from "react-icons/md";
import {
  ClientLeadStatus,
  PaymentStatus,
  statusColors,
} from "@/app/helpers/constants";
import { stageLabel } from "@/features/leads/cockpit/config/cockpitActions.jsx";

export function DealHealthBar({ health }) {
  const theme = useTheme();
  if (!health) return null;

  const { status, paymentStatus, currentStage, nextStage, stageIndex, stageCount } =
    health;

  const notInitiated = typeof stageIndex !== "number" || stageIndex < 0;
  const count = stageCount || 0;
  // stageIndex is 0-based (−1 = NOT_INITIATED); completed steps = stageIndex + 1.
  const completed = notInitiated ? 0 : Math.min(stageIndex + 1, count);
  const percent = count > 0 ? (completed / count) * 100 : 0;

  const statusColor = statusColors[status] || theme.palette.primary.main;

  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: 2.5,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.default, 0.4),
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 1.5, md: 3 }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
      >
        {/* Stage progression */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 0.75 }}
          >
            <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
              {notInitiated ? "Not initiated" : stageLabel(currentStage)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
              {completed}/{count}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={percent}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.text.primary, 0.08),
              "& .MuiLinearProgress-bar": { borderRadius: 4 },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
            {nextStage ? `Next: ${stageLabel(nextStage)}` : "Final stage reached"}
          </Typography>
          {health.contract && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: "block" }}>
              {health.contract.status === "COMPLETED"
                ? "Contract: delivered"
                : `Contract: ${health.contract.currentLevel || "—"} (${health.contract.levelsDone}/${health.contract.levelsTotal})`}
            </Typography>
          )}
        </Box>

        {/* Status / payment chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
          {status && (
            <Chip
              label={ClientLeadStatus[status] || status}
              size="small"
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                color: statusColor,
                bgcolor: alpha(statusColor, 0.14),
                border: `1px solid ${alpha(statusColor, 0.4)}`,
              }}
            />
          )}
          {paymentStatus && (
            <Chip
              label={`Payment: ${PaymentStatus[paymentStatus] || paymentStatus}`}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 600, borderRadius: 2 }}
            />
          )}
          {health.hasAcceptedPriceOffer && (
            <Chip
              icon={<MdCheckCircle style={{ fontSize: 16 }} />}
              label="Offer accepted"
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600, borderRadius: 2 }}
            />
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
