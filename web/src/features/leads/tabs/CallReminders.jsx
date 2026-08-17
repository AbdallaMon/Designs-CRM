import { CALL_REMINDER_STATUSES, LEAD_STATUSES, PROFILES } from "@dms/shared";
import React from "react";
import { Button, Stack, Typography, useTheme } from "@mui/material";

import {
  CallResultDialog,
  NewCallDialog,
} from "@/features/leads/dialogs/CallsDialog";
import {
  RiAlarmLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiPhoneLine,
  RiUserLine,
} from "react-icons/ri";
import { InProgressCall } from "@/features/leads/widgets/InProgressCall.jsx";
import dayjs from "dayjs";
import { useAuth } from "@/app/providers/AuthProvider";

import DeleteModelButton from "@/shared/components/common/DeleteModelButton.jsx";
import { EmptyState } from "@/features/leads/shared/EmptyState.jsx";
import { TabLoading } from "@/features/leads/shared/TabLoading.jsx";
import { useLeadTab } from "@/features/leads/context/LeadDetailsContext.jsx";
import {
  TabSection,
  RecordCard,
  MetaItem,
  CardBlock,
  StatusPill,
} from "@/features/leads/shared/tabKit.jsx";

export function CallReminders({ lead, setleads, admin, notUser }) {
  const {
    data: callReminders,
    onMutated: setCallReminders,
    showLoading,
    error,
    refetch,
  } = useLeadTab("calls", { fallback: lead?.callReminders });
  const theme = useTheme();
  const { user } = useAuth();

  if (showLoading) return <TabLoading />;

  if (error) {
    return (
      <TabSection icon={<RiPhoneLine />} title="Call Reminders">
        <EmptyState
          icon={<RiPhoneLine />}
          title="Couldn't load call reminders"
          description="Something went wrong while loading the call reminders. Please try again."
          action={
            <Button
              variant="outlined"
              onClick={() => refetch()}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Retry
            </Button>
          }
        />
      </TabSection>
    );
  }

  const statusColor = (status) =>
    ({
      IN_PROGRESS: theme.palette.warning.main,
      DONE: theme.palette.success.main,
    })[status] || theme.palette.grey[500];

  const visibleCalls = callReminders?.filter((call) => {
    if (
      user.profile !== PROFILES.ADMIN &&
      user.profile !== PROFILES.SUPER_ADMIN &&
      ![PROFILES.NORMAL_SALES, PROFILES.PRIMARY_SALES, PROFILES.SUPER_SALES].includes(user.profile) &&
      user.profile !== PROFILES.SUPER_SALES &&
      call.userId !== user.id
    ) {
      return false;
    }
    return true;
  });

  const canCreate = lead?.capabilities
    ? Boolean(lead.capabilities.canAddCall)
    : !notUser;

  return (
    <TabSection
      icon={<RiPhoneLine />}
      title="Call Reminders"
      count={visibleCalls?.length || 0}
      action={
        canCreate ? (
          <NewCallDialog
            lead={lead}
            setCallReminders={setCallReminders}
            setleads={setleads}
          />
        ) : null
      }
    >
      {!visibleCalls?.length ? (
        <EmptyState
          icon={<RiPhoneLine />}
          title="No call reminders"
          description={
            !canCreate
              ? "There are no scheduled calls for this lead."
              : "Schedule a call to follow up with this lead."
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {visibleCalls.map((call) => {
            const c = statusColor(call.status);
            return (
              <RecordCard
                key={call.id}
                accent={c}
                title={
                  call.time
                    ? dayjs(call.time).format("MM/DD/YYYY, h:mm A")
                    : "No time selected"
                }
                subtitle={
                  call.status !== LEAD_STATUSES.IN_PROGRESS
                    ? `Done at ${dayjs(call.updatedAt).format("DD/MM/YYYY")}`
                    : undefined
                }
                status={
                  <StatusPill
                    label={call.status.replace(/_/g, " ")}
                    color={c}
                    icon={
                      call.status === CALL_REMINDER_STATUSES.DONE ? (
                        <RiCheckboxCircleLine size={15} />
                      ) : (
                        <RiAlarmLine size={15} />
                      )
                    }
                  />
                }
                meta={
                  <MetaItem
                    icon={<RiUserLine size={15} />}
                    value={call.user?.name}
                  />
                }
                actions={
                  <>
                    {user.profile !== PROFILES.ACCOUNTANT &&
                      call.status === LEAD_STATUSES.IN_PROGRESS && (
                        <CallResultDialog
                          lead={lead}
                          setCallReminders={setCallReminders}
                          call={call}
                          setleads={setleads}
                        />
                      )}
                    <DeleteModelButton
                      item={call}
                      model={"CallReminder"}
                      contentKey="reminderReason"
                      onDelete={() =>
                        setCallReminders((old) =>
                          old.filter((x) => x.id !== call.id)
                        )
                      }
                    />
                  </>
                }
              >
                <Stack spacing={1.5}>
                  {call.status === LEAD_STATUSES.IN_PROGRESS && <InProgressCall call={call} />}
                  <CardBlock label="Reason">{call.reminderReason}</CardBlock>
                  {call.callResult && (
                    <CardBlock label="Result" color={theme.palette.success.main}>
                      {call.callResult}
                    </CardBlock>
                  )}
                </Stack>
              </RecordCard>
            );
          })}
        </Stack>
      )}
    </TabSection>
  );
}
