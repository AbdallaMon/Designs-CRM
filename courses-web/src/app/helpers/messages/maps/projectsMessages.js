// Single-language (Arabic) resolution for backend message CODES emitted by the projects
// domain API ({ success, message: CODE, translationKey: "projectsMessages" }). The
// backend stays language-neutral (packages/shared/messages-codes/projects/projects.js);
// this is the FE lookup. Every code the projects/task/update/delivery surfaces can emit
// has an entry here; unknown codes fall back to a generic string.

export const projectsMessages = {
  // ── projects: reads ────────────────────────────────────────────────────────────
  PROJECTS_FETCHED: "Projects fetched",
  PROJECT_FETCHED: "Project fetched",
  DESIGNER_PROJECTS_FETCHED: "Designer projects fetched",
  DESIGNER_LEAD_FETCHED: "Lead data fetched",
  ARCHIVED_PROJECTS_FETCHED: "Archived projects fetched",
  USER_PROJECTS_FETCHED: "User projects fetched",
  PROJECT_GROUPS_FETCHED: "Project groups fetched",

  // ── projects: mutations ──────────────────────────────────────────────────────────
  PROJECT_UPDATED: "Project updated",
  PROJECT_DESIGNER_ASSIGNED: "Designer assignment updated",
  PROJECT_STATUS_CHANGED: "Project status changed",

  // ── tasks ────────────────────────────────────────────────────────────────────────
  TASKS_FETCHED: "Tasks fetched",
  TASK_FETCHED: "Task fetched",
  TASK_CREATED: "Task created",
  MODIFICATION_CREATED: "Modification created",
  TASK_UPDATED: "Task updated",
  MODIFICATION_UPDATED: "Modification updated",
  TASK_DELETED: "Task deleted",
  NOTES_FETCHED: "Notes fetched",
  NOTE_ADDED: "Note added",

  // ── updates ──────────────────────────────────────────────────────────────────────
  UPDATES_FETCHED: "Updates fetched",
  UPDATE_SHARED_SETTINGS_FETCHED: "Sharing settings fetched",
  UPDATE_CREATED: "Update created",
  UPDATE_DEPARTMENT_AUTHORIZED: "Department approved",
  UPDATE_DEPARTMENT_UNAUTHORIZED: "Department approval revoked",
  UPDATE_ARCHIVE_TOGGLED: "Archive status updated",
  SHARED_UPDATE_ARCHIVE_TOGGLED: "Archive status updated",
  UPDATE_MARKED_DONE: "Update marked as done",

  // ── delivery ─────────────────────────────────────────────────────────────────────
  DELIVERY_SCHEDULES_FETCHED: "Delivery schedules fetched",
  DELIVERY_SCHEDULE_CREATED: "Delivery schedule added",
  DELIVERY_LINKED_TO_MEETING: "Delivery linked to meeting",
  DELIVERY_SCHEDULE_DELETED: "Delivery schedule deleted",

  // ── errors / scope / guards ────────────────────────────────────────────────────
  PROJECT_NOT_FOUND: "Project not found",
  CLIENT_LEAD_NOT_FOUND: "Lead not found",
  PROJECT_ACCESS_DENIED: "You do not have access to this project",
  PROJECT_MUTATE_DENIED: "You do not have permission to edit this project",
  TASK_NOT_FOUND: "Task not found",
  TASK_ACCESS_DENIED: "You do not have access to this task",
  UPDATE_NOT_FOUND: "Update not found",
  SHARED_UPDATE_NOT_FOUND: "Shared update not found",
  DELIVERY_NOT_FOUND: "Delivery schedule not found",
  PROJECT_STATUS_TRANSITION_FORBIDDEN: "Cannot change the status from the current status",
  TASK_STATUS_TRANSITION_FORBIDDEN: "Cannot edit a completed task",
  PROJECT_NOT_IN_MODIFICATION: "The project is not in the modification stage yet",
  DESIGNER_ALREADY_ASSIGNED:
    "This designer is already assigned to this project. Refresh the page if you do not see them.",
  PROJECT_GROUP_TITLE_REQUIRED: "A group title is required",
  PROJECT_GROUP_TITLE_DUPLICATE: "A group with the same title already exists",
  DELETE_MODEL_REQUIRED: "The type of item to delete is required",
  DELETE_NOT_ALLOWED: "This item cannot be deleted",

  // ── generic envelope codes (shared) ────────────────────────────────────────────
  OK: "Operation completed successfully",
  CREATED: "Created successfully",
  UPDATED: "Updated successfully",
  DELETED: "Deleted successfully",
  FORBIDDEN: "You do not have permission to perform this action",
  ACCESS_DENIED: "You do not have access",
  VALIDATION_ERROR: "Invalid data",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveProjectsMessage(code, { fallback } = {}) {
  if (code && projectsMessages[code]) return projectsMessages[code];
  return fallback ?? "Operation completed";
}
