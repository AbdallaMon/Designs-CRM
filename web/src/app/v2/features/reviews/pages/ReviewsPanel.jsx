"use client";

// Reviews screen — the real Google Business Profile reviews UI. Lists the connected business
// locations (left), and on selecting one shows its reviews (right): star rating, reviewer,
// text, date, and the studio's reply when present. Single Arabic / RTL.
//
// Data flows through the reviews SERVICE only (useReviewsLocations / useLocationReviews →
// reviewsService → apiFetch /v2/reviews) — never apiFetch directly. Studio-wide integration,
// NO object scope: the REVIEW.* CODE is the gate (usePermission).
//
// OAuth connect: there is NO connect/authorize endpoint exposed by the backend — only the
// browser-redirect `/oauth2callback` (REVIEW.CONNECT), which Google hits with `?code=`, and a
// `createAuthUrl()` in the frozen service that no route surfaces. We therefore do NOT fabricate
// a connect button that calls an endpoint; instead we surface CONNECTION STATUS (derived from
// whether locations load) and, for REVIEW.CONNECT holders, an explanatory not-connected notice.
// The redirect URI in the frozen service is a stale placeholder, so the flow is non-functional
// today — the UI degrades gracefully to the not-connected state.

import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdRefresh, MdStar, MdStarBorder, MdReply } from "react-icons/md";
import { useState } from "react";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useReviewsLocations } from "../hooks/useReviewsLocations.js";
import { useLocationReviews } from "../hooks/useLocationReviews.js";
import {
  reviewsLabels as L,
  starRatingToNumber,
  extractLocationId,
  locationTitle,
  locationAddress,
  reviewerName,
  reviewerPhoto,
  reviewComment,
  reviewReply,
  formatReviewDate,
} from "../config/reviewsLabels.js";

const P = PERMISSIONS.REVIEW;

export function ReviewsPanel() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);
  const canConnect = hasPermission(P.CONNECT);

  const [selectedId, setSelectedId] = useState(null);

  const {
    accountId,
    locations,
    connected,
    isLoading: locsLoading,
    error: locsError,
    refetch: refetchLocations,
  } = useReviewsLocations({ autoFetch: canView });

  const {
    reviews,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useLocationReviews({ accountId, locationId: selectedId });

  // No access to either capability → hard stop.
  if (!canView && !canConnect) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">{L.noAccess}</Alert>
      </Container>
    );
  }

  const showNotConnected = canView && !locsLoading && connected === false;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ── header ───────────────────────────────────────────────────────────── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5">{L.pageTitle}</Typography>
          <Typography variant="body2" color="text.secondary">
            {L.pageSubtitle}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {connected !== null && (
            <Chip
              size="small"
              color={connected ? "success" : "default"}
              label={connected ? L.connectedChip : L.notConnectedChip}
            />
          )}
          {canView && (
            <Tooltip title={L.refresh}>
              <span>
                <IconButton onClick={refetchLocations} disabled={locsLoading}>
                  <MdRefresh />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      {/* ── not-connected notice (REVIEW.CONNECT context) ─────────────────────── */}
      {showNotConnected && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {L.notConnectedTitle}
          </Typography>
          {canConnect && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {L.notConnectedBody}
            </Typography>
          )}
        </Alert>
      )}

      {/* ── main two-pane layout ──────────────────────────────────────────────── */}
      {canView && (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
            alignItems: "start",
          }}
        >
          <LocationsPane
            locations={locations}
            isLoading={locsLoading}
            error={locsError}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <ReviewsPane
            hasSelection={Boolean(selectedId)}
            reviews={reviews}
            isLoading={reviewsLoading}
            error={reviewsError}
          />
        </Box>
      )}
    </Container>
  );
}

// ── left pane: connected locations ────────────────────────────────────────────
function LocationsPane({ locations, isLoading, error, selectedId, onSelect }) {
  return (
    <Paper variant="outlined">
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {L.locationsTitle} {!isLoading && `(${locations.length})`}
        </Typography>
      </Box>
      <Divider />

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {!isLoading && error && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{L.locationsError}</Alert>
        </Box>
      )}

      {!isLoading && !error && locations.length === 0 && (
        <Box sx={{ p: 2 }}>
          <Typography color="text.secondary">{L.locationsEmpty}</Typography>
        </Box>
      )}

      {!isLoading && !error && locations.length > 0 && (
        <List disablePadding>
          {locations.map((loc, i) => {
            const id = extractLocationId(loc);
            const title = locationTitle(loc, i);
            const address = locationAddress(loc);
            return (
              <ListItemButton
                key={id ?? loc?.name ?? i}
                selected={selectedId === id}
                disabled={!id}
                onClick={() => id && onSelect(id)}
              >
                <ListItemText
                  primary={title}
                  secondary={address || undefined}
                  primaryTypographyProps={{ noWrap: true }}
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </ListItemButton>
            );
          })}
        </List>
      )}
    </Paper>
  );
}

// ── right pane: reviews for the selected location ───────────────────────────────
function ReviewsPane({ hasSelection, reviews, isLoading, error }) {
  if (!hasSelection) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: 4, display: "flex", justifyContent: "center" }}
      >
        <Typography color="text.secondary">{L.selectLocationHint}</Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined">
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {L.reviewsTitle} {!isLoading && !error && `(${reviews.length})`}
        </Typography>
      </Box>
      <Divider />

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {!isLoading && error && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{L.reviewsError}</Alert>
        </Box>
      )}

      {!isLoading && !error && reviews.length === 0 && (
        <Box sx={{ p: 2 }}>
          <Typography color="text.secondary">{L.reviewsEmpty}</Typography>
        </Box>
      )}

      {!isLoading && !error && reviews.length > 0 && (
        <Stack divider={<Divider />}>
          {reviews.map((review, i) => (
            <ReviewRow key={review?.reviewId ?? i} review={review} />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

function ReviewRow({ review }) {
  const name = reviewerName(review);
  const photo = reviewerPhoto(review);
  const rating = starRatingToNumber(review?.starRating);
  const comment = reviewComment(review);
  const date = formatReviewDate(review?.createTime ?? review?.updateTime);
  const reply = reviewReply(review);

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Avatar src={photo || undefined} sx={{ width: 36, height: 36 }}>
          {name?.charAt(0) || "?"}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="subtitle2" noWrap>
              {name}
            </Typography>
            {date && (
              <Typography variant="caption" color="text.secondary">
                {date}
              </Typography>
            )}
          </Stack>

          <StarRating value={rating} />

          <Typography
            variant="body2"
            sx={{ mt: 0.5, whiteSpace: "pre-wrap", color: comment ? "text.primary" : "text.secondary" }}
          >
            {comment || L.noComment}
          </Typography>

          {reply && (
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                bgcolor: "action.hover",
                borderRadius: 1,
              }}
            >
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
                <MdReply />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {L.replyLabel}
                </Typography>
                {formatReviewDate(reply.updateTime) && (
                  <Typography variant="caption" color="text.secondary">
                    · {formatReviewDate(reply.updateTime)}
                  </Typography>
                )}
              </Stack>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {reply.comment}
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

function StarRating({ value }) {
  return (
    <Stack direction="row" spacing={0.25} aria-label={`التقييم ${value} من 5`}>
      {[1, 2, 3, 4, 5].map((n) =>
        n <= value ? (
          <MdStar key={n} color="#f5a623" aria-hidden />
        ) : (
          <MdStarBorder key={n} color="#c0c0c0" aria-hidden />
        ),
      )}
    </Stack>
  );
}

export default ReviewsPanel;
