"use client";

import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(relativeTime);

export const DUBAI_TZ = "Asia/Dubai";

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import {
  FiClock,
  FiUser,
  FiTrash2,
  FiLink,
  FiPlus,
  FiCalendar,
  FiExternalLink,
} from "react-icons/fi";
import { MobileDatePicker } from "@mui/x-date-pickers";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import DeleteModelButton from "../../../common/DeleteModelButton";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useAuth } from "@/app/providers/AuthProvider";
import { NotesComponent } from "../../utility/Notes";

function RowActions({
  reload,
  row,
  onOpenMeeting,
  onLinkMeeting,
  hasMeeting,
  meetingId,
  canDoActions,
}) {
  return (
    <Stack direction="row" spacing={1}>
      {hasMeeting ? (
        <Tooltip title="Open meeting details">
          <Button
            size="small"
            variant="outlined"
            startIcon={<FiExternalLink />}
            onClick={onOpenMeeting}
          >
            #{meetingId}
          </Button>
        </Tooltip>
      ) : (
        <>
          {/* {canDoActions && (
            <Tooltip title="Link to meeting">
              <IconButton onClick={onLinkMeeting} color="primary">
                <FiLink />
              </IconButton>
            </Tooltip>
          )} */}
        </>
      )}
      <Tooltip title="Preview notes">
        <NotesComponent
          item={row}
          id={row.id}
          idKey="deliveryScheduleId"
          slug="shared"
        />
      </Tooltip>
      {canDoActions && (
        <Tooltip title="Delete delivery">
          <DeleteModelButton
            item={row}
            model={"DeliverySchedule"}
            contentKey=""
            deleteModelesBeforeMain={[
              { name: "Note", key: "deliveryScheduleId" },
            ]}
            onDelete={() => {
              reload();
            }}
          />
        </Tooltip>
      )}
    </Stack>
  );
}

/* =========================================
   Dialog: Create Delivery
   ========================================= */

export function toMiddayUTC(value, tz = DUBAI_TZ) {
  const localNoon = dayjs
    .tz(value, tz)
    .hour(12)
    .minute(0)
    .second(0)
    .millisecond(0);
  return localNoon.utc().toDate(); // JS Date in UTC (what Prisma expects)
}

