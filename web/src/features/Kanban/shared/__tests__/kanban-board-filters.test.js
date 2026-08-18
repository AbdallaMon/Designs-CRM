import { describe, expect, it } from "vitest";

import { getVisibleKanbanStatuses } from "../kanban-board-filters.js";

const STATUSES = ["LEVEL_1", "LEVEL_2", "LEVEL_3"];

describe("getVisibleKanbanStatuses", () => {
  it("keeps every contract-level column when no level is selected", () => {
    expect(
      getVisibleKanbanStatuses({ statusArray: STATUSES }),
    ).toEqual(STATUSES);
  });

  it("shows only the selected contract-level column", () => {
    expect(
      getVisibleKanbanStatuses({
        statusArray: STATUSES,
        selectedStatus: "LEVEL_2",
      }),
    ).toEqual(["LEVEL_2"]);
  });

  it("keeps every column when the All option is selected", () => {
    expect(
      getVisibleKanbanStatuses({
        statusArray: STATUSES,
        selectedStatus: "all",
      }),
    ).toEqual(STATUSES);
  });
});
