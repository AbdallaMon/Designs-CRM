import React from "react";
import { Button, Stack, useTheme } from "@mui/material";
import { NewClientMeetingDialog } from "@/app/UiComponents/DataViewer/leads/dialogs/MeetingsDialog";
import { CallResultDialog } from "@/app/UiComponents/DataViewer/leads/dialogs/CallsDialog";
import {
  RiAlarmLine,
  RiCheckboxCircleLine,
  RiFileCopyLine,
  RiGroupLine,
  RiLink,
  RiShieldUserLine,
  RiUserLine,
} from "react-icons/ri";
import { InProgressCall } from "@/app/UiComponents/DataViewer/leads/widgets/InProgressCall.jsx";
import dayjs from "dayjs";
import { useAuth } from "@/app/providers/AuthProvider";

import DeleteModelButton from "@/app/UiComponents/common/DeleteModelButton.jsx";
import { EmptyState } from "@/app/UiComponents/DataViewer/leads/shared/EmptyState.jsx";
import { TabLoading } from "@/app/UiComponents/DataViewer/leads/shared/TabLoading.jsx";
import { useLeadTab } from "@/app/UiComponents/DataViewer/leads/context/LeadDetailsContext.jsx";
import {
  TabSection,
  RecordCard,
  MetaItem,
  CardBlock,
  StatusPill,
} from "@/app/UiComponents/DataViewer/leads/shared/tabKit.jsx";

export function MeetingReminders({ lead, setleads, admin, notUser }) {
  const {
    data: meetingReminders,
    onMutated: setMeetingReminders,
    showLoading,
    error,
    refetch,
  } = useLeadTab("meetings", { fallback: lead?.meetingReminders });
  const theme = useTheme();
  const { user } = useAuth();
  // Admin accent maps to the brand secondary (cognac) — the closest palette token
  // to the former one-off purple.
  const ADMIN_PURPLE = theme.palette.secondary.main;

  if (showLoading) return <TabLoading />;

  if (error) {
    return (
      <TabSection icon={<RiGroupLine />} title="Meeting Reminders">
        <EmptyState
          icon={<RiGroupLine />}
          title="Couldn't load meetings"
          description="Something went wrong while loading the meetings. Please try again."
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

  const typeColor = (type) =>
    ({
      CONSULTATION: theme.palette.info.main,
      FOLLOW_UP: theme.palette.secondary.main,
      PRESENTATION: theme.palette.primary.main,
      NEGOTIATION: theme.palette.warning.main,
      CLOSING: theme.palette.success.main,
    })[type] || theme.palette.grey[500];

  const formatMeetingType = (type) => {
    if (!type) return "General";
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const visibleMeetings = meetingReminders?.filter((call) => {
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

  const canCreate = lead?.capabilities
    ? Boolean(lead.capabilities.canAddMeeting)
    : !notUser;

  return (
    <TabSection
      icon={<RiGroupLine />}
      title="Meeting Reminders"
      count={visibleMeetings?.length || 0}
      action={
        canCreate ? (
          <Stack direction="row" gap={1.5} flexWrap="wrap">
            <NewClientMeetingDialog
              lead={lead}
              setMeetingReminders={setMeetingReminders}
              setleads={setleads}
            />
            <Button
              variant="outlined"
              size="small"
              component={"a"}
              target="_blank"
              href="/dashboard/calendar?tab=1"
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Admin available days
            </Button>
          </Stack>
        ) : null
      }
    >
      {!visibleMeetings?.length ? (
        <EmptyState
          icon={<RiGroupLine />}
          title="No meetings scheduled"
          description={
            !canCreate
              ? "There are no scheduled meetings for this lead."
              : "Generate a client appointment link to schedule a meeting."
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {visibleMeetings.map((call) => {
            const c = statusColor(call.status);
            const accent = call.isAdmin ? ADMIN_PURPLE : c;
            const clientLink =
              call.token && typeof window !== "undefined"
                ? `${window.location.origin}/booking?token=${call.token}`
                : null;
            return (
              <RecordCard
                key={call.id}
                accent={accent}
                title={dayjs(call.time).format("MM/DD/YYYY, h:mm A")}
                subtitle={
                  call.status !== "IN_PROGRESS"
                    ? `Done at ${dayjs(call.updatedAt).format("DD/MM/YYYY")}`
                    : `#${call.id}`
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
                  <>
                    <MetaItem
                      icon={<RiUserLine size={15} />}
                      value={call.user?.name}
                    />
                    {call.isAdmin && call.admin && (
                      <MetaItem
                        icon={<RiShieldUserLine size={15} color={ADMIN_PURPLE} />}
                        value={`Admin: ${call.admin.name}`}
                        color={ADMIN_PURPLE}
                      />
                    )}
                  </>
                }
                actions={
                  <>
                    {user.role !== "ACCOUNTANT" &&
                      call.status === "IN_PROGRESS" && (
                        <CallResultDialog
                          lead={lead}
                          setCallReminders={setMeetingReminders}
                          call={call}
                          setleads={setleads}
                          reminderType="MEETING"
                          text="Update result"
                        />
                      )}
                    <DeleteModelButton
                      item={call}
                      model={"MeetingReminder"}
                      contentKey="reminderReason"
                      onDelete={() =>
                        setMeetingReminders((old) =>
                          old.filter((x) => x.id !== call.id)
                        )
                      }
                    />
                  </>
                }
              >
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <StatusPill
                      label={formatMeetingType(call.type)}
                      color={typeColor(call.type)}
                    />
                    {call.isAdmin && (
                      <StatusPill
                        label="ADMIN"
                        color={ADMIN_PURPLE}
                        icon={<RiShieldUserLine size={15} />}
                      />
                    )}
                    {call.token && (
                      <StatusPill
                        label="Client Link"
                        color={theme.palette.info.main}
                        icon={<RiLink size={15} />}
                      />
                    )}
                  </Stack>

                  {call.status === "IN_PROGRESS" && (
                    <InProgressCall call={call} type="MEETING" />
                  )}

                  <CardBlock label="Reason">{call.reminderReason}</CardBlock>

                  {call.meetingResult && (
                    <CardBlock label="Result" color={theme.palette.success.main}>
                      {call.meetingResult}
                    </CardBlock>
                  )}

                  {clientLink && (
                    <CardBlock label="Client Link" color={theme.palette.info.main}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="space-between"
                        flexWrap="wrap"
                        gap={1}
                      >
                        <span style={{ wordBreak: "break-all" }}>{clientLink}</span>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<RiFileCopyLine size={15} />}
                          onClick={() => navigator.clipboard.writeText(clientLink)}
                          sx={{ textTransform: "none", fontWeight: 600, flexShrink: 0 }}
                        >
                          Copy
                        </Button>
                      </Stack>
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
