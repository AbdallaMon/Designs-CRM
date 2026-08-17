import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../modules/notifications/notification.usecase.js", () => ({
  createNotification: vi.fn(),
}));

vi.mock("../../../../modules/users/user/user.repo.js", () => ({
  userRepository: {
    getUserDetailsWithSpecificFields: vi.fn(),
  },
}));

import { createNotification } from "../../../../modules/notifications/notification.usecase.js";
import { userRepository } from "../../../../modules/users/user/user.repo.js";
import {
  assignLeadNotification,
  assignMultipleLeadsNotification,
  consultedLeadNotification,
  newClientLeadNotification,
  newLeadCompletedNotification,
  newLeadNotification,
} from "../lead-notifications.js";

describe("lead notification lifecycle recipients", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["new lead", newLeadNotification],
    ["initial registration", newClientLeadNotification],
    ["completed registration", newLeadCompletedNotification],
  ])("sends a non-consulted %s notification only to admin profiles", async (_label, sender) => {
    await sender(42, { name: "Client" }, true);

    expect(createNotification).toHaveBeenCalledTimes(1);
    const args = createNotification.mock.calls[0];
    expect(args[0]).toBeNull();
    expect(args[1]).toBe(false);
    expect(args[8]).toBe(42);
    expect(args[10]).toEqual(["ADMIN", "SUPER_ADMIN"]);
    expect(args[11]).toBe(true);
  });

  it("sends the consulted-ready notification only to sales profiles", async () => {
    await consultedLeadNotification(42);

    expect(createNotification).toHaveBeenCalledTimes(1);
    const args = createNotification.mock.calls[0];
    expect(args[0]).toBeNull();
    expect(args[1]).toBe(false);
    expect(args[8]).toBe(42);
    expect(args[10]).toEqual(["NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES"]);
    expect(args[11]).toBe(true);
  });

  it("sends an individually assigned lead to the recipient as well as admins", async () => {
    userRepository.getUserDetailsWithSpecificFields.mockResolvedValue({
      id: 7,
      name: "Assigned User",
    });

    await assignLeadNotification(42, 7, { id: 42 });

    expect(createNotification).toHaveBeenCalledTimes(1);
    const args = createNotification.mock.calls[0];
    expect(args[0]).toBe(7);
    expect(args[1]).toBe(true);
    expect(args[9]).toBe(7);
  });

  it("sends bulk converted/assigned leads to the recipient as well as admins", async () => {
    userRepository.getUserDetailsWithSpecificFields.mockResolvedValue({
      id: 7,
      name: "Assigned User",
    });

    await assignMultipleLeadsNotification([42, 43], 7);

    expect(createNotification).toHaveBeenCalledTimes(1);
    const args = createNotification.mock.calls[0];
    expect(args[0]).toBe(7);
    expect(args[1]).toBe(true);
    expect(args[9]).toBe(7);
  });
});
