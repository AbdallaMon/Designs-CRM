"use client";

// Sales-stages foundation panel — a THIN, LEAD-SCOPED wiring smoke-screen (NOT the redesigned
// pipeline UI; that lands in the UX-redesign phase). It proves the v2 data layer is wired
// end-to-end: takes a `leadId`, fetches that lead's sales stages via useRequest →
// salesStagesService → apiFetch (/v2/sales-stages), and renders the primary data,
// permission-gated on SALES_STAGE.VIEW. Single Arabic/RTL.
//
// LEAD-SCOPED: sales stages are scoped to a parent ClientLead; the BE enforces the lead
// object-scope per record (the dto emits NO capabilities.*), so we gate on the SALES_STAGE.*
// CODES only — the server is the source of truth.

import { Box, Container, Typography, CircularProgress, Alert } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { salesStagesUrl } from "../config/constant.js";

const P = PERMISSIONS.SALES_STAGE;

export function SalesStagesPanel({ leadId }) {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);

  const hasLead = Boolean(leadId);
  const { data, isLoading, error } = useRequest({
    url: hasLead ? salesStagesUrl(leadId) : "",
    method: "get",
    autoFetch: canView && hasLead,
  });

  if (!canView) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">لا تملك صلاحية عرض مراحل البيع</Alert>
      </Container>
    );
  }

  const stages = Array.isArray(data) ? data : data?.items ?? data?.stages ?? [];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        مراحل البيع
      </Typography>

      {!hasLead && (
        <Alert severity="info">حدد عميلاً (leadId) لعرض مراحل البيع الخاصة به.</Alert>
      )}

      {hasLead && isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {hasLead && !isLoading && error && (
        <Alert severity="error">تعذر جلب مراحل البيع.</Alert>
      )}

      {hasLead && !isLoading && !error && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            المراحل ({stages.length})
          </Typography>
          {stages.length === 0 ? (
            <Typography color="text.secondary">لم تبدأ أي مرحلة بعد.</Typography>
          ) : (
            stages.map((s, i) => (
              <Box
                key={s.id ?? s.type ?? s.stageType ?? i}
                sx={{ p: 1.5, mb: 1, border: 1, borderColor: "divider", borderRadius: 1 }}
              >
                <Typography>{s.type ?? s.stageType ?? s.key ?? `#${s.id}`}</Typography>
              </Box>
            ))
          )}
        </Box>
      )}
    </Container>
  );
}

export default SalesStagesPanel;
