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
  Button,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  MdPersonAdd,
  MdEdit,
  MdSend,
  MdGroupAdd,
  MdExpandMore,
  MdBuild,
} from "react-icons/md";
import { useT } from "@/app/v2/lib/i18n";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { SectionCard, EmptyState } from "@/app/v2/shared/components";
import { adminResidualService } from "../adminResidual.service.js";
import { runAdminResidualMutation } from "../adminResidual.mutations.js";
import { EMIRATES_OPTIONS } from "../config/adminResidualConstants.js";
import {
  LEAD_CREATE_CATEGORY_OPTIONS,
  LEAD_ITEM_OPTIONS_BY_CATEGORY,
  LEAD_LOCATION_OPTIONS,
} from "@/app/v2/features/leads/config/leadsConstants.js";
import { BulkImportCard } from "./BulkImportCard.jsx";

const P = PERMISSIONS.ADMIN_RESIDUAL;

export function AdminLeadsOps() {
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canImport = hasPermission(P.LEAD_IMPORT);
  const canCreate = hasPermission(P.LEAD_CREATE);
  const canEditLead = hasPermission(P.LEAD_EDIT);
  const canEditClient = hasPermission(P.CLIENT_EDIT);
  const canTelegram = hasPermission(P.TELEGRAM_MANAGE);

  // NOTE: lead DELETE moved to the lead-detail header (LeadDeleteAction). It is no longer a
  // standalone delete-by-id card here, so LEAD_DELETE no longer gates this ops surface.
  const anything = canImport || canCreate || canEditLead || canEditClient || canTelegram;

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

      {/* Lead delete moved to the lead-detail header (LeadDeleteAction) — no longer a
          standalone delete-by-id card here. */}
    </Stack>
  );
}

// ── admin create-lead (BE .passthrough → forwarded verbatim) ─────────────────────────────────
// The BE `createNewLead` validation REQUIRES email/name/phone + category (LeadCategory) + item
// (LeadType). Master's add-lead form drove these via Select dropdowns (location → design type →
// FinalSelectionForm); the v2 form had regressed to a free-text emirate with NO category/item, so
// every submit failed BE validation. Restored: category + item + location + emirate as Selects.
const CREATE_LEAD_DEFAULTS = {
  name: "",
  phone: "",
  email: "",
  category: "",
  item: "",
  location: "",
  emirate: "",
  description: "",
};

function CreateLeadCard() {
  const { t } = useT();
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: CREATE_LEAD_DEFAULTS,
  });

  // `item` options depend on the chosen category (CONSULTATION vs DESIGN). When the category
  // changes, the old item is no longer valid → clear it so the user re-picks from the new set.
  const category = watch("category");
  const location = watch("location");
  const itemOptions = LEAD_ITEM_OPTIONS_BY_CATEGORY[category] ?? [];
  // Emirate is only meaningful for an INSIDE_UAE design lead (the BE maps OUTSIDE_UAE → "OUTSIDE").
  const showEmirate = category === "DESIGN" && location !== "OUTSIDE_UAE";

  async function onSubmit(values) {
    // The BE reads this rich client form via .passthrough(); forward the filled keys only.
    const body = {};
    Object.entries(values).forEach(([k, v]) => {
      const trimmed = typeof v === "string" ? v.trim() : v;
      if (trimmed !== "" && trimmed != null) body[k] = trimmed;
    });
    // Emirate is irrelevant unless an inside-UAE design lead; don't forward a stale value.
    if (!showEmirate) delete body.emirate;
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
          {/* category (LeadCategory) — required Select; drives the item options */}
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
                    // Reset the dependent item whenever the category changes.
                    setValue("item", "");
                  }}
                >
                  {LEAD_CREATE_CATEGORY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey, opt.value)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          {/* item (LeadType) — required Select; options depend on category */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="item"
              control={control}
              rules={{ required: t("adminResidual.leads.create.field.item.required", "النوع مطلوب") }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  disabled={!category}
                  label={t("adminResidual.leads.create.field.item", "النوع")}
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={
                    fieldState.error?.message ||
                    (!category
                      ? t("adminResidual.leads.create.field.item.hint", "اختر التصنيف أولاً")
                      : undefined)
                  }
                >
                  {itemOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey, opt.value)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          {/* location (inside / outside UAE) — Select */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label={t("adminResidual.leads.create.field.location", "الموقع")}
                  fullWidth
                >
                  {LEAD_LOCATION_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey, opt.value)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          {/* emirate — Select (only for an inside-UAE design lead) */}
          {showEmirate && (
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
                        {t(opt.labelKey, opt.labelFallback)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            <Controller
              name="description"
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

export default AdminLeadsOps;
