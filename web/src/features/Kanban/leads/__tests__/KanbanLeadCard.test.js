import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { KANBAN_VIEW_TYPES } from "@dms/shared";

vi.mock("react-dnd", () => ({
  useDrag: () => [{}, () => {}],
}));

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({ user: { id: 7, profile: "ADMIN" } }),
}));

vi.mock("@/app/hooks/usePermission", () => ({
  usePermission: () => ({ hasPermission: () => true }),
}));

vi.mock("@/features/image-session/users/ClientSessionImageManager", () => ({
  default: ({ compact }) =>
    React.createElement("span", {
      "data-testid": "image-session-trigger",
      "data-compact": String(Boolean(compact)),
    }),
}));

vi.mock("@/features/leads/PreviewLeadDialog.jsx", () => ({ default: () => null }));
vi.mock("@/features/work-stages/PreviewWorkStage", () => ({ default: () => null }));
vi.mock("@/features/leads/leadUpdates/KanbanUpdateSection", () => ({
  KanbanUpdateSection: () => null,
}));
vi.mock("@/features/leads/dialogs/NoteDialog", () => ({
  NewNoteDialog: ({ children }) => children,
}));
vi.mock("@/features/leads/dialogs/CallsDialog.jsx", () => ({
  CallResultDialog: () => null,
  NewCallDialog: ({ children }) => children,
}));
vi.mock("@/features/leads/widgets/InProgressCall.jsx", () => ({
  InProgressCall: () => null,
}));

import KanbanLeadCard from "../KanbanLeadCard.jsx";

const lead = {
  id: 11,
  createdAt: "2026-08-10T10:00:00.000Z",
  status: "IN_PROGRESS",
  client: { name: "Test Client" },
  price: "AED 25,000",
  projects: [{ id: 21, status: "Studying", priority: "MEDIUM" }],
  contracts: [],
  callReminders: [],
};

describe("KanbanLeadCard header actions", () => {
  it("uses the compact Image Sessions trigger beside the preview action", () => {
    const html = renderToStaticMarkup(
      React.createElement(KanbanLeadCard, {
        lead,
        movelead: vi.fn(),
        setleads: vi.fn(),
        type: KANBAN_VIEW_TYPES.STAFF,
        statusArray: [],
        setRerenderColumns: vi.fn(),
        reRenderColumns: 0,
      }),
    );

    expect(html).toContain('data-compact="true"');
    expect(html).toContain('aria-label="View details"');
    expect(html).toContain("Next: Schedule follow-up");
  });

  it("promotes current contract work on the All Projects board", () => {
    const html = renderToStaticMarkup(
      React.createElement(KanbanLeadCard, {
        lead: {
          ...lead,
          contracts: [
            {
              contractLevel: "LEVEL_1",
              totalAmount: 35000,
              stage: { title: "3D Design" },
              stages: [{ title: "3D Design", stageStatus: "IN_PROGRESS" }],
            },
          ],
        },
        movelead: vi.fn(),
        setleads: vi.fn(),
        type: KANBAN_VIEW_TYPES.CONTRACT_LEVELS,
        statusArray: [],
        setRerenderColumns: vi.fn(),
        reRenderColumns: 0,
      }),
    );

    expect(html).toContain("Current work");
    expect(html).toContain("3D Design");
    expect(html).not.toContain("Next: Schedule follow-up");
  });
});
