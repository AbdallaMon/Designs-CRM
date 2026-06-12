// Per-feature UI dictionary: calendar / scheduling
//
// COMPOSITION MODEL: one file per feature/area. Fill BOTH `ar` and `en` with the SAME keys,
// namespaced under "calendar.*" (e.g. "calendar.title", "calendar.actions.create"). The barrel
// (./index.js) deep-merges every stub's `ar` into one ar map and `en` into one en map, then
// uiDictionary merges those on top of its core keys. You do NOT edit the barrel or uiDictionary —
// just fill this file and call t("calendar.<key>") in the feature's components.
//
// CONTRACT: ar is the existing/authoritative wording (byte-identical to the original literals);
// en is the additive translation. Keys identical across ar and en. Arabic stays the default.

export const ar = {
  // CalendarPage
  "calendar.title": "التقويم",
  "calendar.noAccess": "لا تملك صلاحية الوصول إلى التقويم",
  "calendar.ownBookingTitle": "تقويم الحجوزات الخاص بك",

  // Tab labels (calendarConstants CALENDAR_TABS)
  "calendar.tabs.ownBooking": "تقويم الحجوزات الخاص بك",
  "calendar.tabs.adminBooking": "تقويم حجوزات المسؤول",
  "calendar.tabs.meetings": "المواعيد والمكالمات",

  // AdminBookingPanel
  "calendar.manageAvailability": "إدارة التوفر",
  "calendar.multiSelectDays": "تحديد أيام متعددة",
  "calendar.selectedDays": "الأيام المحددة ({count})",
  "calendar.setupSelectedDays": "إعداد الأيام المحددة",
  "calendar.clearSelection": "مسح التحديد",

  // StaffAdminSelector
  "calendar.selectAdmin": "اختر المسؤول *",
  "calendar.loading": "جاري التحميل...",
  "calendar.manageAdminAvailability": "إدارة توفر المسؤول",

  // AvailabilityCalendar legend
  "calendar.legend.available": "متاح",
  "calendar.legend.unavailable": "غير متاح",
  "calendar.legend.selected": "محدد",

  // GoogleConnectCard
  "calendar.google.title": "تقويم جوجل",
  "calendar.google.subtitle": "اربط حسابك لمزامنة المواعيد تلقائياً",
  "calendar.google.connected": "مرتبط",
  "calendar.google.disconnected": "غير مرتبط",
  "calendar.google.disconnect": "إلغاء الربط",
  "calendar.google.connect": "ربط الحساب",
  "calendar.google.connecting": "جاري إنشاء رابط الربط...",
  "calendar.google.disconnecting": "جاري إلغاء الربط...",

  // MeetingsMonthView
  "calendar.meetings": "المواعيد",
  "calendar.calls": "المكالمات",
  "calendar.noMeetingsThisDay": "لا توجد مواعيد في هذا اليوم",
  "calendar.noCallsThisDay": "لا توجد مكالمات في هذا اليوم",
  "calendar.today": "اليوم",
  "calendar.stats.meetings": "مواعيد",
  "calendar.stats.calls": "مكالمات",
  "calendar.stats.activeDays": "أيام نشطة",
  "calendar.showOwnDataOnly": "عرض بياناتك فقط",
  "calendar.meetingCount": "{count} موعد",
  "calendar.callCount": "{count} مكالمة",
  "calendar.clickHighlightedDays": "اضغط على الأيام المميزة لعرض التفاصيل",

  // TimeSlotManager
  "calendar.slot.setupSlots": "إعداد المواعيد",
  "calendar.slot.daysSelected": "{count} يوم محدد",
  "calendar.slot.generationSettings": "إعدادات توليد المواعيد",
  "calendar.slot.startTime": "وقت البدء",
  "calendar.slot.endTime": "وقت الانتهاء",
  "calendar.slot.duration": "المدة (دقيقة)",
  "calendar.slot.break": "الاستراحة (دقيقة)",
  "calendar.slot.generate": "توليد المواعيد",
  "calendar.slot.generatedSlots": "المواعيد المُولّدة ({count})",
  "calendar.slot.booked": "محجوز",
  "calendar.slot.available": "متاح",
  "calendar.slot.deleteDay": "حذف اليوم",
  "calendar.slot.close": "إغلاق",
  "calendar.slot.saving": "جاري حفظ المواعيد...",
  "calendar.slot.deletingSlot": "جاري حذف الموعد...",
  "calendar.slot.deletingDay": "جاري حذف اليوم...",

  // Public booking wizard steps (calendarConstants BOOKING_STEPS)
  "calendar.public.steps.pickDate": "اختر التاريخ",
  "calendar.public.steps.pickTime": "اختر الوقت",
  "calendar.public.steps.confirm": "تأكيد",
  "calendar.public.steps.done": "تم",

  // PublicBooking
  "calendar.public.changeTimezone": "غيّر منطقتك الزمنية",
  "calendar.public.timezonePlaceholder": "اختر منطقتك الزمنية",
  "calendar.public.availableSlots": "المواعيد المتاحة",
  "calendar.public.timezoneLabel": "المنطقة الزمنية: {tz}",
  "calendar.public.confirmBooking": "تأكيد الحجز",
  "calendar.public.reviewDetails": "يرجى مراجعة تفاصيل الحجز أدناه",
  "calendar.public.date": "التاريخ:",
  "calendar.public.time": "الوقت:",
  "calendar.public.bookingConfirmed": "تم تأكيد الحجز! 🎉",
  "calendar.public.thanksMessage": "شكراً لحجزك معنا. تم جدولة موعدك بنجاح.",
  "calendar.public.appointmentDetails": "تفاصيل الموعد",
  "calendar.public.confirmationEmailSent": "📧 تم إرسال بريد تأكيد.",
  "calendar.public.addToCalendar": "📅 يرجى إضافة هذا الموعد إلى تقويمك",
  "calendar.public.rescheduleContact": "❓ إذا احتجت لإعادة الجدولة أو الإلغاء، يرجى التواصل معنا",
  "calendar.public.errorTitle": "حدث خطأ ما",
  "calendar.public.refreshPage": "تحديث الصفحة",
  "calendar.public.errorHint": "إذا استمرت المشكلة، يرجى التواصل مع الدعم أو المحاولة لاحقاً.",
  "calendar.public.bookAppointment": "احجز موعداً",
  "calendar.public.stepProgress": "الخطوة {current} من {total}: {label}",
  "calendar.public.previous": "السابق",
  "calendar.public.next": "التالي",
  "calendar.public.continue": "متابعة",
  "calendar.public.booking": "جاري الحجز...",
  "calendar.public.slotDetailsError": "تعذر جلب تفاصيل الموعد. حاول مرة أخرى.",
};

