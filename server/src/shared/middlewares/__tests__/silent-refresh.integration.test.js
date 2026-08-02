// Real HTTP integration test for SERVER-SIDE SILENT REFRESH in requireAuth.
//
// Contract (mirrors the school-system reference `resolveSessionUser`):
//   - A valid access token → request proceeds, refresh is NEVER attempted.
//   - No/expired/garbage access token BUT a valid refresh cookie → the middleware
//     transparently mints a new token pair, sets fresh cookies on the response, and
//     lets the request through (the 401 never reaches the client).
//   - Neither a valid access token NOR a usable refresh cookie → 401 (unchanged).
//
// `AuthUseCase.refreshTokens` does a DB read, so we spy it to return a freshly
// signed pair — this isolates the NEW middleware branch from the (already tested)
// usecase. Secrets are set before importing anything that pulls in env.js.
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.ISLOCAL = "true";

vi.mock("../../../infra/auth/profile-cache.js", async () => {
  const { getEffectivePermissions } = await import("@dms/shared");
  const effective = getEffectivePermissions({ profile: "ADMIN" });
  const profile = {
    id: 1,
    key: "ADMIN",
    label: "Admin",
    family: "ADMIN",
    isAdminTier: true,
    ...effective,
  };
  return {
    profileCache: {
      resolve: (id) => (id === 1 ? profile : null),
      resolveMeta: (id) => (id === 1 ? profile : null),
    },
  };
});

let server;
let baseUrl;
let JwtService;
let AuthMiddleware;
let AuthUseCase;
let errorHandler;
let authMessagesCodes;
let AUTH_COOKIE_NAME;
let AUTH_REFRESH_TOKEN_COOKIE_NAME;

beforeAll(async () => {
  ({ JwtService } = await import("../../../infra/security/jwt.js"));
  ({ AuthMiddleware } = await import("../auth.middleware.js"));
  ({ AuthUseCase } = await import("../../../modules/auth/auth.usecase.js"));
  ({ errorHandler } = await import("../../errors/error-handler.js"));
  ({ authMessagesCodes, AUTH_COOKIE_NAME, AUTH_REFRESH_TOKEN_COOKIE_NAME } =
    await import("@dms/shared"));

  const app = express();
  app.use(cookieParser());

  const router = express.Router();
  router.use(AuthMiddleware.requireAuth);
  router.get("/ping", (req, res) => res.json({ ok: true, id: req.auth?.id }));

  app.use(router);
  app.use(errorHandler);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function signAccessFor(id = 1, role = "ADMIN") {
  return JwtService.signAccess({
    id,
    currentProfileId: 1,
    profileIds: [1],
    isActive: true,
  });
}

async function ping(cookies) {
  const headers = cookies ? { cookie: cookies } : {};
  const res = await fetch(`${baseUrl}/ping`, { headers });
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  const setCookie = res.headers.get("set-cookie") || "";
  return { status: res.status, body, setCookie };
}

describe("requireAuth — server-side silent refresh", () => {
  it("valid access token -> 200, refresh NOT attempted", async () => {
    const spy = vi.spyOn(AuthUseCase, "refreshTokens");
    const token = signAccessFor(7);
    const { status, body } = await ping(`${AUTH_COOKIE_NAME}=${token}`);
    expect(status).toBe(200);
    expect(body.id).toBe(7);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("no cookies at all -> 401 UNAUTHORIZED (unchanged)", async () => {
    const { status, body } = await ping();
    expect(status).toBe(401);
    expect(body.message).toBe(authMessagesCodes.UNAUTHORIZED);
  });

  it("expired/garbage access + valid refresh cookie -> silent refresh -> 200 + new cookies", async () => {
    const spy = vi.spyOn(AuthUseCase, "refreshTokens").mockResolvedValue({
      accessToken: signAccessFor(42),
      refreshToken: JwtService.signRefresh({ id: 42 }),
    });

    const { status, body, setCookie } = await ping(
      `${AUTH_COOKIE_NAME}=garbage.not.a.jwt; ${AUTH_REFRESH_TOKEN_COOKIE_NAME}=validRefresh`,
    );

    expect(spy).toHaveBeenCalledWith("validRefresh");
    expect(status).toBe(200);
    expect(body.id).toBe(42);
    // Fresh access_token must be issued back to the client.
    expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`);
    spy.mockRestore();
  });

  it("no access cookie but valid refresh cookie -> silent refresh -> 200", async () => {
    const spy = vi.spyOn(AuthUseCase, "refreshTokens").mockResolvedValue({
      accessToken: signAccessFor(99),
      refreshToken: JwtService.signRefresh({ id: 99 }),
    });

    const { status, body } = await ping(
      `${AUTH_REFRESH_TOKEN_COOKIE_NAME}=validRefresh`,
    );

    expect(status).toBe(200);
    expect(body.id).toBe(99);
    spy.mockRestore();
  });

  it("expired access + INVALID refresh cookie -> 401 (refresh rejected)", async () => {
    const { AppError } = await import("../../errors/AppError.js");
    const spy = vi
      .spyOn(AuthUseCase, "refreshTokens")
      .mockRejectedValue(new AppError({ code: authMessagesCodes.UNAUTHORIZED, statusCode: 401 }));

    const { status } = await ping(
      `${AUTH_COOKIE_NAME}=garbage; ${AUTH_REFRESH_TOKEN_COOKIE_NAME}=bad`,
    );
    expect(status).toBe(401);
    spy.mockRestore();
  });
});
