"use client";

import React, { useMemo } from "react";
import {
  Stack,
  Typography,
  Box,
  TextField,
  IconButton,
  Tooltip,
  Grid,
  alpha,
  useTheme,
} from "@mui/material";
import { FaPlus, FaTrash, FaMoneyBill } from "react-icons/fa";
import { sum } from "@/features/contracts/shared/contractHelpers.js";
import SelectPaymentCondition from "@/features/contracts/payments/SelectPaymentCondition.jsx";
import { SectionHeader, EditorCard, EmptyState, AddButton } from "@/features/contracts/shared/formKit.jsx";

export default function PaymentsEditor({
  payments,
  setPayments,
  taxRate = 5,
  clientLeadId,
}) {
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

  const success = theme.palette.success.main;

  return (
    <Stack spacing={2}>
      <SectionHeader
        icon={<FaMoneyBill />}
        title="Payments"
        subtitle="Add contract payments and set each payment's due condition"
        count={payments.length}
        color={success}
        action={
          <AddButton
            onClick={addPayment}
            label="Add"
            startIcon={<FaPlus />}
            color={success}
          />
        }
      />

      {payments.length === 0 ? (
        <EmptyState
          icon={<FaMoneyBill />}
          color={success}
          text="No payments yet — add at least one payment."
          action={
            <AddButton
              onClick={addPayment}
              label="Add"
              startIcon={<FaPlus />}
              color={success}
            />
          }
        />
      ) : (
        <Grid container spacing={2}>
          {payments.map((p, idx) => (
            <Grid key={idx} size={{ xs: 12, md: 6 }}>
              <EditorCard
                accent={success}
                index={idx + 1}
                label={`Payment #${idx + 1}`}
                onRemove={
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
                }
                sx={{ height: "100%" }}
              >
                <Stack spacing={1.5}>
                  <Grid container spacing={1.5} alignItems="center">
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
                      <Box
                        sx={{
                          px: 1.25,
                          py: 0.75,
                          borderRadius: 1.5,
                          bgcolor: alpha(success, 0.1),
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Amount with Tax
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: "text.primary" }}
                        >
                          {(
                            Number(p.amount || 0) *
                            (1 + (Number(taxRate) || 0) / 100)
                          ).toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <TextField
                    label="Note (Optional)"
                    value={p.note || ""}
                    onChange={(e) => updatePayment(idx, "note", e.target.value)}
                    fullWidth
                    size="small"
                  />

                  {idx === 0 ? (
                    <Box
                      sx={{
                        px: 1.25,
                        py: 1,
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette.info.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        This payment will be due after the client signs the
                        contract.
                      </Typography>
                    </Box>
                  ) : (
                    <SelectPaymentCondition
                      initialCondition={p.conditionItem}
                      clientLeadId={clientLeadId}
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
                </Stack>
              </EditorCard>
            </Grid>
          ))}
        </Grid>
      )}

      <Box
        sx={{
          p: 2,
          borderRadius: 2.5,
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Stack spacing={0.25}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Subtotal
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {total.toFixed(2)}
            </Typography>
          </Stack>
          <Stack spacing={0.25}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Tax
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {tax.toFixed(2)}
            </Typography>
          </Stack>
          <Box sx={{ flex: 1 }} />
          <Stack spacing={0.25} sx={{ textAlign: { sm: "end" } }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>
              Total
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: "primary.main" }}
            >
              {grand.toFixed(2)}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}
