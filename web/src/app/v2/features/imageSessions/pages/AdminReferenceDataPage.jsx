"use client";

// SURFACE 1 — ADMIN reference-data CRUD page. Ported from the legacy AdminGallery dashboard
// (UiComponents/DataViewer/image-session/admin/AdminGallery.jsx), Arabic-only, wired to the v2
// image-sessions service. Tabbed by reference type (images / page-info / colors / spaces /
// materials / styles), tab state in the URL (?tab=). GLOBAL studio config — gated on the
// IMAGE_SESSION.ADMIN_* CODES (admins see all; no per-record object scope).
//
// §5c #1: design-images is the only PAGINATED list and its array is nested under res.data.data
// (read accordingly below); the scalar lists return the array at res.data.
//
// NOTE: the per-type CREATE/EDIT forms (the legacy nested title/description "creates/edits"
// builders, the color-palette editor, the design-image uploader, the pros-&-cons drag-reorder)
// are bespoke and are ported as dedicated components onto THIS service/config layer. This page
// is the gated, URL-tabbed shell + the read/list surface they mount into.

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Alert, Box, Grid, Paper, Tab, Tabs, Typography } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import imageSessionsService from "../imageSessions.service.js";
import { ADMIN_REFERENCE_TYPES, readPickListLabel } from "../config/imageSessionsConstants.js";

const P = PERMISSIONS.IMAGE_SESSION;

// Map a reference-type key → its service list call (all return the standard envelope).
function listFor(key) {
  switch (key) {
    case "images":
      return imageSessionsService.listImages({ notArchived: true });
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

// Extract the array from the envelope. §5c #1: images are nested ({ data, total, totalPages }).
function extractItems(key, res) {
  if (key === "images") {
    const payload = res?.data;
    return Array.isArray(payload?.data) ? payload.data : [];
  }
  return Array.isArray(res?.data) ? res.data : [];
}

function ReferenceList({ type }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listFor(type.key);
      setItems(extractItems(type.key, res));
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [type.key]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading) {
    return <Typography color="text.secondary" sx={{ py: 3 }}>جاري التحميل...</Typography>;
  }
  if (error) {
    return <Alert severity="error" sx={{ my: 2 }}>تعذر جلب البيانات</Alert>;
  }
  if (!items.length) {
    return <Alert severity="info" sx={{ my: 2 }}>لا توجد بيانات لعرضها</Alert>;
  }

  return (
    <Grid container spacing={1.5}>
      {items.map((item) => (
        <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
            {type.key === "images" && item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={`#${item.id}`} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 4 }} />
            ) : (
              <Typography variant="subtitle2">
                {readPickListLabel(type.model, item) || `#${item.id}`}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">#{item.id}</Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

export function AdminReferenceDataPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.ADMIN_VIEW);

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const tabKeys = useMemo(() => ADMIN_REFERENCE_TYPES.map((t) => t.key), []);
  const activeKey = tabKeys.includes(sp.get("tab")) ? sp.get("tab") : tabKeys[0];
  const activeType = ADMIN_REFERENCE_TYPES.find((t) => t.key === activeKey);

  const onTab = (_e, key) => {
    const params = new URLSearchParams(sp.toString());
    params.set("tab", key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (!canView) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh" }} dir="rtl">
        <Typography color="text.secondary">لا تملك صلاحية عرض بيانات الجلسات</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }} dir="rtl">
      <Typography variant="h5" sx={{ mb: 2 }}>إدارة معرض جلسات الصور</Typography>
      <Tabs value={activeKey} onChange={onTab} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
        {ADMIN_REFERENCE_TYPES.map((t) => (
          <Tab key={t.key} value={t.key} label={t.label} />
        ))}
      </Tabs>
      {activeType && <ReferenceList type={activeType} />}
    </Box>
  );
}

export default AdminReferenceDataPage;
