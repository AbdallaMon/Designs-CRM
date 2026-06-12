"use client";

// Reports tab — لوحة التقارير. Builds a filter payload (date range / staff / emirate / status
// / lead-type lens) and drives the 🔒 FROZEN lead-report & staff-report generators. The flow
// is the 2-step the backend defines: (1) POST the filters to /reports/<x>-report → JSON data
// ({ leads, summary } / { staffStats, summary, dateRange }); (2) POST that prepared object as
// { data } to /reports/<x>-report/pdf|excel → the generator STREAMS a file we save as a Blob.
// We NEVER touch any PDF/excel generation logic — we only call the endpoint and save bytes.
// Gated upstream by REPORT_GENERATE. Arabic / RTL.

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdPictureAsPdf, MdGridOn } from "react-icons/md";
import { adminResidualService } from "../adminResidual.service.js";
import { runAdminResidualMutation } from "../adminResidual.mutations.js";
import { StaffUserPicker } from "./StaffUserPicker.jsx";
import {
  EMIRATE_LABELS,
  LEAD_STATUS_LABELS,
  REPORT_TYPE_OPTIONS,
  formatAed,
} from "../config/adminResidualConstants.js";

const emptyFilters = {
  startDate: "",
  endDate: "",
  userIds: [],
  emirates: [],
  statuses: [],
  reportType: "",
};

// Strip empty keys so the frozen generator's where-builder sees only active filters.
function buildBody(filters) {
  const body = {};
  if (filters.startDate) body.startDate = filters.startDate;
  if (filters.endDate) body.endDate = filters.endDate;
  if (filters.userIds?.length) body.userIds = filters.userIds.map((n) => Number(n));
  if (filters.emirates?.length) body.emirates = filters.emirates;
  if (filters.statuses?.length) body.statuses = filters.statuses;
  if (filters.reportType) body.reportType = filters.reportType;
  return body;
}

