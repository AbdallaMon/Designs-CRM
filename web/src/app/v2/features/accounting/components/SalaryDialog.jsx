"use client";

// Salary detail dialog — v2 port of SalaryDialog.jsx. For a user WITH a base salary it
// fetches GET /v2/accounting/salaries/data?userId=&startDate=&endDate= (the controller
// returns the base-salary object inc. employee + monthlySalaries[]), and exposes:
//  • a date-range refilter,
//  • edit base salary  → PUT /v2/accounting/salaries/:id  (strict { baseSalary, baseWorkHours, taxAmount }),
//    gated on SALARY_EDIT,
//  • the monthly-pay dialog (separate component), gated on SALARY_PAY,
//  • per-base-salary notes (idKey: baseEmployeeSalaryId).
// Gated on SALARY_VIEW. Money validated client-side.

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { MdEdit } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { accountingService } from "../accounting.service.js";
import { runAccountingMutation } from "../accounting.mutations.js";
import { formatCurrency } from "../config/accountingConstants.js";
import { MonthlySalaryDialog } from "./MonthlySalaryDialog.jsx";
import { NotesDialog } from "./NotesDialog.jsx";

const P = PERMISSIONS.ACCOUNTING;

export function SalaryDialog({ userId }) {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.SALARY_VIEW);
  const canEdit = hasPermission(P.SALARY_EDIT);
  const canPay = hasPermission(P.SALARY_PAY);

  const [open, setOpen] = useState(false);
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState(dayjs().subtract(1, "year").startOf("month").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));

  const editForm = useForm({ defaultValues: { baseSalary: "", baseWorkHours: "", taxAmount: "" } });

  async function fetchSalary() {
    setLoading(true);
    try {
      const res = await accountingService.getSalaryData({ userId, startDate, endDate });
      setSalaryData(res?.data ?? null);
    } catch {
      setSalaryData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    fetchSalary();
  }

  function openEdit() {
    editForm.reset({
      baseSalary: salaryData?.baseSalary ?? "",
      baseWorkHours: salaryData?.baseWorkHours ?? "",
      taxAmount: salaryData?.taxAmount ?? "",
    });
    setEditOpen(true);
  }

  async function onEditSubmit(values) {
    const res = await runAccountingMutation(
      () =>
        accountingService.editBaseSalary(salaryData.id, {
          baseSalary: Number(values.baseSalary),
          baseWorkHours: Number(values.baseWorkHours),
          taxAmount: Number(values.taxAmount),
        }),
      { loading: "جاري تحديث الراتب الأساسي...", setLoading: setSubmitting },
    );
    if (res) {
      setEditOpen(false);
      fetchSalary();
    }
  }

  if (!canView) return null;

  return (
    <>
      <Button variant="contained" size="small" onClick={handleOpen}>
        بيانات الراتب
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullScreen>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">بيانات الراتب</Typography>
            <Button variant="outlined" onClick={() => setOpen(false)}>
              إغلاق
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : !salaryData ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
              لا توجد بيانات
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {/* Filter + actions */}
              <Grid size={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", alignItems: "center" }}>
                    <TextField
                      type="date"
                      size="small"
                      label="من"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      type="date"
                      size="small"
                      label="إلى"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Button variant="outlined" onClick={fetchSalary}>
                      تطبيق
                    </Button>
                    {canEdit && (
                      <Button variant="outlined" startIcon={<MdEdit />} onClick={openEdit}>
                        تعديل الراتب الأساسي
                      </Button>
                    )}
                    {canPay && (
                      <MonthlySalaryDialog
                        salaryData={salaryData}
                        onPaid={(monthly) =>
                          setSalaryData((old) =>
                            old ? { ...old, monthlySalaries: [monthly, ...(old.monthlySalaries ?? [])] } : old,
                          )
                        }
                      />
                    )}
                    <NotesDialog idKey="baseEmployeeSalaryId" id={salaryData.id} buttonLabel="ملاحظات" />
                  </Stack>
                </Paper>
              </Grid>

              {/* Employee + base salary */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6">{salaryData.employee?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {salaryData.employee?.email}
                    </Typography>
                    <Chip label={salaryData.employee?.role} color="primary" size="small" sx={{ mt: 1 }} />
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={1}>
                    <Grid size={6}>
                      <Typography variant="body2" color="text.secondary">
                        الراتب الأساسي
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography fontWeight="bold">{formatCurrency(salaryData.baseSalary)}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="body2" color="text.secondary">
                        مبلغ الضريبة
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography>{formatCurrency(salaryData.taxAmount)}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="body2" color="text.secondary">
                        ساعات العمل الأساسية
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography>{salaryData.baseWorkHours} ساعة</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Monthly salaries */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    الرواتب الشهرية
                  </Typography>
                  {salaryData.monthlySalaries?.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>الشهر</TableCell>
                            <TableCell>الساعات</TableCell>
                            <TableCell>الإضافي</TableCell>
                            <TableCell>المكافآت</TableCell>
                            <TableCell>الخصومات</TableCell>
                            <TableCell>صافي الراتب</TableCell>
                            <TableCell>الحالة</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {salaryData.monthlySalaries.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell>{dayjs(s.createdAt).format("MM/YYYY")}</TableCell>
                              <TableCell>{s.totalHoursWorked}</TableCell>
                              <TableCell>{s.overtimeHours}</TableCell>
                              <TableCell>{formatCurrency(s.bonuses)}</TableCell>
                              <TableCell>{formatCurrency(s.deductions)}</TableCell>
                              <TableCell sx={{ fontWeight: "bold" }}>{formatCurrency(s.netSalary)}</TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  color={s.isFulfilled ? "success" : "warning"}
                                  label={s.isFulfilled ? "مكتمل" : "غير مكتمل"}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                      لا توجد سجلات رواتب ضمن النطاق المحدد
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit base salary */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>تعديل الراتب الأساسي</DialogTitle>
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} noValidate>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Controller
                name="baseSalary"
                control={editForm.control}
                rules={{
                  required: "مطلوب",
                  validate: (v) => Number(v) > 0 || "يجب أن يكون رقماً موجباً",
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="الراتب الأساسي"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="baseWorkHours"
                control={editForm.control}
                rules={{
                  required: "مطلوب",
                  validate: (v) => Number(v) > 0 || "يجب أن يكون رقماً موجباً",
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="ساعات العمل الأساسية"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="taxAmount"
                control={editForm.control}
                rules={{
                  required: "مطلوب",
                  validate: (v) => Number(v) >= 0 || "يجب أن يكون رقماً غير سالب",
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="مبلغ الضريبة"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>إلغاء</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              حفظ
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

export default SalaryDialog;
