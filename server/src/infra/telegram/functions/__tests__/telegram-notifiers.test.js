import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadANote = vi.fn();

vi.mock("../telegram-uploads.js", () => ({ uploadANote }));

const { handleProjectReminder } = await import("../telegram-notifiers.js");

const reminder = {
  notifiedKey: "notified3Days",
  timeLeft: "3 days left",
  projectId: 9,
  clientLeadId: 17,
  type: "3D_Designer",
};

describe("Telegram project-delivery reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadANote.mockResolvedValue(undefined);
  });

  it("queues the reminder and marks its notification bucket after delivery", async () => {
    await handleProjectReminder(reminder);

    expect(uploadANote).toHaveBeenCalledWith({
      id: "9-17-notified3Days",
      clientLeadId: 17,
      content: "⏳ Project 3D_Designer delivery time : 3 days left",
      binMessage: true,
      update: {
        where: { id: 9 },
        key: "project",
        data: { notified3Days: true },
      },
    });
  });

  it("logs a project-specific error when Telegram delivery fails", async () => {
    const error = new Error("Telegram unavailable");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    uploadANote.mockRejectedValue(error);

    await expect(handleProjectReminder(reminder)).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Failed to handle reminder for project 9:",
      error,
    );
    errorSpy.mockRestore();
  });
});
