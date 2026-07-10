"use client";
import { Box, Container, Typography } from "@mui/material";
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
  const { hasPermission } = usePermission();
  const canView = hasPermission(AUDIT_LOG_VIEW);

  return (
    <Container maxWidth="xl" sx={{ pt: { xs: 3, md: 4 }, pb: 4 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 1,
        }}
      >
        <FiActivity size={24} />
        <Typography variant="h5" component="h1" fontWeight={800}>
          Audit Log
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        A read-only trail of who did what across the system — leads, contracts, payments,
        users and profile changes.
      </Typography>

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
