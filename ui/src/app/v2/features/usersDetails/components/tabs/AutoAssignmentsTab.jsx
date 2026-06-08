"use client";

// Auto-assignments editor — manages which project types are auto-assigned to this user.
// GET /:userId/auto-assignments returns a string[] of types; PUT sends a DIFF
// { added: string[], removed: string[] } against the fetched baseline. Lazy: fetches on first
// mount of the tab. Gated on PERMISSIONS.USER.MANAGE_AUTO_ASSIGNMENTS AND the record capability
// `canManageAutoAssignments`. All five states. Single-language Arabic / RTL.

import { useEffect, useState } from "react";
import { Box, Button, Checkbox, FormControlLabel, FormGroup, Stack, Typography } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import {
  SectionCard,
  LoadingState,
  ErrorState,
  PartialPermissionState,
} from "@/app/v2/shared/components";
import { usersService } from "@/app/v2/features/users/users.service.js";
import { runUsersMutation } from "@/app/v2/features/users/users.mutations.js";
import { usersMessages } from "@/app/v2/features/users/config/usersMessages.js";
import { AUTO_ASSIGNMENT_TYPES } from "@/app/v2/features/users/config/usersConstants.js";
import { useLazyResource } from "../../hooks/useLazyResource.js";

export function AutoAssignmentsTab({ userId, capabilities }) {
  const { hasPermission } = usePermission();
  const canManage =
    hasPermission(PERMISSIONS.USER.MANAGE_AUTO_ASSIGNMENTS) &&
    Boolean(capabilities?.canManageAutoAssignments);

  const { data, isLoading, error, refetch } = useLazyResource(
    () => usersService.getAutoAssignments(userId),
    { autoFetch: canManage, deps: [userId] },
  );

  const baseline = Array.isArray(data) ? data : [];
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Re-seed the selection whenever a fresh baseline arrives.
  useEffect(() => {
    setSelected(Array.isArray(data) ? data : []);
  }, [data]);

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
      () => usersService.updateAutoAssignments(userId, { added, removed }),
      { loading: "جاري تحديث التعيينات...", setLoading: setSubmitting },
    );
    if (res) refetch();
  }

  if (!canManage) {
    return (
      <PartialPermissionState
        denied
        title="إدارة التعيينات التلقائية غير متاحة لصلاحياتك"
        message="لا تملك صلاحية تعديل التعيينات التلقائية لهذا المستخدم."
      />
    );
  }
  if (error) return <ErrorState error={error} onRetry={refetch} resolver={usersMessages} />;
  if (isLoading) return <LoadingState variant="form" fields={5} />;

  return (
    <SectionCard
      title="التعيينات التلقائية"
      subtitle="أنواع المشاريع التي تُسنَد تلقائياً إلى هذا المستخدم."
      actions={
        <Button variant="contained" onClick={save} disabled={!dirty || submitting}>
          حفظ التغييرات
        </Button>
      }
    >
      <FormGroup>
        {AUTO_ASSIGNMENT_TYPES.map((opt) => (
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

export default AutoAssignmentsTab;
