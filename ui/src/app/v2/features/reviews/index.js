// Reviews feature barrel (foundation phase — data layer + a thin wiring panel).
export { ReviewsPanel, default as ReviewsPanelDefault } from "./pages/ReviewsPanel.jsx";
export { reviewsService } from "./reviews.service.js";
export { runReviewsMutation } from "./reviews.mutations.js";
export { resolveReviewsMessage, reviewsMessages } from "./config/reviewsMessages.js";
