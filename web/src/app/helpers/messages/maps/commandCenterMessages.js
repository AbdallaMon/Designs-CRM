// Single-language (English) resolution for backend message CODES emitted by the
// command-center surface ({ success, message: CODE, translationKey: "commandCenterMessages" }).
// The backend stays language-neutral (packages/shared/messages-codes/command-center/
// command-center.js); this is the FE lookup. Mirrors maps/auditMessages.js. Unknown codes
// fall back to a generic string via the central resolver.
export const commandCenterMessages = {
  // ── command-center: reads ────────────────────────────────────────────────────────────
  COMMAND_CENTER_FETCHED: "Command center loaded",
};

/**
 * Resolve a command-center backend message CODE to its English display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveCommandCenterMessage(code, { fallback } = {}) {
  if (code && commandCenterMessages[code]) return commandCenterMessages[code];
  return fallback ?? "Operation completed";
}
