import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({ user: { id: 7, profile: "ADMIN" } }),
}));

vi.mock("@/app/providers/ToastLoadingProvider", () => ({
  useToastContext: () => ({ setLoading: vi.fn() }),
}));

vi.mock("@/app/helpers/functions/utility", () => ({
  checkIfAdmin: () => true,
}));

vi.mock("@/features/leads/leadUpdates/components/MarkAsDoneModel.jsx", () => ({
  MarkAsDoneModel: () => null,
}));

import { DepartmentManagementModal } from "../DepartmentManagementModal.jsx";

const update = {
  id: 11,
  department: "STAFF",
};

describe("DepartmentManagementModal trigger", () => {
  it("renders an accessible quick-action icon for update cards", () => {
    const html = renderToStaticMarkup(
      React.createElement(DepartmentManagementModal, {
        update,
        compact: true,
      }),
    );

    expect(html).toContain('aria-label="Manage department access"');
    expect(html).not.toContain(">Manage Access</button>");
  });

  it("keeps the existing full button available to other surfaces", () => {
    const html = renderToStaticMarkup(
      React.createElement(DepartmentManagementModal, { update }),
    );

    expect(html).toContain("Manage Access");
  });
});
