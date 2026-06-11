"use client";

// <DashboardFilters> — the dashboard scope bar (UX plan §3.1): a date range + (admin-tier
// ONLY) a staffId selector that re-scopes the 9 reads. The staffId control is surfaced only
// when `adminTier` is true; the BE ignores staffId for non-privileged callers anyway, but we
// never render a control the user can't meaningfully use. Apply-driven (not on every keystroke)
// so a single re-scope fires the reads once. Single-language Arabic / RTL; logical spacing.
//
// NOTE: staffId is a free-form numeric id — there is no in-scope staff-list source on the
// dashboard data contract (the 9 reads + the FIXED service). A future pass can swap this for a
// searchable picker once a shared staff pick-list is available; the wire shape is unchanged.

import { Box, Stack, TextField, Button } from "@mui/material";
import { MdFilterAltOff, MdCheck } from "react-icons/md";
import { SectionCard } from "@/app/v2/shared/components";
import { FILTER_COPY } from "../config/dashboardConstants.js";

export function DashboardFilters({ adminTier, draft, setField, apply, reset, isDirty, hasFilters }) {
  return (
    <SectionCard sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "flex-end" }}
      >
        <TextField
          type="date"
          size="small"
          label={FILTER_COPY.startDate}
          value={draft.startDate}
          onChange={(e) => setField("startDate", e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 0, flex: 1 }}
        />
        <TextField
          type="date"
          size="small"
          label={FILTER_COPY.endDate}
          value={draft.endDate}
          onChange={(e) => setField("endDate", e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 0, flex: 1 }}
        />

        {adminTier && (
          <TextField
            type="number"
            size="small"
            label={FILTER_COPY.staffId}
            helperText={FILTER_COPY.staffHelper}
            value={draft.staffId}
            onChange={(e) => setField("staffId", e.target.value)}
            inputProps={{ min: 1, inputMode: "numeric" }}
            sx={{ minWidth: 0, flex: 1 }}
          />
        )}

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={apply}
            disabled={!isDirty}
            startIcon={<MdCheck />}
          >
            {FILTER_COPY.apply}
          </Button>
          <Button
            variant="text"
            color="inherit"
            onClick={reset}
            disabled={!hasFilters && !isDirty}
            startIcon={<MdFilterAltOff />}
          >
            {FILTER_COPY.reset}
          </Button>
        </Box>
      </Stack>
    </SectionCard>
  );
}

export default DashboardFilters;
