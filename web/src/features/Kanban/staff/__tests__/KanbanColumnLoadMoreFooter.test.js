import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import KanbanColumnLoadMoreFooter from "../KanbanColumnLoadMoreFooter.jsx";

const renderFooter = (props = {}) =>
  renderToStaticMarkup(
    React.createElement(KanbanColumnLoadMoreFooter, {
      loading: false,
      error: false,
      hasMore: true,
      hasItems: true,
      onLoadMore: vi.fn(),
      onRetry: vi.fn(),
      statusColor: "#123456",
      ...props,
    }),
  );

describe("KanbanColumnLoadMoreFooter", () => {
  it("shows a manual fallback instead of a false loading message while idle", () => {
    const html = renderFooter();

    expect(html).toContain("Load more");
    expect(html).not.toContain("Loading more...");
  });

  it("shows progress only while the next page is being requested", () => {
    const html = renderFooter({ loading: true });

    expect(html).toContain("Loading more...");
    expect(html).not.toContain(">Load more<");
  });

  it("shows an explicit next-page error and retry action", () => {
    const html = renderFooter({ error: true });

    expect(html).toContain("Couldn&#x27;t load more items.");
    expect(html).toContain("Retry loading more");
  });
});
