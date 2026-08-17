import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  meetingReminder: {},
  $transaction: vi.fn(),
}));

vi.mock("../../../infra/prisma/prisma.js", () => ({ default: prismaMock }));

import { clientCalendarRepository } from "../client/client-calendar.repo.js";

describe("client calendar atomic reservation repository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("constrains the slot lookup to the token owner and requested date", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    prismaMock.$transaction.mockImplementation((work) =>
      work({ availableSlot: { findFirst } }),
    );
    const start = new Date("2026-06-09T20:00:00Z");
    const end = new Date("2026-06-10T20:00:00Z");

    await expect(
      clientCalendarRepository.reserveSlotAndUpdateReminder({
        slotId: 5,
        meetingReminderId: 10,
        expectedOwnerId: 30,
        requestedDateStart: start,
        requestedDateEnd: end,
        userTimezone: "Asia/Dubai",
      }),
    ).resolves.toEqual({ outcome: "not-found" });

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 5,
        startTime: { gte: start, lt: end },
        availableDay: {
          userId: 30,
          date: { gte: start, lt: end },
        },
      },
    });
  });

  it("rolls the slot claim back if the reminder was concurrently reserved", async () => {
    let slotBooked = false;
    prismaMock.$transaction.mockImplementation(async (work) => {
      const snapshot = slotBooked;
      const tx = {
        availableSlot: {
          findFirst: vi.fn().mockResolvedValue({
            id: 5,
            startTime: new Date("2026-06-10T09:00:00Z"),
          }),
          updateMany: vi.fn(async () => {
            if (slotBooked) return { count: 0 };
            slotBooked = true;
            return { count: 1 };
          }),
        },
        meetingReminder: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      };
      try {
        return await work(tx);
      } catch (error) {
        slotBooked = snapshot;
        throw error;
      }
    });

    const result = await clientCalendarRepository.reserveSlotAndUpdateReminder({
      slotId: 5,
      meetingReminderId: 10,
      expectedOwnerId: 30,
      requestedDateStart: new Date("2026-06-09T20:00:00Z"),
      requestedDateEnd: new Date("2026-06-10T20:00:00Z"),
      userTimezone: "Asia/Dubai",
    });

    expect(result).toEqual({ outcome: "already-booked" });
    expect(slotBooked).toBe(false);
  });
});
