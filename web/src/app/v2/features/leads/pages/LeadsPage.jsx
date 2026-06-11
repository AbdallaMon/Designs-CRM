"use client";

// Leads pool list page. Collapses the legacy per-role-slot leads screens
// (@admin|@staff|@super_admin|@super_sales|@accountant|@threeD /leads) into ONE
// permission-gated feature: visibility + per-row actions are driven by usePermission +
// the per-record capabilities.* the v2 API returns, NOT by role slot. Same observable
// list per role, one code path.
//
// Migrated onto the canonical <DataTablePage> (was a hand-rolled Table/Toolbar/Pagination +
// a raw native bulk-convert <button> + bare loading/empty strings). Now: config-driven
// columns (config/leadsColumns.js) with PII gating, the status enum routed through the
// DataTablePage filter config, the FIVE shared states (loading/error/empty/partial/data),
// a themed MUI bulk-convert Button, and rows that are real links (rowHref + an open-in-new-tab
// IconButton). All data-fetching params (page/limit/filters/search/sort + the segment extra)
// and capability gates are preserved exactly.
//
// §5c deltas applied: data via the leads service against /v2/leads (list shape
// { items, total, page, pageSize }); each row's actions gated on row.capabilities.*;
// bulk-convert (admin-tier) gated on PERMISSIONS.LEAD.ASSIGN_OTHER.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Checkbox,
  Chip,
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
import {
  PageHeader,
  DataTablePage,
  PartialPermissionState,
} from "@/app/v2/shared/components";
import { useLeadsList } from "../hooks/useLeadsList.js";
import { leadsColumns } from "../config/leadsColumns.js";
import { leadsFilters } from "../config/leadsFilters.js";
import { leadsMessages } from "../config/leadsMessages.js";
import { LeadAssignActions } from "../components/LeadAssignActions.jsx";
import { LeadSearchAutocomplete } from "../components/LeadSearchAutocomplete.jsx";
import { BulkConvertModal } from "../components/BulkConvertModal.jsx";

const P = PERMISSIONS.LEAD;

// Top-level segment: "new" surfaces the un-consulted raw-lead pool. The BE list ALWAYS
// forces `initialConsult: true` (lead.usecase.js #buildListWhere sets checkConsult:true
// unconditionally), so the only way to see freshly-created leads — which are created with
// `initialConsult: false` — is the BE's `noConsulted=true` escape, which resets the where to
// `{ initialConsult: false }`. Sending `isNew=true` instead would AND `status:NEW` with
// `initialConsult:true` and return ZERO rows (verified: 23 NEW leads, all initialConsult=false).
// The default ("deals") branch is the consulted pool (BE `status notIn [NEW, CONVERTED, ON_HOLD]`
// + initialConsult:true). Default to "new" so the raw-lead pool is visible on landing.
const SEGMENTS = {
  NEW: "new",
  DEALS: "deals",
};

