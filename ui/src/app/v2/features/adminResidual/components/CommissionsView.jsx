"use client";

// <CommissionsView /> — the commissions surface (UX plan §3.10). GET /v2/admin/commissions
// REQUIRES a userId, so the screen ALWAYS picks a user FIRST (an explicit empty state until one
// is chosen), then lists that user's commissions in DataTablePage. Create/edit go through
// CommissionDialog. View is gated on COMMISSION_VIEW (the page renders this), the create CTA +
// row-edit on COMMISSION_MANAGE. Single-language Arabic / RTL.

import { useState } from "react";
import { Box, Button, IconButton, Stack, TextField, Tooltip } from "@mui/material";
import { MdAdd, MdEdit, MdSearch } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { DataTablePage, SectionCard, EmptyState } from "@/app/v2/shared/components";
import { useCommissionsList } from "../hooks/useCommissionsList.js";
import { commissionsColumns } from "../config/commissionsColumns.js";
import { adminResidualMessages } from "../config/adminResidualMessages.js";
import { CommissionDialog } from "./CommissionDialog.jsx";

const P = PERMISSIONS.ADMIN_RESIDUAL;

export function CommissionsView() {
  const { hasPermission } = usePermission();
  const canManage = hasPermission(P.COMMISSION_MANAGE);

  const [userIdInput, setUserIdInput] = useState("");
  const [userId, setUserId] = useState(null);
  const [dialog, setDialog] = useState({ open: false, mode: "create", commission: null });

  const { items, isLoading, error, refetch } = useCommissionsList({ userId });

  function pickUser(e) {
    e?.preventDefault?.();
    const id = String(userIdInput ?? "").trim();
    setUserId(/^\d+$/.test(id) ? id : null);
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
      <Tooltip title="تعديل القيمة">
        <IconButton size="small" color="primary" onClick={() => openEdit(row)}>
          <MdEdit />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Stack spacing={3}>
      <SectionCard
        title="اختر الموظف"
        subtitle="تُعرض العمولات لموظف واحد في كل مرة — أدخل معرّف الموظف ثم اعرض عمولاته."
        actions={
          canManage && userId ? (
            <Button variant="contained" color="primary" startIcon={<MdAdd />} onClick={openCreate}>
              إضافة عمولة
            </Button>
          ) : null
        }
      >
        <Box component="form" onSubmit={pickUser}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              type="number"
              label="معرّف الموظف"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              sx={{ minWidth: 220 }}
            />
            <Button type="submit" variant="outlined" startIcon={<MdSearch />}>
              عرض العمولات
            </Button>
          </Stack>
        </Box>
      </SectionCard>

      {!userId ? (
        <EmptyState
          title="لم يتم اختيار موظف"
          description="أدخل معرّف الموظف أعلاه لعرض عمولاته."
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
            title: "لا توجد عمولات",
            description: canManage
              ? "لا توجد عمولات لهذا الموظف بعد. أضف أول عمولة."
              : "لا توجد عمولات لهذا الموظف.",
            action: canManage ? { label: "إضافة عمولة", onClick: openCreate } : undefined,
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
