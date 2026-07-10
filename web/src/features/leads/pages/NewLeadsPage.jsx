"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Container,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import {
  MdOutlineFiberNew,
  MdOutlinePending,
  MdPhoneInTalk,
  MdEventAvailable,
  MdHistoryToggleOff,
  MdOutlineFactCheck,
  MdSearch,
  MdRefresh,
} from "react-icons/md";
import CreateNewLead from "@/features/leads/features/AddNewLead.jsx";
import NextCalls from "@/features/leads/widgets/NextCalls.jsx";
import NextMeetings from "@/features/leads/widgets/NextMeetings.jsx";
import { FixedData } from "@/features/leads/widgets/FixedData.jsx";
import PreviewDialog from "@/features/leads/PreviewLeadDialog.jsx";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import SearchComponent from "@/shared/components/formComponents/SearchComponent";
import PaginationWithLimit from "@/shared/components/PaginationWithLimit.jsx";
import { EmptyState } from "@/features/leads/shared/EmptyState.jsx";
import { LeadSliderCard } from "@/features/leads/core/LeadSliderCard.jsx";
import { useSummary } from "@/features/leads/pages/useSummary.js";

/* ----------------------------------------------------------------------------
 * Tab registry â€” the LEAD POOLS only (new آ· non-consulted آ· stale). Arabic
 * titles, icons, role predicates. Order matters. Calls/meetings/targets are no
 * longer tabs â€” they render as their own stacked sections below the tabs.
 * -------------------------------------------------------------------------- */
const TAB_DEFS = [
  {
    key: "new",
    title: "New leads",
    icon: <MdOutlineFiberNew />,
    countKey: "new",
    show: () => true,
  },
  {
    key: "non-consulted",
    title: "Non-consulted",
    icon: <MdOutlinePending />,
    countKey: "nonConsulted",
    show: (user) =>
      user.role === "ADMIN" ||
      user.role === "CONTACT_INITIATOR" ||
      user.isSuperSales,
  },
  {
    key: "stale",
    title: "Overdue",
    icon: <MdHistoryToggleOff />,
    countKey: "stale",
    warnable: true,
    show: (user) => user.role !== "CONTACT_INITIATOR",
  },
];

/* ----------------------------------------------------------------------------
 * Section registry â€” the stacked, always-visible blocks BELOW the tabs. Each
 * renders in its own Paper. Calls/meetings are hidden for CONTACT_INITIATOR;
 * targets are always visible. `countKey` reads from the single summary payload.
 * -------------------------------------------------------------------------- */
const SECTION_DEFS = [
  {
    key: "calls",
    title: "Today's Calls",
    icon: <MdPhoneInTalk />,
    countKey: "calls",
    show: (user) => user.role !== "CONTACT_INITIATOR",
  },
  {
    key: "meetings",
    title: "Meetings",
    icon: <MdEventAvailable />,
    countKey: "meetings",
    show: (user) => user.role !== "CONTACT_INITIATOR",
  },
  {
    key: "targets",
    title: "Targets & Forms",
    icon: <MdOutlineFactCheck />,
    show: () => true,
  },
];

function defaultTabFor(user) {
  if (user.role === "STAFF" && !user.isSuperSales) return "new";
  // CONTACT_INITIATOR, SUPER_SALES, ADMIN â†’ non-consulted (falls back to new
  // if the role can't see non-consulted, e.g. plain STAFF).
  return "non-consulted";
}

/* ----------------------------------------------------------------------------
 * Main page
 * -------------------------------------------------------------------------- */
