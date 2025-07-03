import React, { useState, useEffect } from "react";
import {
  Paper,
  Box,
  Grid2 as Grid,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
  Skeleton,
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
import { CallResultDialog } from "../leadsDialogs";
import DeleteModelButton from "./DeleteModelButton";
import { InProgressCall } from "../InProgressCall";
import { useAuth } from "@/app/providers/AuthProvider";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import PreviewDialog from "../PreviewLead";

dayjs.extend(utc);
dayjs.extend(timezone);

export const CallCard = ({ call, onUpdate, extra = false }) => {
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

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow: theme.shadows[4],
          transform: "translateY(-2px)",
          borderColor: theme.palette.primary.main,
        },
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
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box>
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
                  {call.status !== "IN_PROGRESS" && (
                    <Typography variant="body2" fontWeight="600">
                      Done at ,{dayjs(call.updatedAt).format("DD/MM/YYYY")}
                    </Typography>
                  )}
                  <Button
                    type="a"
                    target="_blank"
                    href={`/dashboard/deals/${call.clientLeadId}`}
                    variant="outlined"
                  >
                    Preview lead
                  </Button>
                </Box>
                {user.role !== "ACCOUNTANT" && (
                  <>
                    {call.status === "IN_PROGRESS" && (
                      <CallResultDialog call={call} onUpdate={onUpdate} />
                    )}
                  </>
                )}
                <DeleteModelButton
                  item={call}
                  model={"CallReminder"}
                  contentKey="reminderReason"
                  onDelete={() => {
                    onUpdate();
                  }}
                />
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <RiUserLine size={16} color={theme.palette.text.secondary} />
                <Typography variant="body2" color="text.secondary">
                  {call.user.name}
                </Typography>
              </Stack>
            </Stack>
            {call.status === "IN_PROGRESS" && <InProgressCall call={call} />}
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <RiCalendarLine size={18} color={theme.palette.primary.main} />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: call.isAdmin ? 600 : 400,
                    color: call.isAdmin ? "#7B1FA2" : "inherit",
                  }}
                >
                  {call.time
                    ? dayjs(call.time).format("MM/DD/YYYY, h:mm A")
                    : "No time selected"}
                </Typography>
              </Stack>

              <Box
                sx={{
                  bgcolor: alpha(theme.palette.background.default, 0.6),
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
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
              {call.callResult && (
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
                    {call.callResult}
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

// Enhanced Meeting Card Component
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
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow: theme.shadows[4],
          transform: "translateY(-2px)",
          borderColor: meeting.isAdmin ? "#9C27B0" : theme.palette.primary.main,
        },
        ...(meeting.isAdmin && {
          background: `linear-gradient(135deg, ${alpha(
            "#9C27B0",
            0.02
          )} 0%, ${alpha("#9C27B0", 0.05)} 100%)`,
          borderColor: alpha("#9C27B0", 0.3),
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
                ? "#9C27B0"
                : theme.palette.primary.main,
            },
            // Special styling for admin meetings
            ...(meeting.isAdmin && {
              background: `linear-gradient(135deg, ${alpha(
                "#9C27B0",
                0.02
              )} 0%, ${alpha("#9C27B0", 0.05)} 100%)`,
              borderColor: alpha("#9C27B0", 0.3),
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
                      meeting.status === "DONE" ? (
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

                {/* Done Date */}
                {meeting.status !== "IN_PROGRESS" && (
                  <Typography
                    variant="body2"
                    fontWeight="600"
                    color="text.secondary"
                  >
                    Done at {dayjs(meeting.updatedAt).format("DD/MM/YYYY")}
                  </Typography>
                )}

                {/* Action Buttons */}
                <Stack direction="row" spacing={1} alignItems="center">
                  {user.role !== "ACCOUNTANT" && (
                    <>
                      {meeting.status === "IN_PROGRESS" && (
                        <CallResultDialog
                          call={meeting}
                          reminderType="MEETING"
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

              {/* User Info */}
              <Stack direction="column" spacing={1} alignItems="flex-end">
                <Stack direction="row" spacing={1} alignItems="center">
                  <RiUserLine size={16} color={theme.palette.text.secondary} />
                  <Typography variant="body2" color="text.secondary">
                    {meeting.user.name}
                  </Typography>
                </Stack>

                {/* Admin Info (if admin meeting) */}
                {meeting.isAdmin && meeting.admin && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <RiShieldUserLine size={16} color="#9C27B0" />
                    <Typography
                      variant="body2"
                      sx={{ color: "#7B1FA2", fontWeight: 600 }}
                    >
                      Admin: {meeting.admin.name}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Stack>

            {meeting.status === "IN_PROGRESS" && (
              <InProgressCall call={meeting} type="MEETING" />
            )}

            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <RiCalendarLine
                  size={18}
                  color={
                    meeting.isAdmin ? "#9C27B0" : theme.palette.primary.main
                  }
                />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: meeting.isAdmin ? 600 : 400,
                    color: meeting.isAdmin ? "#7B1FA2" : "inherit",
                  }}
                >
                  {dayjs(meeting.time).format("MM/DD/YYYY, h:mm A")}
                </Typography>
              </Stack>

              <Box
                sx={{
                  bgcolor: meeting.isAdmin
                    ? alpha("#9C27B0", 0.03)
                    : alpha(theme.palette.background.default, 0.6),
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${
                    meeting.isAdmin
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
