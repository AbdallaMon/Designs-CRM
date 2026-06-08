"use client";

// <GlobalSearchPanel /> — the primary utilities surface (UX plan §3.9): a cross-model search box
// + grouped results, each result deep-linking to its record. Gated at the CALL SITE on
// PERMISSIONS.UTILITY.SEARCH. Data flows ONLY through utilitiesService.search() (the sole API
// caller) — never fetch/apiFetch directly. All five states are wired: idle (empty prompt),
// loading (skeleton), error (+retry), empty (no matches), and results. Single-language Arabic /
// RTL.

import { useCallback, useRef, useState } from "react";
import NextLink from "next/link";
import {
  Box,
  Stack,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  InputAdornment,
} from "@mui/material";
import { MdSearch } from "react-icons/md";
import { SectionCard } from "@/app/v2/shared/components";
import { LoadingState } from "@/app/v2/shared/components";
import { ErrorState } from "@/app/v2/shared/components";
import { EmptyState } from "@/app/v2/shared/components";
import { utilitiesService } from "../utilities.service.js";
import { utilitiesMessages } from "../config/utilitiesMessages.js";
import { SEARCH_MODEL_DEFS, getSearchModelDef, SEARCH_MODELS } from "../config/utilitiesSurfaces.js";

export function GlobalSearchPanel() {
  const [model, setModel] = useState(SEARCH_MODELS.CLIENT_LEAD);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState(null); // null = idle (never searched yet)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // The query whose results are currently shown — so the result header can echo it.
  const lastQueryRef = useRef("");

  const def = getSearchModelDef(model);

  const runSearch = useCallback(
    async (e) => {
      e?.preventDefault?.();
      const query = term.trim();
      if (!query) return;
      setLoading(true);
      setError(null);
      lastQueryRef.current = query;
      try {
        const res = await utilitiesService.search({ model, query });
        setResults(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        setError(err?.data?.message || err?.message || "SEARCH_FAILED");
        setResults(null);
      } finally {
        setLoading(false);
      }
    },
    [model, term],
  );

  return (
    <Stack spacing={3}>
      <SectionCard
        title="البحث الشامل"
        subtitle="ابحث عبر العملاء المحتملين والعملاء والمستخدمين، وانتقل مباشرة إلى السجل."
      >
        <form onSubmit={runSearch} noValidate>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="stretch">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="search-model-label">نوع السجل</InputLabel>
              <Select
                labelId="search-model-label"
                label="نوع السجل"
                value={model}
                onChange={(ev) => {
                  setModel(ev.target.value);
                  setResults(null);
                  setError(null);
                }}
              >
                {SEARCH_MODEL_DEFS.map((m) => (
                  <MenuItem key={m.key} value={m.key}>
                    {m.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              fullWidth
              label="كلمة البحث"
              placeholder={def.placeholder}
              value={term}
              onChange={(ev) => setTerm(ev.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdSearch />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !term.trim()}
              startIcon={<MdSearch />}
              sx={{ whiteSpace: "nowrap" }}
            >
              بحث
            </Button>
          </Stack>
        </form>
      </SectionCard>

      <ResultsArea
        loading={loading}
        error={error}
        results={results}
        def={def}
        query={lastQueryRef.current}
        onRetry={runSearch}
      />
    </Stack>
  );
}

function ResultsArea({ loading, error, results, def, query, onRetry }) {
  if (loading) {
    return (
      <SectionCard title="النتائج">
        <LoadingState variant="table" rows={5} columns={2} />
      </SectionCard>
    );
  }
  if (error) {
    return (
      <SectionCard title="النتائج">
        <ErrorState error={error} onRetry={onRetry} resolver={utilitiesMessages} />
      </SectionCard>
    );
  }
  if (results === null) {
    // Idle — never searched yet.
    return (
      <EmptyState
        title="ابدأ البحث"
        description="اختر نوع السجل واكتب كلمة البحث ثم اضغط «بحث» لعرض النتائج المطابقة."
      />
    );
  }
  if (results.length === 0) {
    return (
      <EmptyState
        title="لا توجد نتائج"
        description={`لم يُعثر على أي «${def.label}» مطابق لكلمة البحث «${query}». جرّب كلمة أخرى.`}
      />
    );
  }

  return (
    <SectionCard
      title="النتائج"
      actions={<Chip size="small" label={`${results.length} نتيجة`} variant="outlined" />}
      noPadding
    >
      <List disablePadding>
        {results.map((row, i) => {
          const href = def.href?.(row) ?? null;
          const primary = def.primary(row);
          const secondary = def.secondary(row);
          const content = (
            <ListItemText
              primary={primary}
              secondary={secondary || undefined}
              slotProps={{ primary: { sx: { fontWeight: 600 } } }}
            />
          );
          return (
            <ListItem key={row?.id ?? i} divider disablePadding>
              {href ? (
                <ListItemButton component={NextLink} href={href}>
                  {content}
                </ListItemButton>
              ) : (
                <Box sx={{ width: "100%", px: 2, py: 1.25 }}>{content}</Box>
              )}
            </ListItem>
          );
        })}
      </List>
    </SectionCard>
  );
}

export default GlobalSearchPanel;
