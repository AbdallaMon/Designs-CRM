// Roles editor — manages the user's SUB-ROLES (UserSubRole, same enum values as UserRole) via
// PUT /:userId/roles, body { added: string[], removed: string[] } (a DIFF against the current
// set). The profile read includes `subRoles: [{ subRole }]`; we compute added/removed from the
// multi-select selection vs. that baseline and send ONLY the diff. Gated on
// PERMISSIONS.USER.MANAGE_ROLES AND the record capability `canChangeRoles`. Single-language
// Arabic / RTL.

"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
} from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { SectionCard, PartialPermissionState } from "@/app/v2/shared/components";
import { usersService } from "@/app/v2/features/users/users.service.js";
import { runUsersMutation } from "@/app/v2/features/users/users.mutations.js";
import { USER_ROLE_OPTIONS } from "@/app/v2/features/users/config/usersConstants.js";

function currentSubRoles(profile) {
  const list = Array.isArray(profile?.subRoles) ? profile.subRoles : [];
  return list.map((r) => (typeof r === "string" ? r : r?.subRole)).filter(Boolean);
}

export function RolesTab({ profile, capabilities, onUpdated }) {
  const { hasPermission } = usePermission();
  const canManage =
    hasPermission(PERMISSIONS.USER.MANAGE_ROLES) && Boolean(capabilities?.canChangeRoles);

  const baseline = useMemo(() => currentSubRoles(profile), [profile]);
  const [selected, setSelected] = useState(baseline);
  const [submitting, setSubmitting] = useState(false);

  function toggle(value) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  const added = selected.filter((v) => !baseline.includes(v));
  const removed = baseline.filter((v) => !selected.includes(v));
  const dirty = added.length > 0 || removed.length > 0;

  async function save() {
    const res = await runUsersMutation(
      () => usersService.manageRoles(profile.id, { added, removed }),
      { loading: "جاري تحديث الأدوار...", setLoading: setSubmitting },
    );
    if (res) onUpdated?.(res.data);
  }

  if (!canManage) {
    return (
      <PartialPermissionState
        denied
        title="إدارة الأدوار غير متاحة لصلاحياتك"
        message="لا تملك صلاحية تعديل أدوار هذا المستخدم."
      />
    );
  }

  return (
    <SectionCard
      title="الأدوار الإضافية"
      subtitle="حدّد الأدوار الفرعية الممنوحة لهذا المستخدم."
      actions={
        <Button variant="contained" onClick={save} disabled={!dirty || submitting}>
          حفظ التغييرات
        </Button>
      }
    >
      <FormGroup>
        {USER_ROLE_OPTIONS.map((opt) => (
          <FormControlLabel
            key={opt.value}
            control={
              <Checkbox checked={selected.includes(opt.value)} onChange={() => toggle(opt.value)} />
            }
            label={opt.label}
          />
        ))}
      </FormGroup>
      {dirty && (
        <Box sx={{ mt: 1 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {added.length > 0 && (
              <Typography variant="body2" color="success.main">
                إضافة: {added.length}
              </Typography>
            )}
            {removed.length > 0 && (
              <Typography variant="body2" color="error.main">
                إزالة: {removed.length}
              </Typography>
            )}
          </Stack>
        </Box>
      )}
    </SectionCard>
  );
}

export default RolesTab;
