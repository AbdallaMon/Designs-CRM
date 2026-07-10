// audit module message CODES. SCREAMING_SNAKE_CASE, key === value (the string IS the
// code). Carried in the API envelope `message` field; the client resolves
// (translationKey: auditMessages, code) → displayed string. Language-neutral — never put
// Arabic/English prose here. Covers the read-only admin audit-log viewer.
export const auditMessagesCodes = {
  AUDIT_LOGS_FETCHED: "AUDIT_LOGS_FETCHED",
};
