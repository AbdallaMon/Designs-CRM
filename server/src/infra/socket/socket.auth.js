import {
  AUTH_COOKIE_NAME,
  authMessagesCodes,
  chatMessagesCodes,
  messagesNames,
} from "@dms/shared";
import { JwtService } from "../security/jwt.js";
import { profileCache } from "../auth/profile-cache.js";
import { AppError } from "../../shared/errors/AppError.js";
import { chatRepository } from "../../modules/chat/chat.repo.js";
import { socketErrorEnvelope } from "../../modules/chat/handlers/socket-error.js";

function readCookie(cookieHeader, name) {
  if (typeof cookieHeader !== "string" || !cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
}

function unauthorized(code = authMessagesCodes.UNAUTHORIZED) {
  return new AppError({
    code,
    statusCode: code === authMessagesCodes.PROFILE_REQUIRED ? 403 : 401,
    translationKey: messagesNames.authMessages,
  });
}

export function isAllowedSocketRequest(req, origins) {
  const origin = req.headers?.origin;
  if (!origin) return false;
  return origins.includes(origin);
}

export async function authenticateSocket(
  socket,
  {
    verifyAccess = JwtService.verifyAccess.bind(JwtService),
    resolveProfile = profileCache.resolve.bind(profileCache),
    findRoomByAccessToken = chatRepository.findRoomByAccessToken.bind(chatRepository),
  } = {},
) {
  const chatToken = socket.handshake?.auth?.chatToken;
  if (typeof chatToken === "string" && chatToken) {
    const resolved = await findRoomByAccessToken(chatToken);
    if (!resolved?.room || !resolved?.chatMember?.clientId) {
      throw new AppError({
        code: chatMessagesCodes.INVALID_ROOM_TOKEN,
        statusCode: 401,
      });
    }
    return Object.freeze({
      kind: "client",
      userId: null,
      clientId: Number(resolved.chatMember.clientId),
      allowedRoomId: Number(resolved.room.id),
      actor: {
        id: Number(resolved.chatMember.clientId),
        name: resolved.chatMember.client?.name ?? null,
      },
    });
  }

  const accessToken = readCookie(
    socket.request?.headers?.cookie ?? socket.handshake?.headers?.cookie,
    AUTH_COOKIE_NAME,
  );
  if (!accessToken) throw unauthorized();

  let payload;
  try {
    payload = verifyAccess(accessToken);
  } catch {
    throw unauthorized(authMessagesCodes.INVALID_TOKEN);
  }
  if (!payload?.id || payload.isActive === false) throw unauthorized();

  const profile = resolveProfile(payload.currentProfileId);
  if (!profile) throw unauthorized(authMessagesCodes.PROFILE_REQUIRED);

  return Object.freeze({
    kind: "staff",
    userId: Number(payload.id),
    clientId: null,
    allowedRoomId: null,
    actor: {
      id: Number(payload.id),
      name: payload.name ?? null,
    },
    authUser: Object.freeze({
      ...payload,
      currentProfileKey: profile.key,
      profileFamily: profile.family,
      isAdminTier: Boolean(profile.isAdminTier),
      permissions: profile.permissions,
      permissionsByModule: profile.permissionsByModule,
    }),
  });
}

export function joinSocketIdentityRoom(socket, ctx) {
  if (ctx.kind === "staff") socket.join(`user:${ctx.userId}`);
  if (ctx.kind === "client") socket.join(`room:${ctx.allowedRoomId}`);
}

export function toSocketConnectError(error) {
  const connectError = new Error(error?.code ?? authMessagesCodes.UNAUTHORIZED);
  connectError.data = socketErrorEnvelope(
    error,
    authMessagesCodes.UNAUTHORIZED,
  );
  return connectError;
}
