"use client";

// Delivery schedules for a project — migrated from the legacy DeliverySchedulesPanel
// (UiComponents/.../work-stages/utility/ProjectDeilverySchedule.jsx). Same appearance/
// behavior: list of schedules, create (admin), delete, and link-to-meeting. §5c deltas:
//  • list  : GET /v2/delivery/:projectId/schedules            → data is the array (caps on each row)
//  • create: POST /v2/delivery               { projectId, deliveryAt, name }
//  • delete: DELETE /v2/delivery/:deliveryId
//  • link  : POST /v2/delivery/:deliveryId/actions/link-meeting { meetingReminderId }
//
// Per-row actions are gated on the row's capabilities.canDelete / canLinkMeeting combined
// with PERMISSIONS.DELIVERY.DELETE / LINK_MEETING. Create is gated on
// project.capabilities.canAddDelivery × PERMISSIONS.DELIVERY.CREATE.

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { FiCalendar, FiClock, FiLink, FiPlus, FiTrash2, FiUser } from "react-icons/fi";
import apiFetch from "@/app/v2/lib/api/ApiFetch";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useT } from "@/app/v2/lib/i18n";
import { projectsService } from "../projects.service.js";
import { runProjectMutation } from "../projects.mutations.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export const DUBAI_TZ = "Asia/Dubai";

export function toMiddayUTC(value, tz = DUBAI_TZ) {
  return dayjs.tz(value, tz).hour(12).minute(0).second(0).millisecond(0).utc().toDate();
}

