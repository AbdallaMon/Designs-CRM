"use client";

// <DataTablePage /> — THE canonical list pattern for the v2 UI, extracted from LeadsPage.jsx.
// Config-driven: columns are declarative data ({ field, headerName, accessor, align, privileged
// }), NOT JSX in the page. Renders the leads-list shape: a toolbar (search + filter Selects), a
// <Table size="small">, a <TablePagination labelRowsPerPage="عدد الصفوف">, capability-gated row
// actions, and the FIVE states wired in (loading skeleton / error+retry / empty / partial-perm /
// data). The page that uses it owns the data hook (useRequest paginated) and passes state down —
// this component is presentational + pattern-canonical. Single-language Arabic / RTL.
//
// COLUMN config (config/<feature>Columns.js):
//   { field, headerName, accessor?(row)=>node, align?, width?, privileged? }
//   - accessor: how to render the cell (defaults to row[field]).
//   - privileged: hidden unless `showPrivileged` is true (PII gating parity with LeadsPage).
//
// FILTER config (config/<feature>Filters.js) — light, Phase-0 set matching the leads toolbar:
//   { key:"search", type:"search", label, placeholder }
//   { key, type:"enum", label, options: { VALUE: "Arabic label", ... }, allLabel? }
//
// Props (the page wires these to its useRequest hook):
//   columns, filters?            — the config arrays.
//   rows                         — current page items.
//   total, page (1-based), pageSize, onPageChange(p1Based), onPageSizeChange(n)
//   filterValues, onFilterChange(key, value) — controlled filter state.
//   loading, error, onRetry      — state wiring (error resolved via `errorResolver`).
//   errorResolver?               — feature CODE→Arabic map for ErrorState.
//   getRowKey?(row)              — key extractor (default row.id).
//   renderRowActions?(row)       — capability-gated per-row action cluster (end-aligned).
//   onRowClick?(row) | rowHref?(row) — open the detail (link preferred for prefetch).
//   showPrivileged               — reveal `privileged` columns (gate at the call site).
//   empty?                       — { title, description, action } for EmptyState.
//   partial?                     — { message, allowed } banner above the table (optional).
//   rowsPerPageOptions           — default [10, 25, 50].

import {
  Box,
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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import NextLink from "next/link";
import { LoadingState } from "./states/LoadingState";
import { ErrorState } from "./states/ErrorState";
import { EmptyState } from "./states/EmptyState";
import { PartialPermissionState } from "./states/PartialPermissionState";

export function DataTablePage({
  columns = [],
  filters = [],
  rows = [],
  total = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  filterValues = {},
  onFilterChange,
  loading = false,
  error = null,
  onRetry,
  errorResolver,
  getRowKey,
  renderRowActions,
  onRowClick,
  rowHref,
  showPrivileged = false,
  empty,
  partial,
  rowsPerPageOptions = [10, 25, 50],
}) {
  const visibleColumns = columns.filter((c) => !c.privileged || showPrivileged);
  const hasActions = typeof renderRowActions === "function";
  const colSpan = visibleColumns.length + (hasActions ? 1 : 0);

  const toolbar = filters.length > 0 && (
    <Paper variant="outlined" sx={{ mb: 2 }}>
      <Toolbar sx={{ gap: 2, flexWrap: "wrap", py: 2 }}>
        {filters.map((f) => (
          <FilterControl
            key={f.key}
            filter={f}
            value={filterValues[f.key]}
            onChange={(v) => onFilterChange?.(f.key, v)}
          />
        ))}
      </Toolbar>
    </Paper>
  );

  function renderBody() {
    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={colSpan} sx={{ borderBottom: "none" }}>
            <ErrorState error={error} onRetry={onRetry} resolver={errorResolver} />
          </TableCell>
        </TableRow>
      );
    }
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={colSpan} sx={{ borderBottom: "none", p: 0 }}>
            <LoadingState variant="table" columns={colSpan || 5} rows={pageSize > 10 ? 8 : 6} />
          </TableCell>
        </TableRow>
      );
    }
    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={colSpan} sx={{ borderBottom: "none" }}>
            <EmptyState
              title={empty?.title ?? "لا توجد بيانات"}
              description={empty?.description}
              action={empty?.action}
            />
          </TableCell>
        </TableRow>
      );
    }
    return rows.map((row) => {
      const key = getRowKey ? getRowKey(row) : row.id;
      const clickable = Boolean(onRowClick || rowHref);
      return (
        <TableRow
          key={key}
          hover
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          sx={{ cursor: clickable ? "pointer" : "default" }}
        >
          {visibleColumns.map((c) => (
            <TableCell key={c.field} align={c.align}>
              {c.accessor ? c.accessor(row) : row[c.field]}
            </TableCell>
          ))}
          {hasActions && (
            <TableCell align="right" onClick={(e) => e.stopPropagation()}>
              <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                {renderRowActions(row)}
              </Stack>
            </TableCell>
          )}
        </TableRow>
      );
    });
  }

  const table = (
    <>
      {toolbar}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {visibleColumns.map((c) => (
                <TableCell key={c.field} align={c.align} sx={{ width: c.width, fontWeight: 700 }}>
                  {c.headerName}
                </TableCell>
              ))}
              {hasActions && <TableCell align="right">إجراءات</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>{renderBody()}</TableBody>
        </Table>
        {!error && (
          <TablePagination
            component="div"
            count={total}
            page={Math.max(0, page - 1)}
            onPageChange={(_e, p) => onPageChange?.(p + 1)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => {
              onPageSizeChange?.(parseInt(e.target.value, 10));
              onPageChange?.(1);
            }}
            rowsPerPageOptions={rowsPerPageOptions}
            labelRowsPerPage="عدد الصفوف"
          />
        )}
      </TableContainer>
    </>
  );

  // Optional partial-permission banner above the table (role sees a subset).
  if (partial) {
    return (
      <Box>
        <PartialPermissionState message={partial.message} allowed={partial.allowed}>
          {table}
        </PartialPermissionState>
      </Box>
    );
  }

  return <Box>{table}</Box>;
}

function FilterControl({ filter, value, onChange }) {
  if (filter.type === "search") {
    return (
      <TextField
        size="small"
        label={filter.label ?? "بحث"}
        placeholder={filter.placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        sx={{ minWidth: 240 }}
      />
    );
  }
  if (filter.type === "enum") {
    const labelId = `filter-${filter.key}`;
    return (
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel id={labelId}>{filter.label}</InputLabel>
        <Select
          labelId={labelId}
          label={filter.label}
          value={value ?? "ALL"}
          onChange={(e) => onChange(e.target.value)}
        >
          <MenuItem value="ALL">{filter.allLabel ?? "الكل"}</MenuItem>
          {Object.entries(filter.options ?? {}).map(([k, lbl]) => (
            <MenuItem key={k} value={k}>
              {lbl}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }
  return null;
}

export default DataTablePage;