export const en = {
  // CalendarPage
  "calendar.title": "Calendar",
  "calendar.noAccess": "You do not have permission to access the calendar",
  "calendar.ownBookingTitle": "Your booking calendar",

  // Tab labels
  "calendar.tabs.ownBooking": "Your booking calendar",
  "calendar.tabs.adminBooking": "Admin booking calendar",
  "calendar.tabs.meetings": "Meetings & calls",

  // AdminBookingPanel
  "calendar.manageAvailability": "Manage availability",
  "calendar.multiSelectDays": "Select multiple days",
  "calendar.selectedDays": "Selected days ({count})",
  "calendar.setupSelectedDays": "Set up selected days",
  "calendar.clearSelection": "Clear selection",

  // StaffAdminSelector
  "calendar.selectAdmin": "Select admin *",
  "calendar.loading": "Loading...",
  "calendar.manageAdminAvailability": "Manage admin availability",

  // AvailabilityCalendar legend
  "calendar.legend.available": "Available",
  "calendar.legend.unavailable": "Unavailable",
  "calendar.legend.selected": "Selected",

  // GoogleConnectCard
  "calendar.google.title": "Google Calendar",
  "calendar.google.subtitle": "Connect your account to sync appointments automatically",
  "calendar.google.connected": "Connected",
  "calendar.google.disconnected": "Not connected",
  "calendar.google.disconnect": "Disconnect",
  "calendar.google.connect": "Connect account",
  "calendar.google.connecting": "Creating connection link...",
  "calendar.google.disconnecting": "Disconnecting...",

  // MeetingsMonthView
  "calendar.meetings": "Meetings",
  "calendar.calls": "Calls",
  "calendar.noMeetingsThisDay": "No meetings on this day",
  "calendar.noCallsThisDay": "No calls on this day",
  "calendar.today": "Today",
  "calendar.stats.meetings": "Meetings",
  "calendar.stats.calls": "Calls",
  "calendar.stats.activeDays": "Active days",
  "calendar.showOwnDataOnly": "Show your data only",
  "calendar.meetingCount": "{count} meeting",
  "calendar.callCount": "{count} call",
  "calendar.clickHighlightedDays": "Click the highlighted days to view details",

  // TimeSlotManager
  "calendar.slot.setupSlots": "Set up slots",
  "calendar.slot.daysSelected": "{count} days selected",
  "calendar.slot.generationSettings": "Slot generation settings",
  "calendar.slot.startTime": "Start time",
  "calendar.slot.endTime": "End time",
  "calendar.slot.duration": "Duration (minutes)",
  "calendar.slot.break": "Break (minutes)",
  "calendar.slot.generate": "Generate slots",
  "calendar.slot.generatedSlots": "Generated slots ({count})",
  "calendar.slot.booked": "Booked",
  "calendar.slot.available": "Available",
  "calendar.slot.deleteDay": "Delete day",
  "calendar.slot.close": "Close",
  "calendar.slot.saving": "Saving slots...",
  "calendar.slot.deletingSlot": "Deleting slot...",
  "calendar.slot.deletingDay": "Deleting day...",

  // Public booking wizard steps
  "calendar.public.steps.pickDate": "Pick a date",
  "calendar.public.steps.pickTime": "Pick a time",
  "calendar.public.steps.confirm": "Confirm",
  "calendar.public.steps.done": "Done",

  // PublicBooking
  "calendar.public.changeTimezone": "Change your timezone",
  "calendar.public.timezonePlaceholder": "Select your timezone",
  "calendar.public.availableSlots": "Available slots",
  "calendar.public.timezoneLabel": "Timezone: {tz}",
  "calendar.public.confirmBooking": "Confirm booking",
  "calendar.public.reviewDetails": "Please review the booking details below",
  "calendar.public.date": "Date:",
  "calendar.public.time": "Time:",
  "calendar.public.bookingConfirmed": "Booking confirmed! 🎉",
  "calendar.public.thanksMessage": "Thank you for booking with us. Your appointment has been scheduled successfully.",
  "calendar.public.appointmentDetails": "Appointment details",
  "calendar.public.confirmationEmailSent": "📧 A confirmation email has been sent.",
  "calendar.public.addToCalendar": "📅 Please add this appointment to your calendar",
  "calendar.public.rescheduleContact": "❓ If you need to reschedule or cancel, please contact us",
  "calendar.public.errorTitle": "Something went wrong",
  "calendar.public.refreshPage": "Refresh page",
  "calendar.public.errorHint": "If the problem persists, please contact support or try again later.",
  "calendar.public.bookAppointment": "Book an appointment",
  "calendar.public.stepProgress": "Step {current} of {total}: {label}",
  "calendar.public.previous": "Previous",
  "calendar.public.next": "Next",
  "calendar.public.continue": "Continue",
  "calendar.public.booking": "Booking...",
  "calendar.public.slotDetailsError": "Could not fetch slot details. Please try again.",
};
