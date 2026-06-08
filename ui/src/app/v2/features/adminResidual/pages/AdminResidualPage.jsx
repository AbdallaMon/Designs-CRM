"use client";

// admin-residual foundation route-shell page — a WIRING SMOKE-SCREEN, not a redesigned UI.
// Its only job in the Option-A foundation phase is to PROVE the v2 data layer is wired end to
// end: permission-gate on an ADMIN_RESIDUAL.* code, fetch a read aggregation through the SOLE
// service (adminResidualService → /v2/admin/projects) via useRequest, and render the envelope
// shape. The real admin screens (reports builder, import wizard, commissions/fixed-data CRUD,
// the admin-projects board) land in the later UX-redesign phase, reusing this exact data layer.
// Single-language Arabic, RTL.

import { useMemo } from "react";
import { Box, Container, CircularProgress, Typography } from "@mui/material";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { ADMIN_PROJECTS_URL } from "../config/constant.js";

const P = PERMISSIONS.ADMIN_RESIDUAL;

export function AdminResidualPage() {
  const { hasPermission, hasAnyPermission } = usePermission();

  // Whole surface is admin-tier: gate access on holding ANY admin-residual code.
  const canAccess = hasAnyPermission(Object.values(P));
  // The smoke-screen read is the admin leads-with-projects aggregation (GET /v2/admin/projects).
  const canViewProjects = hasPermission(P.PROJECT_VIEW);

  // useRequest (v2): autoFetch only when the user holds the read code; the BE enforces too.
  const { data, isLoading, error } = useRequest({
    url: ADMIN_PROJECTS_URL,
    method: "get",
    autoFetch: canViewProjects,
  });

  // The aggregation returns either an array or a paginated { items, total, ... } envelope.
  const rows = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  }, [data]);

  if (!canAccess) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Typography color="text.secondary">لا تملك صلاحية الوصول إلى قسم الإدارة</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        قسم الإدارة
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        أساس البنية — يتم بناء الشاشات لاحقًا. (تحقق من اتصال طبقة البيانات)
      </Typography>

      {!canViewProjects ? (
        <Typography color="text.secondary">لا تملك صلاحية عرض المشاريع</Typography>
      ) : isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">تعذر جلب البيانات</Typography>
      ) : (
        <Typography color="text.secondary">عدد السجلات: {rows.length}</Typography>
      )}
    </Container>
  );
}

export default AdminResidualPage;
