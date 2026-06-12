"use client";

// Payments table — the list view used by the "overdue" and "paid" accountant sub-views
// (v2 port of OverduePayments.jsx + PaymentsCalendar.jsx). One paginated table over
// GET /v2/accounting/payments with a top-level `status` param. Each row's actions are gated
// on the row's backend-computed capabilities.* (canPay / canMarkOverdue / canViewInvoices)
// combined with the holder's permission codes. Columns mirror the legacy column set,
// localized to Arabic.

import { useState } from "react";
import {
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Button,
} from "@mui/material";
import { useT } from "@/app/v2/lib/i18n";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { usePaginatedList } from "../hooks/usePaginatedList.js";
import { accountingService } from "../accounting.service.js";
import { runAccountingMutation } from "../accounting.mutations.js";
import { PAYMENT_LEVELS, PAYMENT_STATUS } from "../config/accountingConstants.js";
import { PayPaymentDialog } from "./PayPaymentDialog.jsx";
import { PaymentInvoicesDialog } from "./PaymentInvoicesDialog.jsx";
import { NotesDialog } from "./NotesDialog.jsx";

const P = PERMISSIONS.ACCOUNTING;

function buildColumns(t) {
  return [
    { key: "id", label: t("accounting.payments.col.id"), accessor: (r) => r.id },
    { key: "clientName", label: t("accounting.payments.col.clientName"), accessor: (r) => r.clientLead?.client?.name ?? "—" },
    { key: "clientPhone", label: t("accounting.payments.col.clientPhone"), accessor: (r) => r.clientLead?.client?.phone ?? "—" },
    { key: "description", label: t("accounting.payments.col.description"), accessor: (r) => r.clientLead?.description ?? "—" },
    { key: "price", label: t("accounting.payments.col.price"), accessor: (r) => r.clientLead?.averagePrice ?? "—" },
    { key: "reason", label: t("accounting.payments.col.reason"), accessor: (r) => r.paymentReason ?? "—" },
    { key: "amount", label: t("accounting.payments.col.amount"), accessor: (r) => r.amount },
    { key: "amountPaid", label: t("accounting.payments.col.amountPaid"), accessor: (r) => r.amountPaid },
    {
      key: "level",
      label: t("accounting.payments.col.level"),
      accessor: (r) => PAYMENT_LEVELS[r.paymentLevel] ?? r.paymentLevel ?? "—",
    },
    {
      key: "status",
      label: t("accounting.payments.col.status"),
      accessor: (r) => <Chip size="small" label={PAYMENT_STATUS[r.status] ?? r.status} />,
    },
  ];
}

export function PaymentsTable({ status, showMarkOverdue = false }) {
  const { t } = useT();
  const COLUMNS = buildColumns(t);
  const { hasPermission } = usePermission();
  const canList = hasPermission(P.PAYMENT_LIST);
  const canProcess = hasPermission(P.PAYMENT_PROCESS);
  const canMarkOverdue = hasPermission(P.PAYMENT_MARK_OVERDUE);

  const [marking, setMarking] = useState(false);

  const { items, total, page, setPage, pageSize, setPageSize, isLoading, refetch, setItems } =
    usePaginatedList(accountingService.listPayments, {
      autoFetch: canList,
      initialExtra: { status },
    });

  async function handleMarkOverdue(payment) {
    const res = await runAccountingMutation(() => accountingService.markOverdue(payment.id), {
      loading: t("accounting.payments.markOverdueLoading"),
      setLoading: setMarking,
    });
    if (res) refetch();
  }

  function handlePaid() {
    refetch();
  }

  if (!canList) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        {t("accounting.payments.denied")}
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            {COLUMNS.map((c) => (
              <TableCell key={c.key}>{c.label}</TableCell>
            ))}
            <TableCell align="right">{t("accounting.action.actions")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={COLUMNS.length + 1} align="center">
                {t("accounting.state.loading")}
              </TableCell>
            </TableRow>
          )}
          {!isLoading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLUMNS.length + 1} align="center">
                {t("accounting.state.empty")}
              </TableCell>
            </TableRow>
          )}
          {!isLoading &&
            items.map((row) => {
              const caps = row.capabilities ?? {};
              return (
                <TableRow key={row.id} hover>
                  {COLUMNS.map((c) => (
                    <TableCell key={c.key}>{c.accessor(row)}</TableCell>
                  ))}
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                      {canProcess && caps.canPay && <PayPaymentDialog payment={row} onPaid={handlePaid} />}
                      {showMarkOverdue && canMarkOverdue && caps.canMarkOverdue && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="warning"
                          disabled={marking}
                          onClick={() => handleMarkOverdue(row)}
                        >
                          {t("accounting.payments.markOverdue")}
                        </Button>
                      )}
                      {(caps.canViewInvoices ?? true) && <PaymentInvoicesDialog paymentId={row.id} />}
                      <NotesDialog idKey="paymentId" id={row.id} buttonLabel={t("accounting.action.notes")} />
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
        labelRowsPerPage={t("accounting.table.rowsPerPage")}
      />
    </TableContainer>
  );
}

export default PaymentsTable;
