"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  alpha,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  Button,
  Alert,
  Container,
  TextField,
  useTheme,
} from "@mui/material";
import {
  FiRefreshCw,
  FiFileText,
  FiCreditCard,
  FiChevronDown,
  FiEdit3,
} from "react-icons/fi";
import PaginationWithLimit from "@/shared/components/PaginationWithLimit.jsx";
import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import FullScreenLoader from "@/shared/components/feedback/loaders/FullscreenLoader";

const STATUS_OPTS = [
  { value: "DUE", label: "Due" },
  { value: "RECEIVED", label: "Received" },
  { value: "TRANSFERRED", label: "Transferred" },
  { value: "NOT_DUE", label: "Not due" },
  { value: "ALL", label: "All" },
];

const STATUS_COLOR = {
  RECEIVED: "success",
  TRANSFERRED: "info",
  DUE: "warning",
  NOT_DUE: "default",
};

function formatAED(n) {
  try {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(Number(n || 0));
  } catch {
    return `AED ${Number(n || 0).toFixed(2)}`;
  }
}

function StatTile({ label, value, color, icon }) {
  const theme = useTheme();
  const c = color || theme.palette.text.primary;
  return (
    <Box
      sx={{
        flex: "1 1 140px",
        minWidth: 130,
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(c, 0.05),
      }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
        {icon}
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: c }}>
        {formatAED(value)}
      </Typography>
    </Box>
  );
}

function TotalsRow({ totals }) {
  const theme = useTheme();
  return (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      <StatTile label="Received" value={totals.received} color={theme.palette.success.main} />
      <StatTile label="Transferred" value={totals.transferred} color={theme.palette.info.main} />
      <StatTile label="Due" value={totals.due} color={theme.palette.warning.main} />
      <StatTile label="Not due" value={totals.notDue} />
      <StatTile label="Total" value={totals.grand} color={theme.palette.primary.main} />
      <StatTile
        label="Total + Tax"
        value={totals.grandWithTax}
        color={theme.palette.primary.dark}
        icon={<FiCreditCard size={13} />}
      />
    </Stack>
  );
}

function StatusChip({ status }) {
  return (
    <Chip
      size="small"
      color={STATUS_COLOR[status] || "default"}
      label={status?.replace(/_/g, " ")}
      sx={{ fontWeight: 700, borderRadius: 1.5 }}
    />
  );
}

function ChangeStatus({ disableChange, payment, onChangeStatus, status }) {
  if (disableChange) {
    return (
      <Alert severity="warning" sx={{ py: 0.25 }}>
        Status cannot be changed
      </Alert>
    );
  }
  return (
    <FormControl size="small" fullWidth>
      <InputLabel id={`status-${payment.id}`}>Set status</InputLabel>
      <Select
        labelId={`status-${payment.id}`}
        label="Set status"
        value={status !== undefined ? status : payment.status}
        onChange={(e) => onChangeStatus(payment.id, e.target.value)}
        disabled={disableChange}
        IconComponent={FiChevronDown}
      >
        <MenuItem value={"RECEIVED"}>Received</MenuItem>
        <MenuItem value={"TRANSFERRED"}>Transferred</MenuItem>
      </Select>
    </FormControl>
  );
}

