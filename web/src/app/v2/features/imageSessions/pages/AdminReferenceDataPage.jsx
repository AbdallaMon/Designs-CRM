"use client";

// SURFACE 1 — ADMIN reference-data CRUD. Phase-0 primitives: PageHeader + UrlTabs (tab in the
// URL ?tab=) over the reference types (images[paginated] / page-info / colors / spaces /
// materials / styles), each a DataTablePage with a create/edit modal. Materials / styles /
// page-info additionally own a ★ pros-&-cons reorder panel (up/down, optimistic + revert).
// GLOBAL studio config — gated on the IMAGE_SESSION.ADMIN_* CODES (admins see all; NO per-record
// object scope). Single-language Arabic / RTL.
//
// §5c #1: design-images is the ONLY paginated list and its array is nested under res.data.data
// ({ data, total, totalPages }); the scalar lists return the array at res.data.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
} from "@mui/material";
import { MdAdd, MdEdit, MdListAlt } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import {
  PageHeader, SectionCard, DataTablePage, UrlTabs, PartialPermissionState,
} from "@/app/v2/shared/components";
import imageSessionsService from "../imageSessions.service.js";
import { ADMIN_REFERENCE_TYPES } from "../config/imageSessionsConstants.js";
import { imageSessionsMessages } from "../config/imageSessionsMessages.js";
import { columnsFor } from "../config/adminReferenceColumns.js";
import { ReferenceFormDialog } from "../components/ReferenceFormDialog.jsx";
import { ProsConsReorder } from "../components/ProsConsReorder.jsx";
import { UploadImageDialog } from "../components/UploadImageDialog.jsx";

const P = PERMISSIONS.IMAGE_SESSION;

// type key → its list service call. Images carry pagination params.
function listFor(key, { page, pageSize } = {}) {
  switch (key) {
    case "images":
      return imageSessionsService.listImages({
        notArchived: true,
        page,
        limit: pageSize,
        skip: page && pageSize ? (page - 1) * pageSize : undefined,
      });
    case "pageInfo":
      return imageSessionsService.listPageInfo({ notArchived: true });
    case "colors":
      return imageSessionsService.listColors({ notArchived: true });
    case "spaces":
      return imageSessionsService.listSpaces({ notArchived: true });
    case "materials":
      return imageSessionsService.listMaterials({ notArchived: true });
    case "styles":
      return imageSessionsService.listStyles({ notArchived: true });
    default:
      return Promise.resolve({ data: [] });
  }
}

// Which reference types own a pros-&-cons list (the legacy admin attached them to these).
const PROS_CONS_TYPES = { materials: "MATERIAL", styles: "STYLE", pageInfo: "PAGE_INFO" };

function ReferenceTab({ type, canManage }) {
  const paginated = Boolean(type.paginated);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [prosConsFor, setProsConsFor] = useState(null); // row owning the pros/cons dialog
  const [uploadMode, setUploadMode] = useState(null); // "single" | "bulk" | null (images tab)

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listFor(type.key, { page, pageSize });
      if (type.key === "images") {
        const payload = res?.data;
        setRows(Array.isArray(payload?.data) ? payload.data : []);
        setTotal(Number(payload?.total) || 0);
      } else {
        const arr = Array.isArray(res?.data) ? res.data : [];
        setRows(arr);
        setTotal(arr.length);
      }
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [type.key, page, pageSize]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const columns = useMemo(() => columnsFor(type.key, type.model), [type.key, type.model]);
  const prosConsType = PROS_CONS_TYPES[type.key];
  const isImages = type.key === "images";
  const editable = !isImages; // images use the bespoke uploader (UploadImageDialog), not the form

  function renderRowActions(row) {
    if (!canManage) return null;
    return (
      <>
        {editable && (
          <Tooltip title="تعديل">
            <IconButton size="small" onClick={() => { setEditing(row); setFormOpen(true); }} aria-label="تعديل">
              <MdEdit />
            </IconButton>
          </Tooltip>
        )}
        {prosConsType && (
          <Tooltip title="المزايا والعيوب">
            <IconButton size="small" onClick={() => setProsConsFor(row)} aria-label="المزايا والعيوب">
              <MdListAlt />
            </IconButton>
          </Tooltip>
        )}
      </>
    );
  }

  return (
    <Box>
      <SectionCard
        title={type.label}
        actions={
          canManage && isImages ? (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="contained" startIcon={<MdAdd />} onClick={() => setUploadMode("single")}>
                إضافة صورة
              </Button>
              <Button variant="outlined" startIcon={<MdAdd />} onClick={() => setUploadMode("bulk")}>
                إضافة صور (متعددة)
              </Button>
            </Box>
          ) : canManage && editable ? (
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              onClick={() => { setEditing(null); setFormOpen(true); }}
            >
              إضافة
            </Button>
          ) : null
        }
        noPadding
      >
        <Box sx={{ p: 2 }}>
          <DataTablePage
            columns={columns}
            rows={rows}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={paginated ? setPage : undefined}
            onPageSizeChange={paginated ? setPageSize : undefined}
            loading={loading}
            error={error}
            onRetry={fetchItems}
            errorResolver={imageSessionsMessages}
            renderRowActions={canManage ? renderRowActions : undefined}
            empty={{ title: "لا توجد بيانات لعرضها" }}
            rowsPerPageOptions={paginated ? [10, 25, 50] : [rows.length || 10]}
          />
        </Box>
      </SectionCard>

      {canManage && editable && (
        <ReferenceFormDialog
          open={formOpen}
          type={type}
          initial={editing}
          onClose={() => setFormOpen(false)}
          onSaved={fetchItems}
        />
      )}

      {canManage && isImages && (
        <UploadImageDialog
          open={Boolean(uploadMode)}
          mode={uploadMode || "single"}
          onClose={() => setUploadMode(null)}
          onSaved={fetchItems}
        />
      )}

      {canManage && prosConsType && (
        <Dialog open={Boolean(prosConsFor)} onClose={() => setProsConsFor(null)} fullWidth maxWidth="sm" dir="rtl">
          <DialogTitle>المزايا والعيوب — {type.label}</DialogTitle>
          <DialogContent dividers>
            {prosConsFor && <ProsConsReorder type={prosConsType} id={prosConsFor.id} />}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProsConsFor(null)}>إغلاق</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

export function AdminReferenceDataPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.ADMIN_VIEW);
  const canManage = hasPermission(P.ADMIN_MANAGE);

  const tabs = useMemo(
    () => ADMIN_REFERENCE_TYPES.map((t) => ({ key: t.key, label: t.label })),
    [],
  );

  if (!canView) {
    return (
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }} dir="rtl">
        <PartialPermissionState denied message="لا تملك صلاحية عرض بيانات جلسات الصور." />
      </Box>
    );
  }

  return (
    <Box dir="rtl">
      <PageHeader
        title="معرض جلسات الصور"
        subtitle="إدارة البيانات المرجعية: الصور، الألوان، المساحات، الخامات، الطرز ومعلومات الصفحة."
        breadcrumbs={[{ label: "الإنتاج" }, { label: "جلسات الصور" }]}
      />
      <UrlTabs tabs={tabs}>
        {(activeKey) => {
          const type = ADMIN_REFERENCE_TYPES.find((t) => t.key === activeKey);
          return type ? <ReferenceTab key={type.key} type={type} canManage={canManage} /> : null;
        }}
      </UrlTabs>
    </Box>
  );
}

export default AdminReferenceDataPage;
