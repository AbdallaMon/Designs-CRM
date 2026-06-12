"use client";

// Lead picker — the standalone-page entry for the LEAD-SCOPED sales-stages surface. The route
// `/v2/sales-stages` carries no lead context, so the user must first identify a lead; this
// component resolves a `clientLeadId` and lifts it to the page (which drives the URL `?leadId=`
// so the selection is shareable / embeddable).
//
// Two paths, by permission:
//   - lead.list present  → a searchable list of leads (reuses the canonical leads SERVICE; the
//     leads list only supports search-by-numeric-id, matching the leads page — parity).
//   - lead.list absent   → a manual lead-id field (a user may still hold sales_stage.* for a
//     lead they own and arrive via a direct link; the server enforces the lead scope on read).
//
// Never calls apiFetch directly — reads go through leadsService.

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useDebounce } from "@/app/v2/hooks/useDebounce";
import { leadsService } from "@/app/v2/features/leads";
import { SALES_STAGE_LABELS } from "../config/salesStagesConfig.js";

const LEAD_STATUS_FALLBACK = (status) => SALES_STAGE_LABELS[status] ?? status ?? "";

export function LeadPicker({ selectedLeadId, onPick }) {
  const { hasPermission } = usePermission();
  const canListLeads = hasPermission(PERMISSIONS.LEAD.LIST);

  if (canListLeads) {
    return <LeadSearchList selectedLeadId={selectedLeadId} onPick={onPick} />;
  }
  return <ManualLeadId selectedLeadId={selectedLeadId} onPick={onPick} />;
}

// ── Searchable leads list (lead.list) ────────────────────────────────────────────────
function LeadSearchList({ selectedLeadId, onPick }) {
  const [searchInput, setSearchInput] = useState("");
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Parity with the leads page: the leads list only honors search-by-numeric-id. A non-numeric
  // term matches nothing; an empty term lists the first page (the user's scoped pool).
  const debounced = useDebounce(searchInput, 400);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const term = debounced.trim();
      const id = /^\d+$/.test(term) ? term : null;
      const res = await leadsService.listLeads({
        page: 1,
        limit: 10,
        filters: id ? { id } : {},
      });
      const data = res?.data ?? {};
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [debounced]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
        اختر عميلاً لعرض مراحل البيع
      </Typography>
      <TextField
        fullWidth
        size="small"
        label="بحث برقم العميل"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        sx={{ mb: 1.5 }}
      />

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {!isLoading && error && <Alert severity="error">تعذر جلب قائمة العملاء.</Alert>}

      {!isLoading && !error && items.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 2 }}>
          لا توجد نتائج.
        </Typography>
      )}

      {!isLoading && !error && items.length > 0 && (
        <List dense disablePadding>
          {items.map((lead) => {
            const isSelected = Number(lead.id) === Number(selectedLeadId);
            const name = lead?.client?.name || "بدون اسم";
            return (
              <ListItemButton
                key={lead.id}
                selected={isSelected}
                onClick={() => onPick(String(lead.id))}
                sx={{ borderRadius: 1, mb: 0.5, border: 1, borderColor: "divider" }}
              >
                <ListItemText
                  primary={`#${lead.id} — ${name}`}
                  secondary={LEAD_STATUS_FALLBACK(lead.status)}
                />
              </ListItemButton>
            );
          })}
        </List>
      )}
    </Paper>
  );
}

// ── Manual lead-id entry (no lead.list) ──────────────────────────────────────────────
function ManualLeadId({ selectedLeadId, onPick }) {
  const [value, setValue] = useState(selectedLeadId ? String(selectedLeadId) : "");

  function submit() {
    const term = value.trim();
    if (/^\d+$/.test(term)) onPick(term);
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
        أدخل رقم العميل لعرض مراحل البيع
      </Typography>
      <Stack direction="row" spacing={1.5}>
        <TextField
          size="small"
          label="رقم العميل"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          sx={{ minWidth: 220 }}
        />
        <Button variant="contained" onClick={submit} disabled={!/^\d+$/.test(value.trim())}>
          عرض
        </Button>
      </Stack>
    </Paper>
  );
}

export default LeadPicker;
