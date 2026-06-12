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
import { useT } from "@/app/v2/lib/i18n";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { SectionCard, EmptyState } from "@/app/v2/shared/components";
import {
  LEAD_CATEGORY_OPTIONS,
  LEAD_ITEM_OPTIONS_BY_CATEGORY,
  EMIRATES_OPTIONS,
} from "@/app/v2/features/leads/config/leadsConstants.js";
import { adminResidualService } from "../adminResidual.service.js";
import { runAdminResidualMutation } from "../adminResidual.mutations.js";
import { BulkImportCard } from "./BulkImportCard.jsx";

const P = PERMISSIONS.ADMIN_RESIDUAL;

export function AdminLeadsOps() {
  const { t } = useT();
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
        title={t("adminResidual.leads.noTools.title", "لا توجد أدوات متاحة")}
        description={t("adminResidual.leads.noTools.description", "لا تملك صلاحية أي من عمليات العملاء المحتملين.")}
      />
    );
  }

  const showAddGroup = canImport || canCreate;
  const showAdvanced = canEditLead || canEditClient || canTelegram;

  return (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        {t("adminResidual.leads.intro", "أدوات إدارية لإنشاء وتعديل العملاء المحتملين.")}
      </Typography>

      {/* ── primary intent: add leads (bulk import + single create) ───────────────────── */}
      {showAddGroup && (
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
            {t("adminResidual.leads.addGroup.title", "إضافة عملاء")}
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
                {t("adminResidual.leads.advanced.title", "أدوات متقدمة (للمسؤولين التقنيين)")}
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
          title={t("adminResidual.leads.dangerZone.title", "منطقة الحذف")}
          subtitle={t("adminResidual.leads.dangerZone.subtitle", "عمليات نهائية لا يمكن التراجع عنها.")}
          sx={{ borderColor: "error.main", borderWidth: 1, borderStyle: "solid" }}
        >
          <Stack spacing={2}>
            <Alert severity="warning" icon={<MdWarning />}>
              {t(
                "adminResidual.leads.dangerZone.warning",
                "العمليات في هذه المنطقة تؤثر على البيانات بشكل دائم. تأكّد قبل التنفيذ.",
              )}
            </Alert>
            <DeleteLeadCard />
          </Stack>
        </SectionCard>
      )}
    </Stack>
  );
}

// ── admin create-lead (BE .passthrough → forwarded verbatim) ─────────────────────────────────
// The BE REQUIRES email/name/phone + category/item (the create path reads category+item
// unconditionally → selectedCategory/type). category is a SELECT (DESIGN/CONSULTATION), item is a
// DEPENDENT select (its options change with category; CONSULTATION items are price-tabled), and
// emirate is a SELECT of the UAE emirates. clientDescription stays free text.
const CREATE_LEAD_DEFAULTS = {
  name: "",
  phone: "",
  email: "",
  category: "",
  item: "",
  emirate: "",
  clientDescription: "",
};

