import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import KanbanFilterBar from "../KanbanFilterBar.jsx";

describe("KanbanFilterBar", () => {
  it("keeps searches, secondary filters, and navigation in distinct responsive groups", () => {
    const html = renderToStaticMarkup(
      React.createElement(KanbanFilterBar, {
        leadSearch: React.createElement("input", { "aria-label": "Lead search" }),
        staffSearch: React.createElement("input", { "aria-label": "Staff search" }),
        filters: React.createElement("button", null, "Contract level"),
        links: React.createElement("a", { href: "/dashboard/all-deals" }, "All deals"),
      }),
    );

    expect(html).toContain('aria-label="Board filters"');
    expect(html).toContain('data-testid="kanban-filter-searches"');
    expect(html).toContain('data-testid="kanban-filter-controls"');
    expect(html).toContain('aria-label="Lead search"');
    expect(html).toContain('aria-label="Staff search"');
    expect(html).toContain("Contract level");
    expect(html).toContain("All deals");
  });

  it("does not add an empty secondary-filter panel on Work Stages", () => {
    const html = renderToStaticMarkup(
      React.createElement(KanbanFilterBar, {
        leadSearch: React.createElement("input", { "aria-label": "Lead search" }),
      }),
    );

    expect(html).toContain('data-testid="kanban-filter-searches"');
    expect(html).not.toContain('data-testid="kanban-filter-controls"');
  });
});
