"use client";

// Sales-stages page — the standalone, LEAD-SCOPED sales-pipeline screen. Sales stages are scoped
// to a parent ClientLead, and the route `/v2/sales-stages` carries no lead context, so the flow
// is: pick/identify a lead → fetch that lead's reached stages → render the ordered pipeline with
// the current stage highlighted (+ timestamps) → let an authorized user advance / roll back the
// stage via the set-stage workflow action.
//
// The selected lead lives in the URL (`?leadId=`) so the screen is shareable / embeddable; the
// server page seeds it (Next 16 searchParams is async) and this client panel keeps it in sync.
//
// PERMISSIONS (the dto emits NO capabilities.* — gate on the CODES; the server enforces the lead
// object-scope on every read/write):
//   - read    → SALES_STAGE.VIEW   (no VIEW ⇒ the whole screen is denied)
//   - advance / roll back → SALES_STAGE.MANAGE  (gated inside the pipeline component)
//
// Data flows through the v2 layer only: useRequest → salesStagesService → apiFetch (/v2). The
// read returns RAW SalesStage rows (only the reached stages); the pipeline config derives the
// ordered view + current/next. Single Arabic, RTL.

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Alert, Box, Container, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { MdArrowForward, MdRefresh } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { salesStagesUrl } from "../config/constant.js";
import { LeadPicker } from "../components/LeadPicker.jsx";
import { SalesStagesPipeline } from "../components/SalesStagesPipeline.jsx";

const P = PERMISSIONS.SALES_STAGE;

export function SalesStagesPanel({ leadId: initialLeadId }) {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL is the source of truth for the selected lead; seed from the server-passed prop.
  const urlLeadId = searchParams.get("leadId") ?? "";
  const [leadId, setLeadId] = useState(urlLeadId || (initialLeadId ? String(initialLeadId) : ""));

  // Keep local state in sync if the URL changes (back/forward, external link).
  useEffect(() => {
    if (urlLeadId && urlLeadId !== leadId) setLeadId(urlLeadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlLeadId]);

  const setLeadInUrl = useCallback(
    (next) => {
      setLeadId(next || "");
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set("leadId", next);
      else params.delete("leadId");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const hasLead = Boolean(leadId);
  const { data, isLoading, error, refetch } = useRequest({
    url: hasLead ? salesStagesUrl(leadId) : "",
    method: "get",
    autoFetch: canView && hasLead,
  });

  if (!canView) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">لا تملك صلاحية عرض مراحل البيع.</Alert>
      </Container>
    );
  }

  // The read returns raw SalesStage rows under the envelope `data` (no dto wrapping).
  const rows = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">مراحل البيع</Typography>
        {hasLead && (
          <Stack direction="row" spacing={1}>
            <Tooltip title="تحديث">
              <span>
                <IconButton onClick={() => refetch()} disabled={isLoading}>
                  <MdRefresh />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="اختيار عميل آخر">
              <IconButton onClick={() => setLeadInUrl("")}>
                <MdArrowForward />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Stack>

      {!hasLead && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            مراحل البيع مرتبطة بعميل محدد. اختر عميلاً أولاً لعرض مساره وإدارته.
          </Alert>
          <LeadPicker selectedLeadId={leadId} onPick={setLeadInUrl} />
        </Box>
      )}

      {hasLead && (
        <SalesStagesPipeline
          clientLeadId={leadId}
          rows={rows}
          isLoading={isLoading}
          error={error}
          onChanged={refetch}
        />
      )}
    </Container>
  );
}

export default SalesStagesPanel;
