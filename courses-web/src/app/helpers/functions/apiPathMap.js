// Transitional endpoint adapter (courses-web).
//
// The ported Design-courses UI calls the OLD master backend paths (admin/courses/*,
// shared/courses/*, auth/status, auth/reset*, utility/*). The migrated backend exposes the
// same course surface, restructured under /v2 module mounts: admin management at
// `/v2/courses` and staff consumption at `/v2/staff-courses` (see server/src/shared/routes.js).
// Rather than edit every call site, we rewrite the legacy path → its /v2 module path HERE;
// every request flows through apiClient.apiRequest, which prepends the origin separately.
// This function only remaps the path; the query string is preserved untouched.
//
// A few endpoints also changed METHOD/BODY/SHAPE (lesson-complete PATCH→POST /actions/complete,
// password-reset body). Those are handled at their call sites, NOT here.

// Ordered legacy→/v2 rules. First match wins. Each [regex, replacement] rewrites the
// path PREFIX; the rest of the path (ids, sub-resources) is preserved by the regex anchor.
const RULES = [
  // Courses — admin management surface (legacy admin/courses) → /v2/courses
  [/^admin\/courses\b/, "courses"],
  // Courses — staff consumption surface (legacy shared/courses) → /v2/staff-courses
  [/^shared\/courses\b/, "staff-courses"],
  // Auth "who am I": legacy auth/status → /v2 auth/me
  [/^auth\/status\b/, "auth/me"],
  // utility search used by a couple of pickers
  [/^utility\/search\b/, "utilities/search"],
  // Password reset — token form MUST precede the base form (order matters).
  // NOTE: body shape also changes; handled at the call site (Task 3), not here.
  [/^auth\/reset\/[^/?]+/, "auth/reset-password"],
  [/^auth\/reset\b/, "auth/request-password-reset"],
];


export function mapLegacyPathToV2(rawPath) {
  if (typeof rawPath !== "string") return rawPath;
  const qIdx = rawPath.indexOf("?");
  let path = qIdx === -1 ? rawPath : rawPath.slice(0, qIdx);
  const query = qIdx === -1 ? "" : rawPath.slice(qIdx);
  const hadLead = path.startsWith("/");
  path = path.replace(/^\/+/, "");

  for (const [re, repl] of RULES) {
    if (re.test(path)) {
      path = path.replace(re, repl);
      break;
    }
  }
  path = path.replace(/\/{2,}/g, "/").replace(/^\/+/, "");
  return (hadLead ? "/" : "") + path + query;
}
