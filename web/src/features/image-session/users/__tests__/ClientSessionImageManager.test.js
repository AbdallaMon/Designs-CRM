import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({ user: { id: 7, profile: "ADMIN" } }),
}));
vi.mock("@/app/providers/MuiAlert", () => ({
  useAlertContext: () => ({ setAlertError: vi.fn() }),
}));
vi.mock("@/app/providers/ToastLoadingProvider", () => ({
  useToastContext: () => ({ setLoading: vi.fn() }),
}));

import ClientImageSessionManager from "../ClientSessionImageManager.jsx";

describe("ClientImageSessionManager trigger", () => {
  it("uses an icon-only trigger when embedded in a compact Kanban header", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClientImageSessionManager, { clientLeadId: 11, compact: true }),
    );

    expect(html).toContain('aria-label="View image sessions"');
    expect(html).not.toContain(">View Sessions<");
  });

  it("keeps the full trigger on non-compact detail surfaces", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClientImageSessionManager, { clientLeadId: 11 }),
    );

    expect(html).toContain(">View Sessions<");
  });
});
