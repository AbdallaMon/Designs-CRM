// CENTRAL message resolver — the single place that turns a language-neutral backend
// CODE (e.g. "INVALID_CREDENTIALS", "LOGIN_SUCCESS", "LEAD_NOT_FOUND") into an Arabic
// display string for the user.
//
// Why this exists: the per-feature *.mutations.js runners already resolved codes via
// their own feature map, but the GENERIC data layer (handleRequestSubmit / getData /
// useRequest) and the entire AUTH flow showed the RAW code to the user. This resolver
// aggregates ALL the per-feature maps PLUS the auth/generic map so every path can
// resolve any code the backend might emit, with a safe Arabic fallback.
//
// This is ADDITIVE: the per-feature resolvers (resolveUsersMessage, resolveLeadMessage,
// …) are untouched and keep working. The central map simply REUSES their maps.
//
// Resolution order: known code → its Arabic; else explicit `fallback`; else a neutral
// Arabic message. The raw code is never returned to the user as a normal outcome.

// ── per-feature Arabic maps (read-only reuse; do NOT modify the feature files) ──────
import { accountingMessages } from "@/app/v2/features/accounting/config/accountingMessages";
import { adminResidualMessages } from "@/app/v2/features/adminResidual/config/adminResidualMessages";
import { calendarMessages } from "@/app/v2/features/calendar/config/calendarMessages";
import { chatMessages } from "@/app/v2/features/chat/config/chatMessages";
import { contractsMessages } from "@/app/v2/features/contracts/config/contractsMessages";
import { coursesMessages } from "@/app/v2/features/courses/config/coursesMessages";
import { dashboardMessages } from "@/app/v2/features/dashboard/config/dashboardMessages";
import { imageSessionsMessages } from "@/app/v2/features/imageSessions/config/imageSessionsMessages";
import { leadsMessages } from "@/app/v2/features/leads/config/leadsMessages";
import { notificationsMessages } from "@/app/v2/features/notifications/config/notificationsMessages";
import { projectsMessages } from "@/app/v2/features/projects/config/projectsMessages";
import { questionsMessages } from "@/app/v2/features/questions/config/questionsMessages";
import { reviewsMessages } from "@/app/v2/features/reviews/config/reviewsMessages";
import { salesStagesMessages } from "@/app/v2/features/salesStages/config/salesStagesMessages";
import { siteUtilityMessages } from "@/app/v2/features/siteUtility/config/siteUtilityMessages";
import { usersMessages } from "@/app/v2/features/users/config/usersMessages";
import { utilitiesMessages } from "@/app/v2/features/utilities/config/utilitiesMessages";

// ── auth + generic envelope map (authored in this folder) ──────────────────────────
import { authMessages, DEFAULT_FALLBACK_MESSAGE } from "./authMessages";

// Merge order matters only for colliding keys. Every collision is a generic envelope
// code (OK, CREATED, NOT_FOUND, FORBIDDEN, …) whose Arabic value is equivalent across
// maps, so any winner is correct. We spread `authMessages` LAST so the central,
// fully-phrased generic/auth strings win on collision. Object spread silently overwrites
// duplicate keys (no crash) — there is no duplicate-key throw at runtime.
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
 *
 * @param {unknown} code  the language-neutral CODE from the response envelope
 *   (`response.message`). Robust to undefined / null / non-string.
 * @param {{ fallback?: string }} [opts]
 *   `fallback` — shown when the code is unknown (e.g. a feature-specific Arabic phrase
 *   the caller already has). When omitted, a neutral Arabic message is used.
 * @returns {string} a user-facing Arabic string — never the raw code.
 */
export function resolveMessage(code, { fallback } = {}) {
  if (typeof code === "string" && MESSAGES[code]) return MESSAGES[code];
  return fallback ?? DEFAULT_FALLBACK_MESSAGE;
}

export { DEFAULT_FALLBACK_MESSAGE };
