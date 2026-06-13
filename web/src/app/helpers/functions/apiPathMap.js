// Transitional endpoint adapter.
//
// Master's UI calls the OLD backend paths (shared/*, admin/*, accountant/*, utility/*,
// client/*). The migrated backend exposes the same surface, restructured under /v2 module
// mounts (server/src/shared/routes.js). Rather than edit ~317 call sites, we rewrite the
// legacy path → its /v2 module path HERE — every request flows through apiClient.apiRequest,
// which adds the /v2 base separately. This function only remaps the path; the query string
// is preserved untouched.
//
// A few endpoints also changed METHOD/BODY/SHAPE (workflow PATCH→POST /actions/*,
// notifications mark-read, image-session image DELETE needs {token}, utilities model
// pick-list value renames). Those are handled at their call sites, NOT here.
//
// (This is the "match the backend" layer of the master-UI restore — see
// docs/migration/08-ui-restore-plan.md. When the code is later reorganized, these mappings
// can be inlined at the call sites and this adapter retired.)

// Ordered legacy→/v2 rules. First match wins. Each [regex, replacement] rewrites the
// path PREFIX; the rest of the path (ids, sub-resources) is preserved by the regex anchor.
const RULES = [
  // ── chat-user directories (renamed endpoints) ──────────────────────────────────
  [/^shared\/all-related-chat-users\b/, "users/related-chat-directory"],
  [/^shared\/all-chat-users\b/, "users/chat-directory"],

  // ── leads management (legacy /shared/client-leads → /v2/leads) ──────────────────
  [/^shared\/client-leads\b/, "leads"],

  // ── project work-stage helpers that lived under /shared ─────────────────────────
  [/^shared\/designers\b/, "projects/designers"],
  [/^shared\/archived-projects\b/, "projects/archived"],
  // upcoming calls widget — legacy /shared/work-stages/calls → /v2/leads/calls
  [/^shared\/work-stages\/calls\b/, "leads/calls"],

  // ── everything else under /shared maps 1:1 to its own /v2 module ────────────────
  //    (contracts, site-utilities, chat, calendar, calendar-management, projects,
  //     dashboard, questions, updates, image-session, tasks, delivery, work-stages,
  //     users, sales-stages, utilities, …)
  [/^shared\//, ""],

  // ── accountant payment workflow actions: payments/<verb>/<id> → payments/<id>/actions/<v2> ──
  [/^accountant\/payments\/overdue\/([^/?]+)/, "accounting/payments/$1/actions/mark-overdue"],
  [/^accountant\/payments\/pay\/([^/?]+)/, "accounting/payments/$1/actions/pay"],
  [/^accountant\/payments\/status\/([^/?]+)/, "accounting/payments/$1/actions/change-status"],

  // ── accountant → accounting ─────────────────────────────────────────────────────
  [/^accountant\//, "accounting/"],

  // ── utility → utilities ──────────────────────────────────────────────────────────
  [/^utility\//, "utilities/"],

  // ── admin surfaces that moved OUT of the admin-residual module ────────────────────
  [/^admin\/all-users\b/, "users/all-users"],
  [/^admin\/users\b/, "users"],
  [/^admin\/image-session\b/, "image-sessions/admin"],
  // (admin/leads, admin/model, admin/fixed-data, admin/commissions, admin/projects,
  //  admin/new-lead, admin/client, admin/client-leads stay under /v2/admin)

  // client/* public surfaces keep their path (client/image-session, client/chat,
  // client/calendar, client/contracts, client/notes, client/languages, …); auth/* and
  // files/* are already correct — no rule needed (fall through unchanged).
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