function CreateLeadCard() {
  const { t } = useT();
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: CREATE_LEAD_DEFAULTS,
  });

  // item depends on category — switching category resets a now-invalid item.
  const category = watch("category");
  const itemOptions = LEAD_ITEM_OPTIONS_BY_CATEGORY[category] ?? [];

  async function onSubmit(values) {
    // The BE reads this rich client form via .passthrough(); we forward the filled keys only.
    const body = {};
    Object.entries(values).forEach(([k, v]) => {
      const trimmed = typeof v === "string" ? v.trim() : v;
      if (trimmed !== "" && trimmed != null) body[k] = trimmed;
    });
    const res = await runAdminResidualMutation(() => adminResidualService.createNewLead(body), {
      loading: t("adminResidual.leads.create.loading", "جاري إنشاء العميل المحتمل..."),
      setLoading: setSubmitting,
    });
    if (res) reset(CREATE_LEAD_DEFAULTS);
  }

  return (
    <SectionCard title={t("adminResidual.leads.create.title", "إنشاء عميل محتمل")}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="name"
              control={control}
              rules={{ required: t("adminResidual.leads.create.field.name.required", "الاسم مطلوب") }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label={t("adminResidual.leads.create.field.name", "الاسم")}
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
              rules={{ required: t("adminResidual.leads.create.field.phone.required", "رقم الهاتف مطلوب") }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label={t("adminResidual.leads.create.field.phone", "رقم الهاتف")}
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
              rules={{ required: t("adminResidual.leads.create.field.email.required", "البريد الإلكتروني مطلوب") }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="email"
                  label={t("adminResidual.leads.create.field.email", "البريد الإلكتروني")}
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="emirate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label={t("adminResidual.leads.create.field.emirate", "الإمارة")}
                  fullWidth
                >
                  {EMIRATES_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="category"
              control={control}
              rules={{ required: t("adminResidual.leads.create.field.category.required", "التصنيف مطلوب") }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  label={t("adminResidual.leads.create.field.category", "التصنيف")}
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  onChange={(e) => {
                    field.onChange(e);
                    // reset the dependent item whenever the category changes
                    setValue("item", "");
                  }}
                >
                  {LEAD_CATEGORY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="item"
              control={control}
              rules={{ required: t("adminResidual.leads.create.field.item.required", "النوع مطلوب") }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  label={t("adminResidual.leads.create.field.item", "النوع")}
                  fullWidth
                  disabled={!category}
                  error={Boolean(fieldState.error)}
                  helperText={
                    fieldState.error?.message ??
                    (!category
                      ? t("adminResidual.leads.create.field.item.pickCategory", "اختر التصنيف أولاً")
                      : undefined)
                  }
                >
                  {itemOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="clientDescription"
              control={control}
              render={({ field }) => (
                <TextField {...field} label={t("adminResidual.leads.create.field.description", "ملاحظات")} fullWidth multiline minRows={2} />
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
              {t("adminResidual.leads.create.submit", "إنشاء")}
            </Button>
          </Grid>
        </Grid>
      </form>
    </SectionCard>
  );
}

// ── dynamic field edit (lead-keyed OR client-keyed single-field update) ──────────────────────
function FieldEditCard({ canEditLead, canEditClient }) {
  const { t } = useT();
  const [submitting, setSubmitting] = useState(false);
  const targets = [];
  if (canEditLead)
    targets.push({
      value: "lead",
      label: t("adminResidual.leads.fieldEdit.target.lead", "حقل عميل محتمل (حسب معرّف العميل المحتمل)"),
    });
  if (canEditClient)
    targets.push({
      value: "client",
      label: t("adminResidual.leads.fieldEdit.target.client", "حقل عميل (حسب معرّف العميل)"),
    });

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
      loading: t("adminResidual.leads.fieldEdit.loading", "جاري تحديث الحقل..."),
      setLoading: setSubmitting,
    });
    if (res) reset((prev) => ({ ...prev, value: "" }));
  }

  return (
    <SectionCard
      title={t("adminResidual.leads.fieldEdit.title", "تعديل حقل ديناميكي")}
      subtitle={t("adminResidual.leads.fieldEdit.subtitle", "حدّث حقلًا واحدًا لعميل محتمل أو لعميل حسب المعرّف.")}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="target"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label={t("adminResidual.leads.fieldEdit.field.target", "النوع")} fullWidth>
                  {targets.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
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
              rules={{ required: t("adminResidual.leads.fieldEdit.field.id.required", "المعرّف مطلوب") }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label={t("adminResidual.leads.fieldEdit.field.id", "المعرّف")}
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
              rules={{ required: t("adminResidual.leads.fieldEdit.field.fieldName.required", "اسم الحقل مطلوب") }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label={t("adminResidual.leads.fieldEdit.field.fieldName", "اسم الحقل")}
                  placeholder={t("adminResidual.leads.fieldEdit.field.fieldName.placeholder", "مثال: name")}
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
              render={({ field }) => <TextField {...field} label={t("adminResidual.leads.fieldEdit.field.value", "القيمة الجديدة")} fullWidth />}
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
              {t("adminResidual.leads.fieldEdit.submit", "تحديث الحقل")}
            </Button>
          </Grid>
        </Grid>
      </form>
    </SectionCard>
  );
}

// ── telegram (lead-scoped: create channel + assign users) ────────────────────────────────────
function TelegramCard() {
  const { t } = useT();
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit } = useForm({ defaultValues: { leadId: "", userIds: "" } });

  async function createChannel(values) {
    const leadId = String(values.leadId ?? "").trim();
    if (!leadId) return;
    await runAdminResidualMutation(
      () => adminResidualService.createTelegramChannel(leadId, {}),
      { loading: t("adminResidual.leads.telegram.createLoading", "جاري إنشاء القناة..."), setLoading: setSubmitting },
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
      { loading: t("adminResidual.leads.telegram.assignLoading", "جاري جدولة الإضافة..."), setLoading: setSubmitting },
    );
  }

  return (
    <SectionCard title={t("adminResidual.leads.telegram.title", "تيليجرام (حسب العميل المحتمل)")}>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="leadId"
            control={control}
            render={({ field }) => (
              <TextField {...field} type="number" label={t("adminResidual.leads.telegram.field.leadId", "معرّف العميل المحتمل")} fullWidth />
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
                label={t("adminResidual.leads.telegram.field.userIds", "معرّفات المستخدمين (مفصولة بفواصل)")}
                placeholder={t("adminResidual.leads.telegram.field.userIds.placeholder", "مثال: 1, 2, 3")}
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
              {t("adminResidual.leads.telegram.createChannel", "إنشاء قناة")}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<MdGroupAdd />}
              onClick={handleSubmit(assignUsers)}
              disabled={submitting}
            >
              {t("adminResidual.leads.telegram.assignUsers", "إضافة مستخدمين")}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </SectionCard>
  );
}

// ── delete lead (admin-only — gate NOT widened) ──────────────────────────────────────────────
function DeleteLeadCard() {
  const { t } = useT();
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, reset } = useForm({ defaultValues: { id: "" } });

  async function onDelete(values) {
    const id = String(values.id ?? "").trim();
    if (!id) return;
    const res = await runAdminResidualMutation(() => adminResidualService.deleteLead(id), {
      loading: t("adminResidual.leads.delete.loading", "جاري حذف العميل المحتمل..."),
      setLoading: setSubmitting,
    });
    if (res) reset({ id: "" });
  }

  return (
    <Box>
      <Typography variant="subtitle1" component="h3" sx={{ mb: 1.5 }}>
        {t("adminResidual.leads.delete.title", "حذف عميل محتمل")}
      </Typography>
      <Alert severity="error" sx={{ mb: 2 }}>
        {t(
          "adminResidual.leads.delete.warning",
          "الحذف نهائي ولا يمكن التراجع عنه. هذه العملية متاحة للمسؤول فقط.",
        )}
      </Alert>
      <Box component="form" onSubmit={handleSubmit(onDelete)} noValidate>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="flex-start">
          <Controller
            name="id"
            control={control}
            rules={{ required: t("adminResidual.leads.delete.field.id.required", "المعرّف مطلوب") }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                size="small"
                label={t("adminResidual.leads.delete.field.id", "معرّف العميل المحتمل")}
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
            {t("adminResidual.leads.delete.submit", "حذف")}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

export default AdminLeadsOps;
