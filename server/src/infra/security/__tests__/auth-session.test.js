import jwt from "jsonwebtoken";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

process.env.JWT_ACCESS_SECRET = "auth-session-access-secret";
process.env.JWT_REFRESH_SECRET = "auth-session-refresh-secret";
process.env.JWT_RESET_SECRET = "auth-session-reset-secret";
process.env.ACCESS_TOKEN_EXPIRES_IN = "15m";
process.env.REFRESH_TOKEN_EXPIRES_IN = "7d";
process.env.JWT_RESET_EXPIRES_IN = "1h";
process.env.ISLOCAL = "true";

const redisState = vi.hoisted(() => ({ values: new Map() }));

vi.mock("../../redis/redis.client.js", () => {
  const client = {
    async get(key) {
      return redisState.values.get(key) ?? null;
    },
    async set(key, value, options = {}) {
      if (options.NX && redisState.values.has(key)) return null;
      redisState.values.set(key, String(value));
      return "OK";
    },
    async del(key) {
      return redisState.values.delete(key) ? 1 : 0;
    },
    async incr(key) {
      const next = Number(redisState.values.get(key) ?? 0) + 1;
      redisState.values.set(key, String(next));
      return next;
    },
    async sendCommand(command) {
      if (command[0] !== "EVAL") throw new Error("Unexpected Redis command");
      const keyCount = Number(command[2]);
      if (keyCount === 1) {
        const key = command[3];
        const value = redisState.values.get(key) ?? null;
        if (value !== null) redisState.values.delete(key);
        return value;
      }

      if (keyCount === 3) {
        const usedKey = command[3];
        const revokedKey = command[4];
        const graceKey = command[5];
        if (redisState.values.has(revokedKey)) return -1;
        if (!redisState.values.has(usedKey)) {
          redisState.values.set(usedKey, "1");
          redisState.values.set(graceKey, "1");
          return 1;
        }
        if (redisState.values.has(graceKey)) return 2;
        redisState.values.set(revokedKey, "1");
        return 0;
      }

      const versionKey = command[3];
      const revokedKey = command[4];
      const activeKey = command[5];
      const graceKey = command[6];
      const expectedVersion = command[7];
      const currentVersion = redisState.values.get(versionKey) ?? "0";
      if (currentVersion !== expectedVersion) return -2;
      if (redisState.values.has(revokedKey)) return -1;
      if (redisState.values.delete(activeKey)) {
        redisState.values.set(graceKey, "1");
        return 1;
      }
      if (redisState.values.has(graceKey)) return 2;
      redisState.values.set(revokedKey, "1");
      return 0;
    },
  };
  return { default: client };
});

let AuthSessionService;
let JwtService;

beforeAll(async () => {
  ({ AuthSessionService } = await import("../auth-session.js"));
  ({ JwtService } = await import("../jwt.js"));
});

beforeEach(() => {
  redisState.values.clear();
});

describe("AuthSessionService", () => {
  it("keeps access/refresh cookie max-age aligned with JWT expiry", () => {
    const access = JwtService.verifyAccess(JwtService.signAccess({ id: 1 }));
    const refresh = JwtService.verifyRefresh(JwtService.signRefresh({ id: 1 }));
    expect(JwtService.cookies.access.maxAge).toBe((access.exp - access.iat) * 1000);
    expect(JwtService.cookies.refresh.maxAge).toBe(
      (refresh.exp - refresh.iat) * 1000,
    );
  });

  it("allows concurrent refresh rotation within the reuse grace window", async () => {
    const firstToken = await AuthSessionService.issueRefreshToken({ id: 8 });
    const [firstSession, concurrentSession] = await Promise.all([
      AuthSessionService.consumeRefreshToken(firstToken),
      AuthSessionService.consumeRefreshToken(firstToken),
    ]);

    const [firstRotatedToken, concurrentRotatedToken] = await Promise.all([
      AuthSessionService.issueRefreshToken({
        id: 8,
        familyId: firstSession.familyId,
        sessionVersion: firstSession.sessionVersion,
      }),
      AuthSessionService.issueRefreshToken({
        id: 8,
        familyId: concurrentSession.familyId,
        sessionVersion: concurrentSession.sessionVersion,
      }),
    ]);

    await expect(
      AuthSessionService.consumeRefreshToken(firstRotatedToken),
    ).resolves.toMatchObject({ payload: { id: 8 } });
    await expect(
      AuthSessionService.consumeRefreshToken(concurrentRotatedToken),
    ).resolves.toMatchObject({ payload: { id: 8 } });
  });

  it("rejects replay after the grace window and revokes its family", async () => {
    const firstToken = await AuthSessionService.issueRefreshToken({ id: 9 });
    const firstSession =
      await AuthSessionService.consumeRefreshToken(firstToken);
    const rotatedToken = await AuthSessionService.issueRefreshToken({
      id: 9,
      familyId: firstSession.familyId,
      sessionVersion: firstSession.sessionVersion,
    });

    for (const key of redisState.values.keys()) {
      if (key.includes(":refresh-reuse-grace:")) {
        redisState.values.delete(key);
      }
    }

    await expect(
      AuthSessionService.consumeRefreshToken(firstToken),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN", statusCode: 401 });
    await expect(
      AuthSessionService.consumeRefreshToken(rotatedToken),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN", statusCode: 401 });
  });

  it("allows an outstanding legacy refresh token to rotate concurrently", async () => {
    const legacyToken = jwt.sign(
      { id: 10 },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    const [firstSession, concurrentSession] = await Promise.all([
      AuthSessionService.consumeRefreshToken(legacyToken),
      AuthSessionService.consumeRefreshToken(legacyToken),
    ]);

    expect(firstSession).toMatchObject({ payload: { id: 10 }, isLegacy: true });
    expect(concurrentSession).toMatchObject({
      payload: { id: 10 },
      isLegacy: true,
    });
  });

  it("consumes a password-reset token only once", async () => {
    const token = await AuthSessionService.issuePasswordResetToken(11);
    await expect(
      AuthSessionService.consumePasswordResetToken(token),
    ).resolves.toMatchObject({ id: 11 });
    await expect(
      AuthSessionService.consumePasswordResetToken(token),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN", statusCode: 401 });
  });

  it("accepts an outstanding legacy reset token once during rollout", async () => {
    const token = jwt.sign({ id: 12 }, process.env.JWT_RESET_SECRET, {
      expiresIn: "1h",
    });
    await expect(
      AuthSessionService.verifyPasswordResetToken(token),
    ).resolves.toMatchObject({ id: 12 });
    await expect(
      AuthSessionService.consumePasswordResetToken(token),
    ).resolves.toMatchObject({ id: 12 });
    await expect(
      AuthSessionService.consumePasswordResetToken(token),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN", statusCode: 401 });
  });

  it("invalidates refresh tokens issued before a password reset", async () => {
    const token = await AuthSessionService.issueRefreshToken({ id: 13 });
    await AuthSessionService.invalidateUserSessions(13);
    await expect(
      AuthSessionService.consumeRefreshToken(token),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN", statusCode: 401 });
  });

  it("revokes the current refresh family on logout", async () => {
    const token = await AuthSessionService.issueRefreshToken({ id: 17 });
    await expect(
      AuthSessionService.revokeRefreshToken(token),
    ).resolves.toBe(true);
    await expect(
      AuthSessionService.consumeRefreshToken(token),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN", statusCode: 401 });
  });
});
