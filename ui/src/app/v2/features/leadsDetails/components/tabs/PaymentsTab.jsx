"use client";

// Payments tab — lists the lead's payments and exposes the Add-payment dialog. Gated on
// canAddPayment. Also surfaces the payment / complete-register reminder triggers when
// canSendReminder.

import { List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { AddPaymentDialog } from "../dialogs/PaymentDialog.jsx";
import { ReminderButtons } from "../ReminderButtons.jsx";

export function PaymentsTab({ lead, onChanged }) {
  const caps = lead?.capabilities ?? {};
  const payments = Array.isArray(lead?.payments) ? lead.payments : [];

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <AddPaymentDialog lead={lead} canAdd={caps.canAddPayment} onCreated={onChanged} />
        <ReminderButtons lead={lead} canSend={caps.canSendReminder} />
      </Stack>
      {payments.length === 0 ? (
        <Typography color="text.secondary">لا توجد دفعات</Typography>
      ) : (
        <List>
          {payments.map((p) => (
            <ListItem key={p.id} divider>
              <ListItemText
                primary={`${p.amount ?? "—"} · ${p.status ?? ""}`}
                secondary={
                  <>
                    {p.paymentReason ? `${p.paymentReason} · ` : ""}
                    {p.createdAt ? dayjs(p.createdAt).format("YYYY-MM-DD") : ""}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  );
}
