// chat/client Zod schemas — the PUBLIC client-chat surface (token-based, NO auth).
//
// The per-room token (query param `token`) is the client's ONLY credential. Every
// endpoint resolves the room FROM the verified token; the room/member/file scope is
// never trusted from a client-supplied `:roomId` or `clientId`. Legacy accepted a
// raw `:roomId` + `clientId` and gated solely on `clientId` membership — an IDOR
// (any client able to name a member's clientId could read any room). These schemas
// + the usecase close that: the `:roomId` param, when present, must match the
// token's room or the request is rejected.
//
// `validate(schema, "query"|"params")` returns 422 + details on failure.
import { z } from "zod";

// A non-empty token string. We do not constrain the format (legacy tokens are uuids
// but the column is free-form); the usecase verifies it resolves to a room.
const tokenSchema = z.string().trim().min(1);

// Optional pagination — coerced to non-negative integers, matching legacy
// `parseInt(page,10) || 0`. `.strict()` is not used on query objects because the FE
// echoes assorted query params; we read only the ones we declare via `validate`.
const pageSchema = z.coerce.number().int().min(0).optional();
const limitSchema = z.coerce.number().int().min(1).max(200).optional();

export class ClientChatValidation {
  // GET /rooms/validate-token?token=...
  static validateToken = z.object({ token: tokenSchema });

  // GET /rooms/:roomId  (and members/files share the same param shape)
  static roomIdParams = z.object({
    roomId: z.coerce.number().int().positive(),
  });

  // GET /:roomId/messages/:messageId/page
  static messageIdParams = z.object({
    roomId: z.coerce.number().int().positive(),
    messageId: z.coerce.number().int().positive(),
  });

  // Shared: every public read requires the token in the query string.
  static tokenQuery = z.object({ token: tokenSchema });

  // GET /:roomId/messages — token + pagination.
  static messagesQuery = z.object({
    token: tokenSchema,
    page: pageSchema,
    limit: limitSchema,
  });

  // GET /:roomId/messages/:messageId/page — token + limit.
  static messagePageQuery = z.object({
    token: tokenSchema,
    limit: limitSchema,
  });

  // GET /:roomId/files — token + pagination + filters. `uniqueMonths` and `sort`
  // are JSON strings the legacy service JSON.parses; keep them as optional strings
  // here (the usecase guards the parse).
  static filesQuery = z.object({
    token: tokenSchema,
    page: pageSchema,
    limit: limitSchema,
    sort: z.string().optional(),
    type: z.string().optional(),
    search: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    uniqueMonths: z.string().optional(),
  });
}
