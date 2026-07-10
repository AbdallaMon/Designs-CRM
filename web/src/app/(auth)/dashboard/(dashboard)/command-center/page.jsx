"use client";
import { Box, Container, Typography } from "@mui/material";
import { FiActivity } from "react-icons/fi";
import { usePermission } from "@/app/hooks/usePermission.js";
import CommandCenter from "@/features/command-center/CommandCenter.jsx";

// Permission code for the admin Command Center. Web has no @dms/shared dependency, so the
// code string is mirrored here from packages/shared/constants/access/permissions.constants.js
// (PERMISSIONS.COMMAND_CENTER.VIEW). Granted to ADMIN + SUPER_ADMIN only.
const COMMAND_CENTER_VIEW = "command_center.view";

// The admin-only operational hub. Access is enforced in THREE layers that all agree: the
// sidebar hides it (backend `navigationTabs`), the dashboard RouteGuard redirects a
// non-admin who deep-links here, and this page's own `usePermission` gate blocks render +
// the fetch. The server re-checks `command_center.view` on every request.
export default function CommandCenterPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(COMMAND_CENTER_VIEW);

  return (
    <Container maxWidth="xl" sx={{ pt: { xs: 3, md: 4 }, pb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        <FiActivity size={24} />
        <Typography variant="h5" component="h1" fontWeight={800}>
          Command Center
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        The studio at a glance — pipeline health, team capacity, delivery risk, and the
        latest activity across every module.
      </Typography>

      {canView ? (
        <CommandCenter />
      ) : (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
            You don&apos;t have permission to view the Command Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This screen is available to administrators only.
          </Typography>
        </Box>
      )}
    </Container>
  );
}
