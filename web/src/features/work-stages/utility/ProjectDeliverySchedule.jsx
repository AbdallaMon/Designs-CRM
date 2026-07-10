"use client";

import React, { useEffect, useState } from "react";
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
  Divider,
  Stack,
  Typography,
  alpha,
} from "@mui/material";

import { FiClock, FiUser, FiPlus, FiCalendar } from "react-icons/fi";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useAuth } from "@/app/providers/AuthProvider";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { RecordCard, MetaItem, StatusPill } from "@/features/leads/shared/tabKit.jsx";
import { EmptyState } from "@/features/leads/shared/EmptyState.jsx";
import { TabLoading } from "@/features/leads/shared/TabLoading.jsx";
import colors from "@/app/helpers/colors";
import RowActions from "@/features/work-stages/utility/RowActions.jsx";
import CreateDeliveryDialog from "@/features/work-stages/utility/CreateDeliveryDialog.jsx";
import MeetingDetailsDialog from "@/features/work-stages/utility/MeetingDetailsDialog.jsx";
import LinkMeetingDialog from "@/features/work-stages/utility/LinkMeetingDialog.jsx";

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
  // TODO(profiles): no admin-tier delivery code; FE-only admin gate kept
  const admin = checkIfAdmin(user);
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
      url: `shared/delivery/${projectId}/schedules`,
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
      `shared/delivery/${deliveryId}/actions/link-meeting`,
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
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        mb={1.5}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
              color: "primary.main",
              flexShrink: 0,
            }}
          >
            <FiClock size={20} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              Delivery Schedule
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Project stage delivery dates
            </Typography>
          </Box>
        </Stack>
        {admin && (
          <Button
            variant="contained"
            startIcon={<FiPlus />}
            onClick={() => setOpenCreate(true)}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2.5, flexShrink: 0 }}
          >
            New delivery
          </Button>
        )}
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <TabLoading minHeight={160} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<FiCalendar />}
          title="No deliveries yet"
          description="No delivery times have been added for this project yet."
        />
      ) : (
        <Stack spacing={1.5}>
          {rows.map((row) => {
            const isPast = dayjs(row.deliveryAt).isBefore(dayjs());
            return (
              <RecordCard
                key={row.id}
                accent={isPast ? colors.warning : colors.primary}
                leading={
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                      color: "primary.main",
                      flexShrink: 0,
                    }}
                  >
                    <FiCalendar size={18} />
                  </Box>
                }
                title={row.name || "Delivery"}
                subtitle={`${dayjs(row.deliveryAt).format(
                  "YYYY-MM-DD HH:mm"
                )} (${dayjs(row.deliveryAt).fromNow()})`}
                status={
                  row.meetingReminderId ? (
                    <StatusPill
                      label={`Meeting #${row.meetingReminderId}`}
                      color={colors.info}
                    />
                  ) : null
                }
                meta={
                  <>
                    <MetaItem
                      icon={<FiUser size={14} />}
                      label="Created by:"
                      value={row.createdBy?.name || "—"}
                    />
                    <MetaItem
                      icon={<FiClock size={14} />}
                      value={`Created ${dayjs(row.createdAt).fromNow()}`}
                    />
                  </>
                }
                actions={
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
              />
            );
          })}
        </Stack>
      )}

      <CreateDeliveryDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreate={reload}
        projectId={projectId}
      />

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
