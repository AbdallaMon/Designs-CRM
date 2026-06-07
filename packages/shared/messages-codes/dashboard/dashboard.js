// dashboard module message CODES. SCREAMING_SNAKE_CASE, key === value (the string
// IS the code). Carried in the API envelope `message` field; the client resolves
// (translationKey: dashboardMessages, code) → displayed string. Language-neutral —
// never put Arabic/English prose here.
//
// Covers the 9 read-only dashboard aggregations (legacy `/shared/dashboard/*`). The
// scope-prone legacy endpoints trusted a CLIENT-SUPPLIED `staffId` query param to
// select WHOSE metrics to read; the v2 module derives the scope identity from
// req.auth (the IDOR-class fix) for non-privileged roles.
export const dashboardMessagesCodes = {
  KEY_METRICS_FETCHED: "KEY_METRICS_FETCHED",
  LEAD_STATUS_FETCHED: "LEAD_STATUS_FETCHED",
  MONTHLY_PERFORMANCE_FETCHED: "MONTHLY_PERFORMANCE_FETCHED",
  EMIRATES_ANALYTICS_FETCHED: "EMIRATES_ANALYTICS_FETCHED",
  LEADS_MONTHLY_OVERVIEW_FETCHED: "LEADS_MONTHLY_OVERVIEW_FETCHED",
  WEEK_PERFORMANCE_FETCHED: "WEEK_PERFORMANCE_FETCHED",
  LATEST_LEADS_FETCHED: "LATEST_LEADS_FETCHED",
  RECENT_ACTIVITIES_FETCHED: "RECENT_ACTIVITIES_FETCHED",
  DESIGNER_METRICS_FETCHED: "DESIGNER_METRICS_FETCHED",
};
