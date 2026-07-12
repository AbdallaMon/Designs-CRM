"use client";
// The personal queue list. Fetches /my-day (or /my-day/users/:id when userId is passed —
// the supervisor drill-down reuses this component read-only inside the drawer).
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { alpha, useTheme } from "@mui/material/styles";
import { Alert, Box, Button, Chip, Skeleton, Stack, Typography } from "@mui/material";
import { getData } from "@/app/helpers/functions/getData.js";
import { GOTO_SECTION, SEVERITY_PALETTE } from "@/features/leads/cockpit/config/cockpitActions.jsx";
import { getMyDaySignalConfig } from "@/features/my-day/config/myDayCopy.jsx";

function itemHref(item) {
  if (item.kind === "WORK_STAGE") return `/dashboard/work-stages/${item.leadId}`;
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
  if (!queue?.items?.length) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.palette.success.main }}>
          All clear — nothing needs you right now.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      {queue.truncated && (
        <Alert severity="info">Showing the {queue.items.length} most at-risk items.</Alert>
      )}
      {queue.items.map((item) => {
        const top = item.signals[0];
        const cfg = getMyDaySignalConfig(top.type);
        const paletteKey = SEVERITY_PALETTE[top.severity] || "info";
        const color = theme.palette[paletteKey].main;
        return (
          <Box
            key={`${item.kind}-${item.kind === "WORK_STAGE" ? item.projectId : item.leadId}`}
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
      })}
    </Stack>
  );
}