export function ReportsTab() {
  const [filters, setFilters] = useState(emptyFilters);
  const [busy, setBusy] = useState(false);
  // Holds the last fetched data payloads so the summary preview + downloads stay in sync.
  const [leadData, setLeadData] = useState(null);
  const [staffData, setStaffData] = useState(null);

  const set = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  // ── lead report ────────────────────────────────────────────────────────────────────
  async function fetchLeadData() {
    const res = await runAdminResidualMutation(
      () => adminResidualService.generateLeadReportData(buildBody(filters)),
      { loading: "جاري إعداد تقرير العملاء...", setLoading: setBusy },
    );
    // The frozen data endpoint returns a RAW { leads, summary } (not the standard envelope),
    // so apiFetch hands it back with those keys at the top level (no `data` wrapper).
    const data = res && (res.leads || res.summary) ? { leads: res.leads, summary: res.summary } : null;
    if (data) setLeadData(data);
    return data;
  }

  async function downloadLead(kind) {
    setBusy(true);
    try {
      const data = leadData ?? (await fetchLeadData());
      if (!data) return;
      await runAdminResidualMutation(
        () =>
          kind === "pdf"
            ? adminResidualService.downloadLeadReportPdf(data)
            : adminResidualService.downloadLeadReportExcel(data),
        { loading: "جاري تنزيل الملف...", setLoading: setBusy },
      );
    } finally {
      setBusy(false);
    }
  }

  // ── staff report ───────────────────────────────────────────────────────────────────
  async function fetchStaffData() {
    const res = await runAdminResidualMutation(
      () => adminResidualService.generateStaffReportData(buildBody(filters)),
      { loading: "جاري إعداد تقرير الموظفين...", setLoading: setBusy },
    );
    const data =
      res && (res.staffStats || res.summary)
        ? { staffStats: res.staffStats, summary: res.summary, dateRange: res.dateRange }
        : null;
    if (data) setStaffData(data);
    return data;
  }

  async function downloadStaff(kind) {
    setBusy(true);
    try {
      const data = staffData ?? (await fetchStaffData());
      if (!data) return;
      await runAdminResidualMutation(
        () =>
          kind === "pdf"
            ? adminResidualService.downloadStaffReportPdf(data)
            : adminResidualService.downloadStaffReportExcel(data),
        { loading: "جاري تنزيل الملف...", setLoading: setBusy },
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        التقارير
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        اختر معايير التصفية ثم نزّل تقرير العملاء المحتملين أو تقرير أداء الموظفين بصيغة PDF أو Excel.
      </Typography>

      {/* Filters */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="من تاريخ"
                InputLabelProps={{ shrink: true }}
                value={filters.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="إلى تاريخ"
                InputLabelProps={{ shrink: true }}
                value={filters.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="rep-emirates">الإمارات</InputLabel>
                <Select
                  labelId="rep-emirates"
                  multiple
                  value={filters.emirates}
                  onChange={(e) => set("emirates", e.target.value)}
                  input={<OutlinedInput label="الإمارات" />}
                  renderValue={(sel) => sel.map((v) => EMIRATE_LABELS[v] ?? v).join("، ")}
                >
                  {Object.entries(EMIRATE_LABELS).map(([k, label]) => (
                    <MenuItem key={k} value={k}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="rep-statuses">الحالات</InputLabel>
                <Select
                  labelId="rep-statuses"
                  multiple
                  value={filters.statuses}
                  onChange={(e) => set("statuses", e.target.value)}
                  input={<OutlinedInput label="الحالات" />}
                  renderValue={(sel) => sel.map((v) => LEAD_STATUS_LABELS[v] ?? v).join("، ")}
                >
                  {Object.entries(LEAD_STATUS_LABELS).map(([k, label]) => (
                    <MenuItem key={k} value={k}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
              <StaffUserPicker
                multiple
                label="الموظفون (اختياري)"
                value={filters.userIds}
                onChange={(v) => set("userIds", v)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="rep-type">نوع التقرير</InputLabel>
                <Select
                  labelId="rep-type"
                  value={filters.reportType}
                  label="نوع التقرير"
                  onChange={(e) => set("reportType", e.target.value)}
                >
                  {REPORT_TYPE_OPTIONS.map((o) => (
                    <MenuItem key={o.value || "all"} value={o.value}>
                      {o.labelAr}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                fullWidth
                variant="text"
                onClick={() => {
                  setFilters(emptyFilters);
                  setLeadData(null);
                  setStaffData(null);
                }}
                disabled={busy}
              >
                إعادة تعيين
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Lead report */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                تقرير العملاء المحتملين
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                ملخص العملاء حسب المعايير المحددة.
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
                <Button variant="outlined" onClick={fetchLeadData} disabled={busy}>
                  معاينة الملخص
                </Button>
                <Button
                  variant="contained"
                  startIcon={<MdPictureAsPdf />}
                  onClick={() => downloadLead("pdf")}
                  disabled={busy}
                >
                  PDF
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<MdGridOn />}
                  onClick={() => downloadLead("excel")}
                  disabled={busy}
                >
                  Excel
                </Button>
              </Stack>

              {leadData?.summary && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <SummaryRow label="إجمالي العملاء" value={leadData.summary.totalLeads} />
                  <SummaryRow label="إجمالي القيمة" value={formatAed(leadData.summary.totalValue)} />
                  <SummaryRow
                    label="متوسط القيمة"
                    value={formatAed(leadData.summary.averageValue)}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Staff report */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                تقرير أداء الموظفين
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                إحصاءات الموظفين والإيرادات حسب المعايير المحددة.
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
                <Button variant="outlined" onClick={fetchStaffData} disabled={busy}>
                  معاينة الملخص
                </Button>
                <Button
                  variant="contained"
                  startIcon={<MdPictureAsPdf />}
                  onClick={() => downloadStaff("pdf")}
                  disabled={busy}
                >
                  PDF
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<MdGridOn />}
                  onClick={() => downloadStaff("excel")}
                  disabled={busy}
                >
                  Excel
                </Button>
              </Stack>

              {staffData?.summary && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <SummaryRow label="عدد الموظفين" value={staffData.summary.totalStaff} />
                  <SummaryRow label="إجمالي العملاء" value={staffData.summary.totalLeads} />
                  <SummaryRow
                    label="إجمالي الإيرادات"
                    value={formatAed(staffData.summary.totalRevenue)}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function SummaryRow({ label, value }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

export default ReportsTab;
