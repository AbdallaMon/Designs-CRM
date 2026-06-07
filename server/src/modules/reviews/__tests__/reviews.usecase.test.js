import { describe, it, expect, vi } from "vitest";

import { reviewsMessagesCodes } from "@dms/shared";
import { ReviewsUsecase } from "../reviews.usecase.js";

const C = reviewsMessagesCodes;

describe("reviews usecase — Google OAuth integration (no token leak)", () => {
  it("OAuth callback completes the exchange but returns ONLY a connected flag (no tokens)", async () => {
    // The frozen service returns the raw tokens; the usecase must DISCARD them.
    const handleOAuthCallback = vi.fn().mockResolvedValue({
      access_token: "ya29.SECRET",
      refresh_token: "1//REFRESH_SECRET",
      scope: "https://www.googleapis.com/auth/business.manage",
    });
    const uc = new ReviewsUsecase({ handleOAuthCallback });
    const out = await uc.handleOAuthCallback({ code: "auth-code" });

    expect(handleOAuthCallback).toHaveBeenCalledWith("auth-code");
    expect(out).toEqual({ connected: true });
    // Hard assertion: no token field of any kind leaks through the usecase output.
    const serialized = JSON.stringify(out);
    expect(serialized).not.toContain("access_token");
    expect(serialized).not.toContain("refresh_token");
    expect(serialized).not.toContain("SECRET");
  });

  it("OAuth callback rejects a missing code (400) without calling the service", async () => {
    const handleOAuthCallback = vi.fn();
    const uc = new ReviewsUsecase({ handleOAuthCallback });
    await expect(uc.handleOAuthCallback({ code: undefined })).rejects.toMatchObject({
      statusCode: 400,
      message: C.REVIEW_OAUTH_MISSING_CODE,
    });
    expect(handleOAuthCallback).not.toHaveBeenCalled();
  });

  it("getLocations passes through the (account/locations) shape — no tokens in it", async () => {
    const getLocations = vi.fn().mockResolvedValue({
      accountId: "accounts/123",
      locations: [{ name: "accounts/123/locations/9" }],
    });
    const uc = new ReviewsUsecase({ getLocations });
    const out = await uc.getLocations({ code: "x" });
    expect(out.accountId).toBe("accounts/123");
    expect(JSON.stringify(out)).not.toMatch(/token|secret/i);
  });

  it("getReviews forwards accountId + locationId to the frozen service", async () => {
    const getReviews = vi.fn().mockResolvedValue([{ reviewId: "r1" }]);
    const uc = new ReviewsUsecase({ getReviews });
    const out = await uc.getReviews({ accountId: "accounts/123", locationId: "locations/9" });
    expect(getReviews).toHaveBeenCalledWith("accounts/123", "locations/9");
    expect(out).toEqual([{ reviewId: "r1" }]);
  });
});
