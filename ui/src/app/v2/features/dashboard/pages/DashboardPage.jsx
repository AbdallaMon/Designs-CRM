"use client";

// Dashboard FOUNDATION page — a wiring smoke-screen, NOT the redesigned dashboard. It proves
// the v2 data layer is wired end-to-end for this feature: permission-gated on dashboard.view,
// it fetches the primary aggregation (key-metrics) through useRequest → the dashboard.service
// (which is the SOLE API caller, pointed at /v2/dashboard) and renders the raw envelope data.
// The real multi-widget dashboard UI is built later in the UX-redesign phase on top of this
// exact data layer. Single-language Arabic/RTL.

import { Box, Container, Paper, Typography } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { KEY_METRICS_URL } from "../config/constant.js";

const P = PERMISSIONS.DASHBOARD;

export function DashboardPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);

  // Primary read proves the wiring. autoFetch only when the gate passes (no unauthorized call).
  const { data, isLoading, error } = useRequest({
    url: KEY_METRICS_URL,
    method: "get",
    autoFetch: canView,
  });

  if (!canView) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Typography color="text.secondary">لا تملك صلاحية الوصول إلى لوحة التحكم</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        لوحة التحكم
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        أساس البيانات جاهز — تُبنى الواجهة الكاملة في مرحلة إعادة التصميم.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        {isLoading && <Typography color="text.secondary">جاري التحميل...</Typography>}
        {error && <Typography color="error">تعذّر جلب البيانات</Typography>}
        {!isLoading && !error && (
          <Box component="pre" sx={{ m: 0, whiteSpace: "pre-wrap", fontSize: 13 }}>
            {JSON.stringify(data, null, 2)}
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default DashboardPage;
