"use client";

// Leads pool list page — FLAT data table (reverted from the redesigned hub/kanban/workspace).
// Collapses the legacy per-role-slot leads screens into ONE permission-gated feature: visibility
// + per-row actions are driven by usePermission + the per-record capabilities.* the v2 API
// returns, NOT by role slot.
//
// A plain table is the ONLY view (no Kanban board, no list/board toggle, no workspace cockpit).
// Two top-level entry points seed the list from the URL `?segment=`:
//   • segment=new   → "العملاء المحتملون" (raw un-consulted leads pool; BE noConsulted=true)
//   • segment=deals → "الصفقات الحالية"   (consulted pool; BE default status filter)
// An explicit status filter takes precedence over the segment default (the BE status param wins
// over the noConsulted branch). Bilingual ar/en via useT().

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  IconButton,
  Stack,
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

const P = PERMISSIONS.LEAD;

// Top-level segment: "new" surfaces the un-consulted raw-lead pool. The BE list ALWAYS forces
// `initialConsult: true`, so the only way to see freshly-created leads (created with
// initialConsult:false) is the BE's `noConsulted=true` escape. The "deals" branch is the
// consulted pool (BE default `status notIn [NEW, CONVERTED, ON_HOLD]` + initialConsult:true).
const SEGMENTS = {
  NEW: "new",
  DEALS: "deals",
};

function normalizeSegment(value) {
  return value === SEGMENTS.DEALS ? SEGMENTS.DEALS : SEGMENTS.NEW;
}

export function LeadsPage() {
  const { hasPermission, hasAnyPermission } = usePermission();
  const { t } = useT();
  const router = useRouter();
  const sp = useSearchParams();
  const canList = hasPermission(P.LIST);
  const canBulkConvert = hasPermission(P.ASSIGN_OTHER);

  // Segment is seeded from the URL (?segment=new|deals) so the two nav entries land here with the
  // correct pool. Default to "new" so freshly-created client leads (status NEW) are visible.
  const segment = normalizeSegment(sp.get("segment"));

  // Controlled DataTablePage filter values; only `status` is wired (enum). "ALL" = no filter.
  const [filterValues, setFilterValues] = useState({ status: "ALL" });
  const [selected, setSelected] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);

  // Reset the selection + status filter whenever the segment changes (a different pool).
  useEffect(() => {
    setFilterValues({ status: "ALL" });
    setSelected([]);
  }, [segment]);

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
  } = useLeadsList({ autoFetch: canList });

  const statusFilter = filterValues.status;
  const statusActive = Boolean(statusFilter && statusFilter !== "ALL");

  // `noConsulted` (new segment) and `status` (explicit dropdown) are TOP-LEVEL query params the
  // BE list reads directly off searchParams, NOT from the JSON `filters`, so they are routed
  // through the hook's `extra`. An explicit status selection wins over the segment default;
  // otherwise the "new" segment sends `noConsulted=true` (the only param that surfaces un-consulted
  // raw leads) and "deals" sends nothing (BE applies its default status filter).
  useEffect(() => {
    const next = {};
    if (statusActive) {
      next.status = statusFilter;
    } else if (segment === SEGMENTS.NEW) {
      next.noConsulted = "true";
    }
    setExtra(next);
    // setExtra is a stable callback from the list hook (resets to page 1).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment, statusFilter]);

  function onFilterChange(key, value) {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
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

  // Columns are config-driven (config/leadsColumns.js). When the user can bulk-convert we prepend
  // a selection column whose accessor renders a controlled checkbox.
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

  // Distinct empty state per segment so the precedence is legible. A status filter narrows
  // whichever pool is active; surface that in the copy.
  const empty = useMemo(() => {
    if (statusActive) {
      return {
        title: t("leads.empty.status.title"),
        description: t("leads.empty.status.description"),
      };
    }
    if (segment === SEGMENTS.NEW) {
      return {
        title: t("leads.empty.new.title"),
        description: t("leads.empty.new.description"),
      };
    }
    return {
      title: t("leads.empty.deals.title"),
      description: t("leads.empty.deals.description"),
    };
  }, [segment, statusActive, t]);

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

  // The page title reflects which pool is active (the two nav entries land on the same screen).
  const pageTitle =
    segment === SEGMENTS.DEALS ? t("leads.page.title.deals") : t("leads.page.title");

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
        title={pageTitle}
        subtitle={t("leads.page.subtitle.total").replace("{total}", total)}
        breadcrumbs={[{ label: t("leads.page.breadcrumb.sales") }, { label: pageTitle }]}
      >
        <LeadSearchAutocomplete
          onSelect={(lead) => {
            if (lead?.id != null) router.push(`/v2/leads/${lead.id}`);
          }}
        />
        {canBulkConvert && (
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
        <Tooltip title={t("leads.action.refresh")}>
          <IconButton onClick={refetch}>
            <MdRefresh />
          </IconButton>
        </Tooltip>
      </PageHeader>

      {statusActive && (
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Chip
            size="small"
            color="info"
            variant="outlined"
            label={t("leads.segment.filteredChip")}
            onDelete={() => setFilterValues({ status: "ALL" })}
          />
        </Stack>
      )}

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
    </Container>
  );
}

export default LeadsPage;
