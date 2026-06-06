import { describe, it, expect } from "vitest";

import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { chatSchemas } from "../chat.validation.js";

/**
 * Runs an array of (req,res,next) middlewares in sequence against a fake req,
 * stopping if one of them calls next(err). Returns the (possibly mutated) req.
 */
function runMiddlewares(middlewares, req) {
  let err = null;
  for (const mw of middlewares) {
    let called = false;
    mw(req, {}, (e) => {
      called = true;
      if (e) err = e;
    });
    if (err || !called) break;
  }
  return { req, err };
}

describe("DELETE/PUT /rooms/:roomId/members/:memberId params validation", () => {
  // The validate middleware overwrites req.params with the parsed,
  // unknown-stripped object. The combined schema must keep BOTH ids.
  it("roomMemberParams (single validate) preserves BOTH roomId and memberId", () => {
    const req = { params: { roomId: "7", memberId: "42" } };
    const { req: out, err } = runMiddlewares(
      [validate(chatSchemas.roomMemberParams, "params")],
      req,
    );

    expect(err).toBeNull();
    expect(out.params.roomId).toBe(7);
    expect(out.params.memberId).toBe(42);
  });

  it("REGRESSION: chaining two separate params validators cannot deliver BOTH ids", () => {
    // This proves WHY the single combined schema is required. The first
    // validator overwrites req.params with { roomId } (memberId stripped);
    // the second then parses that object — either erroring (memberId missing)
    // or, at best, leaving only one id on req.params. It can never produce a
    // params object containing BOTH valid roomId and memberId.
    const req = { params: { roomId: "7", memberId: "42" } };
    const { req: out, err } = runMiddlewares(
      [
        validate(chatSchemas.roomIdParams, "params"),
        validate(chatSchemas.memberIdParams, "params"),
      ],
      req,
    );

    const bothPresent =
      !err && out.params.roomId === 7 && out.params.memberId === 42;
    expect(bothPresent).toBe(false);
  });
});
