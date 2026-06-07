import { describe, it, expect, vi } from "vitest";

// The usecase pulls chat.socket.js (Prisma + socket graph) lazily, but importing the
// route module eagerly imports the controller -> usecase module. Stub the socket
// infra so the import graph stays light and no real DB/socket is touched.
vi.mock("../../../../infra/socket/index.js", () => ({
  getIo: () => ({ to: () => ({ emit: () => {} }) }),
}));

import { clientChatRouter } from "../client-chat.route.js";

// Walk an Express router's layer stack and collect (method, path) pairs.
function collectRoutes(router) {
  const routes = [];
  for (const layer of router.stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods)
        .filter((m) => layer.route.methods[m])
        .map((m) => m.toUpperCase());
      routes.push({ path: layer.route.path, methods });
    }
  }
  return routes;
}

describe("clientChatRouter — PUBLIC token surface mounts", () => {
  const routes = collectRoutes(clientChatRouter);
  const paths = routes.map((r) => r.path);

  it("mounts all 7 legacy endpoints 1:1", () => {
    expect(paths).toContain("/rooms/validate-token");
    expect(paths).toContain("/rooms/:roomId");
    expect(paths).toContain("/rooms/:roomId/members");
    expect(paths).toContain("/rooms/:roomId/files");
    expect(paths).toContain("/:roomId/messages");
    expect(paths).toContain("/:roomId/messages/:messageId/page");
    expect(paths).toContain("/:roomId/pinned-messages");
    expect(routes.every((r) => r.methods.includes("GET"))).toBe(true);
  });

  it("declares the literal /rooms/validate-token BEFORE the /rooms/:roomId param route", () => {
    const idxLiteral = paths.indexOf("/rooms/validate-token");
    const idxParam = paths.indexOf("/rooms/:roomId");
    expect(idxLiteral).toBeGreaterThanOrEqual(0);
    expect(idxLiteral).toBeLessThan(idxParam);
  });

  it("declares the deeper /:roomId/messages/:messageId/page BEFORE /:roomId/messages", () => {
    const idxDeep = paths.indexOf("/:roomId/messages/:messageId/page");
    const idxShallow = paths.indexOf("/:roomId/messages");
    expect(idxDeep).toBeLessThan(idxShallow);
  });

  it("is PUBLIC — no router-level auth middleware (reachable without a session)", () => {
    // A router-level `router.use(requireAuth)` would appear as a stack layer with no
    // `.route` and a named handle. Assert none of the global layers look like auth.
    const globalLayers = clientChatRouter.stack.filter((l) => !l.route);
    const names = globalLayers.map((l) => l.handle?.name || "");
    expect(names.some((n) => /auth|requireAuth|requirePermission/i.test(n))).toBe(
      false,
    );
  });
});
