"use client";

// Reviews foundation panel — a THIN wiring smoke-screen (NOT the redesigned reviews UI; that
// lands in the UX-redesign phase). It proves the v2 data layer is wired end-to-end: fetches
// Google Business locations via useRequest → reviewsService → apiFetch (/v2/reviews), and
// surfaces the OAuth-connect entry point, permission-gated on REVIEW.VIEW / REVIEW.CONNECT.
// Single Arabic/RTL.
//
// SCOPE: studio-wide integration, NO object scope — the REVIEW.* CODE is the gate. The
// connect surface is an OAuth flow whose redirect URI is a stale, non-functional dev
// placeholder in the frozen service (see config/constant.js); we expose the connect affordance
// gated on REVIEW.CONNECT but do not hardcode any Google URL — the BE owns the flow.

import { Box, Container, Typography, CircularProgress, Alert, Button } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { LOCATIONS_URL } from "../config/constant.js";

const P = PERMISSIONS.REVIEW;

export function ReviewsPanel() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);
  const canConnect = hasPermission(P.CONNECT);

  const { data, isLoading, error } = useRequest({
    url: LOCATIONS_URL,
    method: "get",
    autoFetch: canView,
  });

  if (!canView && !canConnect) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">لا تملك صلاحية الوصول إلى تقييمات جوجل</Alert>
      </Container>
    );
  }

  const locations = Array.isArray(data) ? data : data?.items ?? data?.locations ?? [];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        تقييمات جوجل للنشاط التجاري
      </Typography>

      {canConnect && (
        <Box sx={{ mb: 3, p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            ربط حساب جوجل للنشاط التجاري لعرض المواقع والتقييمات.
          </Typography>
          {/* Connect is an OAuth full-page flow owned by the BE; the redirect URI is a
              frozen placeholder (non-functional today). Disabled until the flow is wired. */}
          <Button variant="outlined" disabled>
            ربط حساب جوجل
          </Button>
        </Box>
      )}

      {canView && isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {canView && !isLoading && error && (
        <Alert severity="error">تعذر جلب المواقع (قد لا يكون الحساب مربوطاً بعد).</Alert>
      )}

      {canView && !isLoading && !error && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            المواقع ({locations.length})
          </Typography>
          {locations.length === 0 ? (
            <Typography color="text.secondary">لا توجد مواقع.</Typography>
          ) : (
            locations.map((loc, i) => (
              <Box
                key={loc.id ?? loc.name ?? i}
                sx={{ p: 1.5, mb: 1, border: 1, borderColor: "divider", borderRadius: 1 }}
              >
                <Typography>{loc.title ?? loc.name ?? loc.locationName ?? `#${loc.id}`}</Typography>
              </Box>
            ))
          )}
        </Box>
      )}
    </Container>
  );
}

export default ReviewsPanel;
