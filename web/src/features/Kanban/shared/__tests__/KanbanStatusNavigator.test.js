import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import KanbanStatusNavigator from "../KanbanStatusNavigator.jsx";

describe("KanbanStatusNavigator", () => {
  it("renders explicit previous/next controls and a selectable status map", () => {
    const html = renderToStaticMarkup(
      React.createElement(KanbanStatusNavigator, {
        statuses: ["IN_PROGRESS", "INTERESTED", "FINALIZED"],
        activeIndex: 1,
        onSelect: vi.fn(),
        onPrevious: vi.fn(),
        onNext: vi.fn(),
      }),
    );

    expect(html).toContain('aria-label="Previous column"');
    expect(html).toContain('aria-label="Next column"');
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("IN PROGRESS");
    expect(html).toContain("FINALIZED");
  });
});

