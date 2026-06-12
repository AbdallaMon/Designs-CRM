"use client";

import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { FaSync } from "react-icons/fa";
import { useT } from "@/app/v2/lib/i18n";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { usePdfUtility } from "../hooks/usePdfUtility.js";
import { PDF_UTILITY_FIELDS } from "../config/siteUtilityConstants.js";
import PdfUtilityFieldCard from "./PdfUtilityFieldCard.jsx";

/**
 * PDF-utility manager: reads the singleton config and renders one editable card per
 * field. Editing is gated on SITE_UTILITY.PDF_CONFIG_EDIT (UI gating is cosmetic; the server
 * still enforces). Migrated from legacy PdfUtility.jsx — same fields, same UX.
 */
export default function PdfUtility() {
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canEdit = hasPermission(PERMISSIONS.SITE_UTILITY.PDF_CONFIG_EDIT);

  const { data, loading, refetch, upsert } = usePdfUtility();

  return (
    <Box sx={{ position: "relative", py: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">{t("siteUtility.pdf.title")}</Typography>
        <IconButton onClick={refetch} disabled={loading} aria-label="refresh">
          {loading ? <CircularProgress size={18} /> : <FaSync />}
        </IconButton>
      </Stack>

      <Grid container spacing={2}>
        {PDF_UTILITY_FIELDS.map((f) => (
          <Grid size={{ xs: 12, md: 6 }} key={f.key}>
            <PdfUtilityFieldCard
              title={f.label}
              itemKey={f.key}
              value={data?.[f.key] || ""}
              disabled={!canEdit}
              onSave={upsert}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
