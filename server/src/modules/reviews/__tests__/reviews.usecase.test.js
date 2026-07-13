import { describe, it, expect, vi, beforeEach } from "vitest";

// DI removed: the usecase now invokes the frozen Google Business client via lazy imports
// of this module. Mock the module so the OAuth/review flow can be asserted without network.
vi.mock("../../../infra/integrations/google-business/google-business.client.js", () => ({
  handleOAuthCallback: vi.fn(),
  getLocations: vi.fn(),
  getReviews: vi.fn(),
  createAuthUrl: vi.fn(),
}));

import { reviewsMessagesCodes } from "@dms/shared";
import { reviewsUsecase } from "../reviews.usecase.js";
import {
  handleOAuthCallback,
  getLocations,
  getReviews,
} from "../../../infra/integrations/google-business/google-business.client.js";


beforeEach(() => vi.clearAllMocks());

describe("reviews usecase — Google OAuth integration (no token leak)", () => {
  it("OAuth callback completes the exchange but returns ONLY a connected flag (no tokens)", async () => {
    // The frozen service returns the raw tokens; the usecase must DISCARD them.
    handleOAuthCallback.mockResolvedValue({
      access_token: "ya29.SECRET",
      refresh_token: "1//REFRESH_SECRET",
      scope: "https://www.googleapis.com/auth/business.manage",
    });
    const out = await reviewsUsecase.handleOAuthCallback({ code: "auth-code" });

    expect(handleOAuthCallback).toHaveBeenCalledWith("auth-code");
    expect(out).toEqual({ connected: true });
    // Hard assertion: no token field of any kind leaks through the usecase output.
    const serialized = JSON.stringify(out);
    expect(serialized).not.toContain("access_token");
    expect(serialized).not.toContain("refresh_token");
    expect(serialized).not.toContain("SECRET");
  });

  it("OAuth callback rejects a missing code (400) without calling the service", async () => {
    await expect(reviewsUsecase.handleOAuthCallback({ code: undefined })).rejects.toMatchObject({
      statusCode: 400,
      message: reviewsMessagesCodes.REVIEW_OAUTH_MISSING_CODE,
    });
    expect(handleOAuthCallback).not.toHaveBeenCalled();
  });

  it("getLocations passes through the (account/locations) shape — no tokens in it", async () => {
    getLocations.mockResolvedValue({
      accountId: "accounts/123",
      locations: [{ name: "accounts/123/locations/9" }],
    });
    const out = await reviewsUsecase.getLocations({ code: "x" });
    expect(out.accountId).toBe("accounts/123");
    expect(JSON.stringify(out)).not.toMatch(/token|secret/i);
  });

  it("getReviews forwards accountId + locationId to the frozen service", async () => {
    getReviews.mockResolvedValue([{ reviewId: "r1" }]);
    const out = await reviewsUsecase.getReviews({ accountId: "accounts/123", locationId: "locations/9" });
    expect(getReviews).toHaveBeenCalledWith("accounts/123", "locations/9");
    expect(out).toEqual([{ reviewId: "r1" }]);
  });
});
