"use client";

// Reusable client-lead search autocomplete (name / phone / email / code). Wraps the
// utilities cross-model search (GET /v2/utilities/search?model=clientLead&query=) — the BE
// already searches name/phone/email/code. Debounced (~300ms), fires only at >= 2 chars, and
// renders each option via the shared SEARCH_MODELS.CLIENT_LEAD projection (primary/secondary)
// so the labels match the utilities search surface. Single-language Arabic / RTL.
//
// Props:
//   • onSelect(lead)  — fires with the chosen clientLead record (the raw search row).
//   • label           — optional field label (default below).
// Never calls apiFetch directly — goes through utilitiesService (the only place that may).

import { useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, CircularProgress, TextField, Typography, Box } from "@mui/material";
import { useT } from "@/app/v2/lib/i18n";
import { utilitiesService } from "@/app/v2/features/utilities/utilities.service.js";
import {
  SEARCH_MODELS,
  getSearchModelDef,
} from "@/app/v2/features/utilities/config/utilitiesSurfaces.js";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

export function LeadSearchAutocomplete({ onSelect, label }) {
  const { t } = useT();
  const resolvedLabel = label ?? t("leads.search.label");
  const def = useMemo(() => getSearchModelDef(SEARCH_MODELS.CLIENT_LEAD), []);

  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  // Guards against out-of-order responses overwriting a newer query's results.
  const reqIdRef = useRef(0);

  useEffect(() => {
    const query = inputValue.trim();
    if (query.length < MIN_CHARS) {
      setOptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const myReqId = ++reqIdRef.current;
    const handle = setTimeout(async () => {
      try {
        const res = await utilitiesService.search({
          model: SEARCH_MODELS.CLIENT_LEAD,
          query,
        });
        if (myReqId !== reqIdRef.current) return; // a newer query superseded this one
        const items = Array.isArray(res?.data) ? res.data : res?.data?.items ?? [];
        setOptions(items);
      } catch {
        if (myReqId === reqIdRef.current) setOptions([]);
      } finally {
        if (myReqId === reqIdRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [inputValue]);

  return (
    <Autocomplete
      sx={{ minWidth: 320 }}
      size="small"
      filterOptions={(x) => x} // server-side search; don't re-filter client-side
      options={options}
      loading={loading}
      loadingText={t("leads.search.loading")}
      noOptionsText={
        inputValue.trim().length < MIN_CHARS
          ? t("leads.search.minChars")
          : t("leads.search.noResults")
      }
      getOptionLabel={(opt) => (typeof opt === "string" ? opt : def.primary(opt) || "")}
      isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
      inputValue={inputValue}
      onInputChange={(_e, val, reason) => {
        if (reason !== "reset") setInputValue(val);
      }}
      onChange={(_e, value) => {
        if (value && typeof value !== "string") onSelect?.(value);
      }}
      renderOption={(props, opt) => {
        const { key, ...rest } = props;
        return (
          <Box component="li" key={opt.id ?? key} {...rest}>
            <Box>
              <Typography variant="body2">{def.primary(opt)}</Typography>
              {def.secondary(opt) && (
                <Typography variant="caption" color="text.secondary">
                  {def.secondary(opt)}
                </Typography>
              )}
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={resolvedLabel}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}

export default LeadSearchAutocomplete;
