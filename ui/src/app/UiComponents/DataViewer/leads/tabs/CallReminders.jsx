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

import {
  CallResultDialog,
  NewCallDialog,
} from "@/app/UiComponents/DataViewer/leads/dialogs/CallsDialog";
import {
  RiAlarmLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiUserLine,
} from "react-icons/ri";
import { InProgressCall } from "@/app/UiComponents/DataViewer/leads/widgets/InProgressCall.jsx";
import dayjs from "dayjs";
import { useAuth } from "@/app/providers/AuthProvider";

import DeleteModelButton from "../../../inline-actions/DeleteModelButton";

export function CallReminders({ lead, setleads, admin, notUser }) {
  const [callReminders, setCallReminders] = useState(lead?.callReminders);
  const theme = useTheme();
  const { user } = useAuth();
  useEffect(() => {
    if (lead?.callReminders) setCallReminders(lead.callReminders);
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

  return (
    <Stack spacing={3}>
      {!notUser && (
        <NewCallDialog
          lead={lead}
          setCallReminders={setCallReminders}
          setleads={setleads}
        />
      )}
      <Stack spacing={2}>
        {callReminders?.map((call) => {
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
                    </Box>
                    {user.role !== "ACCOUNTANT" && (
                      <>
                        {call.status === "IN_PROGRESS" && (
                          <CallResultDialog
                            lead={lead}
                            setCallReminders={setCallReminders}
                            call={call}
                            setleads={setleads}
                          />
                        )}
                      </>
                    )}
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
                  <Stack direction="row" spacing={1} alignItems="center">
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
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <RiCalendarLine
                      size={18}
                      color={theme.palette.primary.main}
                    />
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
          );
        })}
      </Stack>
    </Stack>
  );
}
