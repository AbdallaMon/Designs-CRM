import { beforeEach, describe, expect, it, vi } from "vitest";

const schedule = vi.fn();
const findMany = vi.fn();
const handleProjectReminder = vi.fn();

vi.mock("node-cron", () => ({ default: { schedule } }));
vi.mock("../../../../prisma/prisma.js", () => ({
  default: { project: { findMany } },
}));
vi.mock("../../telegram/telegram-functions.js", () => ({
  handleProjectReminder,
}));

const { startProjectDeliveryCron } = await import("../project-delivery.cron.js");

describe("project-delivery Telegram cron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany
      .mockResolvedValueOnce([
        {
          id: 9,
          clientLeadId: 17,
          type: "3D_Designer",
          deliveryTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    handleProjectReminder.mockResolvedValue(undefined);
  });

  it("registers the two-hour cron and processes projects through Prisma", async () => {
    let runScheduledTask;
    schedule.mockImplementation((expression, handler) => {
      runScheduledTask = handler;
      return { expression };
    });

    startProjectDeliveryCron();
    await runScheduledTask();

    expect(schedule).toHaveBeenCalledWith("0 */2 * * *", expect.any(Function));
    expect(findMany).toHaveBeenCalledTimes(4);
    expect(handleProjectReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        notifiedKey: "notified7Days",
        projectId: 9,
        clientLeadId: 17,
        type: "3D_Designer",
      }),
    );
  });
});
