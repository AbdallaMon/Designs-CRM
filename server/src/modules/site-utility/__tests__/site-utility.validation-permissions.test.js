import { describe, it, expect } from "vitest";

import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { SiteUtilityValidation } from "../site-utility.validation.js";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  USER_ROLES,
} from "@dms/shared";

const P = PERMISSIONS.SITE_UTILITY;

/** Run middlewares in sequence against a fake req; stop on next(err). */
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

describe("SiteUtilityValidation", () => {
  it("createPaymentConditionSchema requires all four columns", () => {
    const req = { body: { condition: "Half" } }; // missing conditionType/labels
    const { err } = runMiddlewares(
      [validate(SiteUtilityValidation.createPaymentConditionSchema)],
      req,
    );
    expect(err).not.toBeNull();
    expect(err.statusCode).toBe(422);
  });

  it("createPaymentConditionSchema accepts a complete body and strips unknown keys", () => {
    const req = {
      body: {
        conditionType: "stage",
        condition: "Half",
        labelAr: "نصف",
        labelEn: "Half",
        hacker: "drop table", // unknown → stripped
      },
    };
    const { req: out, err } = runMiddlewares(
      [validate(SiteUtilityValidation.createPaymentConditionSchema)],
      req,
    );
    expect(err).toBeNull();
    expect(out.body.hacker).toBeUndefined();
    expect(out.body.condition).toBe("Half");
  });

  it("idParams coerces a numeric string and rejects non-positive", () => {
    const okReq = { params: { id: "42" } };
    const { req: out, err } = runMiddlewares(
      [validate(SiteUtilityValidation.idParams, "params")],
      okReq,
    );
    expect(err).toBeNull();
    expect(out.params.id).toBe(42);

    const badReq = { params: { id: "abc" } };
    const { err: badErr } = runMiddlewares(
      [validate(SiteUtilityValidation.idParams, "params")],
      badReq,
    );
    expect(badErr).not.toBeNull();
    expect(badErr.statusCode).toBe(422);
  });

  it("updatePaymentConditionSchema rejects an empty body", () => {
    const req = { body: {} };
    const { err } = runMiddlewares(
      [validate(SiteUtilityValidation.updatePaymentConditionSchema)],
      req,
    );
    expect(err).not.toBeNull();
    expect(err.statusCode).toBe(422);
  });
});

describe("site-utility role grants (security: ADMIN + SUPER_ADMIN only)", () => {
  const codes = Object.values(P);

  it("ADMIN and SUPER_ADMIN hold every site-utility code", () => {
    for (const role of [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]) {
      for (const code of codes) {
        expect(ROLE_PERMISSIONS[role]).toContain(code);
      }
    }
  });

  it("NO other role holds ANY site-utility code", () => {
    const privileged = new Set([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]);
    for (const [role, granted] of Object.entries(ROLE_PERMISSIONS)) {
      if (privileged.has(role)) continue;
      for (const code of codes) {
        expect(granted).not.toContain(code);
      }
    }
  });
});
