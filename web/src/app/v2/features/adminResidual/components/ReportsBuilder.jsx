"use client";

// <ReportsBuilder /> — the lead/staff report builder (UX plan §3.10). Flow:
//   1) pick a report type (lead | staff) + fill the filter form (dates, emirates, statuses,
//      userIds, clientIds);
//   2) "معاينة" → POST the filter payload to the *data* endpoint via the SERVICE (JSON envelope)
//      → render a JSON/table preview of the prepared data;
//   3) export buttons "تصدير Excel" / "تصدير PDF" → POST the SAME prepared `data` object to the
//      frozen binary endpoint via the NET-NEW download helper (blob → browser download).
//
// 🔒 The generators are FROZEN: the FE only POSTs the payload and downloads the file. We forward
// the filter payload verbatim to the *data* endpoint (BE .passthrough()), and forward the
// returned prepared `data` verbatim to the excel/pdf endpoint (the generator reads it). We do NOT
// touch ApiFetch — the helper does its own credentialed fetch. Single-language Arabic / RTL.

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { MdInsertChart, MdGridOn, MdPictureAsPdf } from "react-icons/md";
import { useT } from "@/app/v2/lib/i18n";
import { SectionCard, EmptyState, LoadingState } from "@/app/v2/shared/components";
import { adminResidualService } from "../adminResidual.service.js";
import { runAdminResidualMutation } from "../adminResidual.mutations.js";
import { downloadFileFromPost } from "../lib/download.js";
import {
  LEAD_REPORT_EXCEL_URL,
  LEAD_REPORT_PDF_URL,
  STAFF_REPORT_EXCEL_URL,
  STAFF_REPORT_PDF_URL,
} from "../config/constant.js";
import { resolveAdminResidualMessage } from "../config/adminResidualMessages.js";
import {
  REPORT_TYPES,
  EMIRATES_OPTIONS,
  LEAD_STATUS_OPTIONS,
} from "../config/adminResidualConstants.js";
import { toast } from "react-toastify";
import { Failed, Success } from "@/app/v2/lib/toast/toastUtils";

const DEFAULTS = {
  startDate: "",
  endDate: "",
  emirates: [],
  statuses: [],
  userIds: "",
  clientIds: "",
};

