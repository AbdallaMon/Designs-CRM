"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  Tooltip,
  Button,
  Alert,
  Container,
  TextField,
} from "@mui/material";
import {
  FiRefreshCw,
  FiFileText,
  FiCreditCard,
  FiChevronDown,
  FiEdit3,
} from "react-icons/fi";
import PaginationWithLimit from "../../PaginationWithLimit";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
// If your util is in the same file you pasted, adjust import accordingly.

const STATUS_OPTS = [
  { value: "DUE", label: "Due" },
  { value: "RECEIVED", label: "Received" },
  { value: "TRANSFERRED", label: "Transferred" },
  { value: "NOT_DUE", label: "Not due" },
  { value: "ALL", label: "All" },
];

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

function TotalsChips({ totals }) {
  const items = [
    { label: "Received", value: totals.received },
    { label: "Transferred", value: totals.transferred },
    { label: "Due", value: totals.due },
    { label: "Not due", value: totals.notDue },
  ];
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {items.map((it) => (
        <Chip key={it.label} label={`${it.label}: ${formatAED(it.value)}`} />
      ))}
      <Chip variant="outlined" label={`Total: ${formatAED(totals.grand)}`} />
      <Chip
        variant="outlined"
        icon={<FiCreditCard />}
        label={`Total+Tax: ${formatAED(totals.grandWithTax)}`}
      />
    </Stack>
  );
}

function StatusChip({ status }) {
  const colorMap = {
    RECEIVED: "success",
    TRANSFERRED: "info",
    DUE: "warning",
    NOT_DUE: "default",
  };
  return (
    <Chip size="small" color={colorMap[status] || "default"} label={status} />
  );
}

function PaymentRow({ payment, onChangeStatus, onEditAmounts }) {
  const disableChange = payment.status === "NOT_DUE";
  return (
    <Grid container spacing={1} alignItems="center" sx={{ py: 1 }}>
      <Grid size={{ xs: 12, md: 3 }}>
        <Typography variant="body2">
          <b>Amount:</b> {formatAED(payment.amount)}
        </Typography>
        <Typography variant="caption">
          With tax: {formatAED(payment.amountWithTax)}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          <b>Amount Lost:</b> {formatAED(payment.amountLost || 0)}
        </Typography>
        <Typography variant="body2">
          <b>Amount Received:</b> {formatAED(payment.amountReceived || 0)}
        </Typography>
        {disableChange ? (
          <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
            Amounts cannot be edited for NOT_DUE payments.
          </Alert>
        ) : (
          <Button
            size="small"
            variant="outlined"
            startIcon={<FiEdit3 />}
            sx={{ mt: 0.5, textTransform: "none" }}
            onClick={() => onEditAmounts(payment)}
          >
            Edit amounts and status
          </Button>
        )}
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <StatusChip status={payment.status} />
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <Typography variant="body2">
          <b>Condition:</b>{" "}
          {payment?.conditionItem?.labelAr || payment.paymentCondition || "-"}
        </Typography>
      </Grid>
      <Grid size={{ md: 2 }}>
        <ChangeStatus
          disableChange={disableChange}
          payment={payment}
          onChangeStatus={onChangeStatus}
        />
      </Grid>
    </Grid>
  );
}
function ChangeStatus({ disableChange, payment, onChangeStatus, status }) {
  return (
    <>
      {disableChange ? (
        <Alert severity="warning" sx={{ py: 0.5 }}>
          Status cannot be changed
        </Alert>
      ) : (
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
      )}
    </>
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
      `shared/contracts/payments/${payment.id}/amounts`,
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
      <DialogTitle>Adjust Payment Amounts</DialogTitle>
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
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box>
              {payment && (
                <ChangeStatus
                  disableChange={disableChange}
                  payment={payment}
                  onChangeStatus={(id, newStatus) => setStatus(newStatus)}
                  status={status}
                />
              )}
            </Box>
            <TextField
              label="Amount Lost"
              type="number"
              value={amountLost}
              onChange={(e) => setAmountLost(e.target.value)}
              fullWidth
              size="small"
              mt={2}
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
  const c = node.contract;
  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        titleTypographyProps={{ variant: "h6" }}
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <FiFileText />
            <Typography variant="h6">
              {c.contractLevel} - {c.contractType} — Lead
              <Button
                variant="outlined"
                size="small"
                href={`/dashboard/deals/${c.clientLead?.id}`}
                target="_blank"
                sx={{ ml: 1, textTransform: "none" }}
              >
                # {c.clientLead?.code || c.clientLead?.id}
              </Button>
            </Typography>
          </Stack>
        }
        subheader={
          <Typography variant="body2">
            Client: <b>{c.clientLead?.client?.name || "-"}</b> &nbsp;|&nbsp;
            Tax: {c.taxRate}%
          </Typography>
        }
      />
      <CardContent>
        <Box sx={{ mb: 1 }}>
          <TotalsChips totals={node.totals} />
        </Box>
        <Divider sx={{ my: 1 }} />
        {node.payments.length === 0 ? (
          <Typography variant="body2" sx={{ py: 1 }}>
            No payments for this filter.
          </Typography>
        ) : (
          node.payments.map((p) => (
            <Box key={p.id}>
              <PaymentRow
                payment={p}
                onChangeStatus={onChangeStatus}
                onEditAmounts={onEditAmounts}
              />
              <Divider />
            </Box>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function ContractPaymentsPage() {
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
    const req = await getDataAndSet({
      url: "shared/contracts/payments/all",
      setLoading,
      setData,
      page,
      limit,
      filters: {},
      search: "",
      sort: {},
      others: `status=${status}`,
    });
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
      `shared/contracts/payments/${paymentId}/status`,
      false,
      "Updating",
      false
    );

    if (req.status === 200) {
      await fetchList();
    }
  };

  const header = useMemo(
    () => (
      <Box
        sx={{
          mb: 2,
          display: "flex",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h5">Contract Payments</Typography>
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
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            onClick={fetchList}
            variant="outlined"
            startIcon={<FiRefreshCw />}
            disabled={loading}
            sx={{ textTransform: "none" }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>
    ),
    [status, loading, fetchList]
  );

  return (
    <Container maxWidth="xl" sx={{ p: 2 }}>
      {header}
      {loading && <FullScreenLoader />}
      <>
        {data?.items?.map((node) => (
          <ContractCard
            key={node.contract.id}
            node={node}
            onChangeStatus={handleChangeStatus}
            onEditAmounts={(payment) =>
              setAmountDialog({ open: true, payment })
            }
          />
        ))}

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
      </>
    </Container>
  );
}
