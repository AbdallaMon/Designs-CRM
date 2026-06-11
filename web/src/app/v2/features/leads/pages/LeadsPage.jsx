"use client";

// Leads pool list page. Collapses the legacy per-role-slot leads screens
// (@admin|@staff|@super_admin|@super_sales|@accountant|@threeD /leads) into ONE
// permission-gated feature: visibility + per-row actions are driven by usePermission +
// the per-record capabilities.* the v2 API returns, NOT by role slot. Same observable
// list per role, one code path.
//
// §5c deltas applied: data via the leads service against /v2/leads (list shape
// { items, total, page, pageSize }); each row's actions gated on row.capabilities.*;
// bulk-convert (admin-tier) gated on PERMISSIONS.LEAD.ASSIGN_OTHER.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Checkbox,
  Container,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography,
  MenuItem,
  Select,
  Link as MuiLink,
} from "@mui/material";
import { MdOpenInNew, MdRefresh } from "react-icons/md";
import Link from "next/link";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useLeadsList } from "../hooks/useLeadsList.js";
import { leadsColumns } from "../config/leadsColumns.js";
import { LEAD_STATUS_LABELS } from "../config/leadsConstants.js";
import { LeadAssignActions } from "../components/LeadAssignActions.jsx";
import { LeadSearchAutocomplete } from "../components/LeadSearchAutocomplete.jsx";
import { BulkConvertModal } from "../components/BulkConvertModal.jsx";

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
  const canList = hasPermission(PERMISSIONS.LEAD.LIST);
  const canBulkConvert = hasPermission(PERMISSIONS.LEAD.ASSIGN_OTHER);

  // Default to the "new" segment so freshly-created client leads (status NEW) are visible.
  const [segment, setSegment] = useState(SEGMENTS.NEW);
  const [statusFilter, setStatusFilter] = useState("ALL");
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
    refetch,
  } = useLeadsList({ autoFetch: canList });

  // Free-text lead lookup now goes through LeadSearchAutocomplete (utilities search across
  // name/phone/email/code) and navigates straight to the picked lead — so the page no longer
  // maintains an id-only filter. `filters` stays empty here.

  // `noConsulted` (new segment) and `status` (explicit dropdown selection) are TOP-LEVEL query
  // params the BE list reads directly off searchParams (lead.usecase.js #buildListWhere), NOT from
  // the JSON `filters`, so they are routed through the hook's `extra`. An explicit status selection
  // wins over the segment default; otherwise the "new" segment sends `noConsulted=true` (the only
  // param that surfaces un-consulted raw leads past the BE's forced initialConsult:true) and
  // "deals" sends nothing (BE applies its default status notIn [NEW, CONVERTED, ON_HOLD]).
  // NOTE: the BE's noConsulted branch RESETS the where to `{ initialConsult:false }`, so an explicit
  // status pick (which is meaningful only for the consulted/deals pool) takes precedence here.
  useEffect(() => {
    const next = {};
    if (statusFilter && statusFilter !== "ALL") {
      next.status = statusFilter;
    } else if (segment === SEGMENTS.NEW) {
      next.noConsulted = "true";
    }
    setExtra(next);
    // setExtra is a stable callback from the list hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment, statusFilter]);

  // Which columns to show: privileged-only columns (client PII) hidden unless the user
  // can see them. We approximate the legacy gate with VIEW permission presence (the BE
  // already redacts the payload for non-privileged roles, so this is cosmetic parity).
  const visibleColumns = useMemo(() => {
    const privileged = hasAnyPermission([
      PERMISSIONS.LEAD.ASSIGN_OTHER,
      PERMISSIONS.LEAD.CONVERT,
    ]);
    return leadsColumns.filter((c) => !c.privileged || privileged);
  }, [hasAnyPermission]);

  if (!canList) {
    return (
      <CenteredNotice text="لا تملك صلاحية الوصول إلى قائمة العملاء" />
    );
  }

  function toggleSelect(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
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

      <Typography variant="h5" sx={{ mb: 2 }}>
        العملاء المحتملون
      </Typography>

      <Tabs
        value={segment}
        onChange={(_e, v) => {
          setSegment(v);
          setStatusFilter("ALL");
          setSelected([]);
        }}
        sx={{ mb: 2 }}
      >
        <Tab value={SEGMENTS.NEW} label="العملاء الجدد" />
        <Tab value={SEGMENTS.DEALS} label="الصفقات" />
      </Tabs>

      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Toolbar sx={{ gap: 2, flexWrap: "wrap", py: 2 }}>
          <LeadSearchAutocomplete
            onSelect={(lead) => {
              if (lead?.id != null) router.push(`/v2/leads/${lead.id}`);
            }}
          />
          <Select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ALL">كل الحالات</MenuItem>
            {Object.entries(LEAD_STATUS_LABELS).map(([k, label]) => (
              <MenuItem key={k} value={k}>
                {label}
              </MenuItem>
            ))}
          </Select>
          <Box sx={{ flex: 1 }} />
          {canBulkConvert && (
            <Tooltip title="تحويل جماعي للعملاء المحددين">
              <span>
                <button
                  type="button"
                  disabled={selected.length === 0}
                  onClick={() => setBulkOpen(true)}
                  style={{ padding: "8px 16px", cursor: selected.length ? "pointer" : "not-allowed" }}
                >
                  تحويل جماعي ({selected.length})
                </button>
              </span>
            </Tooltip>
          )}
          <Tooltip title="تحديث">
            <IconButton onClick={refetch}>
              <MdRefresh />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {canBulkConvert && <TableCell padding="checkbox" />}
              {visibleColumns.map((c) => (
                <TableCell key={c.field}>{c.headerName}</TableCell>
              ))}
              <TableCell align="right">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 2} align="center">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 2} align="center">
                  لا توجد بيانات
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              items.map((row) => (
                <TableRow key={row.id} hover>
                  {canBulkConvert && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(row.id)}
                        onChange={() => toggleSelect(row.id)}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.map((c) => (
                    // Each data cell is a real anchor (NextLink) to the lead detail so the row
                    // is genuinely link-navigable: plain click navigates, ctrl/cmd-click and
                    // "open in new tab" work, middle-click works — no JS onClick/router.push.
                    <TableCell key={c.field} sx={{ p: 0 }}>
                      <MuiLink
                        component={Link}
                        href={`/v2/leads/${row.id}`}
                        underline="none"
                        color="inherit"
                        sx={{
                          display: "block",
                          px: 2,
                          py: 1,
                          height: "100%",
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        {c.accessor(row)}
                      </MuiLink>
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                      <LeadAssignActions lead={row} onChanged={refetch} />
                      <Tooltip title="فتح التفاصيل">
                        <IconButton component={Link} href={`/v2/leads/${row.id}`} size="small">
                          <MdOpenInNew />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={(_e, p) => setPage(p + 1)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(1);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="عدد الصفوف"
        />
      </TableContainer>
    </Container>
  );
}

function CenteredNotice({ text }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <Typography color="textSecondary">{text}</Typography>
    </Box>
  );
}

export default LeadsPage;
