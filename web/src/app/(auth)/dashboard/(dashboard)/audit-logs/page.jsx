"use client";
// ⏸️ DISABLED 2026-07-16 (user request): this page renders BLANK and its nav row is
// commented out in packages/shared/constants/access/navigation.js. Nothing was deleted —
// the audit feature is intact (web/src/features/audit/*, the backend audit-logs module,
// the `audit.log.view` permission, and `recordAction` keeps writing the trail). To restore
// the screen: delete the blank return below, un-comment the original body, and un-comment
// the "audit-logs" nav row.
export default function AuditLogsPage() {
  return null;
}

/* ── ORIGINAL PAGE (kept verbatim for restore) ─────────────────────────────────────────
import { alpha, Box, Container, Paper, Stack, Typography, useTheme } from "@mui/material";
import { FiActivity } from "react-icons/fi";
import { usePermission } from "@/app/hooks/usePermission.js";
import AuditLogTable from "@/features/audit/AuditLogTable.jsx";

// Permission code for the audit viewer. Web has no @dms/shared dependency, so the code
// string is mirrored here from packages/shared/constants/access/permissions.constants.js
// (PERMISSIONS.AUDIT.LOG_VIEW). Granted to ADMIN + SUPER_ADMIN only.
const AUDIT_LOG_VIEW = "audit.log.view";

// The admin-only action-audit viewer route. Access is enforced in THREE layers that all
// agree: the sidebar hides it (backend `navigationTabs`), the dashboard RouteGuard
// redirects a non-admin who deep-links here, and this page's own `usePermission` gate
// blocks render + the fetch. The server re-checks `audit.log.view` on every request.
export default function AuditLogsPage() {
  const theme = useTheme();
  const { hasPermission } = usePermission();
  const canView = hasPermission(AUDIT_LOG_VIEW);

  return (
    <Container maxWidth="xl" sx={{ pt: { xs: 3, md: 4 }, pb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.08
          )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          p: { xs: 2.5, md: 3 },
          mb: 2.5,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.14),
              color: theme.palette.primary.main,
              fontSize: 26,
              flexShrink: 0,
            }}
          >
            <FiActivity />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Audit Log
            </Typography>
            <Typography variant="body2" color="text.secondary">
              A read-only trail of who did what across the system — leads, contracts,
              payments, users and profile changes.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {canView ? (
        <AuditLogTable />
      ) : (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
            You don&apos;t have permission to view the audit log
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This screen is available to administrators only.
          </Typography>
        </Box>
      )}
    </Container>
  );
}
──────────────────────────────────────────────────────────────────────────────────────── */
