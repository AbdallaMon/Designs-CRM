// English mirror of the LEADS message CODES (namespace "leadsMessages").
// CODE → English. Mirrors keys 1:1 with ../leads.js (the Arabic map). Bilingual Phase 1.

export const leadsMessagesEn = {
  // reads / generic
  LEADS_FETCHED: "Leads retrieved",
  LEAD_FETCHED: "Lead data retrieved",
  DEALS_FETCHED: "Deals retrieved",
  COLUMNS_FETCHED: "Columns retrieved",
  CALLS_FETCHED: "Calls retrieved",
  MEETINGS_FETCHED: "Meetings retrieved",
  MEETING_REMINDERS_FETCHED: "Meeting reminders retrieved",
  MEETING_REMINDER_FETCHED: "Meeting reminder retrieved",
  COUNTRY_CHECK_DONE: "Country checked",

  // success / mutations
  LEAD_UPDATED: "Lead updated",
  LEAD_ASSIGNED: "Lead assigned to you",
  LEAD_CONVERTED: "Lead converted",
  LEADS_BULK_CONVERTED: "Selected leads converted",
  LEAD_MOVED_TO_CONVERTED: "Lead moved to converted",
  LEAD_STATUS_CHANGED: "Lead status changed",
  LEAD_PRICE_UPDATED: "Price updated",
  CALL_REMINDER_CREATED: "Call reminder created",
  CALL_REMINDER_UPDATED: "Call result updated",
  MEETING_REMINDER_CREATED: "Meeting reminder created",
  MEETING_REMINDER_UPDATED: "Meeting result updated",
  PRICE_OFFER_CREATED: "Price offer created",
  PRICE_OFFER_STATUS_CHANGED: "Price offer status updated",
  PAYMENTS_ADDED: "Payments added",
  FILE_SAVED: "File saved",
  NOTE_ADDED: "Note added",
  REMINDER_SENT: "Reminder sent",

  // errors / scope / guards
  LEAD_NOT_FOUND: "Lead not found",
  LEAD_ACCESS_DENIED: "You don't have permission to access this lead",
  LEAD_MUTATE_DENIED: "You don't have permission to edit this lead",
  CALL_REMINDER_NOT_FOUND: "Call reminder not found",
  MEETING_REMINDER_NOT_FOUND: "Meeting reminder not found",
  PRICE_OFFER_NOT_FOUND: "Price offer not found",
  LEAD_STATUS_TRANSITION_FORBIDDEN: "The status can't change from the current state",
  LEAD_ALREADY_ASSIGNED: "This lead is already assigned",
  LEAD_COUNTRY_NOT_ALLOWED: "This country is not allowed for you",
  LEAD_MAX_ACTIVE_REACHED: "You've reached the maximum number of active leads",
  LEAD_MAX_PER_DAY_REACHED: "You've reached the daily maximum number of leads",
  MEETING_NOT_ALLOWED_FOR_ROLE: "This role can't create/edit meetings",
  REMINDER_TIME_IN_PAST: "The reminder time is in the past",
  NO_AVAILABLE_SLOT: "No available slot",
  PRICE_OFFER_RANGE_INVALID: "The price range is invalid",
  NOTE_CONTENT_EMPTY: "The note content is empty",
  FILE_FIELDS_REQUIRED: "File fields are required",
  BULK_CONVERT_FORBIDDEN: "You don't have permission for bulk conversion",
  LEAD_CONVERT_REQUIRES_OWNER: "A lead must be assigned to a staff member before converting it to a deal",

  // public client lead funnel
  CLIENT_LEAD_CREATED: "Your request was sent successfully",
  CLIENT_LEAD_REGISTERED: "Registered successfully",
  CLIENT_LEAD_REGISTER_COMPLETED: "Registration completed successfully",
  CLIENT_LEAD_ALREADY_TODAY: "You've already sent a request today, try again tomorrow",
  CLIENT_LEAD_ALREADY_COMPLETED: "This registration is already completed",
  COOPERATION_REQUEST_SENT: "Cooperation request sent successfully",
};
