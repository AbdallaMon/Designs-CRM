import React from "react";
import {
  alpha,
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

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
import { SectionToolbar } from "../shared/SectionToolbar";
import { EmptyState } from "../shared/EmptyState";
import { TabLoading } from "../shared/TabLoading";
import { useLeadTab } from "../context/LeadDetailsContext";

export function CallReminders({ lead, setleads, admin, notUser }) {
  const { data: callReminders, onMutated: setCallReminders, showLoading } =
    useLeadTab("calls", { fallback: lead?.callReminders });
  const theme = useTheme();
  const { user } = useAuth();

  if (showLoading) return <TabLoading />;

  const getStatusStyles = (status) => ({
    backgroundColor:
      {
        IN_PROGRESS: alpha(theme.palette.warning.main, 0.1),
        DONE: alpha(theme.palette.success.main, 0.1),
      }[status] || alpha(theme.palette.grey[500], 0.1),
    color:
      {
        IN_PROGRESS: theme.palette.warning.dark,
        DONE: theme.palette.success.dark,
      }[status] || theme.palette.grey[700],
    borderColor:
      {
        IN_PROGRESS: theme.palette.warning.main,
        DONE: theme.palette.success.main,
      }[status] || theme.palette.grey[300],
  });

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
    <Stack spacing={3}>
      <SectionToolbar
        icon={<RiPhoneLine />}
        title="Call Reminders"
        count={visibleCalls?.length || 0}
        countLabel="calls"
        action={
          !notUser ? (
            <NewCallDialog
              lead={lead}
              setCallReminders={setCallReminders}
              setleads={setleads}
            />
          ) : null
        }
      />

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
        <Stack spacing={2}>
          {visibleCalls.map((call) => (
            <Paper
              key={call.id}
              elevation={0}
              sx={{
                position: "relative",
                p: 3,
                borderRadius: 2.5,
                border: `1px solid ${theme.palette.divider}`,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: theme.shadows[3],
                  borderColor: alpha(theme.palette.primary.main, 0.4),
                },
              }}
            >
              <Stack spacing={2}>
                {/* Header row: status + owner */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip
                      size="small"
                      icon={
                        call.status === "DONE" ? (
                          <RiCheckboxCircleLine size={16} />
                        ) : (
                          <RiAlarmLine size={16} />
                        )
                      }
                      label={call.status.replace(/_/g, " ")}
                      sx={{
                        ...getStatusStyles(call.status),
                        fontWeight: 600,
                        border: "1px solid",
                        "& .MuiChip-icon": { color: "inherit" },
                      }}
                    />
                    {call.status !== "IN_PROGRESS" && (
                      <Typography variant="caption" color="text.secondary">
                        Done at {dayjs(call.updatedAt).format("DD/MM/YYYY")}
                      </Typography>
                    )}
                  </Stack>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <RiUserLine
                      size={16}
                      color={theme.palette.text.secondary}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {call.user.name}
                    </Typography>
                  </Stack>
                </Stack>

                {call.status === "IN_PROGRESS" && (
                  <InProgressCall call={call} />
                )}

                {/* Scheduled time */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <RiCalendarLine
                    size={18}
                    color={theme.palette.primary.main}
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: call.isAdmin ? 600 : 500,
                      color: call.isAdmin ? "#7B1FA2" : "text.primary",
                    }}
                  >
                    {call.time
                      ? dayjs(call.time).format("MM/DD/YYYY, h:mm A")
                      : "No time selected"}
                  </Typography>
                </Stack>

                {/* Reason */}
                <Box
                  sx={{
                    bgcolor: alpha(theme.palette.background.default, 0.6),
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ lineHeight: 1.4, fontWeight: 700 }}
                  >
                    Reason
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    {call.reminderReason}
                  </Typography>
                </Box>

                {/* Result */}
                {call.callResult && (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: alpha(theme.palette.success.main, 0.05),
                      borderRadius: 2,
                      border: `1px solid ${alpha(
                        theme.palette.success.main,
                        0.2
                      )}`,
                    }}
                  >
                    <Typography
                      variant="overline"
                      color="success.dark"
                      sx={{ lineHeight: 1.4, fontWeight: 700 }}
                    >
                      Result
                    </Typography>
                    <Typography variant="body2" color="success.dark">
                      {call.callResult}
                    </Typography>
                  </Box>
                )}

                {/* Actions */}
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ pt: 0.5, borderTop: `1px solid ${theme.palette.divider}` }}
                >
                  {user.role !== "ACCOUNTANT" &&
                    call.status === "IN_PROGRESS" && (
                      <CallResultDialog
                        lead={lead}
                        setCallReminders={setCallReminders}
                        call={call}
                        setleads={setleads}
                      />
                    )}
                  <Box sx={{ flex: 1 }} />
                  <DeleteModelButton
                    item={call}
                    model={"CallReminder"}
                    contentKey="reminderReason"
                    onDelete={() => {
                      setCallReminders((oldCalls) =>
                        oldCalls.filter((c) => c.id !== call.id)
                      );
                    }}
                  />
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
