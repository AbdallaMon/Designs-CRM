// reviews controller — thin. Calls the usecase, responds via helpers. NEVER returns or
// logs OAuth tokens / the client secret (the callback returns only a connected flag).
import { ok } from "../../shared/http/response.js";
import { reviewsMessagesCodes, messagesNames } from "@dms/shared";
import { reviewsUsecase } from "./reviews.usecase.js";

const C = reviewsMessagesCodes;
const TK = messagesNames.reviewsMessages;

export class ReviewsController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  oauthCallback = async (req, res) => {
    const data = await this.usecase.handleOAuthCallback({ code: req.query.code });
    return ok(res, data, C.REVIEW_OAUTH_CONNECTED, TK);
  };

  getLocations = async (req, res) => {
    const data = await this.usecase.getLocations({ code: req.query.code });
    return ok(res, data, C.REVIEW_LOCATIONS_FETCHED, TK);
  };

  getReviews = async (req, res) => {
    const data = await this.usecase.getReviews({
      accountId: req.query.accountId,
      locationId: req.query.locationId,
    });
    return ok(res, data, C.REVIEWS_FETCHED, TK);
  };
}

export const reviewsController = new ReviewsController(reviewsUsecase);
