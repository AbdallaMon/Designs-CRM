// Projects-domain data-access service — the ONLY place that talks to the projects /
// tasks / updates / delivery API. Wraps the canonical apiFetch (config.apiUrl === /v2).
// Components/hooks call these helpers, never fetch/apiFetch directly. All responses share
// the { success, message, data, translationKey } envelope; helpers return the parsed
// envelope.
//
// §5c deltas baked in here:
//  • Lists consume `data: { items, ... }` (designer board / by-lead / tasks return
//    `{ items }`; archived returns `{ items,total,page,pageSize }`).
//  • Workflow status changes are POST /:.../actions/<kebab> (assign-designer,
//    change-status, authorize, authorize-shared, archive, mark-done, link-meeting).
//  • Plain field edits stay PUT but send ONLY whitelisted fields (the .strict() BE will
//    422 on extras). The whitelist is enforced by the caller building the body; the
//    helpers here forward whatever body the caller passes (see pickProjectFields /
//    pickTaskFields exported below to build the exact payload).

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import {
  PROJECTS_DESIGNERS_URL,
  PROJECTS_DESIGNER_COLUMNS_URL,
  PROJECTS_ARCHIVED_URL,
  PROJECTS_BY_LEAD_URL,
  projectUrl,
  projectGroupsUrl,
  designerLeadDetailUrl,
  userProjectsUrl,
  projectAssignDesignerUrl,
  projectChangeStatusUrl,
  TASKS_URL,
  TASKS_NOTES_URL,
  taskUrl,
  leadUpdatesUrl,
  updateSharedSettingsUrl,
  updateAuthorizeUrl,
  updateAuthorizeSharedUrl,
  updateArchiveUrl,
  updateMarkDoneUrl,
  sharedUpdateArchiveUrl,
  DELIVERY_CREATE_URL,
  deliverySchedulesUrl,
  deliveryUrl,
  deliveryLinkMeetingUrl,
} from "./config/constant.js";

