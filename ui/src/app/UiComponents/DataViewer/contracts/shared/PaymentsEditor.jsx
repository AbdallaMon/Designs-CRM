"use client";

import React, { useMemo } from "react";
import {
  Stack,
  Typography,
  Box,
  Button,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  TextField,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  Grid,
  alpha,
  useTheme,
} from "@mui/material";
import { FaPlus, FaTrash, FaMoneyBill } from "react-icons/fa";
import { sum } from "./contractHelpers";
import SelectPaymentCondition from "../payments/SelectPaymentCondition";

export default function PaymentsEditor({ payments, setPayments, taxRate = 5 }) {
  const theme = useTheme();
  const total = useMemo(
    () => sum(payments.map((p) => Number(p.amount || 0))),
    [payments]
  );
  const tax = useMemo(
    () => ((Number(taxRate) || 0) * total) / 100,
    [taxRate, total]
  );
  const grand = useMemo(() => total + tax, [total, tax]);

  const addPayment = () => {
    setPayments([
      ...payments,
      {
        amount: "",
        note: "",
        condition: payments?.length === 0 ? "SIGNATURE" : "",
        type: "",
        conditionId: null,
        conditionItem: null,
      },
    ]);
  };

  const updatePayment = (idx, key, value) => {
    const copy = payments.slice();
    copy[idx] = { ...copy[idx], [key]: value };
    setPayments(copy);
  };

  const updatePaymentFields = (idx, newData) => {
    const copy = payments.slice();
    copy[idx] = { ...copy[idx], ...newData };
    setPayments(copy);
  };

  const removePayment = (idx) => {
    const copy = payments.slice();
    copy.splice(idx, 1);
    setPayments(copy);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <FaMoneyBill
          style={{ color: theme.palette.success.main, fontSize: 20 }}
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Payments
        </Typography>
        <Box flex={1} />
        <Button
          startIcon={<FaPlus />}
          onClick={addPayment}
          variant="contained"
          size="small"
        >
          Add
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {payments.map((p, idx) => (
          <Grid key={idx} size={{ xs: 12, md: 6 }}>
            <Card
              variant="outlined"
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.success.main,
                  0.08
                )} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                borderRadius: 2,
                "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
                transition: "all 0.3s ease",
              }}
            >
              <CardHeader
                title={`Payment #${idx + 1}`}
                avatar={
                  <Avatar sx={{ bgcolor: "success.main" }}>{idx + 1}</Avatar>
                }
                titleTypographyProps={{ fontWeight: 600 }}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      type="number"
                      label="Amount"
                      value={p.amount}
                      onChange={(e) =>
                        updatePayment(idx, "amount", e.target.value)
                      }
                      fullWidth
                      required
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 1 }}>
                      Amount with Tax:{" "}
                      {(
                        Number(p.amount || 0) *
                        (1 + (Number(taxRate) || 0) / 100)
                      ).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 10 }}>
                    <TextField
                      label="Note (Optional)"
                      value={p.note || ""}
                      onChange={(e) =>
                        updatePayment(idx, "note", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  <Grid
                    size={{ xs: 12, sm: 2 }}
                    sx={{ display: "flex", justifyContent: "flex-end" }}
                  >
                    <Tooltip title="Remove">
                      <span>
                        <IconButton
                          color="error"
                          onClick={() => removePayment(idx)}
                          size="small"
                        >
                          <FaTrash />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Grid>
                  <Grid size={12}>
                    {idx === 0 ? (
                      <Typography variant="caption" color="text.secondary">
                        This payment will be due after the client signs the
                        contract.
                      </Typography>
                    ) : (
                      <SelectPaymentCondition
                        initialCondition={p.conditionItem}
                        onConditionChange={(value) => {
                          updatePaymentFields(idx, {
                            condition: value.condition,
                            type: value.conditionType,
                            conditionId: value.id,
                            conditionItem: value,
                          });
                        }}
                      />
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 1 }} />

      <Paper
        sx={{
          p: 2,
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid sm="auto">
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Subtotal
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {total.toFixed(2)}
                </Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Tax
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {tax.toFixed(2)}
                </Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "primary.main" }}
                >
                  Total
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: "primary.main",
                    fontSize: "1.1rem",
                  }}
                >
                  {grand.toFixed(2)}
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Stack>
  );
}
