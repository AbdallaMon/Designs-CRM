"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
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
} from "@mui/material";
import {
  FiRefreshCw,
  FiFileText,
  FiCreditCard,
  FiChevronDown,
} from "react-icons/fi";
import PaginationWithLimit from "../../PaginationWithLimit";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
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

function PaymentRow({ payment, onChangeStatus }) {
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
              value={
                ["RECEIVED", "TRANSFERRED"].includes(payment.status)
                  ? payment.status
                  : ""
              }
              onChange={(e) => onChangeStatus(payment.id, e.target.value)}
              disabled={disableChange}
              IconComponent={FiChevronDown}
            >
              <MenuItem value={"RECEIVED"}>Received</MenuItem>
              <MenuItem value={"TRANSFERRED"}>Transferred</MenuItem>
            </Select>
          </FormControl>
        )}
      </Grid>
    </Grid>
  );
}

function ContractCard({ node, onChangeStatus }) {
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
              <PaymentRow payment={p} onChangeStatus={onChangeStatus} />
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

      {loading ? (
        <Typography variant="body2">Loading…</Typography>
      ) : (
        <>
          {data?.items?.map((node) => (
            <ContractCard
              key={node.contract.id}
              node={node}
              onChangeStatus={handleChangeStatus}
            />
          ))}

          <PaginationWithLimit
            page={data.page || page}
            totalPages={data.totalPages || 1}
            limit={data.limit || limit}
            setPage={setPage}
            setLimit={setLimit}
            total={data.total || 0}
          />
        </>
      )}
    </Container>
  );
}
