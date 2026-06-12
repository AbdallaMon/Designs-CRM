"use client";

// Salaries directory view — v2 port of Salaries.jsx. Paginated list of users-with-salaries
// (GET /v2/accounting/users → { items,total }; each user carries `baseSalary` object|null).
// Per row: if the user already has a base salary → open the SalaryDialog (view/edit/pay);
// otherwise → a create-base-salary dialog (POST /v2/accounting/salaries/:userId, strict body
// { baseSalary, baseWorkHours, taxAmount? }). Gated on SALARY_VIEW (list) / SALARY_CREATE
// (create). Money validated client-side.

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  Chip,
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
import { useT } from "@/app/v2/lib/i18n";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { usePaginatedList } from "../hooks/usePaginatedList.js";
import { accountingService } from "../accounting.service.js";
import { runAccountingMutation } from "../accounting.mutations.js";
import { USER_ROLES, ACCOUNT_STATUS } from "../config/accountingConstants.js";
import { SalaryDialog } from "./SalaryDialog.jsx";

const P = PERMISSIONS.ACCOUNTING;

export function SalariesView() {
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canList = hasPermission(P.SALARY_VIEW);
  const canCreate = hasPermission(P.SALARY_CREATE);

  const [createTarget, setCreateTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // initialExtra forces a `filters` param to always be present: buildQuery JSON.stringifies
  // `{}` → `filters=%7B%7D`. Without it the request omits `filters` entirely and the legacy
  // getUsersWithSalaries does `searchParams.filters && JSON.parse(...)` → undefined, then
  // `filters.status` → TypeError → HTTP 500 (salaries list empty forever). See accounting
  // reconciliation FIX 1.
  const { items, total, page, setPage, pageSize, setPageSize, isLoading, refetch } = usePaginatedList(
    accountingService.listUsers,
    { autoFetch: canList, initialExtra: { filters: {} } },
  );

  const form = useForm({ defaultValues: { baseSalary: "", baseWorkHours: "", taxAmount: "" } });

  function openCreate(user) {
    form.reset({ baseSalary: "", baseWorkHours: "", taxAmount: "" });
    setCreateTarget(user);
  }

  async function onCreate(values) {
    const body = {
      baseSalary: Number(values.baseSalary),
      baseWorkHours: Number(values.baseWorkHours),
    };
    if (values.taxAmount !== "" && values.taxAmount != null) body.taxAmount = Number(values.taxAmount);
    const res = await runAccountingMutation(
      () => accountingService.createBaseSalary(createTarget.id, body),
      { loading: t("accounting.salaries.createLoading"), setLoading: setSubmitting },
    );
    if (res) {
      setCreateTarget(null);
      refetch();
    }
  }

  if (!canList) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        {t("accounting.salaries.denied")}
      </Typography>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("accounting.salaries.col.name")}</TableCell>
              <TableCell>{t("accounting.salaries.col.email")}</TableCell>
              <TableCell>{t("accounting.salaries.col.role")}</TableCell>
              <TableCell>{t("accounting.salaries.col.status")}</TableCell>
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
              items.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{USER_ROLES[user.role] ?? user.role}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={user.isActive ? "success" : "default"}
                      label={user.isActive ? ACCOUNT_STATUS.TRUE : ACCOUNT_STATUS.FALSE}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {user.baseSalary ? (
                        <SalaryDialog userId={user.id} />
                      ) : (
                        canCreate && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<MdAdd />}
                            onClick={() => openCreate(user)}
                          >
                            {t("accounting.salaries.createButton")}
                          </Button>
                        )
                      )}
                    </Stack>
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

      <Dialog open={Boolean(createTarget)} onClose={() => setCreateTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t("accounting.salaries.createTitle").replace("{name}", createTarget?.name ?? "")}</DialogTitle>
        <form onSubmit={form.handleSubmit(onCreate)} noValidate>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Controller
                name="baseSalary"
                control={form.control}
                rules={{ required: t("accounting.validation.required"), validate: (v) => Number(v) > 0 || t("accounting.validation.positive") }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="number"
                    label={t("accounting.salaries.field.baseSalary")}
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="baseWorkHours"
                control={form.control}
                rules={{ required: t("accounting.validation.required"), validate: (v) => Number(v) > 0 || t("accounting.validation.positive") }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="number"
                    label={t("accounting.salaries.field.baseWorkHours")}
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="taxAmount"
                control={form.control}
                rules={{
                  validate: (v) => v === "" || v == null || Number(v) >= 0 || t("accounting.validation.nonNegative"),
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="number"
                    label={t("accounting.salaries.field.taxOptional")}
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateTarget(null)}>{t("accounting.action.cancel")}</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {t("accounting.action.create")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default SalariesView;
