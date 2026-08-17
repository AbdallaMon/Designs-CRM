import { beforeEach, describe, expect, it, vi } from "vitest";

const redis = vi.hoisted(() => {
  const values = new Map();
  return {
    values,
    set: vi.fn(async (key, value) => {
      values.set(key, value);
    }),
    eval: vi.fn(async (_script, { keys, arguments: args }) => {
      const storedUserId = values.get(keys[0]);
      if (storedUserId === undefined) return 0;
      if (storedUserId !== args[0]) return -1;
      values.delete(keys[0]);
      return 1;
    }),
  };
});

vi.mock("../../../../infra/redis/redis.client.js", () => ({
  default: redis,
}));

import {
  consumeGoogleOAuthState,
  GOOGLE_OAUTH_STATE_TTL_SECONDS,
  issueGoogleOAuthState,
} from "../google-oauth-state.cache.js";

describe("Google OAuth state cache", () => {
  beforeEach(() => {
    redis.values.clear();
    vi.clearAllMocks();
  });

  it("issues an opaque expiring state instead of exposing the user id", async () => {
    const state = await issueGoogleOAuthState({ userId: 42 });

    expect(state).toMatch(/^[A-Za-z0-9_-]{32,128}$/);
    expect(state).not.toBe("42");
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^google:oauth:state:[a-f0-9]{64}$/),
      "42",
      { EX: GOOGLE_OAUTH_STATE_TTL_SECONDS },
    );
  });

  it("rejects forged and expired states", async () => {
    expect(
      await consumeGoogleOAuthState({
        state: "forged_state_that_has_enough_characters_123456",
        userId: 42,
      }),
    ).toBe(false);

    const state = await issueGoogleOAuthState({ userId: 42 });
    redis.values.clear();
    expect(await consumeGoogleOAuthState({ state, userId: 42 })).toBe(false);
  });

  it("consumes a valid state exactly once", async () => {
    const state = await issueGoogleOAuthState({ userId: 42 });

    expect(await consumeGoogleOAuthState({ state, userId: 42 })).toBe(true);
    expect(await consumeGoogleOAuthState({ state, userId: 42 })).toBe(false);
  });

  it("rejects a different user without consuming the rightful user's state", async () => {
    const state = await issueGoogleOAuthState({ userId: 42 });

    expect(await consumeGoogleOAuthState({ state, userId: 7 })).toBe(false);
    expect(await consumeGoogleOAuthState({ state, userId: 42 })).toBe(true);
  });
});
