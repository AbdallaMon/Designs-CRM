"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
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
import ConfirmWithActionModel from "@/app/UiComponents/models/ConfirmsWithActionModel.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ar";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import UpdateInitialConsultButton from "@/app/UiComponents/buttons/UpdateInitialConsultLead";
import {
  MdCheck,
  MdHourglassEmpty,
  MdOutlineFiberNew,
  MdOutlinePending,
  MdPhoneInTalk,
  MdEventAvailable,
  MdHistoryToggleOff,
  MdOutlineFactCheck,
  MdPreview,
  MdSearch,
  MdLocationOn,
  MdCategory,
  MdPhone,
  MdRefresh,
} from "react-icons/md";
import CreateNewLead from "../features/AddNewLead";
import NextCalls from "../widgets/NextCalls";
import NextMeetings from "../widgets/NextMeetings";
import { FixedData } from "@/app/UiComponents/DataViewer/leads/widgets/FixedData.jsx";
import PreviewDialog from "../PreviewLeadDialog";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { getData } from "@/app/helpers/functions/getData";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay";
import PaginationWithLimit from "@/app/UiComponents/DataViewer/PaginationWithLimit.jsx";
import { EmptyState } from "../shared/EmptyState";
import { RecordCard, MetaItem, StatusPill, NameAvatar } from "../shared/tabKit";
import { EmailRedirect, WhatsAppRedirect } from "../core/Utility";
import { LeadCategory } from "@/app/helpers/constants";

dayjs.extend(relativeTime);

/* ----------------------------------------------------------------------------
 * Tab registry — the LEAD POOLS only (new · non-consulted · stale). Arabic
 * titles, icons, role predicates. Order matters. Calls/meetings/targets are no
 * longer tabs — they render as their own stacked sections below the tabs.
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
 * Section registry — the stacked, always-visible blocks BELOW the tabs. Each
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
  // CONTACT_INITIATOR, SUPER_SALES, ADMIN → non-consulted (falls back to new
  // if the role can't see non-consulted, e.g. plain STAFF).
  return "non-consulted";
}

/* ----------------------------------------------------------------------------
 * Single counts source. ONE call to `shared/client-leads/summary?staffId=<id>`
 * returns `{ new, nonConsulted, stale, calls, meetings }`. These counts feed
 * BOTH the KPI rail and the tab/section badges. Refetches whenever `token`
 * changes (the page bumps it from the refresh button).
 * -------------------------------------------------------------------------- */
const EMPTY_SUMMARY = {
  new: 0,
  nonConsulted: 0,
  stale: 0,
  calls: 0,
  meetings: 0,
};

