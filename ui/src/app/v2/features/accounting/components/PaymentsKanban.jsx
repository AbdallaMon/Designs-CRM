"use client";

// Payments kanban board — v2 port of the legacy AccountantKanbanBoard. The legacy main
// payments board (@accountant/payments) grouped all NOT_PAID payments into columns by
// `paymentLevel` and let the accountant change a payment's level by dragging a card; the
// 3d-status board (@accountant/payments/3d-status) grouped the SAME payments by the lead's
// `threeDWorkStage` and was READ-ONLY (legacy moveCard only showed an error).
//
// This v2 port preserves that behavior WITHOUT the heavy react-dnd drag dependency: the
// level board exposes a "change level" action per card (POST .../actions/change-status,
// §5c — no oldPaymentLevel), gated on PAYMENT_CHANGE_LEVEL × capabilities.canChangeStatus;
// the 3d board renders the same cards with no mutating action. Both fetch the unpaginated
// NOT_PAID set via usePaymentsBoard.

import {
  Box,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { usePaymentsBoard } from "../hooks/usePaymentsBoard.js";
import { PAYMENT_LEVELS, PAYMENT_STATUS, THREE_D_WORK_STAGES, formatCurrency } from "../config/accountingConstants.js";
import { ChangePaymentLevelDialog } from "./ChangePaymentLevelDialog.jsx";
import { PaymentInvoicesDialog } from "./PaymentInvoicesDialog.jsx";
import { NotesDialog } from "./NotesDialog.jsx";

const P = PERMISSIONS.ACCOUNTING;

/**
 * @param {object} props
 * @param {"level"|"three-d"} [props.mode]  group/colour by payment level (mutable) or by
 *                                          the lead's 3D work stage (read-only).
 */
export function PaymentsKanban({ mode = "level" }) {
  const { hasPermission } = usePermission();
  const canList = hasPermission(P.PAYMENT_LIST);
  const canChangeLevel = hasPermission(P.PAYMENT_CHANGE_LEVEL);

  const { payments, isLoading, refetch } = usePaymentsBoard({ autoFetch: canList });

  if (!canList) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        لا تملك صلاحية الوصول إلى الدفعات
      </Typography>
    );
  }

  const columnDefs = mode === "three-d" ? THREE_D_WORK_STAGES : PAYMENT_LEVELS;
  const groupKey = (payment) =>
    mode === "three-d" ? payment.clientLead?.threeDWorkStage : payment.paymentLevel;

  return (
    <Box sx={{ overflowX: "auto" }}>
      {isLoading ? (
        <Typography sx={{ py: 4, textAlign: "center" }} color="text.secondary">
          جاري التحميل...
        </Typography>
      ) : (
        <Stack direction="row" spacing={2} sx={{ p: 1, minWidth: "min-content" }}>
          {Object.entries(columnDefs).map(([colKey, colLabel]) => {
            const cards = payments.filter((p) => groupKey(p) === colKey);
            return (
              <Paper
                key={colKey}
                variant="outlined"
                sx={{ p: 1.5, minWidth: 280, maxWidth: 320, bgcolor: "grey.50" }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  {colLabel} ({cards.length})
                </Typography>
                <Stack spacing={1.5}>
                  {cards.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      لا توجد دفعات
                    </Typography>
                  ) : (
                    cards.map((payment) => {
                      const caps = payment.capabilities ?? {};
                      return (
                        <Card key={payment.id} variant="outlined">
                          <CardContent sx={{ "&:last-child": { pb: 1.5 } }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                #{payment.id}
                              </Typography>
                              <Chip size="small" label={PAYMENT_STATUS[payment.status] ?? payment.status} />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {payment.clientLead?.client?.name ?? "—"}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {formatCurrency(payment.amount)}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                              {mode === "level" && canChangeLevel && caps.canChangeStatus && (
                                <ChangePaymentLevelDialog payment={payment} onChanged={refetch} />
                              )}
                              <PaymentInvoicesDialog paymentId={payment.id} />
                              <NotesDialog idKey="paymentId" id={payment.id} buttonLabel="ملاحظات" />
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

export default PaymentsKanban;
