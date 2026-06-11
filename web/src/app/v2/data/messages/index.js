// Central aggregator for the FE message-code → Arabic maps.
//
// PROBLEM solved here: every backend response/error envelope carries `message` (a
// language-neutral CODE, e.g. INVALID_TOKEN / LEAD_NOT_FOUND / VALIDATION_ERROR) and a
// `translationKey` (the namespace, e.g. "authMessages"). Per-feature resolvers only know
// their OWN codes, so a cross-cutting core/auth/validation/prisma code — or another
// module's code — falls through and the RAW CODE is shown in the toast. This module is the
// single comprehensive Arabic source that backstops them all.
//
// Exports:
//   (a) MESSAGES_BY_NAMESPACE — per-namespace registry keyed by the `messagesNames`
//       namespace ({ authMessages: {...}, leadsMessages: {...}, ... }). The envelope's
//       `translationKey` is exactly one of these keys.
//   (b) ALL_MESSAGE_CODES — a FLAT { CODE_STRING: "عربي" } map merging every namespace,
//       for namespace-agnostic lookup (when no translationKey is supplied, or it is
//       unknown). General/auth codes are merged LAST so the universal ones win on the rare
//       cross-namespace CODE_STRING collision (e.g. FORBIDDEN / ACCESS_DENIED / NOT_FOUND).
//
// Single-language Arabic / RTL. JS (ESM) — matches the repo style; no @dms/shared import
// (the FE mirrors the BE code strings as literal keys, exactly like the feature resolvers).

import { generalMessages } from "./general.js";
import { authMessages } from "./auth.js";
import { chatMessages } from "./chat.js";
import { siteUtilityMessages } from "./siteUtility.js";
import { leadsMessages } from "./leads.js";
import { usersMessages } from "./users.js";
import { projectsMessages } from "./projects.js";
import { accountingMessages } from "./accounting.js";
import { calendarMessages } from "./calendar.js";
import { notificationsMessages } from "./notifications.js";
import { utilitiesMessages } from "./utilities.js";
import { dashboardMessages } from "./dashboard.js";
import { questionsMessages } from "./questions.js";
import { salesStagesMessages } from "./salesStages.js";
import { reviewsMessages } from "./reviews.js";
import { contractsMessages } from "./contracts.js";
import { imageSessionsMessages } from "./imageSessions.js";
import { adminResidualMessages } from "./adminResidual.js";
import { clientPortalMessages } from "./clientPortal.js";
import { prismaKnowMessages } from "./prisma.js";

// (a) Per-namespace registry — keys MUST match packages/shared/messages-names.js exactly,
// because that is the value the envelope carries in `translationKey`.
export const MESSAGES_BY_NAMESPACE = {
  generalMessages,
  authMessages,
  chatMessages,
  siteUtilityMessages,
  leadsMessages,
  usersMessages,
  projectsMessages,
  accountingMessages,
  calendarMessages,
  notificationsMessages,
  utilitiesMessages,
  dashboardMessages,
  questionsMessages,
  salesStagesMessages,
  reviewsMessages,
  contractsMessages,
  imageSessionsMessages,
  adminResidualMessages,
  clientPortalMessages,
  prismaKnowMessages,
};

// (b) FLAT map — every code → Arabic, namespace-agnostic. Domain maps first; the universal
// auth + general maps last so a shared CODE_STRING (FORBIDDEN, ACCESS_DENIED, NOT_FOUND,
// UNAUTHORIZED, VALIDATION_ERROR) resolves to the universal wording rather than a stray
// domain phrasing.
export const ALL_MESSAGE_CODES = {
  ...prismaKnowMessages,
  ...utilitiesMessages,
  ...siteUtilityMessages,
  ...adminResidualMessages,
  ...clientPortalMessages,
  ...salesStagesMessages,
  ...reviewsMessages,
  ...questionsMessages,
  ...dashboardMessages,
  ...notificationsMessages,
  ...calendarMessages,
  ...imageSessionsMessages,
  ...contractsMessages,
  ...accountingMessages,
  ...projectsMessages,
  ...usersMessages,
  ...chatMessages,
  ...leadsMessages,
  ...authMessages,
  ...generalMessages,
};
