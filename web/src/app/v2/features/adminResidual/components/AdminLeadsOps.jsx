"use client";

// <AdminLeadsOps /> — the admin leads-operations surface (UX plan §3.10). Composes the admin-tier
// lead tools, each in its own SectionCard and each gated on its OWN ADMIN_RESIDUAL.* code (the
// same predicate the BE enforces). Tools:
//   • Bulk Excel import (LEAD_IMPORT) — see BulkImportCard.
//   • Admin create-lead (LEAD_CREATE) — rich client form; BE .passthrough() reads it verbatim.
//   • Dynamic field edit (LEAD_EDIT / CLIENT_EDIT) — a single { field, value } update keyed by
//     lead id (updateLead) or client id (updateClient).
//   • Delete lead (LEAD_DELETE) — base-role ADMIN-only on the BE; we DO NOT widen the FE gate.
//   • Telegram create/assign (TELEGRAM_MANAGE) — lead-scoped channel create + assign-users.
// Whatever the user lacks a code for is simply not rendered. Single-language Arabic / RTL.

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Alert,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  MdPersonAdd,
  MdEdit,
  MdDeleteForever,
  MdSend,
  MdGroupAdd,
  MdExpandMore,
  MdBuild,
  MdWarning,
} from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { SectionCard, EmptyState } from "@/app/v2/shared/components";
import { adminResidualService } from "../adminResidual.service.js";
import { runAdminResidualMutation } from "../adminResidual.mutations.js";
import { BulkImportCard } from "./BulkImportCard.jsx";

const P = PERMISSIONS.ADMIN_RESIDUAL;

