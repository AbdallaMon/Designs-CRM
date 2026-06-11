"use client";

// Google Calendar connection card. Self-scoped to the caller (req.auth.id server-side).
//   • status     → GET  /v2/calendar/google/status      (calendar.google.view)
//   • connect    → POST /v2/calendar/google/connect → { redirectUrl }  (calendar.google.manage)
//   • disconnect → POST /v2/calendar/google/disconnect (calendar.google.manage)
// Connect navigates the browser to the Google consent URL the BE returns; the BE callback then
// redirects back to the dashboard. NO tokens are ever read, stored, or echoed in the UI.
//
// Gating: the card is rendered when the user has calendar.google.view; connect/disconnect are
// gated on calendar.google.manage (canManageGoogle).

import { useState } from "react";
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { MdLink, MdLinkOff, MdEvent } from "react-icons/md";
import { calendarService } from "../calendar.service.js";
import { runCalendarMutation } from "../calendar.mutations.js";
import { useGoogleStatus } from "../hooks/useGoogleStatus.js";

export function GoogleConnectCard({ canManageGoogle = false }) {
  const { isConnected, isLoading, refetch } = useGoogleStatus();
  const [busy, setBusy] = useState(false);

  const handleConnect = async () => {
    setBusy(true);
    const res = await runCalendarMutation(() => calendarService.connectGoogle(), {
      loading: "جاري إنشاء رابط الربط...",
    });
    setBusy(false);
    const url = res?.data?.redirectUrl || res?.data?.authUrl;
    if (url && typeof window !== "undefined") {
      window.location.href = url;
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    const res = await runCalendarMutation(() => calendarService.disconnectGoogle(), {
      loading: "جاري إلغاء الربط...",
    });
    setBusy(false);
    if (res) refetch();
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <MdEvent size={24} />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                تقويم جوجل
              </Typography>
              <Typography variant="caption" color="text.secondary">
                اربط حسابك لمزامنة المواعيد تلقائياً
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              size="small"
              label={isLoading ? "..." : isConnected ? "مرتبط" : "غير مرتبط"}
              color={isConnected ? "success" : "default"}
              variant={isConnected ? "filled" : "outlined"}
            />
            {canManageGoogle &&
              (isConnected ? (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<MdLinkOff />}
                  onClick={handleDisconnect}
                  disabled={busy || isLoading}
                  sx={{ borderRadius: 2 }}
                >
                  إلغاء الربط
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<MdLink />}
                  onClick={handleConnect}
                  disabled={busy || isLoading}
                  sx={{ borderRadius: 2 }}
                >
                  ربط الحساب
                </Button>
              ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default GoogleConnectCard;
