import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({ profile: "ADMIN" }));

vi.mock("react-dnd", () => ({
  useDrag: () => [{}, () => {}],
}));

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({ user: { id: 7, profile: authState.profile } }),
}));

vi.mock("@/app/hooks/usePermission", () => ({
  usePermission: () => ({ hasPermission: () => authState.profile !== "DESIGNER_3D" }),
}));

vi.mock("@/features/image-session/users/ClientSessionImageManager", () => ({
  default: ({ compact }) => React.createElement("span", {
    "data-testid": "image-session-trigger",
    "data-compact": String(Boolean(compact)),
  }),
}));

vi.mock("@/features/work-stages/PreviewWorkStage.jsx", () => ({ default: () => null }));
vi.mock("@/features/work-stages/utility/TelegramLink.jsx", () => ({ default: () => null }));
vi.mock("@/features/leads/leadUpdates/KanbanUpdateSection.jsx", () => ({
  KanbanUpdateSection: () => null,
}));
vi.mock("@/features/Kanban/work-stages/cardMeta.js", () => ({
  useUnseenActivity: () => ({ hasUnseen: false, markSeen: vi.fn() }),
}));
vi.mock("@/features/Kanban/work-stages/WorkStageCardSignals.jsx", () => ({
  AgingBadge: () => null,
  NextActionLine: () => null,
  StageProgress: () => null,
}));
vi.mock("@/features/leads/dialogs/NoteDialog", () => ({
  NewNoteDialog: ({ children }) => children,
}));
vi.mock("@/features/leads/dialogs/CallsDialog", () => ({
  NewCallDialog: ({ children }) => children,
}));

import WorkStageKanbanCard from "../WorkStageKanbanCard.jsx";

const lead = {
  id: 11,
  client: { name: "Test Client" },
  projects: [
    {
      id: 21,
      status: "Studying",
      priority: "MEDIUM",
      assignments: [],
      tasks: [],
      capabilities: { canChangeStatus: false },
    },
  ],
};

describe("WorkStageKanbanCard header actions", () => {
  it.each(["ADMIN", "SUPER_ADMIN", "DESIGNER_3D"])(
    "keeps compact Image Sessions and View Lead Details visible for %s",
    (profile) => {
      authState.profile = profile;
      const html = renderToStaticMarkup(
        React.createElement(WorkStageKanbanCard, {
          lead,
          movelead: vi.fn(),
          setleads: vi.fn(),
          type: "2D_Study",
          statusArray: [],
          setRerenderColumns: vi.fn(),
          reRenderColumns: 0,
        }),
      );

      expect(html).toContain('data-compact="true"');
      expect(html).toContain('aria-label="View lead details"');
    },
  );
});
