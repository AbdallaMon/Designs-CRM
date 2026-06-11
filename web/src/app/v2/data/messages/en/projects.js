// English mirror of the PROJECTS message CODES (namespace "projectsMessages").
// CODE → English. Mirrors keys 1:1 with ../projects.js (the Arabic map). Bilingual Phase 1.

export const projectsMessagesEn = {
  // ── projects: reads ────────────────────────────────────────────────────────────
  PROJECTS_FETCHED: "Projects retrieved",
  PROJECT_FETCHED: "Project retrieved",
  DESIGNER_PROJECTS_FETCHED: "Designer projects retrieved",
  DESIGNER_LEAD_FETCHED: "Client data retrieved",
  ARCHIVED_PROJECTS_FETCHED: "Archived projects retrieved",
  USER_PROJECTS_FETCHED: "User projects retrieved",
  PROJECT_GROUPS_FETCHED: "Project groups retrieved",

  // ── projects: mutations ──────────────────────────────────────────────────────────
  PROJECT_UPDATED: "Project updated",
  PROJECT_DESIGNER_ASSIGNED: "Designer assignment updated",
  PROJECT_STATUS_CHANGED: "Project status changed",

  // ── tasks ────────────────────────────────────────────────────────────────────────
  TASKS_FETCHED: "Tasks retrieved",
  TASK_FETCHED: "Task retrieved",
  TASK_CREATED: "Task created",
  MODIFICATION_CREATED: "Modification created",
  TASK_UPDATED: "Task updated",
  MODIFICATION_UPDATED: "Modification updated",
  TASK_DELETED: "Task deleted",
  NOTES_FETCHED: "Notes retrieved",
  NOTE_ADDED: "Note added",

  // ── updates ──────────────────────────────────────────────────────────────────────
  UPDATES_FETCHED: "Updates retrieved",
  UPDATE_SHARED_SETTINGS_FETCHED: "Sharing settings retrieved",
  UPDATE_CREATED: "Update created",
  UPDATE_DEPARTMENT_AUTHORIZED: "Department approved",
  UPDATE_DEPARTMENT_UNAUTHORIZED: "Department approval revoked",
  UPDATE_ARCHIVE_TOGGLED: "Archive status updated",
  SHARED_UPDATE_ARCHIVE_TOGGLED: "Archive status updated",
  UPDATE_MARKED_DONE: "Update marked as done",

  // ── delivery ─────────────────────────────────────────────────────────────────────
  DELIVERY_SCHEDULES_FETCHED: "Delivery schedules retrieved",
  DELIVERY_SCHEDULE_CREATED: "Delivery schedule added",
  DELIVERY_LINKED_TO_MEETING: "Delivery linked to the meeting",
  DELIVERY_SCHEDULE_DELETED: "Delivery schedule deleted",

  // ── errors / scope / guards ────────────────────────────────────────────────────
  PROJECT_NOT_FOUND: "Project not found",
  PROJECT_ACCESS_DENIED: "You don't have permission to access this project",
  PROJECT_MUTATE_DENIED: "You don't have permission to edit this project",
  TASK_NOT_FOUND: "Task not found",
  UPDATE_NOT_FOUND: "Update not found",
  SHARED_UPDATE_NOT_FOUND: "Shared update not found",
  DELIVERY_NOT_FOUND: "Delivery schedule not found",
  PROJECT_STATUS_TRANSITION_FORBIDDEN: "The status can't change from the current state",
  TASK_STATUS_TRANSITION_FORBIDDEN: "A finished task can't be edited",
  PROJECT_NOT_IN_MODIFICATION: "The project is not in the modification stage yet",
  DESIGNER_ALREADY_ASSIGNED: "The designer is already assigned",
  DELETE_MODEL_REQUIRED: "The type of item to delete is required",
  DELETE_NOT_ALLOWED: "This item can't be deleted",
};
