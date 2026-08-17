"use client";
// Today's agenda rail — the caller's scheduled calls + meetings for the day (plus anything
// already overdue), time-ordered. Renders above the personal queue on My Day. Each row can
// log its outcome inline (reuses CallResultDialog, which enforces the next-touch plan).
import Link from "next/link";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { IoMdCall } from "react-icons/io";
import { MdOutlineGroups } from "react-icons/md";
import { CallResultDialog } from "@/features/leads/dialogs/CallsDialog.jsx";
import { REMINDER_TYPES } from "@dms/shared";

export default function AgendaRail({ agenda, onRefresh }) {
  const theme = useTheme();
  if (!Array.isArray(agenda)) return null;

  return (
    <Box
      sx={{
        p: 1.5,
        mb: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.primary.main, 0.03),
      }}
    >
      <Typography variant="overline" color="text.secondary">
        Today&apos;s agenda ({agenda.length})
      </Typography>
      {agenda.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          No calls or meetings scheduled today.
        </Typography>
      ) : (
        <Stack spacing={1} sx={{ mt: 0.5 }}>
          {agenda.map((row) => {
            const isMeeting = row.kind === REMINDER_TYPES.MEETING;
            const color = row.overdue ? theme.palette.error.main : theme.palette.primary.main;
            return (
              <Stack
                key={`${row.kind}-${row.id}`}
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  borderLeft: `3px solid ${color}`,
                  bgcolor: alpha(color, 0.04),
                  flexWrap: "wrap",
                }}
              >
                <Box sx={{ color, display: "flex", fontSize: 18 }}>
                  {isMeeting ? <MdOutlineGroups /> : <IoMdCall />}
                </Box>
                <Typography variant="body2" fontWeight={700} sx={{ minWidth: 72 }}>
                  {dayjs(row.time).format("h:mm A")}
                </Typography>
                <Typography variant="body2" sx={{ minWidth: 0, flex: 1 }} noWrap>
                  {row.clientName || `Lead #${row.leadId}`}
                  {row.reminderReason ? ` — ${row.reminderReason}` : ""}
                </Typography>
                {row.overdue && <Chip size="small" color="error" label="Overdue" />}
                <CallResultDialog
                  call={{ id: row.id }}
                  reminderType={
                    isMeeting ? REMINDER_TYPES.MEETING : REMINDER_TYPES.CALL
                  }
                  onUpdate={onRefresh}
                  text="Log outcome"
                />
                {row.leadId && (
                  <Button
                    component={Link}
                    href={`/dashboard/deals/${row.leadId}`}
                    size="small"
                    variant="text"
                  >
                    Open
                  </Button>
                )}
              </Stack>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
