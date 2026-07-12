"use client";
// Supervisor rollup: exceptions first (only breached thresholds), person cards below,
// click a person → drill-down drawer. Domains come server-gated (sales for super-sales;
// sales + designers for admins) — no client-side widening.
import { useCallback, useEffect, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Alert, Box, Button, Card, CardActionArea, Chip, Grid, Skeleton, Stack, Typography } from "@mui/material";
import { getData } from "@/app/helpers/functions/getData.js";
import { SEVERITY_PALETTE } from "@/features/leads/cockpit/config/cockpitActions.jsx";
import { resolveExceptionCopy } from "@/features/my-day/config/myDayCopy.jsx";
import PersonQueueDrawer from "@/features/my-day/PersonQueueDrawer.jsx";

const DOMAIN_LABEL = { sales: "Sales team", designers: "Designers" };

export default function TeamLens() {
  const theme = useTheme();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchOverview = useCallback(async () => {
    setError(false);
    const res = await getData({ url: "my-day/team", setLoading });
    if (res && res.status === 200) setOverview(res.data);
    else setError(true);
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) return <Skeleton variant="rounded" height={280} />;
  if (error) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchOverview}>Retry</Button>}>
        Couldn&apos;t load the team overview.
      </Alert>
    );
  }

  const domains = Object.entries(overview?.domains ?? {});
  return (
    <Stack spacing={3}>
      {domains.map(([key, domain]) => (
        <Box key={key}>
          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
            {DOMAIN_LABEL[key] || key}
          </Typography>

          {domain.exceptions.length === 0 ? (
            <Typography variant="body2" sx={{ color: theme.palette.success.main, mb: 2 }}>
              No exceptions — everything on track.
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ mb: 2 }}>
              {domain.exceptions.map((e, i) => {
                const color = theme.palette[SEVERITY_PALETTE[e.severity] || "info"].main;
                return (
                  <Box
                    key={i}
                    sx={{ p: 1.25, borderRadius: 1.5, borderLeft: `3px solid ${color}`, bgcolor: alpha(color, 0.05) }}
                  >
                    <Typography variant="body2">{resolveExceptionCopy(e.type, e.params)}</Typography>
                  </Box>
                );
              })}
            </Stack>
          )}

          <Grid container spacing={1.5}>
            {domain.people.map((p) => (
              <Grid key={p.userId} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined">
                  <CardActionArea onClick={() => { setSelected(p); setDrawerOpen(true); }} sx={{ p: 1.5 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>{p.name}</Typography>
                    <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: "wrap", rowGap: 0.5 }}>
                      <Chip size="small" variant="outlined" label={`${p.activeCount ?? 0} active`} />
                      {p.staleCount > 0 && <Chip size="small" color="warning" label={`${p.staleCount} stale`} />}
                      {p.overdueCount > 0 && <Chip size="small" color="error" label={`${p.overdueCount} overdue`} />}
                      {p.atRiskCount > 0 && <Chip size="small" color="warning" label={`${p.atRiskCount} at risk`} />}
                      {p.maxCount != null && p.activeCount > p.maxCount && (
                        <Chip size="small" color="error" label="over capacity" />
                      )}
                    </Stack>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
      <PersonQueueDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} person={selected} />
    </Stack>
  );
}
