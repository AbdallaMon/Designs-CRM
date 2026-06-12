"use client";

// Monthly-salary pay dialog — v2 port of MonthlySalaryDialog.jsx. On open it fetches the
// employee's monthly activity (GET /v2/accounting/users/:userId/last-seen → totalMonthHours)
// to prefill the worked hours, then pays via POST /v2/accounting/salaries/monthly/pay with
// the EXACT strict body { baseSalaryId, totalHoursWorked, netSalary, overtimeHours?,
// bonuses?, deductions?, isFulfilled?, paymentDate }. Money validated client-side (the BE
// requires totalHoursWorked & netSalary positive, the optional numeric fields non-negative).
// Gated on SALARY_PAY (last-seen prefill additionally needs USER_LAST_SEEN).

import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { MdPayments } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { accountingService } from "../accounting.service.js";
import { runAccountingMutation } from "../accounting.mutations.js";
import { formatCurrency } from "../config/accountingConstants.js";

const P = PERMISSIONS.ACCOUNTING;

export function MonthlySalaryDialog({ salaryData, onPaid }) {
  const { hasPermission } = usePermission();
  const canPay = hasPermission(P.SALARY_PAY);
  const canLastSeen = hasPermission(P.USER_LAST_SEEN);

  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [monthly, setMonthly] = useState(null);
  const [form, setForm] = useState({
    totalHoursWorked: 0,
    overtimeHours: 0,
    bonuses: 0,
    deductions: 0,
    netSalary: Number(salaryData?.baseSalary) || 0,
    isFulfilled: false,
    paymentDate: dayjs().format("YYYY-MM-DD"),
  });

  async function handleOpen() {
    setOpen(true);
    if (!canLastSeen) return;
    setFetching(true);
    try {
      const res = await accountingService.getUserLastSeen(salaryData.userId, {});
      const data = res?.data ?? res;
      setMonthly(data);
      setForm((f) => ({
        ...f,
        totalHoursWorked: Number(data?.totalMonthHours) || 0,
        netSalary: Number(salaryData?.baseSalary) || 0,
      }));
    } catch {
      // keep defaults
    } finally {
      setFetching(false);
    }
  }

  function setField(name, value, isNumber = false) {
    setForm((f) => ({ ...f, [name]: isNumber ? Number(value) || 0 : value }));
  }

  async function handleSubmit() {
    if (!(Number(form.totalHoursWorked) > 0) || !(Number(form.netSalary) > 0)) return;
    const res = await runAccountingMutation(
      () =>
        accountingService.payMonthlySalary({
          baseSalaryId: salaryData.id,
          totalHoursWorked: Number(form.totalHoursWorked),
          netSalary: Number(form.netSalary),
          overtimeHours: Number(form.overtimeHours),
          bonuses: Number(form.bonuses),
          deductions: Number(form.deductions),
          isFulfilled: Boolean(form.isFulfilled),
          paymentDate: form.paymentDate,
        }),
      { loading: "جاري دفع الراتب...", setLoading: setSubmitting },
    );
    if (res) {
      onPaid?.(res.data);
      setOpen(false);
    }
  }

  if (!canPay) return null;

  return (
    <>
      <Button variant="contained" size="small" startIcon={<MdPayments />} onClick={handleOpen}>
        دفع الراتب الشهري
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>دفع الراتب الشهري</DialogTitle>
        <DialogContent dividers>
          {fetching ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  بيانات الموظف
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      الاسم
                    </Typography>
                    <Typography fontWeight="bold">{salaryData.employee?.name}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      الراتب الأساسي
                    </Typography>
                    <Typography fontWeight="bold">{formatCurrency(salaryData.baseSalary)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      ساعات الشهر المسجلة
                    </Typography>
                    <Typography fontWeight="bold">{monthly?.totalMonthHours ?? "—"}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="إجمالي ساعات العمل"
                      value={form.totalHoursWorked}
                      onChange={(e) => setField("totalHoursWorked", e.target.value, true)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الساعات الإضافية"
                      value={form.overtimeHours}
                      onChange={(e) => setField("overtimeHours", e.target.value, true)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="المكافآت"
                      value={form.bonuses}
                      onChange={(e) => setField("bonuses", e.target.value, true)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الخصومات"
                      value={form.deductions}
                      onChange={(e) => setField("deductions", e.target.value, true)}
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="صافي الراتب (المبلغ المدفوع فعلياً)"
                      value={form.netSalary}
                      onChange={(e) => setField("netSalary", e.target.value, true)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={form.isFulfilled}
                          onChange={(e) => setField("isFulfilled", e.target.checked)}
                        />
                      }
                      label="هل أكمل ساعات العمل"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="تاريخ الدفع"
                      value={form.paymentDate}
                      onChange={(e) => setField("paymentDate", e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>إلغاء</Button>
          <Button
            variant="contained"
            disabled={submitting || !(Number(form.totalHoursWorked) > 0) || !(Number(form.netSalary) > 0)}
            onClick={handleSubmit}
          >
            دفع
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default MonthlySalaryDialog;
