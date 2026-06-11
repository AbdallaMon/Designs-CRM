"use client";

// Calls tab — lists the lead's call reminders (nested on the detail payload) and exposes the
// New-call dialog (header add-button) + per-reminder result dialog (row action). Capability-
// gated on canAddCall (unchanged). The body is the shared LeadRecordList primitive; the result
// status reads as a <StatusChip> (domain="reminder") instead of a bare "· status" string.

import { Stack, Typography } from "@mui/material";
import { MdCall } from "react-icons/md";
import dayjs from "dayjs";
import { StatusChip } from "@/app/v2/shared/components";
import { useT } from "@/app/v2/lib/i18n";
import { LeadRecordList } from "../LeadRecordList.jsx";
import {
  NewCallMeetingDialog,
  CallMeetingResultDialog,
} from "../dialogs/CallMeetingDialogs.jsx";

export function CallsTab({ lead, onChanged, autoOpenAction, onAutoOpenConsumed }) {
  const { t } = useT();
  const caps = lead?.capabilities ?? {};
  const calls = Array.isArray(lead?.callReminders) ? lead.callReminders : [];

  return (
    <LeadRecordList
      title={t("leadsDetails.calls.title")}
      icon={<MdCall />}
      items={calls}
      headerAction={
        <NewCallMeetingDialog
          lead={lead}
          reminderType="CALL"
          canAdd={caps.canAddCall}
          onCreated={onChanged}
          autoOpen={autoOpenAction === "add"}
          onAutoOpenConsumed={onAutoOpenConsumed}
        />
      }
      renderPrimary={(c) => (
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {c.reminderReason || "—"}
        </Typography>
      )}
      renderSecondary={(c) => (
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" rowGap={0.5}>
          <Typography variant="body2" color="text.secondary" component="span">
            {c.time ? dayjs(c.time).format("YYYY-MM-DD HH:mm") : "—"}
          </Typography>
          {c.callResult && (
            <Typography variant="body2" color="text.secondary" component="span">
              · {c.callResult}
            </Typography>
          )}
        </Stack>
      )}
      renderStatus={(c) =>
        c.status ? <StatusChip domain="reminder" status={c.status} /> : null
      }
      renderRowAction={(c) => (
        <CallMeetingResultDialog
          reminder={c}
          reminderType="CALL"
          canManage={caps.canAddCall}
          onUpdated={onChanged}
        />
      )}
      emptyTitle={t("leadsDetails.calls.empty.title")}
      emptyDescription={
        caps.canAddCall
          ? t("leadsDetails.calls.empty.canAdd")
          : t("leadsDetails.calls.empty.readonly")
      }
    />
  );
}
