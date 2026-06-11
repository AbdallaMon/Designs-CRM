// Reviews feature barrel — redesigned READ-ONLY screen (UX plan §3.7) on the Phase 0 primitives.
export { ReviewsScreen, default as ReviewsScreenDefault } from "./pages/ReviewsScreen.jsx";
// Back-compat alias (ReviewsPanel was the retired wiring smoke-screen).
export { ReviewsPanel } from "./pages/ReviewsPanel.jsx";
export { reviewsService } from "./reviews.service.js";
export { runReviewsMutation } from "./reviews.mutations.js";
export {
  resolveReviewsMessage,
  reviewsMessages,
  reviewsUi,
  STAR_RATING_VALUE,
} from "./config/reviewsMessages.js";
