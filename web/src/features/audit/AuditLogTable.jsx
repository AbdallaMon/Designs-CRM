"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FiEye, FiRefreshCw } from "react-icons/fi";
import AdminTable from "@/shared/components/AdminTable";
import { initialPageLimit } from "@/app/helpers/constants";
import { auditColumns } from "@/features/audit/config/columns.jsx";
import { auditFilters } from "@/features/audit/config/filters.js";
import { getAuditLogs } from "@/features/audit/services/auditService.js";
import AuditDetailDrawer from "@/features/audit/AuditDetailDrawer.jsx";

// Row action injected into AdminTable's `extraComponent` — opens the detail drawer.
function ViewAction({ item, onView }) {
  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={<FiEye size={16} />}
      onClick={() => onView(item)}
      sx={{ textTransform: "none", borderRadius: 2, whiteSpace: "nowrap" }}
    >
      Details
    </Button>
  );
}

// One filter control, rendered by its config `type` (select | number | date). Fully
// config-driven — the fields come from config/filters.js, not inline JSX.
function FilterField({ config, value, onChange }) {
  if (config.type === "select") {
    return (
      <FormControl size="small" sx={{ minWidth: 170 }}>
        <InputLabel id={`audit-filter-${config.key}`}>{config.label}</InputLabel>
        <Select
          labelId={`audit-filter-${config.key}`}
          label={config.label}
          value={value ?? ""}
          onChange={(e) => onChange(config.key, e.target.value)}
        >
          <MenuItem value="">
            <em>All</em>
          </MenuItem>
          {config.options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }
  if (config.type === "date") {
    return (
      <TextField
        size="small"
        type="date"
        label={config.label}
        value={value ?? ""}
        onChange={(e) => onChange(config.key, e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 160 }}
      />
    );
  }
  // number (default)
  return (
    <TextField
      size="small"
      type="number"
      label={config.label}
      placeholder={config.placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(config.key, e.target.value)}
      sx={{ minWidth: 150 }}
    />
  );
}

// The admin-only, config-driven, paginated audit-log table. Manages page/limit/filter
// state locally and fetches through the shared `getData`-backed service (no raw fetch).
export default function AuditLogTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialPageLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState(null);

  // `draft` = the values in the bar; `applied` = what the fetch actually uses. The
  // Apply button commits draft → applied so typing doesn't refetch on every keystroke.
  const [draft, setDraft] = useState({});
  const [applied, setApplied] = useState({});

  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await getAuditLogs({ page, limit, filters: applied, setLoading });
      if (!active) return;
      if (res && res.status === 200) {
        setData(Array.isArray(res.data) ? res.data : []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 0);
        setError(null);
      } else if (res) {
        setData([]);
        setTotal(0);
        setTotalPages(0);
        setError(res.error?.reason || "Could not load the audit log.");
      }
    })();
    return () => {
      active = false;
    };
  }, [page, limit, applied]);

  const handleDraftChange = useCallback((key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    setPage(1);
    setApplied({ ...draft });
  }, [draft]);

  const resetFilters = useCallback(() => {
    setDraft({});
    setApplied({});
    setPage(1);
  }, []);

  const openDrawer = useCallback((item) => {
    setSelected(item);
    setDrawerOpen(true);
  }, []);

  return (
    <>
      <AdminTable
        data={data}
        columns={auditColumns}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        total={total}
        totalPages={totalPages}
        setData={setData}
        setTotal={setTotal}
        loading={loading}
        extraComponent={ViewAction}
        extraComponentProps={{ onView: openDrawer }}
      >
        <Stack spacing={1.5} sx={{ width: "100%" }}>
          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
            alignItems="center"
          >
            {auditFilters.map((config) => (
              <FilterField
                key={config.key}
                config={config}
                value={draft[config.key]}
                onChange={handleDraftChange}
              />
            ))}
            <Button
              variant="contained"
              onClick={applyFilters}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Apply
            </Button>
            <Button
              variant="text"
              startIcon={<FiRefreshCw size={16} />}
              onClick={resetFilters}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Reset
            </Button>
          </Stack>
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </AdminTable>

      <AuditDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        item={selected}
      />
    </>
  );
}
