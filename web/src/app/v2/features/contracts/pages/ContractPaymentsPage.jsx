"use client";

// Contract-payments overview (grouped) — v2 redesign port of the legacy ContractPaymentsPage
// (ui/src/app/UiComponents/DataViewer/contracts/payments/PaymentsPage.jsx). The
// admin/super_admin/super_sales/staff overview of contract payments grouped by contract — NOT
// the accountant board. Same data, same audience, same TWO actions (change status / update
// amounts) and the SAME status constraints as legacy — only the UI/UX is upgraded to the v2
// shell primitives, and labels are localized to Arabic. Nothing functional is added.
//
// Data: contractsService.paymentsGrouped via useContractPayments (envelope data shape
// { items, page, limit, total, totalPages }). Gated on CONTRACT.PAYMENT_LIST; the two actions
// gate additionally on CONTRACT.PAYMENT_MANAGE (a list-only user sees the page READ-ONLY — the
// partial-permission state). Contract dtos emit NO capabilities.*, so gating is on the two
// CODES only (the server enforces lead scope). Single-language Arabic / RTL.

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TablePagination,
  TextField,
  Typography,
  Link as MuiLink,
} from "@mui/material";
import NextLink from "next/link";
import { MdRefresh, MdEdit, MdOpenInNew } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { resolveStatusLabel } from "@/app/v2/shared/config/statusLabels";
import {
  PageHeader,
  SectionCard,
  StatusChip,
  LoadingState,
  EmptyState,
  ErrorState,
  PartialPermissionState,
} from "@/app/v2/shared/components";
import { useContractPayments } from "../hooks/useContractPayments.js";
import { contractsService } from "../contracts.service.js";
import { runContractMutation } from "../contracts.mutations.js";
import { resolveContractMessage } from "../config/contractsMessages.js";
import {
  formatContractPaymentAED as fmt,
  CONTRACT_PAYMENT_STATUS_FILTERS,
  CONTRACT_PAYMENT_SETTABLE_STATUSES,
  CONTRACT_PAYMENTS_COPY as COPY,
} from "../config/contractConstants.js";

const P = PERMISSIONS.CONTRACT;

// Resolve a status filter VALUE to its Arabic label. "ALL" is a synthetic filter with no
// enum entry, so it gets its own copy string; everything else resolves via the payment domain.
function filterLabel(value) {
  return value === "ALL" ? COPY.filterAll : resolveStatusLabel("payment", value);
}

// A row of totals chips for a contract node (defensive — totals may be partially absent).
function TotalsChips({ totals = {} }) {
  const items = [
    { label: COPY.totalsReceived, value: totals.received },
    { label: COPY.totalsTransferred, value: totals.transferred },
    { label: COPY.totalsDue, value: totals.due },
    { label: COPY.totalsNotDue, value: totals.notDue },
  ];
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {items.map((it) => (
        <Chip key={it.label} size="small" label={`${it.label}: ${fmt(it.value)}`} />
      ))}
      <Chip size="small" variant="outlined" label={`${COPY.totalsGrand}: ${fmt(totals.grand)}`} />
      <Chip
        size="small"
        variant="outlined"
        label={`${COPY.totalsGrandWithTax}: ${fmt(totals.grandWithTax)}`}
      />
    </Stack>
  );
}

