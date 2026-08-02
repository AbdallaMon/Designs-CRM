// Morning-digest unit tests: recipient filtering, empty-queue skip, unsupported-profile
// skip, top-N cap, and the sendToUser payload (type + link + email subject). The cron
// registration itself isn't under test — runMyDayDigest is exercised with an injected
// clock and fully mocked collaborators.
import { describe, it, expect, vi, beforeEach } from "vitest";

const userFindMany = vi.fn();
vi.mock("@dms/db", () => ({
  default: { user: { findMany: (...a) => userFindMany(...a) } },
}));
vi.mock("../../../modules/my-day/my-day.usecase.js", () => ({
  myDayUsecase: { getMyQueue: vi.fn() },
}));
vi.mock("../../../shared/notifications/notification.service.js", () => ({
  sendToUser: vi.fn(),
}));

import { myDayUsecase } from "../../../modules/my-day/my-day.usecase.js";
import { sendToUser } from "../../../shared/notifications/notification.service.js";
import { runMyDayDigest, DIGEST_TOP_N } from "../my-day-digest.cron.js";

const NOW = new Date("2026-07-15T04:00:00.000Z"); // 08:00 Asia/Dubai

const item = (leadId, type = "CALL_OVERDUE") => ({
  kind: "LEAD",
  leadId,
  clientName: `Client ${leadId}`,
  signals: [{ type, severity: "critical", params: {} }],
});

beforeEach(() => {
  vi.clearAllMocks();
  userFindMany.mockResolvedValue([
    { id: 7, name: "Rep", currentProfile: { key: "NORMAL_SALES" } },
    { id: 8, name: "Quiet", currentProfile: { key: "NORMAL_SALES" } },
    { id: 9, name: "AdminProfiled", currentProfile: { key: "ADMIN" } },
  ]);
  myDayUsecase.getMyQueue.mockImplementation(async ({ authUser }) => {
    if (authUser.id === 7) {
      return { items: [item(1), item(2), item(3), item(4), item(5), item(6), item(7)] };
    }
    if (authUser.id === 8) return { items: [] };
    const err = new Error("MY_DAY_PROFILE_UNSUPPORTED");
    err.statusCode = 403;
    throw err;
  });
});

describe("runMyDayDigest", () => {
  it("sends only to users with a non-empty queue; skips empty + unsupported profiles", async () => {
    const result = await runMyDayDigest({ now: NOW });
    expect(result).toEqual({ candidates: 3, sent: 1 });
    expect(sendToUser).toHaveBeenCalledTimes(1);
    expect(sendToUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        type: "MY_DAY_DIGEST",
        options: expect.objectContaining({
          link: "/dashboard/my-day",
          emailSubject: expect.stringContaining("morning brief"),
        }),
      }),
    );
  });

  it("caps the digest content at DIGEST_TOP_N items and notes the remainder", async () => {
    await runMyDayDigest({ now: NOW });
    const { content } = sendToUser.mock.calls[0][0];
    expect(content).toContain("7 item(s)");
    // Top 5 named, the remaining 2 summarized.
    expect(content).toContain(`Client ${DIGEST_TOP_N}`);
    expect(content).not.toContain(`Client ${DIGEST_TOP_N + 1} —`);
    expect(content).toContain("+2 more");
  });

  it("queries only active users holding a personal-queue profile", async () => {
    await runMyDayDigest({ now: NOW });
    const where = userFindMany.mock.calls[0][0].where;
    expect(where.isActive).toBe(true);
    expect(where.currentProfile.key.in).toEqual(
      expect.arrayContaining(["NORMAL_SALES", "ACCOUNTANT", "CONTACT_INITIATOR"]),
    );
    expect(where.currentProfile.key.in).not.toContain("ADMIN");
  });

  it("one failed send doesn't abort the run", async () => {
    userFindMany.mockResolvedValue([
      { id: 7, name: "A", currentProfile: { key: "NORMAL_SALES" } },
      { id: 10, name: "B", currentProfile: { key: "NORMAL_SALES" } },
    ]);
    myDayUsecase.getMyQueue.mockResolvedValue({ items: [item(1)] });
    sendToUser.mockRejectedValueOnce(new Error("smtp down"));
    const result = await runMyDayDigest({ now: NOW });
    expect(result.sent).toBe(1); // second user still delivered
    expect(sendToUser).toHaveBeenCalledTimes(2);
  });
});
