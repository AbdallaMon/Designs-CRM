"use client";
import { MY_DAY_SIGNAL_TYPES, MY_DAY_URGENCY } from "@dms/shared";
// The personal queue list. Fetches /my-day (or /my-day/users/:id when userId is passed —
// the supervisor drill-down reuses this component read-only inside the drawer).
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { alpha, useTheme } from "@mui/material/styles";
import { Alert, Box, Button, Chip, Skeleton, Stack, Typography } from "@mui/material";
import { getData } from "@/app/helpers/functions/getData.js";
import { GOTO_SECTION, SEVERITY_PALETTE } from "@/features/leads/cockpit/config/cockpitActions.jsx";
import { getMyDaySignalConfig } from "@/features/my-day/config/myDayCopy.jsx";
import AgendaRail from "@/features/my-day/AgendaRail.jsx";

function itemHref(item) {
  if (item.kind === MY_DAY_SIGNAL_TYPES.WORK_STAGE) return `/dashboard/work-stages/${item.leadId}`;
  const tabKey = item.signals?.[0]?.cta?.tabKey;
  const section = tabKey ? GOTO_SECTION[tabKey] || tabKey : null;
  return section ? `/dashboard/deals/${item.leadId}?tab=${section}` : `/dashboard/deals/${item.leadId}`;
}

export default function MyWorkQueue({ userId }) {
  const theme = useTheme();
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const url = userId ? `my-day/users/${userId}` : "my-day";

  const fetchQueue = useCallback(async () => {
    setError(false);
    const res = await getData({ url, setLoading });
    if (res && res.status === 200) setQueue(res.data);
    else setError(true);
  }, [url]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  if (loading) {
    return (
      <Stack spacing={1.5}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={72} />
        ))}
      </Stack>
    );
  }
  if (error) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchQueue}>Retry</Button>}>
        Couldn&apos;t load the queue.
      </Alert>
    );
  }
  // Agenda renders only on the caller's own surface (the supervisor drill-down passes
  // userId and stays exception-focused).
  const agendaRail = !userId ? <AgendaRail agenda={queue?.agenda} onRefresh={fetchQueue} /> : null;

  if (!queue?.items?.length) {
    return (
      <>
        {agendaRail}
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.palette.success.main }}>
            All clear — nothing needs you right now.
          </Typography>
        </Box>
      </>
    );
  }

  // "On track" = items whose every signal is informational (routine work); anything
  // carrying a critical/warning signal is urgent and stays on top.
  const isOnTrack = (item) => item.signals.every((s) => s.severity === "info");
  const urgent = queue.items.filter((i) => !isOnTrack(i));
  const onTrack = queue.items.filter(isOnTrack);
  const countBy = (sev) =>
    queue.items.filter((i) => i.signals.some((s) => s.severity === sev)).length;

  const renderItem = (item) => {
    const top = item.signals[0];
    const cfg = getMyDaySignalConfig(top.type);
    const paletteKey = SEVERITY_PALETTE[top.severity] || "info";
    const color = theme.palette[paletteKey].main;
    return (
      <Box
        key={`${item.kind}-${item.kind === MY_DAY_SIGNAL_TYPES.WORK_STAGE ? item.projectId : item.leadId}`}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          borderRadius: 2,
          borderLeft: `3px solid ${color}`,
          bgcolor: alpha(color, 0.04),
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: "wrap" }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {item.clientName || `Lead #${item.leadId}`}
            </Typography>
            {item.status && <Chip size="small" label={item.status} variant="outlined" />}
            {item.level && <Chip size="small" label={item.level} variant="outlined" />}
            {item.health && (
              <Chip
                size="small"
                variant="outlined"
                label={
                  item.health.contractLevel
                    ? `Contract ${item.health.contractLevel} (${item.health.levelsDone}/${item.health.levelsTotal})`
                    : `Stage ${Math.max(item.health.stageIndex + 1, 0)}/${item.health.stageCount}`
                }
              />
            )}
            {item.health?.paymentFlag === MY_DAY_URGENCY.OVERDUE && (
              <Chip size="small" color="error" variant="outlined" label="Payment overdue" />
            )}
            {item.health?.paymentFlag === MY_DAY_URGENCY.DUE && (
              <Chip size="small" color="warning" variant="outlined" label="Payment due" />
            )}
          </Stack>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
            {item.signals.map((s, i) => {
              const sCfg = getMyDaySignalConfig(s.type);
              if (!sCfg) return null;
              return (
                <Chip
                  key={i}
                  size="small"
                  color={SEVERITY_PALETTE[s.severity] || "default"}
                  variant={i === 0 ? "filled" : "outlined"}
                  label={`${sCfg.title(s.params)} — ${sCfg.description(s.params)}`}
                  sx={{ maxWidth: "100%" }}
                />
              );
            })}
          </Stack>
        </Box>
        <Button component={Link} href={itemHref(item)} size="small" variant="outlined" sx={{ flexShrink: 0 }}>
          {cfg?.ctaLabel || "Open"}
        </Button>
      </Box>
    );
  };

  return (
    <Stack spacing={1.5}>
      {agendaRail}
      <Typography variant="caption" color="text.secondary">
        {countBy("critical")} critical · {countBy("warning")} warning · {countBy("info")} info
      </Typography>
      {queue.truncated && (
        <Alert severity="info">Showing the {queue.items.length} most at-risk items.</Alert>
      )}
      {urgent.map(renderItem)}
      {urgent.length === 0 && onTrack.length > 0 && (
        <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
          Nothing urgent — all your work is on track.
        </Typography>
      )}
      {onTrack.length > 0 && (
        <>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ pt: 1, borderTop: `1px dashed ${theme.palette.divider}` }}
          >
            On track — your active work ({onTrack.length})
          </Typography>
          {onTrack.map(renderItem)}
        </>
      )}
    </Stack>
  );
}
