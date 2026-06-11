"use client";

// Payments tab — lists the lead's payments and exposes the Add-payment dialog. Gated on
// canAddPayment. Also surfaces the payment / complete-register reminder triggers when
// canSendReminder. Body = shared LeadRecordList; the amount renders via formatAmount and the
// payment status reads as a <StatusChip> (domain="payment") instead of a bare "· status" string.
// When the payload carries paid/remaining figures we surface a one-line totals summary on top.

import { Box, Stack, Typography } from "@mui/material";
import { MdPayments } from "react-icons/md";
import dayjs from "dayjs";
import { StatusChip } from "@/app/v2/shared/components";
import { useT } from "@/app/v2/lib/i18n";
import { LeadRecordList } from "../LeadRecordList.jsx";
import { AddPaymentDialog } from "../dialogs/PaymentDialog.jsx";
import { ReminderButtons } from "../ReminderButtons.jsx";

// Currency formatter — AED in the Arabic-AE locale (mirrors the leads-side formatAED). Falls
// back to "<value> درهم" so a non-numeric amount never renders blank.
function formatAmount(value) {
  if (value == null || value === "") return "—";
  try {
    return new Intl.NumberFormat("ar-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${value} درهم`;
  }
}

// Sum a numeric field across payments, ignoring missing values. Returns null when no payment
// carried the field at all (so we can hide the summary rather than show a misleading "0").
function sumField(payments, field) {
  let total = 0;
  let seen = false;
  for (const p of payments) {
    const v = p?.[field];
    if (v != null && v !== "") {
      total += Number(v) || 0;
      seen = true;
    }
  }
  return seen ? total : null;
}

export function PaymentsTab({ lead, onChanged, autoOpenAction, onAutoOpenConsumed }) {
  const { t } = useT();
  const caps = lead?.capabilities ?? {};
  const payments = Array.isArray(lead?.payments) ? lead.payments : [];

  const paid = sumField(payments, "amountPaid");
  const remaining = sumField(payments, "amountLeft");
  const hasSummary = payments.length > 0 && (paid != null || remaining != null);

  return (
    <Stack spacing={2}>
      {hasSummary && (
        <Box>
          <Typography variant="body2" color="text.secondary">
            {t("leadsDetails.payments.summary")
              .replace("{paid}", formatAmount(paid ?? 0))
              .replace("{remaining}", formatAmount(remaining ?? 0))}
          </Typography>
        </Box>
      )}
      <LeadRecordList
        title={t("leadsDetails.payments.title")}
        icon={<MdPayments />}
        items={payments}
        headerAction={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
            <AddPaymentDialog
              lead={lead}
              canAdd={caps.canAddPayment}
              onCreated={onChanged}
              autoOpen={autoOpenAction === "add"}
              onAutoOpenConsumed={onAutoOpenConsumed}
            />
            <ReminderButtons lead={lead} canSend={caps.canSendReminder} />
          </Stack>
        }
        renderPrimary={(p) => (
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {formatAmount(p.amount)}
          </Typography>
        )}
        renderSecondary={(p) => (
          <Typography variant="body2" color="text.secondary" component="span">
            {p.paymentReason ? `${p.paymentReason} · ` : ""}
            {p.createdAt ? dayjs(p.createdAt).format("YYYY-MM-DD") : ""}
          </Typography>
        )}
        renderStatus={(p) =>
          p.status ? <StatusChip domain="payment" status={p.status} /> : null
        }
        emptyTitle={t("leadsDetails.payments.empty.title")}
        emptyDescription={
          caps.canAddPayment
            ? t("leadsDetails.payments.empty.canAdd")
            : t("leadsDetails.payments.empty.readonly")
        }
      />
    </Stack>
  );
}
