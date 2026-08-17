import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../send-mail.js", () => ({
  sendEmail: vi.fn(),
}));

import { sendEmail } from "../send-mail.js";
import {
  sendReminderToClient,
  sendReminderToUser,
} from "../email-templates.js";

describe("reminder email remaining duration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-17T08:00:00.000Z"));
    sendEmail.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the actual rounded hours to the client instead of the cron bucket", async () => {
    await sendReminderToClient({
      clientEmail: "client@example.com",
      clientName: "Client",
      time: new Date("2026-08-17T09:30:00.000Z"),
      type: "MEETING",
      timeLabel: "4h",
    });

    const [, subject, html] = sendEmail.mock.calls[0];
    expect(subject).toContain("2 Hours");
    expect(html).toContain("begin in <strong>2 Hours</strong>");
    expect(subject).not.toContain("4 Hours");
  });

  it("uses the same actual duration for the assigned user email", async () => {
    await sendReminderToUser({
      userEmail: "sales@example.com",
      userName: "Sales",
      time: new Date("2026-08-17T10:10:00.000Z"),
      type: "MEETING",
      timeLabel: "4h",
      clientLeadId: 42,
    });

    const [, subject, html] = sendEmail.mock.calls[0];
    expect(subject).toContain("2 Hours");
    expect(html).toContain("scheduled in <strong>2 Hours</strong>");
  });

  it("keeps positive sub-hour reminders expressed as one hour", async () => {
    await sendReminderToClient({
      clientEmail: "client@example.com",
      clientName: "Client",
      time: new Date("2026-08-17T08:11:00.000Z"),
      type: "MEETING",
    });

    const [, subject] = sendEmail.mock.calls[0];
    expect(subject).toContain("1 Hour");
  });
});
