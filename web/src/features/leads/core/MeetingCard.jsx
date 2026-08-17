import {
  CALL_REMINDER_STATUSES,
  LEAD_STATUSES,
  PROFILES,
  REMINDER_TYPES,
} from "@dms/shared";
import React from "react";
import {
  Paper,
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  useTheme,
  Stack,
  Button,
  alpha,
} from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  RiCheckboxCircleLine,
  RiAlarmLine,
  RiUserLine,
  RiCalendarLine,
  RiShieldUserLine,
  RiLink,
} from "react-icons/ri";
import { CallResultDialog } from "@/features/leads/dialogs/CallsDialog.jsx";
import DeleteModelButton from "@/shared/components/common/DeleteModelButton.jsx";
import { InProgressCall } from "@/features/leads/widgets/InProgressCall.jsx";
import { useAuth } from "@/app/providers/AuthProvider";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * MeetingCard Component
 * Enhanced card for displaying meeting reminder information with type, status, and actions
 */
export const MeetingCard = ({ meeting, onUpdate, extra = false }) => {
  const theme = useTheme();
  const { user } = useAuth();

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
        NEGOTIATION: alpha(theme.palette.warning.main, 0.1),
        CLOSING: alpha(theme.palette.success.main, 0.1),
        OTHER: alpha(theme.palette.grey[500], 0.1),
      }[type] || alpha(theme.palette.grey[500], 0.1),
    color:
      {
        CONSULTATION: theme.palette.info.dark,
        FOLLOW_UP: theme.palette.secondary.dark,
        PRESENTATION: theme.palette.primary.dark,
        NEGOTIATION: theme.palette.warning.dark,
        CLOSING: theme.palette.success.dark,
        OTHER: theme.palette.grey[700],
      }[type] || theme.palette.grey[700],
    borderColor:
      {
        CONSULTATION: theme.palette.info.main,
        FOLLOW_UP: theme.palette.secondary.main,
        PRESENTATION: theme.palette.primary.main,
        NEGOTIATION: theme.palette.warning.main,
        CLOSING: theme.palette.success.main,
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
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow: theme.shadows[4],
          transform: "translateY(-2px)",
          borderColor: meeting.isAdmin
            ? theme.palette.secondary.main
            : theme.palette.primary.main,
        },
        ...(meeting.isAdmin && {
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.secondary.main,
            0.02
          )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderColor: alpha(theme.palette.secondary.main, 0.3),
        }),
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Paper
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
              borderColor: meeting.isAdmin
                ? theme.palette.secondary.main
                : theme.palette.primary.main,
            },
            ...(meeting.isAdmin && {
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.secondary.main,
                0.02
              )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              borderColor: alpha(theme.palette.secondary.main, 0.3),
            }),
          }}
        >
          <Stack spacing={2}>
            <Stack spacing={2}>
              <Typography variant="h4">
                {" "}
                Client lead id # <strong>{meeting.clientLeadId}</strong>
              </Typography>
            </Stack>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <Chip
                    size="small"
                    icon={
                      meeting.status === CALL_REMINDER_STATUSES.DONE ? (
                        <RiCheckboxCircleLine size={16} />
                      ) : (
                        <RiAlarmLine size={16} />
                      )
                    }
                    label={meeting.status.replace(/_/g, " ")}
                    sx={{
                      ...getStatusStyles(meeting.status),
                      fontWeight: 600,
                      border: "1px solid",
                      "& .MuiChip-icon": {
                        color: "inherit",
                      },
                    }}
                  />

                  <Chip
                    size="small"
                    label={formatMeetingType(meeting.type)}
                    sx={{
                      ...getMeetingTypeStyles(meeting.type),
                      fontWeight: 600,
                      border: "1px solid",
                    }}
                  />

                  {meeting.isAdmin && (
                    <Chip
                      size="small"
                      icon={<RiShieldUserLine size={16} />}
                      label="ADMIN"
                      sx={{
                        backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                        color: theme.palette.secondary.dark,
                        borderColor: theme.palette.secondary.main,
                        fontWeight: 700,
                        border: "1px solid",
                        "& .MuiChip-icon": {
                          color: theme.palette.secondary.dark,
                        },
                      }}
                    />
                  )}

                  {meeting.token && (
                    <Chip
                      size="small"
                      icon={<RiLink size={16} />}
                      label="Client Link"
                      sx={{
                        backgroundColor: alpha(theme.palette.info.main, 0.1),
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

                {meeting.status !== LEAD_STATUSES.IN_PROGRESS && (
                  <Typography
                    variant="body2"
                    fontWeight="600"
                    color="text.secondary"
                  >
                    Done at {dayjs(meeting.updatedAt).format("DD/MM/YYYY")}
                  </Typography>
                )}

                <Stack direction="row" spacing={1} alignItems="center">
                  {user.profile !== PROFILES.ACCOUNTANT && (
                    <>
                      {meeting.status === LEAD_STATUSES.IN_PROGRESS && (
                        <CallResultDialog
                          call={meeting}
                          reminderType={REMINDER_TYPES.MEETING}
                          text="Update meeting result"
                          onUpdate={onUpdate}
                        />
                      )}
                    </>
                  )}
                  <Button
                    type="a"
                    target="_blank"
                    href={`/dashboard/deals/${meeting.clientLeadId}`}
                    variant="outlined"
                    ml={1}
                  >
                    Preview lead
                  </Button>
                  {meeting.token && (
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
                        {`${window.location.origin}/booking?token=${meeting.token}`}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            `${window.location.origin}/booking?token=${meeting.token}`
                          )
                        }
                      >
                        Copy
                      </Button>
                    </Stack>
                  )}

                  <DeleteModelButton
                    item={meeting}
                    model={"MeetingReminder"}
                    contentKey="reminderReason"
                    onDelete={() => {
                      onUpdate();
                    }}
                  />
                </Stack>
              </Stack>

              <Stack direction="column" spacing={1} alignItems="flex-end">
                <Stack direction="row" spacing={1} alignItems="center">
                  <RiUserLine size={16} color={theme.palette.text.secondary} />
                  <Typography variant="body2" color="text.secondary">
                    {meeting.user.name}
                  </Typography>
                </Stack>

                {meeting.isAdmin && meeting.admin && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <RiShieldUserLine
                      size={16}
                      color={theme.palette.secondary.main}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.secondary.dark, fontWeight: 600 }}
                    >
                      Admin: {meeting.admin.name}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Stack>

            {meeting.status === LEAD_STATUSES.IN_PROGRESS && (
              <InProgressCall call={meeting} type={REMINDER_TYPES.MEETING} />
            )}

            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <RiCalendarLine
                  size={18}
                  color={
                    meeting.isAdmin
                      ? theme.palette.secondary.main
                      : theme.palette.primary.main
                  }
                />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: meeting.isAdmin ? 600 : 400,
                    color: meeting.isAdmin
                      ? theme.palette.secondary.dark
                      : "inherit",
                  }}
                >
                  {dayjs(meeting.time).format("MM/DD/YYYY, h:mm A")}
                </Typography>
              </Stack>

              <Box
                sx={{
                  bgcolor: meeting.isAdmin
                    ? alpha(theme.palette.secondary.main, 0.03)
                    : alpha(theme.palette.background.default, 0.6),
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${
                    meeting.isAdmin
                      ? alpha(theme.palette.secondary.main, 0.2)
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
                  {meeting.reminderReason}
                </Typography>
              </Box>

              {meeting.meetingResult && (
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
                    {meeting.meetingResult}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Stack>
        </Paper>
      </CardContent>
    </Card>
  );
};
