"use client";

// <LoadingState /> — skeletons that MATCH the layout being loaded (UX plan §2). Replaces the
// bare "جاري التحميل..." / `return null` habit. Variants:
//   "table" — header row + N skeleton rows (for DataTablePage and any list).
//   "cards" — a grid of card skeletons (dashboards, galleries).
//   "form"  — stacked field skeletons (modals, editors).
//   "detail"— a title + meta + paragraph block (detail headers).
// Single-language Arabic / RTL; aria-busy region so AT announce the loading state (4.1.3).
//
// Props: variant, rows (table), count (cards), columns (table colspan / card grid cols),
//        fields (form), height (cards), label (optional sr-only/visible loading text).

import { Box, Skeleton, Stack, Grid } from "@mui/material";
import { useT } from "@/app/v2/lib/i18n/I18nProvider";

export function LoadingState({
  variant = "table",
  rows = 6,
  count = 4,
  columns = 5,
  fields = 4,
  height = 140,
  label,
}) {
  const { t } = useT();
  const resolvedLabel = label ?? t("state.loading.label", "جاري التحميل…");
  return (
    <Box role="status" aria-busy="true" aria-live="polite" sx={{ width: "100%" }}>
      <Box sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {resolvedLabel}
      </Box>
      {variant === "table" && <TableSkeleton rows={rows} columns={columns} />}
      {variant === "cards" && <CardsSkeleton count={count} columns={columns} height={height} />}
      {variant === "form" && <FormSkeleton fields={fields} />}
      {variant === "detail" && <DetailSkeleton />}
    </Box>
  );
}

function TableSkeleton({ rows, columns }) {
  const cols = Array.from({ length: columns });
  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ px: 2, py: 1.5 }}>
        {cols.map((_, i) => (
          <Skeleton key={i} variant="text" width={`${100 / columns}%`} height={24} />
        ))}
      </Stack>
      {Array.from({ length: rows }).map((_, r) => (
        <Stack key={r} direction="row" spacing={2} sx={{ px: 2, py: 1.25 }}>
          {cols.map((_, i) => (
            <Skeleton key={i} variant="text" width={`${100 / columns}%`} height={20} />
          ))}
        </Stack>
      ))}
    </Box>
  );
}

function CardsSkeleton({ count, columns, height }) {
  const size = Math.max(2, Math.round(12 / Math.min(columns, 6)));
  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: size }}>
          <Skeleton variant="rounded" height={height} sx={{ borderRadius: 3 }} />
        </Grid>
      ))}
    </Grid>
  );
}

function FormSkeleton({ fields }) {
  return (
    <Stack spacing={2.5}>
      {Array.from({ length: fields }).map((_, i) => (
        <Box key={i}>
          <Skeleton variant="text" width={120} height={18} />
          <Skeleton variant="rounded" height={48} sx={{ borderRadius: 2 }} />
        </Box>
      ))}
    </Stack>
  );
}

function DetailSkeleton() {
  return (
    <Stack spacing={1.5}>
      <Skeleton variant="text" width="40%" height={36} />
      <Skeleton variant="text" width="25%" height={20} />
      <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3, mt: 1 }} />
    </Stack>
  );
}

export default LoadingState;
