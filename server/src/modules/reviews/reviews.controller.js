// reviews controller — thin. Calls the usecase, responds via helpers. NEVER returns or
// logs OAuth tokens / the client secret (the callback returns only a connected flag).
import { ok } from "../../shared/http/response.js";
import { reviewsMessagesCodes, messagesNames } from "@dms/shared";
import { reviewsUsecase } from "./reviews.usecase.js";

const TK = messagesNames.reviewsMessages;

export class ReviewsController {
  async oauthCallback(req, res) {
    const data = await reviewsUsecase.handleOAuthCallback({ code: req.query.code });
    return ok(res, data, reviewsMessagesCodes.REVIEW_OAUTH_CONNECTED, TK);
  }

  async getLocations(req, res) {
    const data = await reviewsUsecase.getLocations({ code: req.query.code });
    return ok(res, data, reviewsMessagesCodes.REVIEW_LOCATIONS_FETCHED, TK);
  }

  async getReviews(req, res) {
    const data = await reviewsUsecase.getReviews({
      accountId: req.query.accountId,
      locationId: req.query.locationId,
    });
    return ok(res, data, reviewsMessagesCodes.REVIEWS_FETCHED, TK);
  }
}

export const reviewsController = new ReviewsController();
