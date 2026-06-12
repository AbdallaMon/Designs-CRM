"use client";

// One update card with its workflow actions — migrated from the legacy UpdateCard +
// DepartmentManagementModal + MarkAsDoneModal, collapsed to the core capability-gated
// actions. §5c workflow-action renames wired:
//   • authorize a department        → POST /v2/updates/:updateId/actions/authorize        { type }
//   • unauthorize (shared) a dept    → POST /v2/updates/:updateId/actions/authorize-shared { type }
//   • toggle archive                 → POST /v2/updates/:updateId/actions/archive          { isArchived }
//   • mark done                      → POST /v2/updates/:updateId/actions/mark-done        { isArchived?, clientLeadId? }
// Each action is gated on the row's capabilities.canAuthorize / canArchive / canMarkDone
// combined with the matching PERMISSIONS.UPDATE.* code.

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { MdArchive, MdCheckCircle, MdUnarchive, MdVerified } from "react-icons/md";
import dayjs from "dayjs";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useT } from "@/app/v2/lib/i18n";
import { DEPARTMENTS } from "../../config/projectsConstants.js";
import { projectsService } from "../../projects.service.js";
import { runProjectMutation } from "../../projects.mutations.js";

export function UpdateCard({ update, clientLeadId, currentUserDepartment, onChanged }) {
  const { hasPermission } = usePermission();
  const { t } = useT();
  const caps = update.capabilities ?? {};
  const canAuthorize = hasPermission(PERMISSIONS.UPDATE.AUTHORIZE) && caps.canAuthorize;
  const canArchive = hasPermission(PERMISSIONS.UPDATE.ARCHIVE) && caps.canArchive;
  const canMarkDone = hasPermission(PERMISSIONS.UPDATE.MARK_DONE) && caps.canMarkDone;

  const [authType, setAuthType] = useState(currentUserDepartment || "");

  const sharedSettings = update.sharedSettings ?? [];
  const isArchived = sharedSettings.length > 0 && sharedSettings.every((s) => s.isArchived);

  const handleAuthorize = async (shared) => {
    if (!authType) return;
    const call = shared
      ? () => projectsService.authorizeSharedUpdate(update.id, { type: authType })
      : () => projectsService.authorizeUpdate(update.id, { type: authType });
    const res = await runProjectMutation(call, { loading: t("projects.updateCard.loading.update") });
    if (res) onChanged?.();
  };

  const handleArchiveToggle = async () => {
    const res = await runProjectMutation(
      () => projectsService.archiveUpdate(update.id, { isArchived: !isArchived }),
      { loading: t("projects.updateCard.loading.archive") },
    );
    if (res) onChanged?.();
  };

  const handleMarkDone = async () => {
    const res = await runProjectMutation(
      () => projectsService.markUpdateDone(update.id, { clientLeadId: Number(clientLeadId) }),
      { loading: t("projects.updateCard.loading.markDone") },
    );
    if (res) onChanged?.();
  };

  return (
    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {update.title}
            </Typography>
            {update.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {update.description}
              </Typography>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
              <Chip size="small" label={update.department} />
              {update.isDone && <Chip size="small" color="success" label={t("projects.updateCard.done")} />}
              {isArchived && <Chip size="small" color="default" label={t("projects.updateCard.archived")} />}
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                {update.createdAt ? dayjs(update.createdAt).fromNow() : ""}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        {(canAuthorize || canArchive || canMarkDone) && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
              {canAuthorize && (
                <>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>{t("projects.updateCard.department")}</InputLabel>
                    <Select value={authType} label={t("projects.updateCard.department")} onChange={(e) => setAuthType(e.target.value)}>
                      {DEPARTMENTS.map((d) => (
                        <MenuItem key={d.value} value={d.value}>
                          {d.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button size="small" variant="outlined" startIcon={<MdVerified />} onClick={() => handleAuthorize(false)}>
                    {t("projects.updateCard.authorize")}
                  </Button>
                  <Button size="small" variant="outlined" color="warning" onClick={() => handleAuthorize(true)}>
                    {t("projects.updateCard.unauthorize")}
                  </Button>
                </>
              )}
              {canArchive && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={isArchived ? <MdUnarchive /> : <MdArchive />}
                  onClick={handleArchiveToggle}
                >
                  {isArchived ? t("projects.updateCard.unarchive") : t("projects.updateCard.archive")}
                </Button>
              )}
              {canMarkDone && (
                <Button size="small" variant="contained" color="success" startIcon={<MdCheckCircle />} onClick={handleMarkDone}>
                  {t("projects.updateCard.markDone")}
                </Button>
              )}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default UpdateCard;
