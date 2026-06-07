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
export const CALENDAR_TABS = {
  ownBooking: "تقويم الحجوزات الخاص بك",
  adminBooking: "تقويم حجوزات المسؤول",
  meetings: "المواعيد والمكالمات",
};

// Slot-generation defaults (legacy TimeSlotManager initial values).
export const SLOT_DEFAULTS = {
  startTime: "09:00",
  endTime: "17:00",
  meetingDuration: 60,
  breakDuration: 15,
};

// Public booking wizard step labels (Arabic). Behavior preserved from ClientBooking.
export const BOOKING_STEPS = ["اختر التاريخ", "اختر الوقت", "تأكيد", "تم"];
