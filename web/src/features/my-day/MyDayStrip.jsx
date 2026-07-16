"use client";
// Compact, embeddable "My Day" strip for contextual placement (dashboard landing, deals
// board, work-stages board). The FULL queue lives only at /dashboard/my-day — this strip
// deliberately shows just the pulse (counts + the single top item + today's agenda count)
// and deep-links there, so the queue itself is never fragmented across pages.
// Renders NOTHING when the caller has no personal queue, while loading, on error, or when
// there is nothing actionable — a contextual strip must never nag with empty chrome.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { FiSunrise } from "react-icons/fi";
import { getData } from "@/app/helpers/functions/getData.js";
import { usePermission } from "@/app/hooks/usePermission.js";
import { getMyDaySignalConfig } from "@/features/my-day/config/myDayCopy.jsx";

const MY_DAY_VIEW = "my_day.view";

export default function MyDayStrip() {
  const theme = useTheme();
  const { hasPermission } = usePermission();
  const canView = hasPermission(MY_DAY_VIEW);
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    const res = await getData({ url: "my-day", setLoading });
    if (res && res.status === 200) setQueue(res.data);
  }, []);

  useEffect(() => {
    if (canView) fetchQueue();
  }, [canView, fetchQueue]);

  if (!canView || loading || !queue) return null;

  const items = queue.items ?? [];
  const agendaCount = (queue.agenda ?? []).length;
  if (!items.length && !agendaCount) return null;

  const countBy = (sev) => items.filter((i) => i.signals.some((s) => s.severity === sev)).length;
  const critical = countBy("critical");
  const warning = countBy("warning");
  const top = items[0];
  const topCfg = top ? getMyDaySignalConfig(top.signals[0]?.type) : null;
  const accent = critical > 0 ? theme.palette.error.main : warning > 0 ? theme.palette.warning.main : theme.palette.info.main;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexWrap: "wrap",
        p: 1.5,
        mb: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        borderLeft: `3px solid ${accent}`,
        bgcolor: alpha(accent, 0.04),
      }}
    >
      <Box sx={{ color: accent, display: "flex", fontSize: 20 }}>
        <FiSunrise />
      </Box>
      <Typography variant="body2" fontWeight={700}>
        My Day
      </Typography>
      {critical > 0 && <Chip size="small" color="error" label={`${critical} critical`} />}
      {warning > 0 && <Chip size="small" color="warning" label={`${warning} warning`} />}
      {agendaCount > 0 && (
        <Chip size="small" variant="outlined" label={`${agendaCount} on today's agenda`} />
      )}
      {top && topCfg && (
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0, flex: 1 }} noWrap>
          Start here: {top.clientName || `Lead #${top.leadId}`} — {topCfg.title(top.signals[0]?.params)}
        </Typography>
      )}
      <Button component={Link} href="/dashboard/my-day" size="small" variant="outlined" sx={{ ml: "auto", flexShrink: 0 }}>
        Open My Day
      </Button>
    </Box>
  );
}
