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
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  MenuItem,
  Select,
} from "@mui/material";
import { MdOpenInNew, MdRefresh } from "react-icons/md";
import Link from "next/link";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useDebounce } from "@/app/v2/hooks/useDebounce";
import { useLeadsList } from "../hooks/useLeadsList.js";
import { leadsColumns } from "../config/leadsColumns.js";
import { LEAD_STATUS_LABELS } from "../config/leadsConstants.js";
import { LeadAssignActions } from "../components/LeadAssignActions.jsx";
import { BulkConvertModal } from "../components/BulkConvertModal.jsx";

export function LeadsPage() {
  const { hasPermission, hasAnyPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.LEAD.LIST);
  const canBulkConvert = hasPermission(PERMISSIONS.LEAD.ASSIGN_OTHER);

  const [searchInput, setSearchInput] = useState("");
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
    setFilters,
    setExtra,
    isLoading,
    refetch,
  } = useLeadsList({ autoFetch: canList });

  // Debounce the raw search term, then push it into the list hook's filter state.
  // Parity: the legacy leads list (services/main/shared/leadServices.js getClientLeads)
  // only ever supported searching by lead id (via filters.id) — it never honored a
  // name/phone free-text search. So the search box is scoped to the numeric lead id; a
  // non-numeric term matches nothing and is treated as no id filter.
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    const term = debouncedSearch.trim();
    const id = /^\d+$/.test(term) ? term : null;
    setFilters(buildFilters(id));
    // setFilters is a stable callback from the list hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Status is a TOP-LEVEL query param the BE list reads directly (lead.usecase.js
  // #buildListWhere reads `status` off searchParams, NOT from the JSON `filters`), so it
  // is routed through the hook's `extra` (top-level params), not buildFilters.
  useEffect(() => {
    setExtra(statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {});
    // setExtra is a stable callback from the list hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  function buildFilters(id) {
    const f = {};
    if (id) f.id = id;
    return f;
  }

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

      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Toolbar sx={{ gap: 2, flexWrap: "wrap", py: 2 }}>
          <TextField
            size="small"
            label="بحث برقم العميل"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{ minWidth: 260 }}
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
                    <TableCell key={c.field}>{c.accessor(row)}</TableCell>
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
