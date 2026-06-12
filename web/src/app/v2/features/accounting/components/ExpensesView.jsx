"use client";

// Operational expenses view — v2 port of OperationalExpenses.jsx. Paginated list over
// GET /v2/accounting/operational-expenses + a create dialog building the EXACT strict body
// { category, amount, description?, paymentDate }. Money validated client-side (positive
// finite). Gated on EXPENSE_LIST / EXPENSE_CREATE. Per-row notes via NotesDialog
// (idKey: operationalExpensesId).

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
import { MdAdd } from "react-icons/md";
import dayjs from "dayjs";
import { useT } from "@/app/v2/lib/i18n";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { usePaginatedList } from "../hooks/usePaginatedList.js";
import { accountingService } from "../accounting.service.js";
import { runAccountingMutation } from "../accounting.mutations.js";
import { NotesDialog } from "./NotesDialog.jsx";

const P = PERMISSIONS.ACCOUNTING;

export function ExpensesView() {
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canList = hasPermission(P.EXPENSE_LIST);
  const canCreate = hasPermission(P.EXPENSE_CREATE);

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { items, total, page, setPage, pageSize, setPageSize, isLoading, refetch } = usePaginatedList(
    accountingService.listExpenses,
    { autoFetch: canList },
  );

  const { control, handleSubmit, reset } = useForm({
    defaultValues: { category: "", description: "", amount: "", paymentDate: dayjs().format("YYYY-MM-DD") },
  });

  function closeCreate() {
    setCreateOpen(false);
    reset({ category: "", description: "", amount: "", paymentDate: dayjs().format("YYYY-MM-DD") });
  }

  async function onSubmit(values) {
    const res = await runAccountingMutation(
      () =>
        accountingService.createExpense({
          category: values.category,
          amount: Number(values.amount),
          description: values.description,
          paymentDate: values.paymentDate,
        }),
      { loading: t("accounting.expenses.loading"), setLoading: setSubmitting },
    );
    if (res) {
      closeCreate();
      refetch();
    }
  }

  if (!canList) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        {t("accounting.expenses.denied")}
      </Typography>
    );
  }

  return (
    <Box>
      {canCreate && (
        <Box sx={{ mb: 2 }}>
          <Button variant="outlined" startIcon={<MdAdd />} onClick={() => setCreateOpen(true)}>
            {t("accounting.expenses.addButton")}
          </Button>
        </Box>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("accounting.expenses.col.category")}</TableCell>
              <TableCell>{t("accounting.expenses.col.description")}</TableCell>
              <TableCell>{t("accounting.expenses.col.amount")}</TableCell>
              <TableCell>{t("accounting.expenses.col.paymentDate")}</TableCell>
              <TableCell align="right">{t("accounting.action.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {t("accounting.state.loading")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {t("accounting.state.empty")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              items.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{row.description ?? "—"}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>{row.paymentDate ? dayjs(row.paymentDate).format("YYYY/MM/DD") : "—"}</TableCell>
                  <TableCell align="right">
                    <NotesDialog idKey="operationalExpensesId" id={row.id} buttonLabel={t("accounting.action.notes")} />
                  </TableCell>
                </TableRow>
              ))}
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
          labelRowsPerPage={t("accounting.table.rowsPerPage")}
        />
      </TableContainer>

      <Dialog open={createOpen} onClose={closeCreate} fullWidth maxWidth="sm">
        <DialogTitle>{t("accounting.expenses.createTitle")}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Controller
                name="category"
                control={control}
                rules={{ required: t("accounting.validation.categoryRequired") }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label={t("accounting.expenses.field.category")}
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="description"
                control={control}
                render={({ field }) => <TextField {...field} label={t("accounting.expenses.field.description")} fullWidth multiline minRows={2} />}
              />
              <Controller
                name="amount"
                control={control}
                rules={{
                  required: t("accounting.validation.amountRequired"),
                  validate: (v) => {
                    const n = Number(v);
                    return (Number.isFinite(n) && n > 0) || t("accounting.validation.amountPositive");
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="number"
                    label={t("accounting.expenses.field.amount")}
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="paymentDate"
                control={control}
                rules={{ required: t("accounting.validation.paymentDateRequired") }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="date"
                    label={t("accounting.expenses.field.paymentDate")}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCreate}>{t("accounting.action.cancel")}</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {t("accounting.action.add")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default ExpensesView;
