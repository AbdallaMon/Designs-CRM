// English aggregator for the FE message-code maps — the EN counterpart of ../index.js.
//
// BILINGUAL Phase 1 (now COMPLETE): every namespace returned by the backend has an English
// mirror here, so resolveMessageCode(code, { lang: "en" }) returns real English. If a code is
// still missing from a given EN map, resolveMessageCode falls back to the Arabic map (so nothing
// breaks and no raw CODE leaks). To extend: add the key to ./en/<ns>.js mirroring the Arabic map.
//
// Structure mirrors ../index.js (the Arabic aggregator) exactly: a by-namespace registry plus a
// flat ALL map with the SAME precedence (domain maps first, universal auth + general LAST).

import { generalMessagesEn } from "./general.js";
import { authMessagesEn } from "./auth.js";
import { chatMessagesEn } from "./chat.js";
import { siteUtilityMessagesEn } from "./siteUtility.js";
import { leadsMessagesEn } from "./leads.js";
import { usersMessagesEn } from "./users.js";
import { projectsMessagesEn } from "./projects.js";
import { accountingMessagesEn } from "./accounting.js";
import { calendarMessagesEn } from "./calendar.js";
import { notificationsMessagesEn } from "./notifications.js";
import { utilitiesMessagesEn } from "./utilities.js";
import { dashboardMessagesEn } from "./dashboard.js";
import { questionsMessagesEn } from "./questions.js";
import { salesStagesMessagesEn } from "./salesStages.js";
import { contractsMessagesEn } from "./contracts.js";
import { imageSessionsMessagesEn } from "./imageSessions.js";
import { adminResidualMessagesEn } from "./adminResidual.js";
import { clientPortalMessagesEn } from "./clientPortal.js";
import { prismaKnowMessagesEn } from "./prisma.js";

// (a) Per-namespace registry — keys MUST match packages/shared/messages-names.js (the value the
// envelope carries in `translationKey`), identical to the Arabic registry's keys.
export const MESSAGES_BY_NAMESPACE_EN = {
  generalMessages: generalMessagesEn,
  authMessages: authMessagesEn,
  chatMessages: chatMessagesEn,
  siteUtilityMessages: siteUtilityMessagesEn,
  leadsMessages: leadsMessagesEn,
  usersMessages: usersMessagesEn,
  projectsMessages: projectsMessagesEn,
  accountingMessages: accountingMessagesEn,
  calendarMessages: calendarMessagesEn,
  notificationsMessages: notificationsMessagesEn,
  utilitiesMessages: utilitiesMessagesEn,
  dashboardMessages: dashboardMessagesEn,
  questionsMessages: questionsMessagesEn,
  salesStagesMessages: salesStagesMessagesEn,
  contractsMessages: contractsMessagesEn,
  imageSessionsMessages: imageSessionsMessagesEn,
  adminResidualMessages: adminResidualMessagesEn,
  clientPortalMessages: clientPortalMessagesEn,
  prismaKnowMessages: prismaKnowMessagesEn,
};

// (b) FLAT map — every translated code → English, namespace-agnostic. Domain maps first; the
// universal auth + general maps LAST so shared CODE_STRINGs (FORBIDDEN, UNAUTHORIZED, …) resolve
// to the universal wording (matches the Arabic aggregator's precedence).
export const ALL_MESSAGE_CODES_EN = {
  ...prismaKnowMessagesEn,
  ...utilitiesMessagesEn,
  ...siteUtilityMessagesEn,
  ...adminResidualMessagesEn,
  ...clientPortalMessagesEn,
  ...salesStagesMessagesEn,
  ...questionsMessagesEn,
  ...dashboardMessagesEn,
  ...notificationsMessagesEn,
  ...calendarMessagesEn,
  ...imageSessionsMessagesEn,
  ...contractsMessagesEn,
  ...accountingMessagesEn,
  ...projectsMessagesEn,
  ...usersMessagesEn,
  ...chatMessagesEn,
  ...leadsMessagesEn,
  ...authMessagesEn,
  ...generalMessagesEn,
};
