"use client";

// Roles tab — READ-ONLY. GET /v2/utilities/roles is self-scoped (the controller derives the
// subject from req.auth.id) and returns a flat array of the CURRENT user's role names (base
// role + sub-roles). The utilities module exposes NO create/edit/delete for roles, so this
// tab only lists. Gated on UTILITY.USER_ROLE_VIEW. Uses useRequest (the canonical data
// layer) against the roles endpoint. Single-language Arabic RTL.

import { Box, Chip, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { ROLES_URL } from "../config/constant.js";

// Single-language Arabic labels for the role enum values the BE returns.
const ROLE_LABELS = {
  ADMIN: "مدير",
  SUPER_ADMIN: "مدير عام",
  STAFF: "موظف",
  SUPER_SALES: "مشرف مبيعات",
  CONTACT_INITIATOR: "بادئ التواصل",
  THREE_D_DESIGNER: "مصمم ثري دي",
  TWO_D_DESIGNER: "مصمم تو دي",
  ACCOUNTANT: "محاسب",
  EXECUTOR: "منفّذ",
};

const roleLabel = (r) => ROLE_LABELS[r] || r;

export default function RolesTab() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.UTILITY.USER_ROLE_VIEW);

  const { data, isLoading, error } = useRequest({
    url: ROLES_URL,
    method: "get",
    autoFetch: canView,
  });

  if (!canView) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography color="text.secondary">
          لا تملك صلاحية عرض الأدوار.
        </Typography>
      </Box>
    );
  }

  const roles = Array.isArray(data) ? data : [];

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" mb={1}>
        أدواري
      </Typography>
      <Typography color="text.secondary" mb={2}>
        الأدوار المسندة إليك (الدور الأساسي والأدوار الفرعية). عرض فقط.
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {isLoading ? (
        <Stack direction="row" alignItems="center" spacing={1}>
          <CircularProgress size={18} />
          <Typography>جاري التحميل...</Typography>
        </Stack>
      ) : error ? (
        <Typography color="error">تعذّر جلب الأدوار</Typography>
      ) : roles.length === 0 ? (
        <Typography color="text.secondary">لا توجد أدوار.</Typography>
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {roles.map((r, i) => (
            <Chip key={`${r}-${i}`} label={roleLabel(r)} color="primary" variant="outlined" />
          ))}
        </Stack>
      )}
    </Box>
  );
}