export function AdminLeadsOps() {
  const { hasPermission } = usePermission();
  const canImport = hasPermission(P.LEAD_IMPORT);
  const canCreate = hasPermission(P.LEAD_CREATE);
  const canEditLead = hasPermission(P.LEAD_EDIT);
  const canEditClient = hasPermission(P.CLIENT_EDIT);
  const canDelete = hasPermission(P.LEAD_DELETE);
  const canTelegram = hasPermission(P.TELEGRAM_MANAGE);

  const anything =
    canImport || canCreate || canEditLead || canEditClient || canDelete || canTelegram;

  if (!anything) {
    return (
      <EmptyState
        title="لا توجد أدوات متاحة"
        description="لا تملك صلاحية أي من عمليات العملاء المحتملين."
      />
    );
  }

  const showAddGroup = canImport || canCreate;
  const showAdvanced = canEditLead || canEditClient || canTelegram;

  return (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        أدوات إدارية لإنشاء وتعديل العملاء المحتملين.
      </Typography>

      {/* ── primary intent: add leads (bulk import + single create) ───────────────────── */}
      {showAddGroup && (
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
            إضافة عملاء
          </Typography>
          {canImport && <BulkImportCard />}
          {canCreate && <CreateLeadCard />}
        </Stack>
      )}

      {/* ── power-user internals, collapsed by default ────────────────────────────────── */}
      {showAdvanced && (
        <Accordion disableGutters sx={{ borderRadius: 3, "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<MdExpandMore />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <MdBuild />
              <Typography variant="subtitle1" component="h2">
                أدوات متقدمة (للمسؤولين التقنيين)
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={3}>
              {(canEditLead || canEditClient) && (
                <FieldEditCard canEditLead={canEditLead} canEditClient={canEditClient} />
              )}
              {canTelegram && <TelegramCard />}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {/* ── danger zone: destructive delete, isolated at the bottom ───────────────────── */}
      {canDelete && (
        <SectionCard
          title="منطقة الحذف"
          subtitle="عمليات نهائية لا يمكن التراجع عنها."
          sx={{ borderColor: "error.main", borderWidth: 1, borderStyle: "solid" }}
        >
          <Stack spacing={2}>
            <Alert severity="warning" icon={<MdWarning />}>
              العمليات في هذه المنطقة تؤثر على البيانات بشكل دائم. تأكّد قبل التنفيذ.
            </Alert>
            <DeleteLeadCard />
          </Stack>
        </SectionCard>
      )}
    </Stack>
  );
}

// ── admin create-lead (BE .passthrough → forwarded verbatim) ─────────────────────────────────
const CREATE_LEAD_DEFAULTS = { name: "", phone: "", email: "", emirate: "", description: "" };

function CreateLeadCard() {
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, reset } = useForm({ defaultValues: CREATE_LEAD_DEFAULTS });

  async function onSubmit(values) {
    // The BE reads this rich client form via .passthrough(); we forward the filled keys only.
    const body = {};
    Object.entries(values).forEach(([k, v]) => {
      const t = typeof v === "string" ? v.trim() : v;
      if (t !== "" && t != null) body[k] = t;
    });
    const res = await runAdminResidualMutation(() => adminResidualService.createNewLead(body), {
      loading: "جاري إنشاء العميل المحتمل...",
      setLoading: setSubmitting,
    });
    if (res) reset(CREATE_LEAD_DEFAULTS);
  }

  return (
    <SectionCard title="إنشاء عميل محتمل">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="name"
              control={control}
              rules={{ required: "الاسم مطلوب" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="الاسم"
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="phone"
              control={control}
              rules={{ required: "رقم الهاتف مطلوب" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="رقم الهاتف"
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => <TextField {...field} type="email" label="البريد الإلكتروني" fullWidth />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="emirate"
              control={control}
              render={({ field }) => <TextField {...field} label="الإمارة" fullWidth />}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="ملاحظات" fullWidth multiline minRows={2} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<MdPersonAdd />}
              disabled={submitting}
            >
              إنشاء
            </Button>
          </Grid>
        </Grid>
      </form>
    </SectionCard>
  );
}

// ── dynamic field edit (lead-keyed OR client-keyed single-field update) ──────────────────────
function FieldEditCard({ canEditLead, canEditClient }) {
  const [submitting, setSubmitting] = useState(false);
  const targets = [];
  if (canEditLead) targets.push({ value: "lead", label: "حقل عميل محتمل (حسب معرّف العميل المحتمل)" });
  if (canEditClient) targets.push({ value: "client", label: "حقل عميل (حسب معرّف العميل)" });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: { target: targets[0]?.value ?? "lead", id: "", field: "", value: "" },
  });

  async function onSubmit(values) {
    const id = String(values.id ?? "").trim();
    const field = String(values.field ?? "").trim();
    if (!id || !field) return;
    // The BE reads the dynamic update via .passthrough(): { field, [field]: value }.
    const body = { field, [field]: values.value };
    const fn =
      values.target === "client"
        ? () => adminResidualService.updateClient(id, body)
        : () => adminResidualService.updateLead(id, body);
    const res = await runAdminResidualMutation(fn, {
      loading: "جاري تحديث الحقل...",
      setLoading: setSubmitting,
    });
    if (res) reset((prev) => ({ ...prev, value: "" }));
  }

  return (
    <SectionCard
      title="تعديل حقل ديناميكي"
      subtitle="حدّث حقلًا واحدًا لعميل محتمل أو لعميل حسب المعرّف."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="target"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="النوع" fullWidth>
                  {targets.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="id"
              control={control}
              rules={{ required: "المعرّف مطلوب" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label="المعرّف"
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="field"
              control={control}
              rules={{ required: "اسم الحقل مطلوب" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="اسم الحقل"
                  placeholder="مثال: name"
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="value"
              control={control}
              render={({ field }) => <TextField {...field} label="القيمة الجديدة" fullWidth />}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<MdEdit />}
              disabled={submitting}
            >
              تحديث الحقل
            </Button>
          </Grid>
        </Grid>
      </form>
    </SectionCard>
  );
}

// ── telegram (lead-scoped: create channel + assign users) ────────────────────────────────────
function TelegramCard() {
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit } = useForm({ defaultValues: { leadId: "", userIds: "" } });

  async function createChannel(values) {
    const leadId = String(values.leadId ?? "").trim();
    if (!leadId) return;
    await runAdminResidualMutation(
      () => adminResidualService.createTelegramChannel(leadId, {}),
      { loading: "جاري إنشاء القناة...", setLoading: setSubmitting },
    );
  }

  async function assignUsers(values) {
    const leadId = String(values.leadId ?? "").trim();
    const userIds = String(values.userIds ?? "")
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number);
    if (!leadId || userIds.length === 0) return;
    await runAdminResidualMutation(
      () => adminResidualService.assignTelegramUsers(leadId, { userIds }),
      { loading: "جاري جدولة الإضافة...", setLoading: setSubmitting },
    );
  }

  return (
    <SectionCard title="تيليجرام (حسب العميل المحتمل)">
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="leadId"
            control={control}
            render={({ field }) => (
              <TextField {...field} type="number" label="معرّف العميل المحتمل" fullWidth />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="userIds"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="معرّفات المستخدمين (مفصولة بفواصل)"
                placeholder="مثال: 1, 2, 3"
                fullWidth
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<MdSend />}
              onClick={handleSubmit(createChannel)}
              disabled={submitting}
            >
              إنشاء قناة
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<MdGroupAdd />}
              onClick={handleSubmit(assignUsers)}
              disabled={submitting}
            >
              إضافة مستخدمين
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </SectionCard>
  );
}

// ── delete lead (admin-only — gate NOT widened) ──────────────────────────────────────────────
function DeleteLeadCard() {
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, reset } = useForm({ defaultValues: { id: "" } });

  async function onDelete(values) {
    const id = String(values.id ?? "").trim();
    if (!id) return;
    const res = await runAdminResidualMutation(() => adminResidualService.deleteLead(id), {
      loading: "جاري حذف العميل المحتمل...",
      setLoading: setSubmitting,
    });
    if (res) reset({ id: "" });
  }

  return (
    <Box>
      <Typography variant="subtitle1" component="h3" sx={{ mb: 1.5 }}>
        حذف عميل محتمل
      </Typography>
      <Alert severity="error" sx={{ mb: 2 }}>
        الحذف نهائي ولا يمكن التراجع عنه. هذه العملية متاحة للمسؤول فقط.
      </Alert>
      <Box component="form" onSubmit={handleSubmit(onDelete)} noValidate>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="flex-start">
          <Controller
            name="id"
            control={control}
            rules={{ required: "المعرّف مطلوب" }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                size="small"
                label="معرّف العميل المحتمل"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                sx={{ minWidth: 220 }}
              />
            )}
          />
          <Button
            type="submit"
            variant="contained"
            color="error"
            startIcon={<MdDeleteForever />}
            disabled={submitting}
          >
            حذف
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

export default AdminLeadsOps;