export function LeadsPage() {
  const { hasPermission, hasAnyPermission } = usePermission();
  const router = useRouter();
  const canList = hasPermission(P.LIST);
  const canBulkConvert = hasPermission(P.ASSIGN_OTHER);

  // Default to the "new" segment so freshly-created client leads (status NEW) are visible.
  const [segment, setSegment] = useState(SEGMENTS.NEW);
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
  } = useLeadsList({ autoFetch: canList });

  const statusFilter = filterValues.status;
  // An explicit status pick is active when it is not the "ALL" sentinel.
  const statusActive = Boolean(statusFilter && statusFilter !== "ALL");

  // Free-text lead lookup goes through LeadSearchAutocomplete (utilities search across
  // name/phone/email/code) and navigates straight to the picked lead — so the page keeps no
  // id-only list filter; `filters` stays empty.
  //
  // `noConsulted` (new segment) and `status` (explicit dropdown) are TOP-LEVEL query params the
  // BE list reads directly off searchParams (lead.usecase.js #buildListWhere), NOT from the JSON
  // `filters`, so they are routed through the hook's `extra`. An explicit status selection wins
  // over the segment default; otherwise the "new" segment sends `noConsulted=true` (the only
  // param that surfaces un-consulted raw leads past the BE's forced initialConsult:true) and
  // "deals" sends nothing (BE applies its default status notIn [NEW, CONVERTED, ON_HOLD]).
  // NOTE: the BE's noConsulted branch RESETS the where to `{ initialConsult:false }`, so an
  // explicit status pick (meaningful only for the consulted/deals pool) takes precedence here.
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

  function onSegmentChange(_e, value) {
    setSegment(value);
    setFilterValues({ status: "ALL" });
    setSelected([]);
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
    if (!canBulkConvert) return leadsColumns;
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
          inputProps={{ "aria-label": `تحديد العميل ${row.id}` }}
        />
      ),
    };
    return [selectCol, ...leadsColumns];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canBulkConvert, selected]);

  // Distinct empty state per segment so the precedence is legible (UX fix). A status filter
  // narrows whichever pool is active; surface that in the copy.
  const empty = useMemo(() => {
    if (statusActive) {
      return {
        title: "لا توجد نتائج مطابقة للحالة المحددة",
        description: "غيّر الحالة من شريط التصفية أو أعد التعيين لعرض القائمة كاملة.",
      };
    }
    if (segment === SEGMENTS.NEW) {
      return {
        title: "لا يوجد عملاء جدد بانتظار الاستلام",
        description: "ستظهر هنا العملاء الجدد فور وصولهم. لا حاجة لإجراء الآن.",
      };
    }
    return {
      title: "لا توجد صفقات مطابقة",
      description: "لا توجد صفقات في هذا القسم حالياً.",
    };
  }, [segment, statusActive]);

  function renderRowActions(row) {
    return (
      <>
        <LeadAssignActions lead={row} onChanged={refetch} />
        <Tooltip title="فتح التفاصيل">
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
          title="قائمة العملاء غير متاحة لصلاحياتك"
          message="لا تملك صلاحية الوصول إلى قائمة العملاء المحتملين. تواصل مع المسؤول إن كنت تظن أنه ينبغي أن تصل إليها."
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
        title="العملاء المحتملون"
        subtitle={`الإجمالي: ${total}`}
        breadcrumbs={[{ label: "المبيعات" }, { label: "العملاء المحتملون" }]}
      >
        <LeadSearchAutocomplete
          onSelect={(lead) => {
            if (lead?.id != null) router.push(`/v2/leads/${lead.id}`);
          }}
        />
        {canBulkConvert && (
          <Tooltip title="تحويل العملاء المحددين تحويلاً جماعياً">
            <span>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<MdGroupAdd />}
                disabled={selected.length === 0}
                onClick={() => setBulkOpen(true)}
              >
                تحويل جماعي ({selected.length})
              </Button>
            </span>
          </Tooltip>
        )}
        <Tooltip title="تحديث">
          <IconButton onClick={refetch}>
            <MdRefresh />
          </IconButton>
        </Tooltip>
      </PageHeader>

      {/* Segment selector. When an explicit status filter is active it takes precedence over the
          segment default (the BE status param overrides the noConsulted branch), so the tabs are
          visually deactivated and a "مفلتر حسب الحالة" chip explains why — making the precedence
          legible instead of silently ignoring the segment. */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ mb: 2, flexWrap: "wrap" }}
      >
        <Tabs
          value={segment}
          onChange={onSegmentChange}
          sx={{ opacity: statusActive ? 0.5 : 1 }}
        >
          <Tab value={SEGMENTS.NEW} label="العملاء الجدد" disabled={statusActive} />
          <Tab value={SEGMENTS.DEALS} label="الصفقات" disabled={statusActive} />
        </Tabs>
        {statusActive && (
          <Chip
            size="small"
            color="info"
            variant="outlined"
            label="مفلتر حسب الحالة"
            onDelete={() => setFilterValues({ status: "ALL" })}
          />
        )}
      </Stack>

      <Box>
        <DataTablePage
          columns={columns}
          filters={leadsFilters}
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
