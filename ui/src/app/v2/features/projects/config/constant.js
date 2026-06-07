// Projects domain — API contract surface. All paths are relative to the v2 API base
// (apiFetch is configured with config.apiUrl === /v2). One place to edit if a backend
// path changes (reconciliation point vs server/src/modules/projects/*/*.routes.js).
//
// Backend contract (confirmed against the four v2 route files):
//   /v2/projects:
//     GET  /designers                              → designer board (grouped leads, { items })
//     GET  /designers/columns                      → designer board columns
//     GET  /designers/:id                          → lead-by-project detail (object-scoped)
//     POST /designers/:leadId/actions/change-status→ board status change (project id in body.id)
//     GET  /archived                               → archived board ({ items,total,page,pageSize })
//     GET  /user-profile/:userId                   → a user's assigned projects
//     GET  /?clientLeadId=                          → projects by lead ({ items })
//     GET  /:leadId/groups                         → unique project groups for a lead
//     GET  /:id                                    → project detail (+ capabilities.*)
//     PUT  /:id                                    → plain field/status edit (STRICT whitelist)
//     POST /:id/actions/assign-designer            → assign / unassign a designer
//   /v2/tasks:
//     GET  /                                        → tasks list ({ items })
//     GET  /notes                                   → notes list
//     POST /notes                                   → add a note
//     POST /                                        → create task
//     GET  /:id                                     → task detail (+ capabilities.*)
//     PUT  /:taskId                                 → update task (STRICT whitelist)
//     DELETE /:id                                   → delete task (body { model: "Task" })
//   /v2/updates:
//     GET  /:clientLeadId                           → updates for a lead ({ items })
//     GET  /shared-settings/:updateId               → shared settings of an update
//     POST /:clientLeadId                           → create update
//     POST /:updateId/actions/authorize             → authorize a department
//     POST /:updateId/actions/authorize-shared      → unauthorize a department (shared)
//     POST /:updateId/actions/archive               → toggle archive
//     POST /:updateId/actions/mark-done             → mark done
//     POST /shared-updates/:sharedUpdateId/actions/archive → toggle archive on a shared update
//   /v2/delivery:
//     GET  /:projectId/schedules                    → delivery schedules of a project
//     POST /                                        → create a delivery schedule (body.projectId)
//     POST /:deliveryId/actions/link-meeting        → link a delivery to a meeting reminder
//     DELETE /:deliveryId                           → delete a delivery schedule

// ── projects ──────────────────────────────────────────────────────────────────────
export const PROJECTS_BASE = "projects";
export const PROJECTS_DESIGNERS_URL = `${PROJECTS_BASE}/designers`;
export const PROJECTS_DESIGNER_COLUMNS_URL = `${PROJECTS_BASE}/designers/columns`;
export const PROJECTS_ARCHIVED_URL = `${PROJECTS_BASE}/archived`;
export const PROJECTS_BY_LEAD_URL = `${PROJECTS_BASE}`; // GET /?clientLeadId=

export const projectUrl = (id) => `${PROJECTS_BASE}/${id}`;
export const projectGroupsUrl = (leadId) => `${PROJECTS_BASE}/${leadId}/groups`;
export const designerLeadDetailUrl = (id) => `${PROJECTS_BASE}/designers/${id}`;
export const userProjectsUrl = (userId) => `${PROJECTS_BASE}/user-profile/${userId}`;

// workflow actions (POST)
export const projectAssignDesignerUrl = (id) => `${PROJECTS_BASE}/${id}/actions/assign-designer`;
export const projectChangeStatusUrl = (leadId) =>
  `${PROJECTS_BASE}/designers/${leadId}/actions/change-status`;

// ── tasks ──────────────────────────────────────────────────────────────────────────
export const TASKS_BASE = "tasks";
export const TASKS_URL = `${TASKS_BASE}`;
export const TASKS_NOTES_URL = `${TASKS_BASE}/notes`;
export const taskUrl = (id) => `${TASKS_BASE}/${id}`;

// ── updates ──────────────────────────────────────────────────────────────────────
export const UPDATES_BASE = "updates";
export const leadUpdatesUrl = (clientLeadId) => `${UPDATES_BASE}/${clientLeadId}`;
export const updateSharedSettingsUrl = (updateId) => `${UPDATES_BASE}/shared-settings/${updateId}`;
export const updateAuthorizeUrl = (updateId) => `${UPDATES_BASE}/${updateId}/actions/authorize`;
export const updateAuthorizeSharedUrl = (updateId) =>
  `${UPDATES_BASE}/${updateId}/actions/authorize-shared`;
export const updateArchiveUrl = (updateId) => `${UPDATES_BASE}/${updateId}/actions/archive`;
export const updateMarkDoneUrl = (updateId) => `${UPDATES_BASE}/${updateId}/actions/mark-done`;
export const sharedUpdateArchiveUrl = (sharedUpdateId) =>
  `${UPDATES_BASE}/shared-updates/${sharedUpdateId}/actions/archive`;

// ── delivery ─────────────────────────────────────────────────────────────────────
export const DELIVERY_BASE = "delivery";
export const DELIVERY_CREATE_URL = `${DELIVERY_BASE}`; // POST
export const deliverySchedulesUrl = (projectId) => `${DELIVERY_BASE}/${projectId}/schedules`;
export const deliveryUrl = (deliveryId) => `${DELIVERY_BASE}/${deliveryId}`;
export const deliveryLinkMeetingUrl = (deliveryId) =>
  `${DELIVERY_BASE}/${deliveryId}/actions/link-meeting`;
