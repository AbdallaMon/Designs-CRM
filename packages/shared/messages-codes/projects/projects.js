// projects domain message CODES (project / task / update / delivery surfaces).
// SCREAMING_SNAKE_CASE, key === value (the string IS the code). Carried in the API
// envelope `message` field; the client resolves (translationKey: projectsMessages,
// code) → displayed string. Language-neutral — never put Arabic/English prose here.
//
// One codes object covers all four sub-surfaces of the PROJECTS domain (project,
// task, update, delivery) because they are ONE coupled domain centered on the
// Project/ClientLead entity and share a single scope checker.
export const projectsMessagesCodes = {
  // ── projects: reads ────────────────────────────────────────────────────────────
  PROJECTS_FETCHED: "PROJECTS_FETCHED", // GET / (projects by clientLead)
  PROJECT_FETCHED: "PROJECT_FETCHED", // GET /:id (project detail)
  DESIGNER_PROJECTS_FETCHED: "DESIGNER_PROJECTS_FETCHED", // GET /designers , /designers/columns
  DESIGNER_LEAD_FETCHED: "DESIGNER_LEAD_FETCHED", // GET /designers/:id (lead-by-project detail)
  ARCHIVED_PROJECTS_FETCHED: "ARCHIVED_PROJECTS_FETCHED", // GET /archived
  USER_PROJECTS_FETCHED: "USER_PROJECTS_FETCHED", // GET /user-profile/:userId
  PROJECT_GROUPS_FETCHED: "PROJECT_GROUPS_FETCHED", // GET /:leadId/groups

  // ── projects: mutations ──────────────────────────────────────────────────────────
  PROJECT_UPDATED: "PROJECT_UPDATED", // PUT /:id
  PROJECT_DESIGNER_ASSIGNED: "PROJECT_DESIGNER_ASSIGNED", // POST /:id/actions/assign-designer
  PROJECT_STATUS_CHANGED: "PROJECT_STATUS_CHANGED", // POST /designers/:leadId/actions/change-status

  // ── tasks ────────────────────────────────────────────────────────────────────────
  TASKS_FETCHED: "TASKS_FETCHED", // GET /
  TASK_FETCHED: "TASK_FETCHED", // GET /:id
  TASK_CREATED: "TASK_CREATED", // POST /
  MODIFICATION_CREATED: "MODIFICATION_CREATED", // POST / (type === MODIFICATION)
  TASK_UPDATED: "TASK_UPDATED", // PUT /:taskId
  MODIFICATION_UPDATED: "MODIFICATION_UPDATED", // PUT /:taskId (type === MODIFICATION)
  TASK_DELETED: "TASK_DELETED", // DELETE /:id
  NOTES_FETCHED: "NOTES_FETCHED", // GET /notes
  NOTE_ADDED: "NOTE_ADDED", // POST /notes

  // ── updates ──────────────────────────────────────────────────────────────────────
  UPDATES_FETCHED: "UPDATES_FETCHED", // GET /:clientLeadId
  UPDATE_SHARED_SETTINGS_FETCHED: "UPDATE_SHARED_SETTINGS_FETCHED", // GET /shared-settings/:updateId
  UPDATE_CREATED: "UPDATE_CREATED", // POST /:clientLeadId
  UPDATE_DEPARTMENT_AUTHORIZED: "UPDATE_DEPARTMENT_AUTHORIZED", // POST /:updateId/actions/authorize
  UPDATE_DEPARTMENT_UNAUTHORIZED: "UPDATE_DEPARTMENT_UNAUTHORIZED", // POST /:updateId/actions/authorize-shared
  UPDATE_ARCHIVE_TOGGLED: "UPDATE_ARCHIVE_TOGGLED", // POST /:updateId/actions/archive
  SHARED_UPDATE_ARCHIVE_TOGGLED: "SHARED_UPDATE_ARCHIVE_TOGGLED", // POST /shared-updates/:sharedUpdateId/actions/archive
  UPDATE_MARKED_DONE: "UPDATE_MARKED_DONE", // POST /:updateId/actions/mark-done

  // ── delivery ─────────────────────────────────────────────────────────────────────
  DELIVERY_SCHEDULES_FETCHED: "DELIVERY_SCHEDULES_FETCHED", // GET /:projectId/schedules
  DELIVERY_SCHEDULE_CREATED: "DELIVERY_SCHEDULE_CREATED", // POST /
  DELIVERY_LINKED_TO_MEETING: "DELIVERY_LINKED_TO_MEETING", // POST /:deliveryId/actions/link-meeting
  DELIVERY_SCHEDULE_DELETED: "DELIVERY_SCHEDULE_DELETED", // DELETE /:deliveryId

  // ── errors / scope / guards (the IDOR keystone) ─────────────────────────────────
  PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND",
  PROJECT_ACCESS_DENIED: "PROJECT_ACCESS_DENIED", // project outside the user's scope (read IDOR)
  PROJECT_MUTATE_DENIED: "PROJECT_MUTATE_DENIED", // visible but not writable by this user
  TASK_NOT_FOUND: "TASK_NOT_FOUND",
  UPDATE_NOT_FOUND: "UPDATE_NOT_FOUND",
  SHARED_UPDATE_NOT_FOUND: "SHARED_UPDATE_NOT_FOUND",
  DELIVERY_NOT_FOUND: "DELIVERY_NOT_FOUND",
  // Domain-rule failures preserved from legacy (same observable meaning).
  PROJECT_STATUS_TRANSITION_FORBIDDEN: "PROJECT_STATUS_TRANSITION_FORBIDDEN", // non-admin from Completed/Canceled/Rejected
  TASK_STATUS_TRANSITION_FORBIDDEN: "TASK_STATUS_TRANSITION_FORBIDDEN", // non-admin editing a DONE task
  PROJECT_NOT_IN_MODIFICATION: "PROJECT_NOT_IN_MODIFICATION", // 3D_Modification project not yet in modification state
  DESIGNER_ALREADY_ASSIGNED: "DESIGNER_ALREADY_ASSIGNED",
  DELETE_MODEL_REQUIRED: "DELETE_MODEL_REQUIRED", // generic delete missing body.model
  DELETE_NOT_ALLOWED: "DELETE_NOT_ALLOWED", // time-window / role guard on generic delete
};
