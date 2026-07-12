"use client";
import { useCallback, useState } from "react";
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
import SearchComponent from "@/shared/components/formComponents/SearchComponent.jsx";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import AdminTable from "@/shared/components/AdminTable";
import { auditColumns } from "@/features/audit/config/columns.jsx";
import { auditFilters, AUDIT_FILTER_KEYS } from "@/features/audit/config/filters.js";
import { AUDIT_LOGS_URL } from "@/features/audit/config/constant.js";
import AuditDetailDrawer from "@/features/audit/AuditDetailDrawer.jsx";

// The audit backend reads FLAT query params (actorUserId, module, action, entityType,
// entityId, clientLeadId, from, to) straight off `req.query` — NOT getData's `filters`
// JSON blob. `useDataFetcher`/`getData` send `page` + `limit` natively and append the
// `others` string raw, so the active filters are serialized into `others` here. Empty
// values are skipped so they never reach the Prisma where.
function buildFilterQuery(filters) {
  const params = new URLSearchParams();
  for (const key of AUDIT_FILTER_KEYS) {
    const value = filters[key];
    if (value === undefined || value === null) continue;
    const str = String(value).trim();
    if (str === "") continue;
    params.append(key, str);
  }
  return params.toString();
}

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

// One filter control, rendered by its config `type` (userSearch | select | number |
// date). Fully config-driven — the fields come from config/filters.js, not inline JSX.
function FilterField({ config, value, onChange, resetTrigger }) {
  if (config.type === "userSearch") {
    // Same user autocomplete as the Users page search. SearchComponent reports the
    // pick through a setFilters(updater) callback; only the selected id is kept —
    // it lands in the draft under this filter's key (actorUserId) and reaches the
    // backend as the same flat query param the number field used to fill.
    return (
      <Box sx={{ width: 300 }}>
        <SearchComponent
          apiEndpoint="search?model=all-users"
          setFilters={(updater) => {
            const next = typeof updater === "function" ? updater({}) : updater;
            onChange(config.key, next?.[config.key] ?? "");
          }}
          inputLabel={config.label}
          renderKeys={["name", "email"]}
          mainKey="name"
          searchKey={config.key}
          resetTrigger={resetTrigger}
          size="small"
        />
      </Box>
    );
  }
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

// The admin-only, config-driven, paginated audit-log table. Fetching/pagination/error
// state come from the shared `useDataFetcher` hook (same convention as UsersPage); the
// filter bar commits its draft into the hook's `others` on Apply.
export default function AuditLogTable() {
  const {
    data,
    loading,
    setData,
    page,
    setPage,
    limit,
    setLimit,
    total,
    setTotal,
    totalPages,
    setOthers,
    error,
  } = useDataFetcher(AUDIT_LOGS_URL, false);

  // `draft` = the values currently in the bar. The Apply button commits draft → the
  // hook's `others` so typing doesn't refetch on every keystroke.
  const [draft, setDraft] = useState({});
  // Bumped on Reset so uncontrolled inner widgets (the actor autocomplete) clear too.
  const [resetTick, setResetTick] = useState(null);

  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDraftChange = useCallback((key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    setPage(1);
    setOthers(buildFilterQuery(draft));
  }, [draft, setPage, setOthers]);

  const resetFilters = useCallback(() => {
    setDraft({});
    setResetTick((t) => (t ?? 0) + 1);
    setPage(1);
    setOthers("");
  }, [setPage, setOthers]);

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
                resetTrigger={resetTick}
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
              Could not load the audit log.
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
