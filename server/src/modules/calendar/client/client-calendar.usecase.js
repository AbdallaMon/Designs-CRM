// calendar/client usecase — the PUBLIC client booking surface (legacy
// routes/calendar/client-calendar.js, mounted at /client/calendar with NO auth gate). Every
// action authenticates the CLIENT via a per-meeting token (MeetingReminder.token) that the
// frozen service `verifyAndExtractCalendarToken` validates and expands into the
// reminderId/userId/clientLeadId/adminId context — exactly as the booking funnel and
// /files/client/* are public. There is NO permission code and NO session here, by design.
//
// Heavy logic (token verification, slot availability, booking + notification + email +
// Google sync) lives in the legacy services and is invoked via lazy adapters — never
// duplicated. The slot/day reads reuse the same availability service the staff surface uses.
const DEFAULT_TZ = "Asia/Dubai";

const legacyDefaults = {
  verifyAndExtractCalendarToken: (token) =>
    import("../../../../services/main/client/calendar.js").then((m) =>
      m.verifyAndExtractCalendarToken(token),
    ),
  verifySlotIsAvailableAndNotBooked: (a) =>
    import("../../../../services/main/client/calendar.js").then((m) =>
      m.verifySlotIsAvailableAndNotBooked(a),
    ),
  bookAMeeting: (a) =>
    import("../../../../services/main/client/calendar.js").then((m) => m.bookAMeeting(a)),
  getAvailableDays: (a) =>
    import("../../../../routes/calendar/new-calendar.js").then((m) => m.getAvailableDays(a)),
  getAvailableSlotsForDay: (a) =>
    import("../../../../routes/calendar/new-calendar.js").then((m) => m.getAvailableSlotsForDay(a)),
};

export class ClientCalendarUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // GET /meeting-data — expand the token into the booking context (legacy returned the raw
  // tokenData). The frozen service selects only booking-relevant fields (no secrets).
  meetingData({ token }) {
    return this.legacy.verifyAndExtractCalendarToken(token);
  }

  // GET /available-days — month grid for the meeting's admin (type CLIENT filters to
  // future, unbooked slots). adminId/userId come from the token, not the client.
  async availableDays({ token, month, timezone }) {
    const tokenData = await this.legacy.verifyAndExtractCalendarToken(token);
    return this.legacy.getAvailableDays({
      month,
      ...tokenData,
      type: "CLIENT",
      timezone,
    });
  }

  // GET /slots — slots for a date for the meeting's admin (type CLIENT).
  async slots({ token, date, dayId, timezone }) {
    const tokenData = await this.legacy.verifyAndExtractCalendarToken(token);
    return this.legacy.getAvailableSlotsForDay({
      date,
      dayId,
      ...tokenData,
      timezone,
      type: "CLIENT",
    });
  }

  // GET /slots/details — confirm a slot is still available + not booked (legacy verified
  // the token first, then checked the slot by id). Returns the slot row.
  async slotDetails({ token, slotId, timezone }) {
    await this.legacy.verifyAndExtractCalendarToken(token);
    return this.legacy.verifySlotIsAvailableAndNotBooked({ slotId: Number(slotId), timezone });
  }

  // POST /book — book the meeting. Legacy merged the request body (selectedSlot,
  // selectedTimezone) with the token context (reminderId, clientLeadId, ...) and called
  // bookAMeeting. The reminderId/clientLeadId ALWAYS come from the verified token — never
  // from the client body — which is why the public surface is safe without a session.
  async book({ token, body }) {
    const tokenData = await this.legacy.verifyAndExtractCalendarToken(token);
    return this.legacy.bookAMeeting({ ...body, ...tokenData });
  }

  // GET /timezones — static grouped IANA timezone list (no token; pure data, as legacy).
  timezones() {
    return Intl.supportedValuesOf("timeZone")
      .map((tz) => {
        const [region = "Other"] = tz.split("/");
        const label = tz.replace("_", " ");
        const currentTime = new Date().toLocaleTimeString("en-US", {
          timeZone: tz,
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        return { group: region, label: `${label} (${currentTime})`, value: tz };
      })
      .sort(
        (a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label),
      );
  }
}

export { DEFAULT_TZ };
export const clientCalendarUsecase = new ClientCalendarUsecase();
