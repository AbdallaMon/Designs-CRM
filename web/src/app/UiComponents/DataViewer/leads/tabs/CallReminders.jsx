import React from "react";
import { Stack, Typography, useTheme } from "@mui/material";

import {
  CallResultDialog,
  NewCallDialog,
} from "@/app/UiComponents/DataViewer/leads/dialogs/CallsDialog";
import {
  RiAlarmLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiPhoneLine,
  RiUserLine,
} from "react-icons/ri";
import { InProgressCall } from "@/app/UiComponents/DataViewer/leads/widgets/InProgressCall.jsx";
import dayjs from "dayjs";
import { useAuth } from "@/app/providers/AuthProvider";

import DeleteModelButton from "../../../common/DeleteModelButton";
import { EmptyState } from "../shared/EmptyState";
import { TabLoading } from "../shared/TabLoading";
import { useLeadTab } from "../context/LeadDetailsContext";
import {
  TabSection,
  RecordCard,
  MetaItem,
  CardBlock,
  StatusPill,
} from "../shared/tabKit";

export function CallReminders({ lead, setleads, admin, notUser }) {
  const { data: callReminders, onMutated: setCallReminders, showLoading } =
    useLeadTab("calls", { fallback: lead?.callReminders });
  const theme = useTheme();
  const { user } = useAuth();

  if (showLoading) return <TabLoading />;

  const statusColor = (status) =>
    ({
      IN_PROGRESS: theme.palette.warning.main,
      DONE: theme.palette.success.main,
    })[status] || theme.palette.grey[500];

  const visibleCalls = callReminders?.filter((call) => {
    if (
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN" &&
      user.role !== "STAFF" &&
      user.role !== "SUPER_SALES" &&
      call.userId !== user.id
    ) {
      return false;
    }
    return true;
  });

  return (
    <TabSection
      icon={<RiPhoneLine />}
      title="Call Reminders"
      count={visibleCalls?.length || 0}
      action={
        !notUser ? (
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
            notUser
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
                  call.status !== "IN_PROGRESS"
                    ? `Done at ${dayjs(call.updatedAt).format("DD/MM/YYYY")}`
                    : undefined
                }
                status={
                  <StatusPill
                    label={call.status.replace(/_/g, " ")}
                    color={c}
                    icon={
                      call.status === "DONE" ? (
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
                    {user.role !== "ACCOUNTANT" &&
                      call.status === "IN_PROGRESS" && (
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
                  {call.status === "IN_PROGRESS" && <InProgressCall call={call} />}
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
