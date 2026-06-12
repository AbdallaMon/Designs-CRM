"use client";

// Leads pool page. Collapses the legacy per-role-slot leads screens (@admin|@staff|… /leads)
// into ONE permission-gated feature: visibility + per-row actions are driven by usePermission +
// the per-record capabilities.* the v2 API returns, NOT by role slot.
//
// TWO segments, each with the ONE view master used for it (no dead toggle):
//   • "new"  (العملاء المحتملون) — the un-consulted raw-lead pool, rendered as a LIST/table.
//     The BE list ALWAYS forces `initialConsult: true` (lead.usecase.js list() sets
//     checkConsult:true), and freshly-created leads are `initialConsult:false`, so the list
//     sends `noConsulted=true` (the only param that surfaces them) — exactly master's NewLeadsPage.
//   • "deals" (الصفقات الحالية) — the active pipeline, rendered as the KANBAN BOARD. Master's
//     deals view was ALWAYS the board (getClientLeadsColumnStatus, one fetch per status); it never
//     had a working deals LIST. The board does NOT filter on initialConsult, which is why it shows
//     the deals the consult-forced list could not. Board-only here = master-faithful AND removes the
//     empty-deals-list defect at the root.
//
// The segment is seeded from the URL (?segment=new|deals) so the two top-level nav links land
// directly on the right pool, and segment switches are reflected back into the URL.

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Checkbox,
  Container,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
} from "@mui/material";
import { MdOpenInNew, MdRefresh, MdGroupAdd } from "react-icons/md";
import Link from "next/link";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useT } from "@/app/v2/lib/i18n";
import {
  PageHeader,
  DataTablePage,
  PartialPermissionState,
} from "@/app/v2/shared/components";
import { useLeadsList } from "../hooks/useLeadsList.js";
import { buildLeadsColumns } from "../config/leadsColumns.js";
import { buildLeadsFilters } from "../config/leadsFilters.js";
import { leadsMessages } from "../config/leadsMessages.js";
import { LeadAssignActions } from "../components/LeadAssignActions.jsx";
import { LeadSearchAutocomplete } from "../components/LeadSearchAutocomplete.jsx";
import { BulkConvertModal } from "../components/BulkConvertModal.jsx";
import { LeadsKanban } from "../components/LeadsKanban.jsx";

const P = PERMISSIONS.LEAD;

// Top-level segment. "new" = the un-consulted raw-lead pool (LIST). "deals" = the active
// pipeline (BOARD). The view is implied by the segment — there is no separate view toggle.
const SEGMENTS = {
  NEW: "new",
  DEALS: "deals",
};

// Normalize an arbitrary ?segment= value to a known segment (default: new).
function normalizeSegment(value) {
  return value === SEGMENTS.DEALS ? SEGMENTS.DEALS : SEGMENTS.NEW;
}

