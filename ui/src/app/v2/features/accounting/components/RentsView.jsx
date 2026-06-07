"use client";

// Rents view — v2 port of Rents.jsx. Paginated list over GET /v2/accounting/rents (each row
// carries `rentPeriods` = the latest period object + capabilities.*), a create dialog
// (POST /, strict body { name, amount, description?, startDate, endDate, paymentDate }) and
// a renew dialog (PUT /:rentId, strict body { name?, amount, startDate, endDate, paymentDate? }).
// Money validated client-side (positive finite). Gated on RENT_LIST / RENT_CREATE / RENT_RENEW
// (× capabilities.canRenew). Per-row notes via NotesDialog (idKey: rentId).

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { MdAdd, MdAutorenew } from "react-icons/md";
import dayjs from "dayjs";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { usePaginatedList } from "../hooks/usePaginatedList.js";
import { accountingService } from "../accounting.service.js";
import { runAccountingMutation } from "../accounting.mutations.js";
import { NotesDialog } from "./NotesDialog.jsx";

const P = PERMISSIONS.ACCOUNTING;

const today = () => dayjs().format("YYYY-MM-DD");

export function RentsView() {
  const { hasPermission } = usePermission();
  const canList = hasPermission(P.RENT_LIST);
  const canCreate = hasPermission(P.RENT_CREATE);
  const canRenew = hasPermission(P.RENT_RENEW);

  const [createOpen, setCreateOpen] = useState(false);
  const [renewTarget, setRenewTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { items, total, page, setPage, pageSize, setPageSize, isLoading, refetch } = usePaginatedList(
    accountingService.listRents,
    { autoFetch: canList },
  );

  const createForm = useForm({
    defaultValues: {
      name: "",
      description: "",
      amount: "",
      startDate: today(),
      endDate: today(),
      paymentDate: today(),
    },
  });
  const renewForm = useForm({
    defaultValues: { amount: "", startDate: today(), endDate: today(), paymentDate: today() },
  });

  function closeCreate() {
    setCreateOpen(false);
    createForm.reset();
  }
  function openRenew(rent) {
    renewForm.reset({ amount: "", startDate: today(), endDate: today(), paymentDate: today() });
    setRenewTarget(rent);
  }

  async function onCreate(values) {
    const res = await runAccountingMutation(
      () =>
        accountingService.createRent({
          name: values.name,
          amount: Number(values.amount),
          description: values.description,
          startDate: values.startDate,
          endDate: values.endDate,
          paymentDate: values.paymentDate,
        }),
      { loading: "جاري إضافة الإيجار...", setLoading: setSubmitting },
    );
    if (res) {
      closeCreate();
      refetch();
    }
  }

  async function onRenew(values) {
    const res = await runAccountingMutation(
      () =>
        accountingService.renewRent(renewTarget.id, {
          name: renewTarget.name, // legacy renew keeps the rent's name for the outcome description
          amount: Number(values.amount),
          startDate: values.startDate,
          endDate: values.endDate,
          paymentDate: values.paymentDate,
        }),
      { loading: "جاري تجديد الإيجار...", setLoading: setSubmitting },
    );
    if (res) {
      setRenewTarget(null);
      refetch();
    }
  }

  if (!canList) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        لا تملك صلاحية الوصول إلى الإيجارات
      </Typography>
    );
  }

  return (
    <Box>
      {canCreate && (
        <Box sx={{ mb: 2 }}>
          <Button variant="outlined" startIcon={<MdAdd />} onClick={() => setCreateOpen(true)}>
            إضافة إيجار
          </Button>
        </Box>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>الاسم</TableCell>
              <TableCell>الوصف</TableCell>
              <TableCell>تاريخ البداية</TableCell>
              <TableCell>تاريخ النهاية</TableCell>
              <TableCell>المبلغ</TableCell>
              <TableCell align="right">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  لا توجد بيانات
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              items.map((row) => {
                const period = row.rentPeriods ?? {};
                const caps = row.capabilities ?? {};
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.description ?? "—"}</TableCell>
                    <TableCell>{period.startDate ? dayjs(period.startDate).format("YYYY/MM/DD") : "—"}</TableCell>
                    <TableCell>{period.endDate ? dayjs(period.endDate).format("YYYY/MM/DD") : "—"}</TableCell>
                    <TableCell>{period.amount ?? "—"}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {canRenew && (caps.canRenew ?? true) && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<MdAutorenew />}
                            onClick={() => openRenew(row)}
                          >
                            تجديد
                          </Button>
                        )}
                        <NotesDialog idKey="rentId" id={row.id} buttonLabel="ملاحظات" />
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={(_e, p) => setPage(p + 1)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(1);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="عدد الصفوف"
        />
      </TableContainer>

      {/* Create */}
      <Dialog open={createOpen} onClose={closeCreate} fullWidth maxWidth="sm">
        <DialogTitle>إيجار جديد</DialogTitle>
        <form onSubmit={createForm.handleSubmit(onCreate)} noValidate>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Controller
                name="name"
                control={createForm.control}
                rules={{ required: "الاسم مطلوب" }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="اسم الخدمة"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="description"
                control={createForm.control}
                render={({ field }) => <TextField {...field} label="الوصف" fullWidth multiline minRows={2} />}
              />
              <RentMoneyAndDates control={createForm.control} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCreate}>إلغاء</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              إضافة
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Renew */}
      <Dialog open={Boolean(renewTarget)} onClose={() => setRenewTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>تجديد إيجار {renewTarget?.name}</DialogTitle>
        <form onSubmit={renewForm.handleSubmit(onRenew)} noValidate>
          <DialogContent dividers>
            <Stack spacing={2}>
              <RentMoneyAndDates control={renewForm.control} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRenewTarget(null)}>إلغاء</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              تجديد
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

function RentMoneyAndDates({ control }) {
  return (
    <>
      <Controller
        name="amount"
        control={control}
        rules={{
          required: "المبلغ مطلوب",
          validate: (v) => {
            const n = Number(v);
            return (Number.isFinite(n) && n > 0) || "يجب أن يكون المبلغ رقماً موجباً";
          },
        }}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            type="number"
            label="المبلغ"
            fullWidth
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="startDate"
        control={control}
        rules={{ required: "تاريخ البداية مطلوب" }}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            type="date"
            label="تاريخ البداية"
            fullWidth
            InputLabelProps={{ shrink: true }}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="endDate"
        control={control}
        rules={{ required: "تاريخ النهاية مطلوب" }}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            type="date"
            label="تاريخ النهاية"
            fullWidth
            InputLabelProps={{ shrink: true }}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="paymentDate"
        control={control}
        rules={{ required: "تاريخ الدفع مطلوب" }}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            type="date"
            label="تاريخ الدفع"
            fullWidth
            InputLabelProps={{ shrink: true }}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          />
        )}
      />
    </>
  );
}

export default RentsView;