// Build a paginated query string the BE list reads (page/limit + JSON `filters` string +
// extra top-level keys). Mirrors leads.service.buildListQuery.
function buildListQuery(base, { page, limit, filters = {}, extra = {} } = {}) {
  const params = new URLSearchParams();
  if (page != null) params.set("page", String(page));
  if (limit != null) params.set("limit", String(limit));
  params.set("filters", JSON.stringify(filters ?? {}));
  Object.entries(extra).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

// ── §5c PUT whitelists (do NOT spread the whole object — the BE .strict() 422s) ──────
// project PUT /:id accepts exactly these keys (project.validation.updateProject).
const PROJECT_EDIT_FIELDS = [
  "status",
  "priority",
  "deliveryTime",
  "oldStatus",
  "type",
  "role",
  "area",
  "groupId",
  "groupTitle",
  "isModification",
  "endedAt",
];
// task PUT /:taskId accepts exactly these keys (task.validation.updateTask).
const TASK_EDIT_FIELDS = ["title", "description", "status", "priority", "dueDate"];

function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => {
    if (obj != null && obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}

/** Build the EXACT project-edit PUT payload (whitelist; drops everything else). */
export function pickProjectFields(obj) {
  return pick(obj, PROJECT_EDIT_FIELDS);
}
/** Build the EXACT task-edit PUT payload (whitelist; drops everything else). */
export function pickTaskFields(obj) {
  return pick(obj, TASK_EDIT_FIELDS);
}

export const projectsService = {
  // ── projects: lists ───────────────────────────────────────────────────────────
  listDesigners: (opts = {}) => apiFetch.get(buildListQuery(PROJECTS_DESIGNERS_URL, opts)),
  listDesignerColumns: (opts = {}) =>
    apiFetch.get(buildListQuery(PROJECTS_DESIGNER_COLUMNS_URL, opts)),
  listArchived: (opts = {}) => apiFetch.get(buildListQuery(PROJECTS_ARCHIVED_URL, opts)),
  // GET /?clientLeadId= — projects (grouped) for one lead.
  listByLead: (clientLeadId, opts = {}) =>
    apiFetch.get(
      buildListQuery(PROJECTS_BY_LEAD_URL, { ...opts, extra: { ...(opts.extra || {}), clientLeadId } }),
    ),

  // ── projects: detail ──────────────────────────────────────────────────────────
  getProject: (id) => apiFetch.get(projectUrl(id)),
  getDesignerLeadDetail: (id) => apiFetch.get(designerLeadDetailUrl(id)),
  getGroups: (leadId) => apiFetch.get(projectGroupsUrl(leadId)),
  getUserProjects: (userId, opts = {}) =>
    apiFetch.get(buildListQuery(userProjectsUrl(userId), opts)),

  // ── projects: mutations ─────────────────────────────────────────────────────────
  // PUT /:id — plain field edit. Caller MUST pass a pickProjectFields(...) body.
  updateProject: (id, body) => apiFetch.put(projectUrl(id), body),
  // POST /:id/actions/assign-designer — assign / unassign / (de)modification.
  assignDesigner: (id, body) => apiFetch.post(projectAssignDesignerUrl(id), body),
  // POST /designers/:leadId/actions/change-status — body carries { id, status } (project
  // id in body.id); the BE derives oldStatus server-side (no client oldStatus needed).
  changeStatus: (leadId, body) => apiFetch.post(projectChangeStatusUrl(leadId), body),

  // ── tasks ─────────────────────────────────────────────────────────────────────
  listTasks: (opts = {}) => apiFetch.get(buildListQuery(TASKS_URL, opts)),
  getTask: (id) => apiFetch.get(taskUrl(id)),
  createTask: (body) => apiFetch.post(TASKS_URL, body),
  // PUT /:taskId — caller MUST pass a pickTaskFields(...) body.
  updateTask: (taskId, body) => apiFetch.put(taskUrl(taskId), body),
  // DELETE /:id — body is fixed { model: "Task" } (BE .strict() rejects anything else).
  deleteTask: (id) =>
    apiFetch.submit("DELETE", taskUrl(id), { model: "Task" }),
  listNotes: (opts = {}) => apiFetch.get(buildListQuery(TASKS_NOTES_URL, opts)),
  addNote: (body) => apiFetch.post(TASKS_NOTES_URL, body),

  // ── updates ─────────────────────────────────────────────────────────────────────
  // The BE list reads `type` (the caller's department) + `department` (filter) off the
  // query string (passthrough), so they travel as top-level params via `extra`.
  listUpdates: (clientLeadId, opts = {}) =>
    apiFetch.get(buildListQuery(leadUpdatesUrl(clientLeadId), opts)),
  getSharedSettings: (updateId) => apiFetch.get(updateSharedSettingsUrl(updateId)),
  // create reads `department` (the main department) off the query string (passthrough).
  createUpdate: (clientLeadId, body, query = {}) => {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch.post(`${leadUpdatesUrl(clientLeadId)}${suffix}`, body);
  },
  authorizeUpdate: (updateId, body) => apiFetch.post(updateAuthorizeUrl(updateId), body),
  authorizeSharedUpdate: (updateId, body) =>
    apiFetch.post(updateAuthorizeSharedUrl(updateId), body),
  archiveUpdate: (updateId, body) => apiFetch.post(updateArchiveUrl(updateId), body),
  markUpdateDone: (updateId, body) => apiFetch.post(updateMarkDoneUrl(updateId), body),
  archiveSharedUpdate: (sharedUpdateId, body) =>
    apiFetch.post(sharedUpdateArchiveUrl(sharedUpdateId), body),

  // ── delivery ────────────────────────────────────────────────────────────────────
  listDeliverySchedules: (projectId) => apiFetch.get(deliverySchedulesUrl(projectId)),
  createDelivery: (body) => apiFetch.post(DELIVERY_CREATE_URL, body),
  linkDeliveryMeeting: (deliveryId, body) => apiFetch.post(deliveryLinkMeetingUrl(deliveryId), body),
  deleteDelivery: (deliveryId) => apiFetch.delete(deliveryUrl(deliveryId)),
};

export default projectsService;
