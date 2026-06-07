// Namespace registry: each message-code namespace maps to itself. The
// `translationKey` carried on every API response/error is one of these names;
// it tells the client which lookup table the `code` belongs to.
//
// SEED for Stage 1 — namespaces are added as modules migrate.
export const messagesNames = {
  generalMessages: "generalMessages",
  authMessages: "authMessages",
  chatMessages: "chatMessages",
  siteUtilityMessages: "siteUtilityMessages",
  coursesMessages: "coursesMessages",
  leadsMessages: "leadsMessages",
  usersMessages: "usersMessages",
  projectsMessages: "projectsMessages",
  accountingMessages: "accountingMessages",
  calendarMessages: "calendarMessages",
  notificationsMessages: "notificationsMessages",
  utilitiesMessages: "utilitiesMessages",
  dashboardMessages: "dashboardMessages",
  prismaKnowMessages: "prismaKnowMessages",
};
