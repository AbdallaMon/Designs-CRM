import { describe, expect, it } from "vitest";
import { REMINDER_TYPES } from "@dms/shared";
import { replaceLeadReminder } from "../reminder-state.js";

describe("replaceLeadReminder", () => {
  it("adds an updated meeting when the lead has no meeting reminder array", () => {
    const reminder = { id: 12, status: "MISSED" };
    const leads = [{ id: 1, name: "Lead" }];

    expect(
      replaceLeadReminder(leads, {
        leadId: 1,
        reminder,
        reminderType: REMINDER_TYPES.MEETING,
      }),
    ).toEqual([{ id: 1, name: "Lead", meetingReminders: [reminder] }]);
  });

  it("replaces the matching call reminder without mutating the lead", () => {
    const originalLead = {
      id: 1,
      callReminders: [
        { id: 7, status: "IN_PROGRESS" },
        { id: 8, status: "IN_PROGRESS" },
      ],
    };
    const reminder = { id: 7, status: "DONE" };

    const [updatedLead] = replaceLeadReminder([originalLead], {
      leadId: 1,
      reminder,
      reminderType: REMINDER_TYPES.CALL,
    });

    expect(updatedLead).toEqual({
      id: 1,
      callReminders: [reminder, { id: 8, status: "IN_PROGRESS" }],
    });
    expect(updatedLead).not.toBe(originalLead);
    expect(originalLead.callReminders[0].status).toBe("IN_PROGRESS");
  });
});