export function LeadsPage() {
  const { hasPermission, hasAnyPermission } = usePermission();
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canList = hasPermission(P.LIST);
  const canBulkConvert = hasPermission(P.ASSIGN_OTHER);

  // Segment is seeded from the URL (?segment=) so the split nav links land on the right pool.
  const urlSegment = normalizeSegment(searchParams.get("segment"));
  const [segment, setSegment] = useState(urlSegment);
  // Keep local state in sync if the URL segment changes (e.g. nav link click while mounted).
  useEffect(() => {
    setSegment(urlSegment);
  }, [urlSegment]);

  const isDeals = segment === SEGMENTS.DEALS;

  // Controlled DataTablePage filter values; only `status` is wired (enum). "ALL" = no filter.
  const [filterValues, setFilterValues] = useState({ status: "ALL" });
  const [selected, setSelected] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);

  const {
    items,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    setExtra,
    isLoading,
    error,
    refetch,
  } = useLeadsList({ autoFetch: canList && !isDeals });

  const statusFilter = filterValues.status;
  // An explicit status pick is active when it is not the "ALL" sentinel.
  const statusActive = Boolean(statusFilter && statusFilter !== "ALL");

  // The NEW segment is the only one using the LIST. It sends `noConsulted=true` (the only param
  // that surfaces un-consulted raw leads past the BE's forced initialConsult:true). An explicit
  // status pick narrows that pool. The DEALS segment uses the board and never touches the list.
  useEffect(() => {
    if (isDeals) return;
    const next = {};
    if (statusActive) next.status = statusFilter;
    else next.noConsulted = "true";
    setExtra(next);
    // setExtra is a stable callback from the list hook (resets to page 1).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeals, statusFilter]);

  function onFilterChange(key, value) {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }

  // Switch segment AND reflect it into the URL so deep-links / nav stay consistent.
  function onSegmentChange(_e, value) {
    const next = normalizeSegment(value);
    setSegment(next);
    setFilterValues({ status: "ALL" });
    setSelected([]);
    const params = new URLSearchParams(searchParams.toString());
    params.set("segment", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function toggleSelect(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  // PII columns (client name / phone) are revealed only to privileged roles. The BE already
  // redacts the payload for non-privileged roles, so this is cosmetic parity (legacy behavior).
  const showPrivileged = useMemo(
    () => hasAnyPermission([P.ASSIGN_OTHER, P.CONVERT]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasAnyPermission],
  );

  // Columns are config-driven (config/leadsColumns.js). When the user can bulk-convert we
  // prepend a selection column whose accessor renders a controlled checkbox — selection is
  // inherently page state, so only the affordance (not the data columns) is composed here.
  const columns = useMemo(() => {
    const baseColumns = buildLeadsColumns(t);
    if (!canBulkConvert) return baseColumns;
    const selectCol = {
      field: "__select",
      headerName: "",
      width: 48,
      accessor: (row) => (
        <Checkbox
          size="small"
          checked={selected.includes(row.id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleSelect(row.id)}
          inputProps={{ "aria-label": t("leads.row.selectAria").replace("{id}", row.id) }}
        />
      ),
    };
    return [selectCol, ...baseColumns];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canBulkConvert, selected, t]);

  // Empty state for the NEW-leads list. A status filter narrows the pool; surface that in copy.
  const empty = useMemo(() => {
    if (statusActive) {
      return {
        title: t("leads.empty.status.title"),
        description: t("leads.empty.status.description"),
      };
    }
    return {
      title: t("leads.empty.new.title"),
      description: t("leads.empty.new.description"),
    };
  }, [statusActive, t]);

  function renderRowActions(row) {
    return (
      <>
        <LeadAssignActions lead={row} onChanged={refetch} />
        <Tooltip title={t("leads.action.openDetails")}>
          {/* Real anchor → middle-click / ctrl+click / open-in-new-tab all work. */}
          <IconButton
            component={Link}
            href={`/v2/leads/${row.id}`}
            size="small"
            onClick={(e) => e.stopPropagation()}
          >
            <MdOpenInNew />
          </IconButton>
        </Tooltip>
      </>
    );
  }

  if (!canList) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <PartialPermissionState
          denied
          title={t("leads.denied.title")}
          message={t("leads.denied.message")}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <BulkConvertModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        selectedIds={selected}
        onDone={() => {
          setSelected([]);
          refetch();
        }}
      />

      <PageHeader
        title={t("leads.page.title")}
        subtitle={
          isDeals
            ? t("leads.page.subtitle.deals")
            : t("leads.page.subtitle.total").replace("{total}", total)
        }
        breadcrumbs={[
          { label: t("leads.page.breadcrumb.sales") },
          { label: isDeals ? t("leads.segment.deals") : t("leads.segment.new") },
        ]}
      >
        <LeadSearchAutocomplete
          onSelect={(lead) => {
            if (lead?.id != null) router.push(`/v2/leads/${lead.id}`);
          }}
        />
        {!isDeals && canBulkConvert && (
          <Tooltip title={t("leads.action.bulkConvert.tooltip")}>
            <span>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<MdGroupAdd />}
                disabled={selected.length === 0}
                onClick={() => setBulkOpen(true)}
              >
                {t("leads.action.bulkConvert.label").replace("{count}", selected.length)}
              </Button>
            </span>
          </Tooltip>
        )}
        {!isDeals && (
          <Tooltip title={t("leads.action.refresh")}>
            <IconButton onClick={refetch}>
              <MdRefresh />
            </IconButton>
          </Tooltip>
        )}
      </PageHeader>

      {/* Segment selector — switches the pool (and the view it implies). */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
        <Tabs value={segment} onChange={onSegmentChange}>
          <Tab value={SEGMENTS.NEW} label={t("leads.segment.new")} />
          <Tab value={SEGMENTS.DEALS} label={t("leads.segment.deals")} />
        </Tabs>
      </Stack>

      {isDeals ? (
        // Deals = the Kanban board (master-faithful; never an empty list).
        <LeadsKanban />
      ) : (
        <Box>
          <DataTablePage
            columns={columns}
            filters={buildLeadsFilters(t)}
            rows={items}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            loading={isLoading}
            error={error}
            onRetry={refetch}
            errorResolver={leadsMessages}
            getRowKey={(row) => row.id}
            renderRowActions={renderRowActions}
            onRowClick={(row) => router.push(`/v2/leads/${row.id}`)}
            rowHref={(row) => `/v2/leads/${row.id}`}
            showPrivileged={showPrivileged}
            empty={empty}
          />
        </Box>
      )}
    </Container>
  );
}

export default LeadsPage;
