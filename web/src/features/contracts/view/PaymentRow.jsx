"use client";

import { useEffect, useState } from "react";
import {
  Stack,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Divider,
  IconButton,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  alpha,
} from "@mui/material";
import { FaEdit, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import SelectPaymentCondition from "@/features/contracts/payments/SelectPaymentCondition.jsx";
import ConfirmDialog from "@/features/contracts/view/ConfirmDialog.jsx";
import { diffPayload, canDeletePayment } from "@/features/contracts/view/viewContractHelpers.js";

export default function PaymentRow({ payment, contractId, onReload, taxRate }) {
  const theme = useTheme();
  const relatedType = payment?.project?.type || "";
  const [edit, setEdit] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setLoading } = useToastContext();
  // status: preview + independent update
  const [status, setStatus] = useState(payment.status);

  // Working state (unchanged)
  const [amount, setAmount] = useState(Number(payment.amount) || 0);
  const [chosenType, setChosenType] = useState(relatedType || "");
  const [condition, setCondition] = useState(payment.paymentCondition || "");
  const [conditionItem, setConditionItem] = useState(
    payment.conditionItem || ""
  );
  const [conditionId, setConditionId] = useState(payment.conditionId || "");
  const conditionIsSignature =
    ((condition || "") + "").toUpperCase() === "SIGNATURE";

  useEffect(() => {
    setAmount(Number(payment.amount) || 0);
    setChosenType(relatedType || "");
    setCondition(payment.paymentCondition || "");
    setStatus(payment.status);
    setConditionItem(payment.conditionItem || "");
    setConditionId(payment.conditionId || "");
  }, [
    payment.id,
    relatedType,
    payment.amount,
    payment.paymentCondition,
    payment.status,
    payment.conditionItem,
    payment.conditionId,
  ]);

  // === NEW: independent request for status ===
  const updateStatus = async (next) => {
    // guard: allow only RECEIVED or TRANSFERRED
    if (next !== "RECEIVED" && next !== "TRANSFERRED") return;

    const req = await handleRequestSubmit(
      { status: next },
      setLoading,
      `shared/contracts/${contractId}/payments/${payment.id}/actions/change-status`,
      false,
      "Updating",
      false
    );

    if (req.status === 200) {
      setStatus(next);
      await onReload();
      oad();
    }
  };

  const save = async () => {
    const payload = diffPayload(
      {
        amount: Number(payment.amount) || 0,
        condition: payment.paymentCondition || "",
        type: relatedType || "",
        conditionId: payment.conditionId || "",
      },
      {
        amount,
        condition: condition,
        type: chosenType,
        conditionId: conditionId,
      }
    );

    if (conditionIsSignature && "paymentCondition" in payload) {
      delete payload.paymentCondition;
    }

    if (Object.keys(payload).length === 0) {
      setEdit(false);
      return;
    }
    const req = await handleRequestSubmit(
      payload,
      setLoading,
      `shared/contracts/${contractId}/payments/${payment.id}`,
      false,
      "Updating",
      false,
      "PUT"
    );

    if (req.status === 200) {
      setEdit(false);
      await onReload();
    }
  };

  const remove = async () => {
    const req = await handleRequestSubmit(
      {},
      setLoading,
      `shared/contracts/${contractId}/payments/${payment.id}`,
      false,
      "Updating",
      false,
      "DELETE"
    );

    if (req.status === 200) {
      await onReload();
    }
  };

  const deletable = canDeletePayment(payment.status);

  // color for Chip preview
  const statusColor =
    status === "RECEIVED"
      ? "success"
      : status === "TRANSFERRED"
      ? "info"
      : status === "DUE"
      ? "warning"
      : "default";

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.success.main,
            0.08
          )} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
          "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
          transition: "all 0.3s ease",
        }}
      >
        <CardHeader
          title={`Payment • ${Number(payment.amount)}`}
          subheader={
            <>
              {payment.project
                ? `Project: ${payment.project.type}`
                : `No related project`}
              <br />
              {payment.note}
            </>
          }
          action={
            <Stack direction="row" spacing={0.5}>
              {edit ? (
                <>
                  <IconButton color="primary" onClick={save} size="small">
                    <FaSave />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => setEdit(false)}
                    size="small"
                  >
                    <FaTimes />
                  </IconButton>
                </>
              ) : (
                <IconButton onClick={() => setEdit(true)} size="small">
                  <FaEdit />
                </IconButton>
              )}
              <IconButton
                color="error"
                onClick={() => deletable && setConfirmOpen(true)}
                disabled={!deletable}
                size="small"
                title={
                  deletable
                    ? "Delete payment"
                    : "Only deletable when Not Due or Due"
                }
              >
                <FaTrash />
              </IconButton>
            </Stack>
          }
        />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            {/* === NEW: Status Select (independent request) === */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Chip label={status} color={statusColor} variant="filled" />
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  label="Payment Status"
                  value={status}
                  onChange={(e) => updateStatus(e.target.value)}
                  size="small"
                >
                  {/* Only allowed targets */}
                  <MenuItem value="RECEIVED">RECEIVED</MenuItem>
                  <MenuItem value="TRANSFERRED">TRANSFERRED</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <TextField
              type="number"
              label="Amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              disabled={!edit}
              fullWidth
              size="small"
            />
            <Typography variant="body2" sx={{ fontWeight: 600, mt: 1 }}>
              Amount with Tax:
              {(
                Number(amount || 0) *
                (1 + (Number(taxRate) || 0) / 100)
              ).toFixed(2)}
            </Typography>

            {/* Condition select (unchanged) */}
            {!conditionIsSignature && (
              <SelectPaymentCondition
                initialCondition={payment?.conditionItem}
                disabled={!edit}
                onConditionChange={(value) => {
                  setCondition(value.condition);
                  setChosenType(value.conditionType);
                  setConditionItem(value.conditionItem);
                  setConditionId(value.id);
                }}
              />
            )}
            {conditionIsSignature && (
              <Typography variant="caption" color="text.secondary">
                Condition is "Signature" — it cannot be changed.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await remove();
          setConfirmOpen(false);
        }}
        title="Delete Payment"
        content={`Delete this payment of ${Number(
          payment.amount
        )}? You can only delete NOT_DUE or DUE payments.`}
      />
    </>
  );
}
