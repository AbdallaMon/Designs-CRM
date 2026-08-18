import { REMINDER_TYPES } from "@dms/shared";

export function replaceLeadReminder(
  leads,
  { leadId, reminder, reminderType },
) {
  const remindersKey =
    reminderType === REMINDER_TYPES.MEETING
      ? "meetingReminders"
      : "callReminders";

  return leads.map((lead) => {
    if (lead.id !== leadId) return lead;

    const reminders = Array.isArray(lead[remindersKey])
      ? lead[remindersKey]
      : [];

    return {
      ...lead,
      [remindersKey]: [
        reminder,
        ...reminders.filter((item) => item.id !== reminder.id),
      ],
    };
  });
}
