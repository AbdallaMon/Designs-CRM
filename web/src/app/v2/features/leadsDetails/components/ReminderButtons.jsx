"use client";

// Reminder triggers — payment-reminder + complete-register, ports the legacy
// ReminderButtons. Both gated on capabilities.canSendReminder (lead.reminder.send ×
// mutate scope, folded by the backend dto). POST /:id/payment-reminder and
// /:id/complete-register.

import { Button, Stack } from "@mui/material";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { leadsService } from "@/app/v2/features/leads/leads.service.js";
import { runLeadMutation } from "@/app/v2/features/leads/leads.mutations.js";

export function ReminderButtons({ lead, canSend }) {
  const { setLoading } = useToastContext();
  if (!canSend) return null;

  async function sendPayment() {
    await runLeadMutation(() => leadsService.sendPaymentReminder(lead.id), {
      setLoading,
      loading: "جاري الإرسال...",
    });
  }
  async function sendComplete() {
    await runLeadMutation(() => leadsService.sendCompleteRegister(lead.id), {
      setLoading,
      loading: "جاري الإرسال...",
    });
  }

  return (
    <Stack direction="row" spacing={1}>
      <Button variant="outlined" size="small" onClick={sendPayment}>
        تذكير بالدفع
      </Button>
      <Button variant="outlined" size="small" onClick={sendComplete}>
        تذكير بإكمال التسجيل
      </Button>
    </Stack>
  );
}
