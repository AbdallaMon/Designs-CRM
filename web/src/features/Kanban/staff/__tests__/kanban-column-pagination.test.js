import { describe, expect, it } from "vitest";

import {
  hasMoreColumnItems,
  isNearKanbanColumnBottom,
} from "../kanban-column-pagination.js";

describe("Kanban column pagination", () => {
  it("stops on an exact final page when the API reports the total", () => {
    expect(
      hasMoreColumnItems({
        page: 0,
        pageSize: 20,
        totalItems: 20,
        receivedItems: 20,
      }),
    ).toBe(false);
  });

  it("keeps loading while another API page exists", () => {
    expect(
      hasMoreColumnItems({
        page: 0,
        pageSize: 20,
        totalItems: 21,
        receivedItems: 20,
      }),
    ).toBe(true);
  });

  it("falls back to the received page size when the API omits the total", () => {
    expect(
      hasMoreColumnItems({
        page: 0,
        pageSize: 20,
        totalItems: undefined,
        receivedItems: 20,
      }),
    ).toBe(true);
    expect(
      hasMoreColumnItems({
        page: 1,
        pageSize: 20,
        totalItems: undefined,
        receivedItems: 4,
      }),
    ).toBe(false);
  });

  it("accepts fractional browser dimensions near the scroll bottom", () => {
    expect(
      isNearKanbanColumnBottom({
        scrollHeight: 1000,
        scrollTop: 599.4,
        clientHeight: 400,
      }),
    ).toBe(true);
    expect(
      isNearKanbanColumnBottom({
        scrollHeight: 1000,
        scrollTop: 590,
        clientHeight: 400,
      }),
    ).toBe(false);
  });
});
