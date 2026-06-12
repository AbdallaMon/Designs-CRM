"use client";

// <CommissionsView /> — the commissions surface (UX plan §3.10). GET /v2/admin/commissions
// REQUIRES a userId. Two modes:
//   • STANDALONE (no `userId` prop) — the /v2/admin/commissions page: the screen picks a user
//     FIRST via a manual id input (an explicit empty state until one is chosen).
//   • EMBEDDED (`userId` prop provided) — e.g. the user-detail "العمولات" tab: the user is fixed,
//     so the picker is skipped and that user's commissions load directly.
// Create/edit go through CommissionDialog. View is gated on COMMISSION_VIEW (the caller renders
// this), the create CTA + row-edit on COMMISSION_MANAGE. Single-language Arabic / RTL.

import { useState } from "react";
import { Box, Button, IconButton, Stack, TextField, Tooltip } from "@mui/material";
import { MdAdd, MdEdit, MdSearch } from "react-icons/md";
import { useT } from "@/app/v2/lib/i18n";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { DataTablePage, SectionCard, EmptyState } from "@/app/v2/shared/components";
import { useCommissionsList } from "../hooks/useCommissionsList.js";
import { buildCommissionsColumns } from "../config/commissionsColumns.js";
import { adminResidualMessages } from "../config/adminResidualMessages.js";
import { CommissionDialog } from "./CommissionDialog.jsx";

const P = PERMISSIONS.ADMIN_RESIDUAL;

export function CommissionsView({ userId: fixedUserId } = {}) {
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canManage = hasPermission(P.COMMISSION_MANAGE);
  const commissionsColumns = buildCommissionsColumns(t);

  // EMBEDDED mode: a userId prop fixes the subject and skips the picker. STANDALONE mode: the
  // user is chosen via the manual id input below.
  const embedded = fixedUserId != null && String(fixedUserId).trim() !== "";

  const [userIdInput, setUserIdInput] = useState("");
  const [pickedUserId, setPickedUserId] = useState(null);
  const [dialog, setDialog] = useState({ open: false, mode: "create", commission: null });

  const userId = embedded ? String(fixedUserId) : pickedUserId;

  const { items, isLoading, error, refetch } = useCommissionsList({ userId });

  function pickUser(e) {
    e?.preventDefault?.();
    const id = String(userIdInput ?? "").trim();
    setPickedUserId(/^\d+$/.test(id) ? id : null);
  }

  function openCreate() {
    setDialog({ open: true, mode: "create", commission: null });
  }
  function openEdit(row) {
    setDialog({ open: true, mode: "edit", commission: row });
  }
  function closeDialog() {
    setDialog((d) => ({ ...d, open: false }));
  }

  function renderRowActions(row) {
    if (!canManage) return null;
    return (
      <Tooltip title={t("adminResidual.commissions.editTooltip", "تعديل القيمة")}>
        <IconButton size="small" color="primary" onClick={() => openEdit(row)}>
          <MdEdit />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Stack spacing={3}>
      {!embedded && (
        <SectionCard
          title={t("adminResidual.commissions.picker.title", "اختر الموظف")}
          subtitle={t(
            "adminResidual.commissions.picker.subtitle",
            "تُعرض العمولات لموظف واحد في كل مرة — أدخل معرّف الموظف ثم اعرض عمولاته.",
          )}
          actions={
            canManage && userId ? (
              <Button variant="contained" color="primary" startIcon={<MdAdd />} onClick={openCreate}>
                {t("adminResidual.commissions.add", "إضافة عمولة")}
              </Button>
            ) : null
          }
        >
          <Box component="form" onSubmit={pickUser}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                type="number"
                label={t("adminResidual.commissions.field.userId", "معرّف الموظف")}
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                sx={{ minWidth: 220 }}
              />
              <Button type="submit" variant="outlined" startIcon={<MdSearch />}>
                {t("adminResidual.commissions.view", "عرض العمولات")}
              </Button>
            </Stack>
          </Box>
        </SectionCard>
      )}

      {embedded && canManage && (
        <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
          <Button variant="contained" color="primary" startIcon={<MdAdd />} onClick={openCreate}>
            {t("adminResidual.commissions.add", "إضافة عمولة")}
          </Button>
        </Box>
      )}

      {!userId ? (
        <EmptyState
          title={t("adminResidual.commissions.noUser.title", "لم يتم اختيار موظف")}
          description={t("adminResidual.commissions.noUser.description", "أدخل معرّف الموظف أعلاه لعرض عمولاته.")}
        />
      ) : (
        <DataTablePage
          columns={commissionsColumns}
          rows={items}
          total={items.length}
          page={1}
          pageSize={items.length || 10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          errorResolver={adminResidualMessages}
          getRowKey={(row) => row.id}
          renderRowActions={canManage ? renderRowActions : undefined}
          empty={{
            title: t("adminResidual.commissions.empty.title", "لا توجد عمولات"),
            description: canManage
              ? t(
                  "adminResidual.commissions.empty.description.manage",
                  "لا توجد عمولات لهذا الموظف بعد. أضف أول عمولة.",
                )
              : t("adminResidual.commissions.empty.description.readonly", "لا توجد عمولات لهذا الموظف."),
            action: canManage
              ? { label: t("adminResidual.commissions.add", "إضافة عمولة"), onClick: openCreate }
              : undefined,
          }}
        />
      )}

      {canManage && (
        <CommissionDialog
          open={dialog.open}
          mode={dialog.mode}
          userId={userId}
          commission={dialog.commission}
          onClose={closeDialog}
          onSaved={() => {
            closeDialog();
            refetch();
          }}
        />
      )}
    </Stack>
  );
}

export default CommissionsView;
