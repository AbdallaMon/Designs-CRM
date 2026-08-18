import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/leads/leadUpdates/CreateUpdate.jsx", () => ({
  CreateUpdateModal: () => React.createElement("button", null, "Create update"),
}));
vi.mock("@/features/leads/leadUpdates/LeadListModal.jsx", () => ({
  default: () => React.createElement("button", null, "History"),
}));
vi.mock("@/features/leads/leadUpdates/UpdateCard.jsx", () => ({
  UpdateCard: ({ update }) => React.createElement("article", null, update.title),
}));

import { KanbanUpdateSection } from "../KanbanUpdateSection.jsx";

describe("KanbanUpdateSection", () => {
  it("shows one latest update summary and keeps full history in the modal", () => {
    const html = renderToStaticMarkup(
      React.createElement(KanbanUpdateSection, {
        lead: {
          id: 11,
          status: "FINALIZED",
          updates: [
            { id: 1, title: "Client approved the layout", updatedAt: "2026-08-18T10:00:00.000Z" },
            { id: 2, title: "Older detailed update", updatedAt: "2026-08-17T10:00:00.000Z" },
          ],
        },
        setleads: vi.fn(),
        setRerenderColumns: vi.fn(),
        reRenderColumns: {},
      }),
    );

    expect(html).toContain("Latest project update");
    expect(html).toContain("Client approved the layout");
    expect(html).not.toContain("Older detailed update");
    expect(html).toContain("History");
  });
});