function PaymentRow({ payment, onChangeStatus, onEditAmounts }) {
  const theme = useTheme();
  const disableChange = payment.status === "NOT_DUE";
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: "background.paper",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ md: "center" }}
        justifyContent="space-between"
      >
        {/* Amount block */}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="h6" fontWeight={800} color="text.primary">
              {formatAED(payment.amount)}
            </Typography>
            <StatusChip status={payment.status} />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            With tax: {formatAED(payment.amountWithTax)} ·{" "}
            {payment?.conditionItem?.labelAr || payment.paymentCondition || "—"}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
            <Typography variant="caption" color="text.secondary">
              Lost: <b>{formatAED(payment.amountLost || 0)}</b>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Received: <b>{formatAED(payment.amountReceived || 0)}</b>
            </Typography>
          </Stack>
        </Box>

        {/* Actions */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ sm: "center" }}
          sx={{ flexShrink: 0, minWidth: { md: 280 } }}
        >
          {disableChange ? (
            <Alert severity="warning" sx={{ py: 0.25, flex: 1 }}>
              NOT_DUE — locked
            </Alert>
          ) : (
            <>
              <Box sx={{ minWidth: 150, flex: 1 }}>
                <ChangeStatus
                  disableChange={disableChange}
                  payment={payment}
                  onChangeStatus={onChangeStatus}
                />
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FiEdit3 />}
                sx={{ textTransform: "none", borderRadius: 2, whiteSpace: "nowrap" }}
                onClick={() => onEditAmounts(payment)}
              >
                Edit
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

function PaymentAmountsDialog({ open, onClose, payment, onSave, loading }) {
  const [amountLost, setAmountLost] = useState(0);
  const [amountReceived, setAmountReceived] = useState(0);
  const { setLoading } = useToastContext();
  const [status, setStatus] = useState(payment?.status || "");
  const disableChange = payment?.status === "NOT_DUE";
  useEffect(() => {
    if (payment) {
      setAmountLost(payment.amountLost ?? 0);
      setAmountReceived(payment.amountReceived ?? 0);
    }
  }, [open, payment]);

  const handleSubmit = async () => {
    if (!payment) return;
    const req = await handleRequestSubmit(
      {
        amountLost: Number(amountLost || 0),
        amountReceived: Number(amountReceived || 0),
        status,
      },
      setLoading,
      `shared/contracts/payments/${payment.id}/actions/update-amounts`,
      false,
      "Updating amounts",
      false
    );
    if (req.status === 200) {
      onSave();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Adjust payment amounts</DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          pt: "16px !important",
        }}
      >
        {disableChange ? (
          <Alert severity="warning">
            Amounts cannot be changed for payments with NOT_DUE status.
          </Alert>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {payment && (
              <ChangeStatus
                disableChange={disableChange}
                payment={payment}
                onChangeStatus={(id, newStatus) => setStatus(newStatus)}
                status={status}
              />
            )}
            <TextField
              label="Amount Lost"
              type="number"
              value={amountLost}
              onChange={(e) => setAmountLost(e.target.value)}
              fullWidth
              size="small"
              inputProps={{ step: "0.01" }}
            />
            <TextField
              label="Amount Received"
              type="number"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              fullWidth
              size="small"
              inputProps={{ step: "0.01" }}
            />
            {payment && (
              <Alert severity="info">
                Original Amount with tax: {formatAED(payment.amountWithTax)}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ContractCard({ node, onChangeStatus, onEditAmounts }) {
  const theme = useTheme();
  const c = node.contract;
  return (
    <Box
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: { xs: 2, md: 2.5 },
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.08
          )} 0%, ${theme.palette.background.paper} 70%)`,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ md: "center" }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              <FiFileText />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="subtitle1" fontWeight={700}>
                  {c.contractLevel} · {c.contractType}
                </Typography>
                <Chip size="small" label={`Tax ${c.taxRate}%`} variant="outlined" sx={{ fontWeight: 600 }} />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Client: <b>{c.clientLead?.client?.name || "-"}</b>
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="outlined"
            size="small"
            href={`/dashboard/deals/${c.clientLead?.id}`}
            target="_blank"
            sx={{ textTransform: "none", borderRadius: 2, flexShrink: 0 }}
          >
            Lead #{c.clientLead?.code || c.clientLead?.id}
          </Button>
        </Stack>
      </Box>

      {/* Body */}
      <Box sx={{ p: { xs: 2, md: 2.5 } }}>
        <TotalsRow totals={node.totals} />
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {node.payments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              No payments for this filter.
            </Typography>
          ) : (
            node.payments.map((p) => (
              <PaymentRow
                key={p.id}
                payment={p}
                onChangeStatus={onChangeStatus}
                onEditAmounts={onEditAmounts}
              />
            ))
          )}
        </Stack>
      </Box>
    </Box>
  );
}

export default function ContractPaymentsPage() {
  const theme = useTheme();
  const [data, setData] = useState({
    items: [],
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("DUE"); // default: due payments
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [amountDialog, setAmountDialog] = useState({
    open: false,
    payment: null,
  });

  const fetchList = React.useCallback(async () => {
    // getData returns master's FLAT shape: `data` is the items ARRAY (the paginated
    // envelope was unwrapped in normalizeEnvelope), plus `total`/`totalPages`/`page`.
    // This page's UI reads an object with `.items`, so re-wrap the array back into it.
    const res = await getData({
      url: "shared/contracts/payments/all",
      setLoading,
      page,
      limit,
      filters: {},
      search: "",
      sort: {},
      others: `status=${status}`,
    });
    if (res) {
      setData({
        items: Array.isArray(res.data) ? res.data : [],
        page: res.page || page,
        limit,
        totalPages: res.totalPages || 1,
        total: res.total || 0,
      });
    }
  }, [page, limit, status]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // allow external refresh (per-card action)
  useEffect(() => {
    const handler = () => fetchList();
    window.addEventListener("payments-refetch", handler);
    return () => window.removeEventListener("payments-refetch", handler);
  }, [fetchList]);

  const handleSaveAmounts = async () => {
    setAmountDialog({ open: false, payment: null });
    await fetchList();
  };

  const handleChangeStatus = async (paymentId, newStatus) => {
    // guard: allow only RECEIVED or TRANSFERRED
    if (newStatus !== "RECEIVED" && newStatus !== "TRANSFERRED") return;

    const req = await handleRequestSubmit(
      { status: newStatus },
      setLoading,
      `shared/contracts/payments/${paymentId}/actions/change-status`,
      false,
      "Updating",
      false
    );

    if (req.status === 200) {
      await fetchList();
    }
  };

  // aggregate totals across the visible contracts for the page summary
  const summary = useMemo(() => {
    const acc = { received: 0, transferred: 0, due: 0, notDue: 0, grand: 0, grandWithTax: 0 };
    (data?.items || []).forEach((node) => {
      const t = node.totals || {};
      acc.received += Number(t.received || 0);
      acc.transferred += Number(t.transferred || 0);
      acc.due += Number(t.due || 0);
      acc.notDue += Number(t.notDue || 0);
      acc.grand += Number(t.grand || 0);
      acc.grandWithTax += Number(t.grandWithTax || 0);
    });
    return acc;
  }, [data]);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
      {loading && <FullScreenLoader />}

      <Stack spacing={3}>
        {/* Page header */}
        <Box
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.1
            )} 0%, ${theme.palette.background.paper} 60%)`,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="h4" fontWeight={800} color="text.primary">
                Contract payments
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track and settle scheduled contract payments.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="status-filter">Filter by status</InputLabel>
                <Select
                  labelId="status-filter"
                  value={status}
                  label="Filter by status"
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  IconComponent={FiChevronDown}
                >
                  {STATUS_OPTS.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                onClick={fetchList}
                variant="outlined"
                startIcon={<FiRefreshCw />}
                disabled={loading}
                sx={{ textTransform: "none", borderRadius: 2 }}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>

          {data?.items?.length > 0 && (
            <Box sx={{ mt: 2.5 }}>
              <TotalsRow totals={summary} />
            </Box>
          )}
        </Box>

        {/* Contract cards */}
        {data?.items?.length === 0 && !loading ? (
          <Box
            sx={{
              py: 8,
              textAlign: "center",
              borderRadius: 3,
              border: `1px dashed ${theme.palette.divider}`,
            }}
          >
            <Typography variant="subtitle1" color="text.secondary" fontWeight={600}>
              No payments match this filter
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2.5}>
            {data?.items?.map((node) => (
              <ContractCard
                key={node.contract.id}
                node={node}
                onChangeStatus={handleChangeStatus}
                onEditAmounts={(payment) => setAmountDialog({ open: true, payment })}
              />
            ))}
          </Stack>
        )}

        <PaymentAmountsDialog
          open={amountDialog.open}
          payment={amountDialog.payment}
          onClose={() => setAmountDialog({ open: false, payment: null })}
          onSave={handleSaveAmounts}
          loading={loading}
        />

        <PaginationWithLimit
          page={data.page || page}
          totalPages={data.totalPages || 1}
          limit={data.limit || limit}
          setPage={setPage}
          setLimit={setLimit}
          total={data.total || 0}
        />
      </Stack>
    </Container>
  );
}
