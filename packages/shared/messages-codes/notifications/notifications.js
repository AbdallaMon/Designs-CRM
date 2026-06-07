// notifications module message CODES. SCREAMING_SNAKE_CASE, key === value (the string
// IS the code). Carried in the API envelope `message` field; the client resolves
// (translationKey: notificationsMessages, code) → displayed string. Language-neutral —
// never put Arabic/English prose here.
//
// Covers the self-scoped notification reads (paginated all + unread) and the
// mark-own-as-read workflow action. The IDOR-prone legacy endpoints
// (`/utility/notification/*`, unauthenticated + client-supplied userId) are replaced by
// authenticated, self-scoped (req.auth.id) v2 endpoints.
export const notificationsMessagesCodes = {
  NOTIFICATIONS_FETCHED: "NOTIFICATIONS_FETCHED",
  UNREAD_NOTIFICATIONS_FETCHED: "UNREAD_NOTIFICATIONS_FETCHED",
  NOTIFICATIONS_MARKED_READ: "NOTIFICATIONS_MARKED_READ",
};