function useSummary(staffId, token) {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      const res = await getData({
        url: `shared/client-leads/summary?staffId=${staffId}&`,
        setLoading,
        // getData appends pagination params; the summary endpoint ignores them.
        page: 1,
        limit: 1,
        filters: {},
        search: "",
        sort: {},
        others: "",
      });
      if (!alive) return;
      if (res && res.status === 200 && res.data && typeof res.data === "object") {
        setSummary({ ...EMPTY_SUMMARY, ...res.data });
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [staffId, token]);

  return { summary, loading };
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

  // Admin "look up any lead" → opens the standard preview dialog.
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

  // KPI rail — one tile per visible LEAD-POOL tab, count read from the summary.
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
                New, non-consulted, and overdue leads — pick a lead and start a
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
            {/* Render only the active LEAD-POOL panel → only its fetcher runs.
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

        {/* ===== Zone 4: stacked sections (calls · meetings · targets) =====
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

      {/* Admin: look up any lead → standard preview dialog */}
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
 * Section frame — the unified tab header (icon · Arabic title · count) + body.
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
 * Lead-list panel — the shared 5-state body for New / Non-consulted / Stale.
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

/* ----------------------------------------------------------------------------
 * Lead card — rebuilt on the shared RecordCard. Same signature ({lead, setData})
 * and same action wiring as before, so NonConsultedLeads/OnHoldLeads keep working.
 * -------------------------------------------------------------------------- */
export function LeadSliderCard({ lead, setData }) {
  const { user } = useAuth();
  const theme = useTheme();
  const { setLoading } = useToastContext();
  const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false);
  const admin = checkIfAdmin(user);
  const isFullyPaid = lead.paymentStatus === "FULLY_PAID";

  const relative = dayjs(lead.createdAt).locale("ar").fromNow();
  const idLabel = `#${lead?.id.toString().padStart(7, "0")}`;

  const showContact =
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN" ||
    user.role === "CONTACT_INITIATOR" ||
    user.isSuperSales;

  async function createADeal(lead) {
    const assign = await handleRequestSubmit(
      lead,
      setLoading,
      `shared/client-leads`,
      false,
      "Assigning",
      false,
      "PUT"
    );
    if (assign.status === 200) {
      setData((data) => data.filter((l) => l.id !== lead.id));
    }
    return assign;
  }

  const category = LeadCategory[lead.selectedCategory] || lead.selectedCategory;
  const location = lead.country || lead.emirate;

  return (
    <>
      <RecordCard
        sx={{ height: "100%", display: "flex", flexDirection: "column" }}
        accent={isFullyPaid ? theme.palette.success.main : undefined}
        leading={
          showContact ? <NameAvatar name={lead.client?.name} /> : undefined
        }
        title={showContact ? lead.client?.name : idLabel}
        subtitle={`${idLabel} · ${relative}`}
        status={
          <StatusPill
            label={lead.paymentStatus}
            color={
              isFullyPaid
                ? theme.palette.success.main
                : theme.palette.text.secondary
            }
            icon={
              isFullyPaid ? (
                <MdCheck size={14} />
              ) : (
                <MdHourglassEmpty size={14} />
              )
            }
          />
        }
        meta={
          <>
            {category && (
              <MetaItem
                icon={<MdCategory size={14} />}
                label="Category"
                value={category}
              />
            )}
            {location && (
              <MetaItem
                icon={<MdLocationOn size={14} />}
                label="Location"
                value={location}
              />
            )}
            {showContact && lead.client?.phone && (
              <MetaItem icon={<MdPhone size={14} />} value={lead.client.phone} />
            )}
          </>
        }
        actions={
          <Stack spacing={1} sx={{ width: "100%" }}>
            {user.role === "STAFF" && !user.isSuperSales && (
              <ConfirmWithActionModel
                title="Are you sure you want to get this lead and assign it to you as a new deal?"
                handleConfirm={() => createADeal(lead)}
                label="Start a Deal"
                fullWidth={true}
                size="small"
                variant="contained"
              />
            )}
            <UpdateInitialConsultButton clientLead={lead} fullWidth />
            {user.role !== "CONTACT_INITIATOR" && (
              <Button
                fullWidth
                onClick={() => setPreviewDialogOpen(true)}
                variant="outlined"
                size="small"
                startIcon={<MdPreview />}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                Preview Details
              </Button>
            )}
          </Stack>
        }
      >
        {lead.description && (
          <Typography
            variant="body2"
            color="text.primary"
            title={lead.description}
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {lead.description}
          </Typography>
        )}
      </RecordCard>
      <PreviewDialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        setleads={setData}
        id={lead.id}
        admin={admin}
      />
    </>
  );
}

/* ----------------------------------------------------------------------------
 * Preserved (not in the page flow anymore): the admin lead-lookup card. Kept
 * exported so no external reuse site breaks; the page now routes admin lookups
 * into PreviewDialog instead. Body identical to the previous implementation.
 * -------------------------------------------------------------------------- */
