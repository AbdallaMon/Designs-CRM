"use client";

// <FixedDataView /> — the fixed-data WRITES surface + the generic model-archive toggle (UX plan
// §3.10). The GET read lives in the utilities module (utility.fixed_data.list) so we reuse the
// utilities SERVICE for the read; the WRITES (create/update/delete) go through the adminResidual
// service, gated on FIXED_DATA_MANAGE. A second card hosts the allow-listed model-archive toggle
// (MODEL_ARCHIVE). Single-language Arabic / RTL.

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  FormControlLabel,
  Alert,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdArchive,
  MdExpandMore,
} from "react-icons/md";
import { useT } from "@/app/v2/lib/i18n";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { DataTablePage, SectionCard } from "@/app/v2/shared/components";
import { utilitiesService } from "@/app/v2/features/utilities/utilities.service.js";
import { adminResidualService } from "../adminResidual.service.js";
import { runAdminResidualMutation } from "../adminResidual.mutations.js";
import { buildFixedDataColumns } from "../config/fixedDataColumns.js";
import { adminResidualMessages } from "../config/adminResidualMessages.js";
import { ARCHIVE_MODEL_OPTIONS } from "../config/adminResidualConstants.js";
import { FixedDataDialog } from "./FixedDataDialog.jsx";

const P = PERMISSIONS.ADMIN_RESIDUAL;

export function FixedDataView() {
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canManage = hasPermission(P.FIXED_DATA_MANAGE);
  const canArchive = hasPermission(P.MODEL_ARCHIVE);
  const fixedDataColumns = buildFixedDataColumns(t);

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState({ open: false, mode: "create", item: null });

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await utilitiesService.listFixedData();
      const data = res?.data ?? {};
      if (Array.isArray(data)) setItems(data);
      else if (Array.isArray(data.items)) setItems(data.items);
      else setItems([]);
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  function openCreate() {
    setDialog({ open: true, mode: "create", item: null });
  }
  function openEdit(row) {
    setDialog({ open: true, mode: "edit", item: row });
  }
  function closeDialog() {
    setDialog((d) => ({ ...d, open: false }));
  }

  async function onDelete(row) {
    const res = await runAdminResidualMutation(
      () => adminResidualService.deleteFixedData(row.id),
      { loading: t("adminResidual.fixedData.delete.loading", "جاري حذف البيان...") },
    );
    if (res) fetchList();
  }

  function renderRowActions(row) {
    if (!canManage) return null;
    return (
      <>
        <Tooltip title={t("adminResidual.fixedData.action.edit", "تعديل")}>
          <IconButton size="small" color="primary" onClick={() => openEdit(row)}>
            <MdEdit />
          </IconButton>
        </Tooltip>
        <Tooltip title={t("adminResidual.fixedData.action.delete", "حذف")}>
          <IconButton size="small" color="error" onClick={() => onDelete(row)}>
            <MdDelete />
          </IconButton>
        </Tooltip>
      </>
    );
  }

  return (
    <Stack spacing={3}>
      <SectionCard
        title={t("adminResidual.fixedData.title", "البيانات الثابتة")}
        subtitle={t("adminResidual.fixedData.subtitle", "القيم الثابتة المستخدمة في النماذج عبر النظام.")}
        actions={
          canManage ? (
            <Button variant="contained" color="primary" startIcon={<MdAdd />} onClick={openCreate}>
              {t("adminResidual.fixedData.add", "إضافة بيان")}
            </Button>
          ) : null
        }
        noPadding
      >
        <Box sx={{ p: 2 }}>
          <DataTablePage
            columns={fixedDataColumns}
            rows={items}
            total={items.length}
            page={1}
            pageSize={items.length || 10}
            loading={isLoading}
            error={error}
            onRetry={fetchList}
            errorResolver={adminResidualMessages}
            getRowKey={(row) => row.id}
            renderRowActions={canManage ? renderRowActions : undefined}
            empty={{
              title: t("adminResidual.fixedData.empty.title", "لا توجد بيانات ثابتة"),
              description: canManage
                ? t("adminResidual.fixedData.empty.description.manage", "أضف أول بيان ثابت.")
                : t("adminResidual.fixedData.empty.description.readonly", "لا توجد بيانات."),
              action: canManage
                ? { label: t("adminResidual.fixedData.add", "إضافة بيان"), onClick: openCreate }
                : undefined,
            }}
          />
        </Box>
      </SectionCard>

      {canArchive && (
        <Accordion disableGutters sx={{ borderRadius: 3, "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<MdExpandMore />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <MdArchive />
              <Typography variant="subtitle1" component="h2">
                {t("adminResidual.fixedData.archive.accordion.title", "أداة متقدمة: أرشفة سجل")}
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <ModelArchiveCard />
          </AccordionDetails>
        </Accordion>
      )}

      {canManage && (
        <FixedDataDialog
          open={dialog.open}
          mode={dialog.mode}
          item={dialog.item}
          onClose={closeDialog}
          onSaved={() => {
            closeDialog();
            fetchList();
          }}
        />
      )}
    </Stack>
  );
}

// ── generic model-archive toggle (allow-listed `model` on the BE) ────────────────────────────
function ModelArchiveCard() {
  const { t } = useT();
  const [model, setModel] = useState(ARCHIVE_MODEL_OPTIONS[0].value);
  const [id, setId] = useState("");
  const [isArchived, setIsArchived] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const recordId = String(id ?? "").trim();
    if (!recordId) return;
    await runAdminResidualMutation(
      () => adminResidualService.archiveModel(recordId, { model, isArchived }),
      { loading: t("adminResidual.fixedData.archive.loading", "جاري تحديث حالة الأرشفة..."), setLoading: setSubmitting },
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {t("adminResidual.fixedData.archive.intro", "فعّل أو ألغِ أرشفة سجلّ من النماذج المسموح بها.")}
      </Typography>
      <Alert severity="warning" sx={{ mb: 2 }}>
        {t(
          "adminResidual.fixedData.archive.warning",
          "تعمل هذه الأداة على أي سجل حسب معرّفه — تأكّد من النموذج والمعرّف قبل التطبيق.",
        )}
      </Alert>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
          flexWrap="wrap"
        >
          <TextField
            select
            size="small"
            label={t("adminResidual.fixedData.archive.field.model", "النموذج")}
            value={model}
            onChange={(e) => setModel(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {ARCHIVE_MODEL_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {t(o.labelKey, o.labelFallback)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            type="number"
            label={t("adminResidual.fixedData.archive.field.recordId", "معرّف السجل")}
            value={id}
            onChange={(e) => setId(e.target.value)}
            sx={{ minWidth: 160 }}
          />
          <FormControlLabel
            control={
              <Switch checked={isArchived} onChange={(e) => setIsArchived(e.target.checked)} />
            }
            label={
              isArchived
                ? t("adminResidual.fixedData.archive.archived", "مؤرشَف")
                : t("adminResidual.fixedData.archive.notArchived", "غير مؤرشَف")
            }
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<MdArchive />}
            disabled={submitting}
          >
            {t("adminResidual.fixedData.archive.submit", "تطبيق")}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

export default FixedDataView;
