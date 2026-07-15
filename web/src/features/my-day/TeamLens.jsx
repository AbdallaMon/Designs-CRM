"use client";
// Supervisor rollup: exceptions first (only breached thresholds), person cards below.
// Every exception and every person card is now ACTIONABLE — clicking drills down to the
// exact leads/calls behind the count:
//   • rep-scoped exceptions (overdue calls / stale / over-capacity) → the rep's drawer,
//     focused on the matching issue;
//   • contract-signing-stalled / delivery → a direct link to that lead / work stage;
//   • unclaimed-aging (no owner) → the Unclaimed leads drawer.
// Domains come server-gated (sales for super-sales; sales + designers for admins).
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { alpha, useTheme } from "@mui/material/styles";
import { Alert, Box, Button, Card, CardActionArea, Chip, Grid, Skeleton, Stack, Typography } from "@mui/material";
import { FiChevronRight } from "react-icons/fi";
import { getData } from "@/app/helpers/functions/getData.js";
import { SEVERITY_PALETTE } from "@/features/leads/cockpit/config/cockpitActions.jsx";
import { resolveExceptionCopy } from "@/features/my-day/config/myDayCopy.jsx";
import PersonQueueDrawer from "@/features/my-day/PersonQueueDrawer.jsx";
import UnclaimedLeadsDrawer from "@/features/my-day/UnclaimedLeadsDrawer.jsx";

const DOMAIN_LABEL = { sales: "Sales team", designers: "Designers" };

// Where does clicking an exception go? Returns a descriptor the click handler routes on.
// Uses identifiers already present in the exception params (userId / leadId).
function exceptionAction(e) {
  const p = e.params ?? {};
  switch (e.type) {
    case "CALL_OVERDUE_TEAM":
      return p.userId != null ? { kind: "drawer", target: { userId: p.userId, name: p.userName, focus: "overdue" } } : null;
    case "LEAD_STALE_TEAM":
      return p.userId != null ? { kind: "drawer", target: { userId: p.userId, name: p.userName, focus: "stale" } } : null;
    case "REP_OVER_CAPACITY":
      return p.userId != null ? { kind: "drawer", target: { userId: p.userId, name: p.userName } } : null;
    case "CONTRACT_SIGNING_STALLED":
      return p.leadId != null ? { kind: "link", href: `/dashboard/deals/${p.leadId}` } : null;
    case "DELIVERY_OVERDUE_TEAM":
    case "DELIVERY_DUE_SOON_TEAM":
      return p.leadId != null ? { kind: "link", href: `/dashboard/work-stages/${p.leadId}` } : null;
    case "LEAD_UNCLAIMED_AGING":
      return { kind: "unclaimed" };
    default:
      return null;
  }
}

export default function TeamLens() {
  const theme = useTheme();
  const router = useRouter();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [target, setTarget] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unclaimedOpen, setUnclaimedOpen] = useState(false);

  const fetchOverview = useCallback(async () => {
    setError(false);
    const res = await getData({ url: "my-day/team", setLoading });
    if (res && res.status === 200) setOverview(res.data);
    else setError(true);
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const openPerson = (personTarget) => {
    setTarget(personTarget);
    setDrawerOpen(true);
  };

  const handleException = (e) => {
    const action = exceptionAction(e);
    if (!action) return;
    if (action.kind === "drawer") openPerson(action.target);
    else if (action.kind === "unclaimed") setUnclaimedOpen(true);
    else if (action.kind === "link") router.push(action.href);
  };

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
                const actionable = exceptionAction(e) != null;
                return (
                  <Box
                    key={i}
                    role={actionable ? "button" : undefined}
                    tabIndex={actionable ? 0 : undefined}
                    onClick={actionable ? () => handleException(e) : undefined}
                    onKeyDown={
                      actionable
                        ? (ev) => {
                            if (ev.key === "Enter" || ev.key === " ") {
                              ev.preventDefault();
                              handleException(e);
                            }
                          }
                        : undefined
                    }
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1.25,
                      borderRadius: 1.5,
                      borderLeft: `3px solid ${color}`,
                      bgcolor: alpha(color, 0.05),
                      cursor: actionable ? "pointer" : "default",
                      transition: "background-color .15s ease",
                      "&:hover": actionable ? { bgcolor: alpha(color, 0.12) } : undefined,
                    }}
                  >
                    <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                      {resolveExceptionCopy(e.type, e.params)}
                    </Typography>
                    {actionable && (
                      <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0, color }}>
                        <Typography variant="caption" fontWeight={700}>
                          View
                        </Typography>
                        <FiChevronRight size={16} />
                      </Stack>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}

          <Grid container spacing={1.5}>
            {domain.people.map((p) => (
              <Grid key={p.userId} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined">
                  <CardActionArea onClick={() => openPerson({ userId: p.userId, name: p.name })} sx={{ p: 1.5 }}>
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
      <PersonQueueDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} target={target} />
      <UnclaimedLeadsDrawer open={unclaimedOpen} onClose={() => setUnclaimedOpen(false)} />
    </Stack>
  );
}
