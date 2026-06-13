// CENTRAL message resolver — turns a language-neutral backend CODE (e.g. "INVALID_CREDENTIALS",
// "LEAD_NOT_FOUND") into an Arabic display string. The migrated /v2 backend sends CODES, never
// prose, so the data layer (getData / getDataAndSet / handleRequestSubmit) resolves them here.
// Relocated into helpers/ so it no longer depends on the (removed) v2 feature folders — the
// per-feature Arabic maps now live standalone under ./maps.

import { accountingMessages } from "./maps/accountingMessages";
import { adminResidualMessages } from "./maps/adminResidualMessages";
import { calendarMessages } from "./maps/calendarMessages";
import { chatMessages } from "./maps/chatMessages";
import { contractsMessages } from "./maps/contractsMessages";
import { coursesMessages } from "./maps/coursesMessages";
import { dashboardMessages } from "./maps/dashboardMessages";
import { imageSessionsMessages } from "./maps/imageSessionsMessages";
import { leadsMessages } from "./maps/leadsMessages";
import { notificationsMessages } from "./maps/notificationsMessages";
import { projectsMessages } from "./maps/projectsMessages";
import { questionsMessages } from "./maps/questionsMessages";
import { reviewsMessages } from "./maps/reviewsMessages";
import { salesStagesMessages } from "./maps/salesStagesMessages";
import { siteUtilityMessages } from "./maps/siteUtilityMessages";
import { usersMessages } from "./maps/usersMessages";
import { utilitiesMessages } from "./maps/utilitiesMessages";
import { authMessages, DEFAULT_FALLBACK_MESSAGE } from "./authMessages";

// authMessages spread LAST so the fully-phrased generic/auth strings win on collision.
const MESSAGES = {
  ...accountingMessages,
  ...adminResidualMessages,
  ...calendarMessages,
  ...chatMessages,
  ...contractsMessages,
  ...coursesMessages,
  ...dashboardMessages,
  ...imageSessionsMessages,
  ...leadsMessages,
  ...notificationsMessages,
  ...projectsMessages,
  ...questionsMessages,
  ...reviewsMessages,
  ...salesStagesMessages,
  ...siteUtilityMessages,
  ...usersMessages,
  ...utilitiesMessages,
  ...authMessages,
};

/**
 * Resolve ANY backend message CODE to an Arabic display string.
 * @param {unknown} code  the language-neutral CODE from the response envelope.
 * @param {{ fallback?: string }} [opts]  fallback shown when the code is unknown.
 * @returns {string} a user-facing Arabic string — never the raw code.
 */
export function resolveMessage(code, { fallback } = {}) {
  if (typeof code === "string" && MESSAGES[code]) return MESSAGES[code];
  return fallback ?? DEFAULT_FALLBACK_MESSAGE;
}

export { DEFAULT_FALLBACK_MESSAGE };
