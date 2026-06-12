// Reviews feature barrel — real Google Business reviews screen (locations → reviews) on the
// v2 data layer, permission-gated on REVIEW.VIEW / REVIEW.CONNECT.
export { ReviewsPanel, default as ReviewsPanelDefault } from "./pages/ReviewsPanel.jsx";
export { reviewsService } from "./reviews.service.js";
export { runReviewsMutation } from "./reviews.mutations.js";
export { resolveReviewsMessage, reviewsMessages } from "./config/reviewsMessages.js";
export { useReviewsLocations } from "./hooks/useReviewsLocations.js";
export { useLocationReviews } from "./hooks/useLocationReviews.js";
export {
  reviewsLabels,
  starRatingToNumber,
  extractLocationId,
} from "./config/reviewsLabels.js";
