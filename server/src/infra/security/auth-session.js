import { createHash, randomUUID } from "node:crypto";
import { authMessagesCodes } from "@dms/shared";
import redisClient from "../redis/redis.client.js";
import { AppError } from "../../shared/errors/AppError.js";
import { JwtService } from "./jwt.js";

const PREFIX = "auth";
const DEFAULT_REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const DEFAULT_RESET_TTL_SECONDS = 60 * 60;

const refreshVersionKey = (userId) => `${PREFIX}:refresh-version:${userId}`;
const refreshFamilyKey = (familyId) => `${PREFIX}:refresh-family-revoked:${familyId}`;
const refreshTokenKey = (familyId, tokenId) =>
  `${PREFIX}:refresh-token:${familyId}:${tokenId}`;
const legacyRefreshUsedKey = (tokenId) =>
  `${PREFIX}:refresh-legacy-used:${tokenId}`;
const resetTokenKey = (tokenId) => `${PREFIX}:password-reset:${tokenId}`;
const legacyResetUsedKey = (tokenId) =>
  `${PREFIX}:password-reset-legacy-used:${tokenId}`;

const CONSUME_REFRESH_SCRIPT = `
local version = redis.call("GET", KEYS[1])
if not version then version = "0" end
if version ~= ARGV[1] then return -2 end
if redis.call("EXISTS", KEYS[2]) == 1 then return -1 end
if redis.call("DEL", KEYS[3]) ~= 1 then
  redis.call("SET", KEYS[2], "1", "EX", ARGV[2])
  return 0
end
return 1
`;

const CONSUME_RESET_SCRIPT = `
local value = redis.call("GET", KEYS[1])
if not value then return false end
redis.call("DEL", KEYS[1])
return value
`;

function invalidToken() {
  return new AppError({
    code: authMessagesCodes.INVALID_TOKEN,
    statusCode: 401,
  });
}

function tokenTtlSeconds(payload, fallback) {
  const remaining = Number(payload?.exp) - Math.floor(Date.now() / 1000);
  return Number.isFinite(remaining) && remaining > 0 ? remaining : fallback;
}

function tokenDigest(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

function verifiedRefresh(token) {
  let payload;
  try {
    payload = JwtService.verifyRefresh(token);
  } catch {
    throw invalidToken();
  }
  if (!payload?.id) throw invalidToken();

  const digest = tokenDigest(token);
  const isLegacy = !payload.sid || !payload.jti;
  return {
    payload,
    familyId: payload.sid || `legacy-${digest}`,
    tokenId: payload.jti || digest,
    sessionVersion: Number.isInteger(payload.sv) ? payload.sv : 0,
    isLegacy,
    ttlSeconds: tokenTtlSeconds(payload, DEFAULT_REFRESH_TTL_SECONDS),
  };
}

function verifiedReset(token) {
  let payload;
  try {
    payload = JwtService.verifyReset(token);
  } catch {
    throw invalidToken();
  }
  if (!payload?.id) throw invalidToken();
  const isLegacy = !payload.jti;
  return {
    payload,
    tokenId: payload.jti || tokenDigest(token),
    isLegacy,
    ttlSeconds: tokenTtlSeconds(payload, DEFAULT_RESET_TTL_SECONDS),
  };
}

export class AuthSessionService {
  static async getUserSessionVersion(userId) {
    const value = await redisClient.get(refreshVersionKey(userId));
    const version = Number(value ?? 0);
    return Number.isInteger(version) && version >= 0 ? version : 0;
  }

  static async issueRefreshToken({
    id,
    familyId = null,
    sessionVersion = null,
  }) {
    const sid = familyId || randomUUID();
    const jti = randomUUID();
    const sv =
      sessionVersion ?? (await AuthSessionService.getUserSessionVersion(id));
    const token = JwtService.signRefresh({ id, sid, jti, sv });
    const decoded = JwtService.verifyRefresh(token);
    const ttlSeconds = tokenTtlSeconds(decoded, DEFAULT_REFRESH_TTL_SECONDS);

    await redisClient.set(refreshTokenKey(sid, jti), "1", {
      EX: ttlSeconds,
    });
    return token;
  }

  static async consumeRefreshToken(token) {
    const session = verifiedRefresh(token);
    const currentVersion = await AuthSessionService.getUserSessionVersion(
      session.payload.id,
    );
    if (currentVersion !== session.sessionVersion) throw invalidToken();

    if (session.isLegacy) {
      const firstUse = await redisClient.set(
        legacyRefreshUsedKey(session.tokenId),
        "1",
        { EX: session.ttlSeconds, NX: true },
      );
      if (!firstUse) {
        await redisClient.set(refreshFamilyKey(session.familyId), "1", {
          EX: session.ttlSeconds,
        });
        throw invalidToken();
      }
      return session;
    }

    const result = Number(
      await redisClient.sendCommand([
        "EVAL",
        CONSUME_REFRESH_SCRIPT,
        "3",
        refreshVersionKey(session.payload.id),
        refreshFamilyKey(session.familyId),
        refreshTokenKey(session.familyId, session.tokenId),
        String(session.sessionVersion),
        String(session.ttlSeconds),
      ]),
    );
    if (result !== 1) throw invalidToken();
    return session;
  }

  static async revokeRefreshToken(token) {
    if (!token) return false;

    let session;
    try {
      session = verifiedRefresh(token);
    } catch {
      return false;
    }

    await redisClient.set(refreshFamilyKey(session.familyId), "1", {
      EX: session.ttlSeconds,
    });
    await redisClient.del(refreshTokenKey(session.familyId, session.tokenId));
    return true;
  }

  static async invalidateUserSessions(userId) {
    return redisClient.incr(refreshVersionKey(userId));
  }

  static async issuePasswordResetToken(userId) {
    const token = JwtService.signReset({ id: userId, jti: randomUUID() });
    const decoded = JwtService.verifyReset(token);
    const ttlSeconds = tokenTtlSeconds(decoded, DEFAULT_RESET_TTL_SECONDS);
    await redisClient.set(resetTokenKey(decoded.jti), String(userId), {
      EX: ttlSeconds,
    });
    return token;
  }

  static async verifyPasswordResetToken(token) {
    const reset = verifiedReset(token);
    if (reset.isLegacy) {
      const used = await redisClient.get(legacyResetUsedKey(reset.tokenId));
      if (used) throw invalidToken();
      return reset.payload;
    }

    const storedUserId = await redisClient.get(resetTokenKey(reset.tokenId));
    if (String(storedUserId) !== String(reset.payload.id)) throw invalidToken();
    return reset.payload;
  }

  static async consumePasswordResetToken(token) {
    const reset = verifiedReset(token);
    if (reset.isLegacy) {
      const firstUse = await redisClient.set(
        legacyResetUsedKey(reset.tokenId),
        "1",
        { EX: reset.ttlSeconds, NX: true },
      );
      if (!firstUse) throw invalidToken();
      return reset.payload;
    }

    const storedUserId = await redisClient.sendCommand([
      "EVAL",
      CONSUME_RESET_SCRIPT,
      "1",
      resetTokenKey(reset.tokenId),
    ]);
    if (String(storedUserId) !== String(reset.payload.id)) throw invalidToken();
    return reset.payload;
  }
}
