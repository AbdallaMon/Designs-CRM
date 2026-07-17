// Single-language (English) resolution for backend message CODES emitted by the audit
// surface ({ success, message: CODE, translationKey: "auditMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/audit/audit.js); this is the FE
// lookup. Mirrors features/*/…/usersMessages.js. Unknown codes fall back to a generic
// string via the central resolver.
export const auditMessages = {
  // ── audit: reads ───────────────────────────────────────────────────────────────────
  AUDIT_LOGS_FETCHED: "Audit logs fetched",
};

/**
 * Resolve an audit backend message CODE to its English display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveAuditMessage(code, { fallback } = {}) {
  if (code && auditMessages[code]) return auditMessages[code];
  return fallback ?? "Operation completed";
}
