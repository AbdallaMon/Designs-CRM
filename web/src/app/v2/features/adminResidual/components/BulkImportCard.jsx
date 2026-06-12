"use client";

// <BulkImportCard /> — admin bulk lead import (UX plan §3.10). Multipart "file" upload via the
// SERVICE (importLeads → POST /v2/admin/leads/excel, isMultipart). UX: pick an .xlsx file →
// "استيراد" with a blocking progress state (the upload is a single request; we show an
// indeterminate progress, never a frozen button) → a result-summary panel built from the
// returned envelope `data` (imported/skipped/errors when present). Gated at the CALL SITE on
// LEAD_IMPORT. Single-language Arabic / RTL.

import { useRef, useState } from "react";
import {
  Box,
  Button,
  LinearProgress,
  Stack,
  Typography,
  Alert,
  Chip,
} from "@mui/material";
import { MdUploadFile, MdDescription } from "react-icons/md";
import { useT } from "@/app/v2/lib/i18n";
import { SectionCard, SuccessState } from "@/app/v2/shared/components";
import { adminResidualService } from "../adminResidual.service.js";
import { runAdminResidualMutation } from "../adminResidual.mutations.js";

export function BulkImportCard() {
  const { t } = useT();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState(null);

  function pickFile(e) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setSummary(null);
  }

  async function onImport() {
    if (!file) return;
    setSummary(null);
    const res = await runAdminResidualMutation(() => adminResidualService.importLeads(file), {
      loading: t("adminResidual.import.loading", "جارٍ استيراد الملف..."),
      setLoading: setImporting,
    });
    if (res) {
      // The frozen importer returns a summary under the envelope `data` (shape varies); render
      // defensively: imported/created count, skipped, and any error rows.
      const d = res.data ?? {};
      setSummary({
        imported: d.imported ?? d.created ?? d.count ?? null,
        skipped: d.skipped ?? null,
        errors: Array.isArray(d.errors) ? d.errors : [],
        raw: d,
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <SectionCard
      title={t("adminResidual.import.title", "استيراد العملاء المحتملين")}
      subtitle={t("adminResidual.import.subtitle", "ارفع ملف Excel (.xlsx) لاستيراد دفعة من العملاء المحتملين.")}
    >
      <Stack spacing={2}>
        <Box>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={pickFile}
            style={{ display: "none" }}
            id="bulk-import-input"
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
            <Button
              component="label"
              htmlFor="bulk-import-input"
              variant="outlined"
              startIcon={<MdDescription />}
              disabled={importing}
            >
              {t("adminResidual.import.pickFile", "اختيار ملف")}
            </Button>
            {file && (
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                {file.name}
              </Typography>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              color="primary"
              startIcon={<MdUploadFile />}
              onClick={onImport}
              disabled={!file || importing}
            >
              {t("adminResidual.import.submit", "استيراد")}
            </Button>
          </Stack>
        </Box>

        {importing && (
          <Box>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              {t("adminResidual.import.processing", "جارٍ معالجة الملف، قد تستغرق العملية بعض الوقت…")}
            </Typography>
          </Box>
        )}

        {summary && (
          <Box>
            <SuccessState
              title={t("adminResidual.import.success.title", "تم استيراد الملف")}
              message={t("adminResidual.import.success.message", "فيما يلي ملخّص نتيجة الاستيراد.")}
            />
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
              {summary.imported != null && (
                <Chip
                  color="success"
                  label={t("adminResidual.import.chip.imported", "تم الاستيراد: {x}").replace(
                    "{x}",
                    summary.imported,
                  )}
                />
              )}
              {summary.skipped != null && (
                <Chip
                  color="warning"
                  label={t("adminResidual.import.chip.skipped", "تم التخطّي: {x}").replace(
                    "{x}",
                    summary.skipped,
                  )}
                />
              )}
              {summary.errors.length > 0 && (
                <Chip
                  color="error"
                  label={t("adminResidual.import.chip.errors", "أخطاء: {x}").replace(
                    "{x}",
                    summary.errors.length,
                  )}
                />
              )}
            </Stack>
            {summary.errors.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {t("adminResidual.import.errors.title", "صفوف بها أخطاء:")}
                </Typography>
                <Box component="ul" sx={{ m: 0, ps: 2.5 }}>
                  {summary.errors.slice(0, 20).map((err, i) => (
                    <li key={i}>
                      <Typography variant="caption">
                        {typeof err === "string" ? err : JSON.stringify(err)}
                      </Typography>
                    </li>
                  ))}
                </Box>
              </Alert>
            )}
          </Box>
        )}
      </Stack>
    </SectionCard>
  );
}

export default BulkImportCard;
