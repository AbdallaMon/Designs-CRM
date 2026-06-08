"use client";

// Reviews — the redesigned READ-ONLY screen (UX plan §3.7). Replaces the ReviewsPanel wiring
// smoke-screen. Studio-wide Google Business reviews integration: a location picker
// (reviewsService.getLocations) drives a read-only list of review cards
// (reviewsService.getReviews). Built ENTIRELY on the Phase 0 shared primitives — no parallel
// styles. Single-language Arabic / RTL.
//
// FROZEN reality (do NOT redesign the OAuth flow): the Google connect is non-functional (stale
// dev redirect URI + empty creds in the frozen services/reviews.js). So:
//   • the "ربط مع Google" affordance is rendered DISABLED + informational (GoogleConnectNotice),
//     gated on review.connect.
//   • when the BE returns no account/locations (the non-functional path resolves to no data),
//     we show a GRACEFUL "الربط مع Google غير مُفعّل" empty state — never a scary 500.
//
// Gating (codes only — studio-wide surface, no object scope / no capabilities.*):
//   • review.view    → see locations + reviews
//   • review.connect → see the (disabled) connect notice
// All visible prose comes from reviewsUi (no inline Arabic in logic).

import { useMemo, useState } from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import { MdRateReview } from "react-icons/md";

import { usePermission } from "@/app/v2/hooks/usePermission";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import {
  PageHeader,
  SectionCard,
  LoadingState,
  EmptyState,
  ErrorState,
  PartialPermissionState,
} from "@/app/v2/shared/components";

import { LOCATIONS_URL, REVIEWS_URL } from "../config/constant.js";
import { reviewsUi, reviewsMessages } from "../config/reviewsMessages.js";
import GoogleConnectNotice from "../components/GoogleConnectNotice.jsx";
import LocationPicker from "../components/LocationPicker.jsx";
import ReviewCard from "../components/ReviewCard.jsx";

const P = PERMISSIONS.REVIEW;

// Pull the bare `locations/<id>` segment that the reviews read expects (`?locationId=`) out of
// a full Google resource name ("accounts/1/locations/2"). The getReviews helper joins
// accountId + locationId, so we pass the trailing "locations/<id>" segment as locationId.
function locationIdFromName(name) {
  if (!name) return "";
  const idx = name.indexOf("/locations/");
  return idx >= 0 ? name.slice(idx + 1) : name; // "locations/2"
}

export function ReviewsScreen() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);
  const canConnect = hasPermission(P.CONNECT);

  const [selected, setSelected] = useState(""); // selected location resource `name`

  // ── locations (review.view) ────────────────────────────────────────────────────
  const locationsReq = useRequest({ url: LOCATIONS_URL, method: "get", autoFetch: canView });
  const locations = useMemo(() => {
    const d = locationsReq.data;
    if (Array.isArray(d)) return d;
    return d?.locations ?? [];
  }, [locationsReq.data]);
  const accountId = locationsReq.data?.accountId ?? "";

  // ── reviews for the selected location (review.view) ──────────────────────────────
  const reviewsReq = useRequest({ url: REVIEWS_URL, method: "get", autoFetch: false });
  const reviews = Array.isArray(reviewsReq.data) ? reviewsReq.data : reviewsReq.data?.reviews ?? [];

  function handleSelect(name) {
    setSelected(name);
    if (name) {
      reviewsReq.fetchData({ accountId, locationId: locationIdFromName(name) });
    }
  }

  // ── no access at all ─────────────────────────────────────────────────────────────
  if (!canView && !canConnect) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PartialPermissionState
          denied
          title={reviewsUi.noAccessTitle}
          message={reviewsUi.noAccessMessage}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader title={reviewsUi.pageTitle} subtitle={reviewsUi.pageSubtitle} />

      {/* Connect affordance — gated review.connect, rendered disabled + informational. */}
      {canConnect && <GoogleConnectNotice />}

      {canView && (
        <Stack spacing={3}>
          {/* Locations */}
          <SectionCard title={reviewsUi.locationsTitle}>
            {locationsReq.isLoading ? (
              <LoadingState variant="form" fields={1} />
            ) : locationsReq.error ? (
              <ErrorState
                title={reviewsUi.loadErrorTitle}
                error={reviewsUi.notConfiguredError}
                resolver={reviewsMessages}
                onRetry={locationsReq.refetch}
              />
            ) : locations.length === 0 ? (
              <EmptyState
                icon={<MdRateReview />}
                title={reviewsUi.locationsEmptyTitle}
                description={reviewsUi.locationsEmptyDesc}
              />
            ) : (
              <LocationPicker locations={locations} value={selected} onChange={handleSelect} />
            )}
          </SectionCard>

          {/* Reviews for the selected location */}
          {locations.length > 0 && (
            <SectionCard title={reviewsUi.reviewsTitle}>
              {!selected ? (
                <Typography variant="body2" color="text.secondary">
                  {reviewsUi.selectLocationPrompt}
                </Typography>
              ) : reviewsReq.isLoading ? (
                <LoadingState variant="cards" count={3} columns={1} height={120} />
              ) : reviewsReq.error ? (
                <ErrorState
                  title={reviewsUi.loadErrorTitle}
                  error={reviewsUi.notConfiguredError}
                  resolver={reviewsMessages}
                  onRetry={() =>
                    reviewsReq.fetchData({ accountId, locationId: locationIdFromName(selected) })
                  }
                />
              ) : reviews.length === 0 ? (
                <EmptyState
                  icon={<MdRateReview />}
                  title={reviewsUi.reviewsEmptyTitle}
                  description={reviewsUi.reviewsEmptyDesc}
                />
              ) : (
                <Stack spacing={2}>
                  {reviews.map((rev, i) => (
                    <ReviewCard key={rev?.reviewId ?? rev?.name ?? i} review={rev} />
                  ))}
                </Stack>
              )}
            </SectionCard>
          )}
        </Stack>
      )}

      {/* review.connect-only user (no review.view): the connect notice above already explains
          the state; nothing more to show. */}
      {!canView && canConnect && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {reviewsUi.connectExplanation}
          </Typography>
        </Box>
      )}
    </Container>
  );
}

export default ReviewsScreen;