export default function NewLeadsPage({ searchParams, staff }) {
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const admin = checkIfAdmin(user);

  // Visible tabs for this role, in defined order.
  const tabs = useMemo(() => TAB_DEFS.filter((t) => t.show(user)), [user]);
  const tabKeys = tabs.map((t) => t.key);

  // Active tab from the URL (?tab=), with a per-role default fallback.
  const urlTab = sp.get("tab");
  let initialDefault = defaultTabFor(user);
  if (!tabKeys.includes(initialDefault)) initialDefault = tabKeys[0];
  const active = tabKeys.includes(urlTab) ? urlTab : initialDefault;

  function goToTab(key) {
    const params = new URLSearchParams(sp.toString());
    params.set("tab", key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // Admin "look up any lead" â†’ opens the standard preview dialog.
  const [lookupId, setLookupId] = useState(null);
  const [lookupOpen, setLookupOpen] = useState(false);

  // Single shared refetch token. Bumping it (a) refetches the summary counts and
  // (b) remounts the active tab panel + the calls/meetings sections via `key=`,
  // forcing their internal fetchers to re-run. The children own their own URLs,
  // so a key-remount is the cleanest way to refetch them without touching them.
  const [rerenderToken, setRerenderToken] = useState(0);
  const refreshAll = useCallback(() => setRerenderToken((t) => t + 1), []);

  // ONE summary call drives every count (KPI rail + tab/section badges). Scope
  // matches NextCalls/NextMeetings: own leads for staff, all leads otherwise.
  const staffId = staff ? user.id : "";
  const { summary, loading: summaryLoading } = useSummary(staffId, rerenderToken);

  // Sections (calls/meetings/targets) visible to this role.
  const sections = useMemo(
    () => SECTION_DEFS.filter((s) => s.show(user)),
    [user]
  );

  // KPI rail â€” one tile per visible LEAD-POOL tab, count read from the summary.
  const kpis = tabs.map((t) => ({
    key: t.key,
    label: t.title,
    icon: t.icon,
    warn: !!t.warnable,
    count: summary[t.countKey] ?? 0,
    loading: summaryLoading,
  }));

  const activeDef = tabs.find((t) => t.key === active);

  return (
    <Container maxWidth="xxl" sx={{ py: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        {/* ===== Zone 1: header ===== */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
            background: (t) =>
              `linear-gradient(135deg, ${t.palette.primary.main}14 0%, ${t.palette.background.paper} 60%)`,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="h4" fontWeight={800} color="text.primary">
                Leads
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New, non-consulted, and overdue leads â€” pick a lead and start a
                deal.
              </Typography>
            </Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flexShrink: 0 }}
            >
              <Tooltip title="Refresh">
                <IconButton
                  onClick={refreshAll}
                  color="primary"
                  aria-label="Refresh"
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <MdRefresh />
                </IconButton>
              </Tooltip>
              <CreateNewLead />
            </Stack>
          </Stack>

          {/* Single search. For admins it looks up ANY lead and opens it in a
              dialog; for everyone else it filters the New-leads pool. */}
          <Box sx={{ mt: 2.5 }}>
            <SearchComponent
              apiEndpoint="search?model=clientLead"
              setFilters={
                admin
                  ? (updater) => {
                      // SearchComponent calls setFilters with an updater fn.
                      const next =
                        typeof updater === "function" ? updater({}) : updater;
                      if (next && next.id) {
                        setLookupId(next.id);
                        setLookupOpen(true);
                      }
                    }
                  : (updater) => {
                      // Filter the New pool: jump to the New tab so the result shows.
                      if (active !== "new" && tabKeys.includes("new")) {
                        goToTab("new");
                      }
                    }
              }
              inputLabel="Search lead by id ,name or phone"
              renderKeys={["id", "client.name", "client.phone", "client.email"]}
              mainKey="id"
              searchKey={"id"}
              withParamsChange={false}
            />
          </Box>
        </Paper>

        {/* ===== Zone 2: KPI rail ===== */}
        {kpis.length > 0 && (
          <Grid container spacing={1.5}>
            {kpis.map((kpi) => {
              const isActive = active === kpi.key;
              const warnOn = kpi.warn && kpi.count > 0;
              const accent = warnOn
                ? theme.palette.warning.main
                : theme.palette.primary.main;
              return (
                <Grid size={{ xs: 6, sm: 4, md: 12 / kpis.length }} key={kpi.key}>
                  <ButtonBase
                    onClick={() => goToTab(kpi.key)}
                    sx={{
                      width: "100%",
                      textAlign: "start",
                      borderRadius: 2.5,
                      p: 1.75,
                      border: `1px solid ${
                        isActive ? alpha(accent, 0.5) : theme.palette.divider
                      }`,
                      bgcolor: isActive
                        ? alpha(accent, 0.08)
                        : "background.paper",
                      transition: "all .2s ease",
                      "&:hover": {
                        borderColor: alpha(accent, 0.5),
                        boxShadow: theme.shadows[2],
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{ width: "100%" }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                          flexShrink: 0,
                          bgcolor: alpha(accent, 0.12),
                          color: accent,
                        }}
                      >
                        {kpi.icon}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                          noWrap
                          display="block"
                        >
                          {kpi.label}
                        </Typography>
                        {kpi.loading ? (
                          <Skeleton width={28} height={26} />
                        ) : (
                          <Typography
                            variant="h6"
                            fontWeight={800}
                            sx={{ color: warnOn ? accent : "text.primary" }}
                          >
                            {kpi.count}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </ButtonBase>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* ===== Zone 3: segmented body ===== */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <Tabs
            value={active}
            onChange={(e, v) => goToTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              px: 1,
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": { textTransform: "none", fontWeight: 700 },
            }}
          >
            {tabs.map((t) => {
              const count = summary[t.countKey] ?? 0;
              const warnOn = t.warnable && count > 0;
              return (
                <Tab
                  key={t.key}
                  value={t.key}
                  icon={t.icon}
                  iconPosition="start"
                  label={
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      component="span"
                    >
                      <span>{t.title}</span>
                      {!summaryLoading && (
                        <Box
                          component="span"
                          sx={{
                            px: 0.75,
                            py: 0.05,
                            borderRadius: 1.25,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            lineHeight: 1.6,
                            color: warnOn ? "warning.main" : "primary.main",
                            bgcolor: (th) =>
                              alpha(
                                warnOn
                                  ? th.palette.warning.main
                                  : th.palette.primary.main,
                                0.12
                              ),
                          }}
                        >
                          {count}
                        </Box>
                      )}
                    </Stack>
                  }
                />
              );
            })}
          </Tabs>

          <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
            {/* Render only the active LEAD-POOL panel â†’ only its fetcher runs.
                The rerenderToken in the key remounts it on manual refresh. */}
            {active === "new" && (
              <NewLeadsPanel
                key={`new-${rerenderToken}`}
                def={activeDef}
                searchParams={searchParams}
              />
            )}
            {active === "non-consulted" && (
              <NonConsultedPanel
                key={`non-consulted-${rerenderToken}`}
                def={activeDef}
              />
            )}
            {active === "stale" && (
              <StalePanel key={`stale-${rerenderToken}`} def={activeDef} />
            )}
          </Box>
        </Paper>

        {/* ===== Zone 4: stacked sections (calls آ· meetings آ· targets) =====
            Always visible (role permitting), each in its own Paper below the
            tabs. Calls/meetings carry their count from the single summary and
            remount on manual refresh via the rerenderToken key. */}
        {sections.map((s) => (
          <Paper
            key={s.key}
            elevation={0}
            sx={{
              p: { xs: 1.5, md: 2.5 },
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            {s.key === "calls" && (
              <SimpleSection def={s} count={summary.calls ?? 0}>
                <NextCalls key={`calls-${rerenderToken}`} staff={staff} />
              </SimpleSection>
            )}
            {s.key === "meetings" && (
              <SimpleSection def={s} count={summary.meetings ?? 0}>
                <NextMeetings key={`meetings-${rerenderToken}`} staff={staff} />
              </SimpleSection>
            )}
            {s.key === "targets" && (
              <SimpleSection def={s}>
                <FixedData />
              </SimpleSection>
            )}
          </Paper>
        ))}
      </Stack>

      {/* Admin: look up any lead â†’ standard preview dialog */}
      {admin && lookupId && (
        <PreviewDialog
          open={lookupOpen}
          onClose={() => setLookupOpen(false)}
          setleads={() => {}}
          id={lookupId}
          admin={admin}
        />
      )}
    </Container>
  );
}

/* ----------------------------------------------------------------------------
 * Section frame â€” the unified tab header (icon آ· Arabic title آ· count) + body.
 * Lighter local copy so this page has no dependency on the detail-tab provider.
 * -------------------------------------------------------------------------- */
function SectionFrame({ def, count, children }) {
  const theme = useTheme();
  const hasCount = typeof count === "number";
  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 21,
            flexShrink: 0,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: theme.palette.primary.main,
          }}
        >
          {def.icon}
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6" fontWeight={700} color="text.primary">
            {def.title}
          </Typography>
          {hasCount && (
            <Box
              sx={{
                px: 1,
                py: 0.1,
                borderRadius: 1.5,
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.12),
              }}
            >
              {count}
            </Box>
          )}
        </Stack>
      </Stack>
      {children}
    </Stack>
  );
}

/** Wrapper for sections that keep their own self-framed widget (calls/meetings/
 *  targets). We just put the unified header above them. */
function SimpleSection({ def, count, children }) {
  return (
    <SectionFrame def={def} count={count}>
      {children}
    </SectionFrame>
  );
}

/* ----------------------------------------------------------------------------
 * Lead-list panel â€” the shared 5-state body for New / Non-consulted / Stale.
 * Owns nothing; the caller passes the fetcher result + render config so each
 * pool keeps its exact existing query.
 * -------------------------------------------------------------------------- */
function LeadListBody({
  def,
  loading,
  error,
  data,
  setData,
  total,
  page,
  setPage,
  limit,
  setLimit,
  totalPages,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onRetry,
}) {
  const isEmpty = !loading && !error && (!data || data.length === 0);

  return (
    <SectionFrame def={def} count={typeof total === "number" ? total : undefined}>
      {error ? (
        <Alert
          severity="error"
          action={
            onRetry ? (
              <Button color="inherit" size="small" onClick={onRetry}>
                Retry
              </Button>
            ) : undefined
          }
        >
          Failed to load data. Please try again.
        </Alert>
      ) : loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6 }} key={i}>
              <Skeleton variant="rounded" height={170} />
            </Grid>
          ))}
        </Grid>
      ) : isEmpty ? (
        <EmptyState
          icon={<MdOutlineFiberNew />}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        <>
          <Grid container spacing={2}>
            {data.map((lead) => (
              <Grid size={{ xs: 12, sm: 6 }} key={lead.id}>
                <LeadSliderCard lead={lead} setData={setData} />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 1 }}>
            <PaginationWithLimit
              total={total}
              limit={limit}
              page={page}
              setLimit={setLimit}
              setPage={setPage}
              totalPages={totalPages}
            />
          </Box>
        </>
      )}
    </SectionFrame>
  );
}

/* ---- New leads pool ---- */
function NewLeadsPanel({ def, searchParams }) {
  const {
    data,
    loading,
    error,
    setData,
    page,
    setPage,
    filters,
    limit,
    setLimit,
    total,
    totalPages,
    setRender,
  } = useDataFetcher("shared/client-leads?isNew=true&", false, {
    clientId: searchParams?.clientId ? searchParams.clientId : null,
  });
  useEffect(() => {
    if (filters) setPage(1);
  }, [filters]);

  return (
    <LeadListBody
      def={def}
      loading={loading}
      error={error}
      data={data}
      setData={setData}
      total={total}
      page={page}
      setPage={setPage}
      limit={limit}
      setLimit={setLimit}
      totalPages={totalPages}
      onRetry={() => setRender((r) => !r)}
      emptyTitle="No new leads right now"
      emptyDescription="New leads will appear here when they arrive. You can add a lead manually."
      emptyAction={<CreateNewLead />}
    />
  );
}

/* ---- Non-consulted pool ---- */
function NonConsultedPanel({ def }) {
  const {
    data,
    loading,
    error,
    setData,
    page,
    setPage,
    filters,
    limit,
    setLimit,
    total,
    totalPages,
    setRender,
  } = useDataFetcher("shared/client-leads?noConsulted=true&", false);
  useEffect(() => {
    if (filters) setPage(1);
  }, [filters]);

  return (
    <LeadListBody
      def={def}
      loading={loading}
      error={error}
      data={data}
      setData={setData}
      total={total}
      page={page}
      setPage={setPage}
      limit={limit}
      setLimit={setLimit}
      totalPages={totalPages}
      onRetry={() => setRender((r) => !r)}
      emptyTitle="No leads awaiting consultation"
      emptyDescription="All new leads have been consulted. Great work!"
    />
  );
}

/* ---- Stale / overdue pool (was "Shuffle") ---- */
function StalePanel({ def }) {
  const { user } = useAuth();
  const {
    data,
    loading,
    error,
    setData,
    page,
    setPage,
    limit,
    setLimit,
    total,
    totalPages,
    setRender,
  } = useDataFetcher(
    `shared/client-leads?staffId=${user.id}&assignedOverdue=true&`,
    false
  );

  return (
    <LeadListBody
      def={def}
      loading={loading}
      error={error}
      data={data}
      setData={setData}
      total={total}
      page={page}
      setPage={setPage}
      limit={limit}
      setLimit={setLimit}
      totalPages={totalPages}
      onRetry={() => setRender((r) => !r)}
      emptyTitle="No overdue leads"
      emptyDescription="No leads have exceeded the set time without follow-up."
    />
  );
}