// Parse a comma/space separated id list into a clean number[]/string[] (forwarded verbatim).
function parseIdList(raw) {
  return String(raw ?? "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ReportsBuilder() {
  const { t } = useT();
  const [reportType, setReportType] = useState("lead"); // "lead" | "staff"
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { control, handleSubmit } = useForm({ defaultValues: DEFAULTS });

  // Build the filter payload the *data* endpoint reads (BE .passthrough → frozen reads verbatim).
  function buildPayload(values) {
    const payload = { reportType };
    if (values.startDate) payload.startDate = values.startDate;
    if (values.endDate) payload.endDate = values.endDate;
    if (Array.isArray(values.emirates) && values.emirates.length) payload.emirates = values.emirates;
    if (Array.isArray(values.statuses) && values.statuses.length) payload.statuses = values.statuses;
    const userIds = parseIdList(values.userIds);
    if (userIds.length) payload.userIds = userIds;
    const clientIds = parseIdList(values.clientIds);
    if (clientIds.length) payload.clientIds = clientIds;
    return payload;
  }

  async function onPreview(values) {
    const payload = buildPayload(values);
    setLoadingPreview(true);
    setPreviewData(null);
    const dataFn =
      reportType === "lead"
        ? () => adminResidualService.generateLeadReportData(payload)
        : () => adminResidualService.generateStaffReportData(payload);
    const res = await runAdminResidualMutation(dataFn, {
      loading: t("adminResidual.reports.preview.loading", "جارٍ إعداد المعاينة..."),
      setLoading: setLoadingPreview,
    });
    // Keep BOTH the filter payload and the prepared data: the export endpoints read `data`.
    if (res) setPreviewData({ filters: payload, data: res.data });
  }

  // Export: POST the prepared `data` to the frozen binary endpoint via the download helper.
  async function onExport(kind) {
    if (!previewData) return;
    const url =
      reportType === "lead"
        ? kind === "excel"
          ? LEAD_REPORT_EXCEL_URL
          : LEAD_REPORT_PDF_URL
        : kind === "excel"
          ? STAFF_REPORT_EXCEL_URL
          : STAFF_REPORT_PDF_URL;
    const ext = kind === "excel" ? "xlsx" : "pdf";
    const fallbackFilename = `${reportType}-report.${ext}`;
    const toastId = toast.loading(t("adminResidual.reports.export.loading", "جارٍ تجهيز الملف..."));
    setExporting(true);
    try {
      // The frozen generator reads a prepared `data` object (data.leads/summary/staffStats).
      await downloadFileFromPost(url, { data: previewData.data }, { fallbackFilename });
      toast.update(toastId, Success(t("adminResidual.reports.export.success", "تم تجهيز الملف")));
    } catch (e) {
      const code = e?.data?.message || e?.message;
      toast.update(
        toastId,
        Failed(
          resolveAdminResidualMessage(code, {
            fallback: t("adminResidual.reports.export.error", "تعذّر تجهيز الملف، حاول مرة أخرى"),
          }),
        ),
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <Stack spacing={3}>
      <SectionCard title={t("adminResidual.reports.type.title", "نوع التقرير")}>
        <ToggleButtonGroup
          exclusive
          color="primary"
          value={reportType}
          onChange={(_e, v) => {
            if (v) {
              setReportType(v);
              setPreviewData(null);
            }
          }}
        >
          {Object.entries(REPORT_TYPES).map(([value, def]) => (
            <ToggleButton key={value} value={value} sx={{ px: 3 }}>
              {t(def.labelKey, def.labelFallback)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </SectionCard>

      <SectionCard title={t("adminResidual.reports.filters.title", "عوامل التصفية")}>
        <form onSubmit={handleSubmit(onPreview)} noValidate>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label={t("adminResidual.reports.filters.startDate", "من تاريخ")}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label={t("adminResidual.reports.filters.endDate", "إلى تاريخ")}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            {reportType === "lead" && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="emirates"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        SelectProps={{ multiple: true }}
                        label={t("adminResidual.reports.filters.emirates", "الإمارات")}
                        fullWidth
                      >
                        {EMIRATES_OPTIONS.map((o) => (
                          <MenuItem key={o.value} value={o.value}>
                            {t(o.labelKey, o.labelFallback)}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="statuses"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        SelectProps={{ multiple: true }}
                        label={t("adminResidual.reports.filters.statuses", "الحالات")}
                        fullWidth
                      >
                        {LEAD_STATUS_OPTIONS.map((o) => (
                          <MenuItem key={o.value} value={o.value}>
                            {t(o.labelKey, o.labelFallback)}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="clientIds"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={t("adminResidual.reports.filters.clientIds", "معرّفات العملاء (مفصولة بفواصل)")}
                        placeholder={t("adminResidual.reports.filters.clientIds.placeholder", "مثال: 12, 34, 56")}
                        fullWidth
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="userIds"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t("adminResidual.reports.filters.userIds", "معرّفات الموظفين (مفصولة بفواصل)")}
                    placeholder={t("adminResidual.reports.filters.userIds.placeholder", "مثال: 1, 2, 3")}
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<MdInsertChart />}
                disabled={loadingPreview}
              >
                {t("adminResidual.reports.preview.submit", "معاينة")}
              </Button>
            </Grid>
          </Grid>
        </form>
      </SectionCard>

      <SectionCard
        title={t("adminResidual.reports.preview.title", "المعاينة")}
        actions={
          previewData ? (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<MdGridOn />}
                onClick={() => onExport("excel")}
                disabled={exporting}
              >
                {t("adminResidual.reports.export.excel", "تصدير Excel")}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<MdPictureAsPdf />}
                onClick={() => onExport("pdf")}
                disabled={exporting}
              >
                {t("adminResidual.reports.export.pdf", "تصدير PDF")}
              </Button>
            </Stack>
          ) : null
        }
      >
        {loadingPreview ? (
          <LoadingState variant="detail" />
        ) : !previewData ? (
          <EmptyState
            title={t("adminResidual.reports.preview.empty.title", "لا توجد معاينة بعد")}
            description={t(
              "adminResidual.reports.preview.empty.description",
              "اضبط عوامل التصفية ثم اضغط «معاينة» لعرض بيانات التقرير قبل التصدير.",
            )}
          />
        ) : (
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              maxHeight: 420,
              overflow: "auto",
              direction: "ltr",
              textAlign: "left",
              bgcolor: "action.hover",
              borderRadius: 2,
              fontSize: 13,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {JSON.stringify(previewData.data, null, 2)}
          </Box>
        )}
        {previewData && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            {t(
              "adminResidual.reports.preview.note",
              "تُصدَّر الملفات من بيانات المعاينة المعروضة أعلاه دون تعديل.",
            )}
          </Typography>
        )}
      </SectionCard>
    </Stack>
  );
}

export default ReportsBuilder;
