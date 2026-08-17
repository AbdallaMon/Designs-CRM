import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const update = vi.fn();

vi.mock("../../../../infra/prisma/prisma.js", () => ({
  default: {
    user: {
      findUnique: (...args) => findUnique(...args),
      update: (...args) => update(...args),
    },
  },
}));

import { userRepository } from "../user.repo.js";

describe("user profile settings repository projection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUnique.mockResolvedValue(null);
    update.mockResolvedValue(null);
  });

  it("returns the notification preferences and non-secret Google identity", async () => {
    await userRepository.findUserProfileById({ userId: 3 });

    const select = findUnique.mock.calls[0][0].select;
    expect(select).toMatchObject({
      allowNotification: true,
      allowEmailing: true,
      googleEmail: true,
    });
    expect(select).not.toHaveProperty("googleRefreshToken");
    expect(select).not.toHaveProperty("googleAccessToken");
  });

  it("returns the same settings after an update", async () => {
    await userRepository.updateUserProfile({
      userId: 3,
      data: { allowNotification: false, allowEmailing: false },
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { allowNotification: false, allowEmailing: false },
        select: expect.objectContaining({
          allowNotification: true,
          allowEmailing: true,
          googleEmail: true,
        }),
      }),
    );
  });
});
