// Calendar feature UI constants — tab labels (Arabic), default timezone, slot-generation
// defaults. Behavior preserved from the legacy staff calendar screens (NOT a redesign).

export const DEFAULT_TIMEZONE = "Asia/Dubai";

// Resolve the browser timezone, falling back to the studio default (legacy did the same).
export function resolveBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

// Tab keys for the authed calendar surface. Mirrors the legacy admin/staff tab set
// (preserved appearance): admins see [own booking, meetings & calls]; staff/super-sales
// additionally get an [admin booking] tab to manage another admin's availability.
// Labels are i18n keys resolved at render time via t() (see CalendarPage).
export const CALENDAR_TAB_LABEL_KEYS = {
  ownBooking: "calendar.tabs.ownBooking",
  adminBooking: "calendar.tabs.adminBooking",
  meetings: "calendar.tabs.meetings",
};

// Slot-generation defaults (legacy TimeSlotManager initial values).
export const SLOT_DEFAULTS = {
  startTime: "09:00",
  endTime: "17:00",
  meetingDuration: 60,
  breakDuration: 15,
};

// Public booking wizard step labels. Behavior preserved from ClientBooking. The labels are
// i18n keys; resolve at render time with buildBookingSteps(t).
export const BOOKING_STEP_KEYS = [
  "calendar.public.steps.pickDate",
  "calendar.public.steps.pickTime",
  "calendar.public.steps.confirm",
  "calendar.public.steps.done",
];

// Resolve the wizard step labels to localized strings. Call inside a component (needs t()).
export function buildBookingSteps(t) {
  const fallbacks = ["اختر التاريخ", "اختر الوقت", "تأكيد", "تم"];
  return BOOKING_STEP_KEYS.map((key, i) => t(key, fallbacks[i]));
}