function CreateDeliveryDialog({ projectId, open, onClose, onCreated }) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [days, setDays] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setDays(1);
    }
  }, [open]);

  const handleSubmit = async () => {
    const n = Number(days);
    const value = dayjs().add(isNaN(n) ? 0 : n, "day");
    const deliveryAtUtc = toMiddayUTC(value, DUBAI_TZ);
    const res = await runProjectMutation(
      () => projectsService.createDelivery({ projectId, deliveryAt: deliveryAtUtc, name }),
      { loading: t("projects.delivery.loading.add"), setLoading: setSubmitting },
    );
    if (res) {
      onClose();
      await onCreated?.();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <FiCalendar />
          <span>{t("projects.delivery.newTitle")}</span>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label={t("projects.delivery.name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label={t("projects.delivery.daysFromToday")}
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
          />
          <Typography variant="body2" color="text.secondary">
            {t("projects.delivery.deliveryDate").replace(
              "{value}",
              dayjs().add(Number(days) || 0, "day").format("YYYY-MM-DD"),
            )}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t("projects.delivery.cancel")}
        </Button>
        <Button onClick={handleSubmit} disabled={submitting} variant="contained">
          {submitting ? t("projects.delivery.saving") : t("projects.delivery.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function LinkMeetingDialog({ open, onClose, clientLeadId, deliveryId, onLinked }) {
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !clientLeadId) return;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        // Meeting reminders live in the leads module (/v2/leads/:id/meeting-reminders).
        const res = await apiFetch.get(`leads/${clientLeadId}/meeting-reminders`);
        if (active) setMeetings(Array.isArray(res?.data) ? res.data : res?.data?.items ?? []);
      } catch {
        if (active) setMeetings([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, clientLeadId]);

  const handleConfirm = async () => {
    if (!selectedId) return;
    const res = await runProjectMutation(
      () => projectsService.linkDeliveryMeeting(deliveryId, { meetingReminderId: selectedId }),
      { loading: t("projects.delivery.loading.link"), setLoading: setSubmitting },
    );
    if (res) {
      onClose();
      await onLinked?.();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <FiLink />
          <span>{t("projects.delivery.linkTitle")}</span>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
          </Stack>
        ) : meetings.length === 0 ? (
          <Typography color="text.secondary">{t("projects.delivery.noMeetings")}</Typography>
        ) : (
          <RadioGroup
            value={selectedId || ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
          >
            {meetings.map((m) => (
              <Box key={m.id} sx={{ p: 1 }}>
                <FormControlLabel
                  value={m.id}
                  control={<Radio />}
                  label={`#${m.id} – ${dayjs(m.time).format("YYYY-MM-DD HH:mm")}`}
                />
                <Divider />
              </Box>
            ))}
          </RadioGroup>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t("projects.delivery.cancel")}
        </Button>
        <Button disabled={!selectedId || submitting} onClick={handleConfirm} variant="contained">
          {t("projects.delivery.link")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function DeliverySchedulesPanel({ project }) {
  const projectId = project?.id;
  const clientLeadId = project?.clientLeadId;
  const { hasPermission } = usePermission();
  const { t } = useT();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [linkDialog, setLinkDialog] = useState({ open: false, deliveryId: null });

  const canCreate =
    hasPermission(PERMISSIONS.DELIVERY.CREATE) && project?.capabilities?.canAddDelivery;

  const reload = async () => {
    setLoading(true);
    try {
      const res = await projectsService.listDeliverySchedules(projectId);
      setRows(Array.isArray(res?.data) ? res.data : res?.data?.items ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleDelete = async (row) => {
    const res = await runProjectMutation(() => projectsService.deleteDelivery(row.id), {
      loading: t("projects.delivery.loading.delete"),
    });
    if (res) await reload();
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FiClock />
          <Typography variant="h6">{t("projects.delivery.sectionTitle")}</Typography>
        </Stack>
        {canCreate && (
          <Button variant="contained" startIcon={<FiPlus />} onClick={() => setOpenCreate(true)}>
            {t("projects.delivery.newButton")}
          </Button>
        )}
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Stack alignItems="center" py={4}>
          <CircularProgress />
        </Stack>
      ) : rows.length === 0 ? (
        <Typography color="text.secondary">{t("projects.delivery.empty")}</Typography>
      ) : (
        <List sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          {rows.map((row) => {
            const canDelete = hasPermission(PERMISSIONS.DELIVERY.DELETE) && row.capabilities?.canDelete;
            const canLink =
              hasPermission(PERMISSIONS.DELIVERY.LINK_MEETING) && row.capabilities?.canLinkMeeting;
            return (
              <React.Fragment key={row.id}>
                <ListItem
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      {row.meetingReminderId ? (
                        <Chip size="small" color="primary" label={t("projects.delivery.meetingChip").replace("{id}", row.meetingReminderId)} />
                      ) : (
                        canLink && (
                          <Tooltip title={t("projects.delivery.linkTooltip")}>
                            <IconButton
                              color="primary"
                              onClick={() => setLinkDialog({ open: true, deliveryId: row.id })}
                            >
                              <FiLink />
                            </IconButton>
                          </Tooltip>
                        )
                      )}
                      {canDelete && (
                        <Tooltip title={t("projects.delivery.deleteTooltip")}>
                          <IconButton color="error" onClick={() => handleDelete(row)}>
                            <FiTrash2 />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        <Typography variant="body2" color="text.secondary">
                          {row.name || ""}
                        </Typography>
                        <Chip
                          size="small"
                          icon={<FiCalendar />}
                          label={dayjs(row.deliveryAt).format("YYYY-MM-DD HH:mm")}
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          ({dayjs(row.deliveryAt).fromNow()})
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      <Stack direction="row" spacing={0.7} alignItems="center">
                        <FiUser />
                        <Typography variant="body2">
                          {t("projects.delivery.createdBy")} <b>{row.createdBy?.name}</b>
                        </Typography>
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

      <CreateDeliveryDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={reload}
        projectId={projectId}
      />
      <LinkMeetingDialog
        open={linkDialog.open}
        deliveryId={linkDialog.deliveryId}
        clientLeadId={clientLeadId}
        onClose={() => setLinkDialog({ open: false, deliveryId: null })}
        onLinked={reload}
      />
    </Box>
  );
}
