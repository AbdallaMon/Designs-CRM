import React, { useEffect, useState } from "react";
import {
  alpha,
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { NewClientMeetingDialog } from "@/app/UiComponents/DataViewer/leads/dialogs/MeetingsDialog";
import { CallResultDialog } from "@/app/UiComponents/DataViewer/leads/dialogs/CallsDialog";
import {
  RiAlarmLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiLink,
  RiShieldUserLine,
  RiUserLine,
} from "react-icons/ri";
import { InProgressCall } from "@/app/UiComponents/DataViewer/leads/widgets/InProgressCall.jsx";
import dayjs from "dayjs";
import { useAuth } from "@/app/providers/AuthProvider";

import { Button } from "@mui/material";

import DeleteModelButton from "../../../inline-actions/DeleteModelButton";

export function MeetingReminders({ lead, setleads, admin, notUser }) {
  const [meetingReminders, setMeetingReminders] = useState(
    lead?.meetingReminders
  );
  const theme = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    if (lead?.meetingReminders) setMeetingReminders(lead.meetingReminders);
  }, [lead]);

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

  const getMeetingTypeStyles = (type) => ({
    backgroundColor:
      {
        CONSULTATION: alpha(theme.palette.info.main, 0.1),
        FOLLOW_UP: alpha(theme.palette.secondary.main, 0.1),
        PRESENTATION: alpha(theme.palette.primary.main, 0.1),
        NEGOTIATION: alpha("#FF9800", 0.1), // Orange
        CLOSING: alpha("#4CAF50", 0.1), // Green
        OTHER: alpha(theme.palette.grey[500], 0.1),
      }[type] || alpha(theme.palette.grey[500], 0.1),
    color:
      {
        CONSULTATION: theme.palette.info.dark,
        FOLLOW_UP: theme.palette.secondary.dark,
        PRESENTATION: theme.palette.primary.dark,
        NEGOTIATION: "#E65100", // Dark Orange
        CLOSING: "#2E7D32", // Dark Green
        OTHER: theme.palette.grey[700],
      }[type] || theme.palette.grey[700],
    borderColor:
      {
        CONSULTATION: theme.palette.info.main,
        FOLLOW_UP: theme.palette.secondary.main,
        PRESENTATION: theme.palette.primary.main,
        NEGOTIATION: "#FF9800",
        CLOSING: "#4CAF50",
        OTHER: theme.palette.grey[300],
      }[type] || theme.palette.grey[300],
  });

  const formatMeetingType = (type) => {
    if (!type) return "General";
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Stack spacing={3}>
      {!notUser && (
        <Box display="flex" gap={1.5}>
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
          >
            See admin available days
          </Button>
        </Box>
      )}
      <Stack spacing={2}>
        {meetingReminders?.map((call) => {
          if (
            user.role !== "ADMIN" &&
            user.role !== "SUPER_ADMIN" &&
            user.role !== "STAFF" &&
            user.role !== "SUPER_SALES" &&
            call.userId !== user.id
          ) {
            return;
          }
          return (
            <Paper
              key={call.id}
              elevation={0}
              sx={{
                position: "relative",
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: theme.shadows[4],
                  transform: "translateY(-2px)",
                  borderColor: call.isAdmin
                    ? "#9C27B0"
                    : theme.palette.primary.main,
                },
                // Special styling for admin meetings
                ...(call.isAdmin && {
                  background: `linear-gradient(135deg, ${alpha(
                    "#9C27B0",
                    0.02
                  )} 0%, ${alpha("#9C27B0", 0.05)} 100%)`,
                  borderColor: alpha("#9C27B0", 0.3),
                }),
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                >
                  <Stack spacing={2}>
                    {/* Status and Type Chips Row */}
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Chip
                        size="small"
                        icon={
                          call.status === "DONE" ? (
                            <RiCheckboxCircleLine size={16} />
                          ) : (
                            <RiAlarmLine size={16} />
                          )
                        }
                        label={`# ${call.id}`}
                        sx={{
                          fontWeight: 600,
                          border: "1px solid",
                          "& .MuiChip-icon": {
                            color: "inherit",
                          },
                        }}
                      />
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
                          "& .MuiChip-icon": {
                            color: "inherit",
                          },
                        }}
                      />

                      <Chip
                        size="small"
                        label={formatMeetingType(call.type)}
                        sx={{
                          ...getMeetingTypeStyles(call.type),
                          fontWeight: 600,
                          border: "1px solid",
                        }}
                      />

                      {/* Admin Tag */}
                      {call.isAdmin && (
                        <Chip
                          size="small"
                          icon={<RiShieldUserLine size={16} />}
                          label="ADMIN"
                          sx={{
                            backgroundColor: alpha("#9C27B0", 0.1),
                            color: "#7B1FA2",
                            borderColor: "#9C27B0",
                            fontWeight: 700,
                            border: "1px solid",
                            "& .MuiChip-icon": {
                              color: "#7B1FA2",
                            },
                          }}
                        />
                      )}

                      {call.token && (
                        <Chip
                          size="small"
                          icon={<RiLink size={16} />}
                          label="Client Link"
                          sx={{
                            backgroundColor: alpha(
                              theme.palette.info.main,
                              0.1
                            ),
                            color: theme.palette.info.main,
                            fontWeight: 700,
                            border: `1px solid ${alpha(
                              theme.palette.info.main,
                              0.5
                            )}`,
                            "& .MuiChip-icon": {
                              color: theme.palette.info.main,
                            },
                          }}
                        />
                      )}
                    </Stack>

                    {/* Done Date */}
                    {call.status !== "IN_PROGRESS" && (
                      <Typography
                        variant="body2"
                        fontWeight="600"
                        color="text.secondary"
                      >
                        Done at {dayjs(call.updatedAt).format("DD/MM/YYYY")}
                      </Typography>
                    )}

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={1} alignItems="center">
                      {user.role !== "ACCOUNTANT" && (
                        <>
                          {call.status === "IN_PROGRESS" && (
                            <CallResultDialog
                              lead={lead}
                              setCallReminders={setMeetingReminders}
                              call={call}
                              setleads={setleads}
                              reminderType="MEETING"
                              text="Update meeting result"
                            />
                          )}
                        </>
                      )}
                      {call.token && (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mt: 1, flexWrap: "wrap" }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Client Link:
                          </Typography>
                          <Typography
                            variant="body2"
                            color="primary"
                            sx={{ wordBreak: "break-all" }}
                          >
                            {`${window.location.origin}/booking?token=${call.token}`}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                `${window.location.origin}/booking?token=${call.token}`
                              )
                            }
                          >
                            Copy
                          </Button>
                        </Stack>
                      )}

                      <DeleteModelButton
                        item={call}
                        model={"MeetingReminder"}
                        contentKey="reminderReason"
                        onDelete={() => {
                          setMeetingReminders((oldCalls) =>
                            oldCalls.filter((c) => c.id !== call.id)
                          );
                        }}
                      />
                    </Stack>
                  </Stack>

                  {/* User Info */}
                  <Stack direction="column" spacing={1} alignItems="flex-end">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <RiUserLine
                        size={16}
                        color={theme.palette.text.secondary}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {call.user.name}
                      </Typography>
                    </Stack>

                    {/* Admin Info (if admin meeting) */}
                    {call.isAdmin && call.admin && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <RiShieldUserLine size={16} color="#9C27B0" />
                        <Typography
                          variant="body2"
                          sx={{ color: "#7B1FA2", fontWeight: 600 }}
                        >
                          Admin: {call.admin.name}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Stack>

                {call.status === "IN_PROGRESS" && (
                  <InProgressCall call={call} type="MEETING" />
                )}

                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <RiCalendarLine
                      size={18}
                      color={
                        call.isAdmin ? "#9C27B0" : theme.palette.primary.main
                      }
                    />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: call.isAdmin ? 600 : 400,
                        color: call.isAdmin ? "#7B1FA2" : "inherit",
                      }}
                    >
                      {dayjs(call.time).format("MM/DD/YYYY, h:mm A")}
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      bgcolor: call.isAdmin
                        ? alpha("#9C27B0", 0.03)
                        : alpha(theme.palette.background.default, 0.6),
                      p: 2,
                      borderRadius: 2,
                      border: `1px solid ${
                        call.isAdmin
                          ? alpha("#9C27B0", 0.2)
                          : theme.palette.divider
                      }`,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.primary }}
                    >
                      <Box component="span" fontWeight="600">
                        Reason:
                      </Box>{" "}
                      {call.reminderReason}
                    </Typography>
                  </Box>

                  {call.meetingResult && (
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        borderRadius: 2,
                        border: `1px solid ${alpha(
                          theme.palette.success.main,
                          0.1
                        )}`,
                      }}
                    >
                      <Typography variant="body2" color="success.dark">
                        <Box component="span" fontWeight="600">
                          Result:
                        </Box>{" "}
                        {call.meetingResult}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Stack>
  );
}
