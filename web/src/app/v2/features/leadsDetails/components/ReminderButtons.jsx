"use client";

// Reminder triggers — payment-reminder + complete-register, ports the legacy
// ReminderButtons. Both gated on capabilities.canSendReminder (lead.reminder.send ×
// mutate scope, folded by the backend dto). POST /:id/payment-reminder and
// /:id/complete-register.

import { Button, Stack } from "@mui/material";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { useT } from "@/app/v2/lib/i18n";
import { leadsService } from "@/app/v2/features/leads/leads.service.js";
import { runLeadMutation } from "@/app/v2/features/leads/leads.mutations.js";

export function ReminderButtons({ lead, canSend }) {
  const { setLoading } = useToastContext();
  const { t } = useT();
  if (!canSend) return null;

  async function sendPayment() {
    await runLeadMutation(() => leadsService.sendPaymentReminder(lead.id), {
      setLoading,
      loading: t("leadsDetails.reminder.loading"),
    });
  }
  async function sendComplete() {
    await runLeadMutation(() => leadsService.sendCompleteRegister(lead.id), {
      setLoading,
      loading: t("leadsDetails.reminder.loading"),
    });
  }

  return (
    <Stack direction="row" spacing={1}>
      <Button variant="outlined" size="small" onClick={sendPayment}>
        {t("leadsDetails.reminder.payment")}
      </Button>
      <Button variant="outlined" size="small" onClick={sendComplete}>
        {t("leadsDetails.reminder.complete")}
      </Button>
    </Stack>
  );
}