function CreateDeliveryDialog({ projectId, open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [days, setDays] = useState(1);
  const [value, setValue] = useState(dayjs().add(1, "day"));

  const { loading: submitting, setLoading: setSubmitting } = useToastContext();
  const { setAlertError } = useAlertContext();

  useEffect(() => {
    const n = Number(days);
    setValue(dayjs().add(isNaN(n) ? 0 : n, "day"));
  }, [days]);

  const handleSubmit = async () => {
    if (!value) {
      setAlertError("Please select a delivery date.");
      return;
    }
    const deliveryAtUtc = toMiddayUTC(value, DUBAI_TZ); // 12:00 in Dubai -> UTC Date

    const req = await handleRequestSubmit(
      { projectId, deliveryAt: deliveryAtUtc, name }, // ← send name too
      setSubmitting,
      `shared/delivery-schedule`,
      false,
      "Adding"
    );
    if (req.status === 200) {
      onClose();
      await onCreate();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <FiCalendar />
          <span>New Delivery Time</span>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {/* 1) Name */}
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
          />

          {/* 2) Days from today -> live preview */}
          <TextField
            label="Days from today"
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            fullWidth
            size="small"
            inputProps={{ min: 0, step: 1 }}
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <MobileDatePicker
              label="Delivery at (preview)"
              value={value}
              readOnly
              disabled
              slotProps={{
                textField: { fullWidth: true, size: "small" },
              }}
            />
          </LocalizationProvider>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!value || submitting}
          variant="contained"
        >
          {submitting ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* =========================================
   Dialog: Meeting Details
   ========================================= */

function MeetingDetailsDialog({ open, onClose, meetingId }) {
  const [loading, setLoading] = useState(false);
  const [meeting, setMeeting] = useState(null);
  useEffect(() => {
    let active = true;
    if (!open || !meetingId) return;

    (async () => {
      if (!active) return;
      await getDataAndSet({
        url: `shared/meeting-reminders/${meetingId}`,
        setLoading,
        setData: setMeeting,
      });
    })();

    return () => {
      active = false;
    };
  }, [open, meetingId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <FiExternalLink />
          <span>Meeting Details #{meetingId}</span>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
          </Stack>
        ) : !meeting ? (
          <Typography color="text.secondary">Meeting not found.</Typography>
        ) : (
          <Stack spacing={1.2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FiClock />
              <Typography>
                Time:{" "}
                <b>
                  {dayjs(meeting.time).format("YYYY-MM-DD HH:mm")} (
                  {dayjs(meeting.time).fromNow()})
                </b>
              </Typography>
            </Stack>

            <Typography>
              Status: <Chip size="small" label={meeting.status} />
            </Typography>

            <Typography>Result: {meeting.meetingResult || <i>—</i>}</Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" spacing={0.8} alignItems="center">
                <FiUser />
                <Typography>
                  User: <b>{meeting.user?.name}</b>
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* =========================================
   Dialog: Link to Meeting
   ========================================= */

function LinkMeetingDialog({
  open,
  onClose,
  clientLeadId,
  onLink,
  deliveryId,
}) {
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    let active = true;
    if (!open) return;
    (async () => {
      if (active) {
        await getDataAndSet({
          url: `shared/client-leads/${clientLeadId}/meeting-reminders`,
          setLoading,
          setData: setMeetings,
        });
      }
    })();
    return () => {
      active = false;
    };
  }, [open, clientLeadId]);

  const handleConfirm = async () => {
    if (!selectedId) return;
    await onLink({ deliveryId, meetingReminderId: selectedId });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <FiLink />
          <span>Link Delivery to Meeting</span>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
          </Stack>
        ) : meetings.length === 0 ? (
          <Typography color="text.secondary">
            No meetings found for this lead.
          </Typography>
        ) : (
          <RadioGroup
            value={selectedId || ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
          >
            {meetings.map((m) => (
              <Box key={m.id} sx={{ p: 1, borderRadius: 1 }}>
                <FormControlLabel
                  value={m.id}
                  control={<Radio />}
                  label={
                    <Stack spacing={0.3}>
                      <Typography>
                        #{m.id} – {dayjs(m.time).format("YYYY-MM-DD HH:mm")} (
                        {dayjs(m.time).fromNow()})
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Result: {m.meetingResult || "—"}
                      </Typography>
                    </Stack>
                  }
                />
                <Divider />
              </Box>
            ))}
          </RadioGroup>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          disabled={!selectedId}
          onClick={handleConfirm}
          variant="contained"
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* =========================================
   Main Component
   ========================================= */

export default function DeliverySchedulesPanel({ projectId, clientLeadId }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const { user } = useAuth();
  const canDoActions =
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN" ||
    user.role === "STAFF";
  const { setLoading: setSubmitting } = useToastContext();
  const [openCreate, setOpenCreate] = useState(false);
  const [meetingDialog, setMeetingDialog] = useState({
    open: false,
    meetingId: null,
  });
  const [linkDialog, setLinkDialog] = useState({
    open: false,
    deliveryId: null,
  });

  const reload = async () => {
    await getDataAndSet({
      url: `shared/projects/${projectId}/delivery-schedules`,
      setLoading,
      setData: setRows,
    });
  };

  useEffect(() => {
    reload();
  }, [projectId]);

  const handleLink = async ({ deliveryId, meetingReminderId }) => {
    const req = await handleRequestSubmit(
      { deliveryId, meetingReminderId },
      setSubmitting,
      `shared/delivery-schedule/${deliveryId}/link-meeting`,
      false,
      "Linking meeting..."
    );
    if (req.status === 200) {
      await reload();
    }
  };

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1.5}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <FiClock />
          <Typography variant="h6">Delivery Schedule</Typography>
        </Stack>
        {/* {canDoActions && (
          <Button
            variant="contained"
            startIcon={<FiPlus />}
            onClick={() => setOpenCreate(true)}
          >
            New delivery
          </Button>
        )} */}
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Stack alignItems="center" py={4}>
          <CircularProgress />
        </Stack>
      ) : rows.length === 0 ? (
        <Typography color="text.secondary">No deliveries yet.</Typography>
      ) : (
        <List
          sx={{
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          {rows.map((row) => {
            return (
              <React.Fragment key={row.id}>
                <ListItem
                  secondaryAction={
                    <RowActions
                      reload={reload}
                      row={row}
                      hasMeeting={!!row.meetingReminderId}
                      meetingId={row.meetingReminderId}
                      onOpenMeeting={() =>
                        setMeetingDialog({
                          open: true,
                          meetingId: row.meetingReminderId,
                        })
                      }
                      canDoActions={canDoActions}
                      onLinkMeeting={() =>
                        setLinkDialog({ open: true, deliveryId: row.id })
                      }
                    />
                  }
                >
                  <ListItemText
                    primary={
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        flexWrap="wrap"
                      >
                        <Typography variant="body2" color="text.secondary">
                          {row.name || ""}
                        </Typography>
                        <Chip
                          size="small"
                          icon={<FiCalendar />}
                          label={dayjs(row.deliveryAt).format(
                            "YYYY-MM-DD HH:mm"
                          )}
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          ({dayjs(row.deliveryAt).fromNow()})
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Stack
                          direction="row"
                          spacing={0.7}
                          alignItems="center"
                        >
                          <FiUser />
                          <Typography variant="body2">
                            Created by: <b>{row.createdBy?.name}</b>
                          </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          Created {dayjs(row.createdAt).fromNow()}
                        </Typography>
                        {row.meetingReminderId && (
                          <Chip
                            size="small"
                            color="primary"
                            label={`Meeting #${row.meetingReminderId}`}
                          />
                        )}
                      </Stack>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            );
          })}
        </List>
      )}

      {/* <CreateDeliveryDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreate={reload}
        projectId={projectId}
      /> */}

      <MeetingDetailsDialog
        open={meetingDialog.open}
        meetingId={meetingDialog.meetingId}
        onClose={() => setMeetingDialog({ open: false, meetingId: null })}
      />

      {/* <LinkMeetingDialog
        open={linkDialog.open}
        deliveryId={linkDialog.deliveryId}
        clientLeadId={clientLeadId}
        onClose={() => setLinkDialog({ open: false, deliveryId: null })}
        onLink={handleLink}
      /> */}
    </Box>
  );
}