// Set-status inline select (RECEIVED / TRANSFERRED only — the legacy constraint). Hidden
// entirely for NOT_DUE rows (system-managed).
function SetStatusSelect({ payment, onChangeStatus }) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel id={`set-status-${payment.id}`}>{COPY.setStatus}</InputLabel>
      <Select
        labelId={`set-status-${payment.id}`}
        label={COPY.setStatus}
        value=""
        onChange={(e) => onChangeStatus(payment.id, e.target.value)}
      >
        {CONTRACT_PAYMENT_SETTABLE_STATUSES.map((s) => (
          <MenuItem key={s} value={s}>
            {resolveStatusLabel("payment", s)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

// One payment row. `canManage` toggles the action controls (read-only otherwise).
function PaymentRow({ payment, canManage, onChangeStatus, onEditAmounts }) {
  const isNotDue = payment.status === "NOT_DUE";
  return (
    <Grid container spacing={1.5} alignItems="center" sx={{ py: 1.5 }}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Typography variant="body2">
          <b>{COPY.amount}:</b> {fmt(payment.amount)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {COPY.withTax}: {fmt(payment.amountWithTax)}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          <b>{COPY.amountLost}:</b> {fmt(payment.amountLost || 0)}
        </Typography>
        <Typography variant="body2">
          <b>{COPY.amountReceived}:</b> {fmt(payment.amountReceived || 0)}
        </Typography>
      </Grid>

      <Grid size={{ xs: 6, md: 2 }}>
        <StatusChip status={payment.status} domain="payment" />
      </Grid>

      <Grid size={{ xs: 6, md: 3 }}>
        <Typography variant="body2">
          <b>{COPY.condition}:</b>{" "}
          {payment?.conditionItem?.labelAr || payment?.paymentCondition || "-"}
        </Typography>
      </Grid>

      {canManage && (
        <Grid size={{ xs: 12, md: 3 }}>
          {isNotDue ? (
            <Typography variant="caption" color="text.secondary">
              {COPY.statusGuard}
            </Typography>
          ) : (
            <Stack spacing={1}>
              <SetStatusSelect payment={payment} onChangeStatus={onChangeStatus} />
              <Button
                size="small"
                variant="outlined"
                startIcon={<MdEdit />}
                onClick={() => onEditAmounts(payment)}
              >
                {COPY.editAmounts}
              </Button>
            </Stack>
          )}
        </Grid>
      )}
    </Grid>
  );
}

// One contract group = one SectionCard.
function ContractNodeCard({ node, canManage, onChangeStatus, onEditAmounts }) {
  const c = node?.contract ?? {};
  const lead = c.clientLead ?? {};
  const leadLabel = lead.code != null ? `#${lead.code}` : lead.id != null ? `#${lead.id}` : "—";

  const title = (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
      <span>
        {c.contractLevel || "—"} — {c.contractType || "—"}
      </span>
      {lead.id != null && (
        <MuiLink
          component={NextLink}
          href={`/v2/leads/${lead.id}`}
          underline="hover"
          variant="body2"
          sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
        >
          {COPY.lead} {leadLabel}
          <MdOpenInNew size={14} />
        </MuiLink>
      )}
    </Stack>
  );

  const subtitle = `${COPY.client}: ${lead?.client?.name || "-"}  |  ${COPY.taxRate}: ${
    c.taxRate ?? 0
  }%`;

  const payments = Array.isArray(node?.payments) ? node.payments : [];

  return (
    <SectionCard title={title} subtitle={subtitle} sx={{ mb: 2 }}>
      <Box sx={{ mb: 1.5 }}>
        <TotalsChips totals={node?.totals} />
      </Box>
      <Divider sx={{ my: 1 }} />
      {payments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          {COPY.noPaymentsForFilter}
        </Typography>
      ) : (
        payments.map((p) => (
          <Box key={p.id}>
            <PaymentRow
              payment={p}
              canManage={canManage}
              onChangeStatus={onChangeStatus}
              onEditAmounts={onEditAmounts}
            />
            <Divider />
          </Box>
        ))
      )}
    </SectionCard>
  );
}

// Edit-amounts dialog — mirrors PayPaymentDialog styling. Submits amountLost / amountReceived
// + an optional new status (RECEIVED / TRANSFERRED only) via updatePaymentAmounts. NOT_DUE
// rows never reach here (the trigger is hidden), but we keep the guard for safety.
function PaymentAmountsDialog({ payment, onClose, onSaved }) {
  const open = Boolean(payment);
  const isNotDue = payment?.status === "NOT_DUE";
  const [amountLost, setAmountLost] = useState("0");
  const [amountReceived, setAmountReceived] = useState("0");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Seed fields each time a payment opens the dialog.
  const seedKey = payment?.id;
  const [seededFor, setSeededFor] = useState(null);
  if (open && seededFor !== seedKey) {
    setAmountLost(String(payment?.amountLost ?? 0));
    setAmountReceived(String(payment?.amountReceived ?? 0));
    setStatus("");
    setSeededFor(seedKey);
  }

  async function handleSave() {
    if (!payment) return;
    const res = await runContractMutation(
      () =>
        contractsService.updatePaymentAmounts(payment.id, {
          amountLost: Number(amountLost || 0),
          amountReceived: Number(amountReceived || 0),
          ...(status ? { status } : {}),
        }),
      { loading: "جاري تحديث المبالغ...", setLoading: setSubmitting },
    );
    if (res) onSaved();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{COPY.dialogTitle}</DialogTitle>
      <DialogContent dividers>
        {isNotDue ? (
          <Alert severity="warning">{COPY.amountsGuard}</Alert>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="amounts-status">{COPY.setStatus}</InputLabel>
              <Select
                labelId="amounts-status"
                label={COPY.setStatus}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {CONTRACT_PAYMENT_SETTABLE_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {resolveStatusLabel("payment", s)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={COPY.amountLost}
              type="number"
              value={amountLost}
              onChange={(e) => setAmountLost(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { step: "0.01" } }}
            />
            <TextField
              label={COPY.amountReceived}
              type="number"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { step: "0.01" } }}
            />
            {payment && (
              <Alert severity="info">
                {COPY.originalWithTax}: {fmt(payment.amountWithTax)}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {COPY.cancel}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={submitting || isNotDue}>
          {COPY.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ContractPaymentsPage() {
  const { hasPermission } = usePermission();
  const canList = hasPermission(P.PAYMENT_LIST);
  const canManage = hasPermission(P.PAYMENT_MANAGE);

  const {
    items,
    total,
    page,
    setPage,
    limit,
    setLimit,
    status,
    setStatus,
    isLoading,
    error,
    refetch,
  } = useContractPayments({ autoFetch: canList });

  const [editPayment, setEditPayment] = useState(null);

  async function handleChangeStatus(paymentId, newStatus) {
    // Guard: only RECEIVED / TRANSFERRED are user-settable (legacy constraint).
    if (!CONTRACT_PAYMENT_SETTABLE_STATUSES.includes(newStatus)) return;
    const res = await runContractMutation(
      () => contractsService.changePaymentStatusBare(paymentId, newStatus),
      { loading: "جاري تحديث الحالة..." },
    );
    if (res) refetch();
  }

  function handleSavedAmounts() {
    setEditPayment(null);
    refetch();
  }

  // Full no-access notice (the user holds neither list nor manage on contract payments).
  if (!canList) {
    return <PartialPermissionState denied />;
  }

  const headerControls = (
    <>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel id="payments-status-filter">{COPY.filterLabel}</InputLabel>
        <Select
          labelId="payments-status-filter"
          label={COPY.filterLabel}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {CONTRACT_PAYMENT_STATUS_FILTERS.map((s) => (
            <MenuItem key={s} value={s}>
              {filterLabel(s)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="outlined" startIcon={<MdRefresh />} onClick={refetch} disabled={isLoading}>
        {COPY.refresh}
      </Button>
    </>
  );

  function renderBody() {
    if (isLoading) return <LoadingState variant="cards" count={4} height={200} columns={1} />;
    if (error) {
      return <ErrorState error={error} onRetry={refetch} resolver={null} />;
    }
    if (items.length === 0) {
      return <EmptyState title={COPY.emptyTitle} />;
    }
    return (
      <>
        {items.map((node) => (
          <ContractNodeCard
            key={node?.contract?.id}
            node={node}
            canManage={canManage}
            onChangeStatus={handleChangeStatus}
            onEditAmounts={setEditPayment}
          />
        ))}
        <TablePagination
          component="div"
          count={total}
          page={Math.max(0, page - 1)}
          onPageChange={(_e, p) => setPage(p + 1)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => {
            setLimit(parseInt(e.target.value, 10));
            setPage(1);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="عدد الصفوف"
        />
      </>
    );
  }

  const body = renderBody();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader title={COPY.pageTitle} subtitle={COPY.pageSubtitle}>
        {headerControls}
      </PageHeader>

      {/* List-only users see a read-only banner above the (action-less) content. */}
      {canList && !canManage ? (
        <PartialPermissionState message={COPY.readonlyBanner}>{body}</PartialPermissionState>
      ) : (
        body
      )}

      <PaymentAmountsDialog
        payment={editPayment}
        onClose={() => setEditPayment(null)}
        onSaved={handleSavedAmounts}
      />
    </Container>
  );
}

export default ContractPaymentsPage;