export function SearchForALead() {
  const [lead, setLead] = useState();
  const [loading, setLoading] = useState();
  const [filters, setFilters] = useState();
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  const theme = useTheme();
  async function getALead() {
    await getDataAndSet({
      url: `shared/client-leads/${filters.id}`,
      setLoading,
      setData: setLead,
    });
  }
  useEffect(() => {
    if (filters && filters?.id) {
      getALead();
    }
  }, [filters, filters?.id]);
  if (!isAdmin) return;
  return (
    <Box
      sx={{
        width: "100%",
        margin: "auto",
        py: 1,
        pb: 3,
        background: theme.palette.background.default,
        position: "relative",
        mb: 10,
        borderRadius: 3,
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      {loading && <LoadingOverlay />}
      <Typography variant="h5" sx={{ pl: 2, mb: 0.5 }}>
        Search in deals
      </Typography>
      <SearchComponent
        apiEndpoint="search?model=clientLead"
        setFilters={setFilters}
        inputLabel="Search lead by id ,name or phone"
        renderKeys={["id", "client.name", "client.phone", "client.email"]}
        mainKey="id"
        searchKey={"id"}
        withParamsChange={false}
      />
      {lead && <LeadCard lead={lead} />}
    </Box>
  );
}

function LeadCard({ lead }) {
  const { user } = useAuth();
  return (
    <Box
      sx={{
        p: 3,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: "background.paper",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        transition: "box-shadow 0.2s ease-in-out",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        },
      }}
    >
      <Box sx={{ mb: 3, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography variant="h5" fontWeight={600} color="text.primary">
            {lead.client.name}
          </Typography>
          {user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? (
            <Button
              variant="text"
              color="text.secondary"
              component="a"
              href={`/dashboard/deals/${lead.id}`}
              sx={{
                fontFamily: "monospace",
                backgroundColor: "grey.100",
                px: 1,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              #{lead.id.toString().padStart(7, "0")}
            </Button>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontFamily: "monospace",
                backgroundColor: "grey.100",
                px: 1,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              #{lead.id.toString().padStart(7, "0")}
            </Typography>
          )}
        </Box>
        <Chip
          label={`Payment: ${lead.paymentStatus}`}
          color="primary"
          variant="outlined"
          size="small"
          sx={{ fontWeight: 500 }}
        />
        <Chip
          label={`Status: ${lead.status}`}
          color="secondary"
          variant="outlined"
          size="small"
          sx={{ fontWeight: 500 }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={500} color="text.primary" sx={{ mb: 2 }}>
          Lead Details
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
              <Typography
                color="text.secondary"
                variant="caption"
                sx={{ fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                Category
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                {LeadCategory[lead.selectedCategory]}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
              <Typography
                color="text.secondary"
                variant="caption"
                sx={{ fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                Location
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                {lead.country ? lead.country : lead.emirate}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
              <Typography
                color="text.secondary"
                variant="caption"
                sx={{ fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                Description
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.6 }}>
                {lead.description}
              </Typography>
            </Box>
          </Grid>
          {lead.clientDescription && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
                <Typography
                  color="text.secondary"
                  variant="caption"
                  sx={{ fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}
                >
                  Client Description
                </Typography>
                <Typography
                  variant="body1"
                  component="pre"
                  sx={{
                    textWrap: "auto",
                    wordBreak: "break-all",
                    mt: 1,
                    lineHeight: 1.6,
                    fontFamily: "inherit",
                  }}
                >
                  {lead.clientDescription}
                </Typography>
              </Box>
            </Grid>
          )}
          {lead.timeToContact && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
                <Typography
                  color="text.secondary"
                  variant="caption"
                  sx={{ fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}
                >
                  Preferred Contact Time
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {dayjs(lead.timeToContact).format("DD-MM-YYYY, HH:mm")}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>

      <Box>
        <Typography variant="h6" fontWeight={500} color="text.primary" sx={{ mb: 2 }}>
          Contact Information
        </Typography>
        <Grid container spacing={3}>
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{ "& .MuiBox-root": { width: "100%" } }}
          >
            <Box
              sx={{
                p: 2,
                backgroundColor: "primary.50",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "primary.200",
              }}
            >
              <Typography
                color="text.secondary"
                variant="caption"
                sx={{ fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                Client Name
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500, mb: 2 }}>
                {lead.client.name}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <WhatsAppRedirect lead={lead} />
              </Box>

              <Box>
                <Typography
                  color="text.secondary"
                  variant="caption"
                  sx={{ fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}
                >
                  Client Email
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <EmailRedirect email={lead.client.email} />
                </Box>
              </Box>
            </Box>
          </Grid>

          {lead.assignedTo && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "success.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "success.200",
                }}
              >
                <Typography
                  color="text.secondary"
                  variant="caption"
                  sx={{
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    mb: 1,
                    display: "block",
                  }}
                >
                  Assigned To
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                  {lead.assignedTo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {lead.assignedTo.email}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  Assigned: {dayjs(lead.assignedAt).format("DD/MM/YYYY")}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
}
