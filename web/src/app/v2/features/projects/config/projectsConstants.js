// Projects domain UI constants — ported verbatim from the legacy app/helpers/constants.js
// (PROJECT_STATUSES / DEPARTMENTS / PRIORITY / TASKSTATUS / color maps / getPriorityOrder)
// so the migrated work-surface keeps identical appearance/behavior. Single language
// (these are domain/enum labels, not localized UI prose).

export const PROJECT_STATUSES = {
  "3D_Designer": ["To Do", "3D", "Render", "Modification", "Delivery", "Hold", "Completed"],
  "3D_Modification": ["To Do", "Modification", "Completed"],
  "2D_Study": ["To Do", "Studying", "Modification", "Delivery", "Electricity", "Hold", "Completed"],
  "2D_Final_Plans": ["To Do", "Started", "In Progress", "Completed"],
  "2D_Quantity_Calculation": ["To Do", "Started", "In Progress", "Completed"],
};

export const DEPARTMENTS = [
  { value: "3D_Designer", label: "3D Designer", color: "#FF6B35" },
  { value: "3D_Modification", label: "3D Modification", color: "#F7931E" },
  { value: "2D_Study", label: "2D Study", color: "#FFD23F" },
  { value: "2D_Final_Plans", label: "2D Final Plans", color: "#06FFA5" },
  { value: "2D_Quantity_Calculation", label: "2D Quantity Calculation", color: "#118AB2" },
  { value: "STAFF", label: "Staff", color: "#6C5CE7" },
  { value: "ADMIN", label: "Admin only", color: "#E74C3C" },
];

export const PRIORITY = ["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"];
export const TASKSTATUS = ["TODO", "IN_PROGRESS", "DONE"];

export function getPriorityOrder(priority) {
  const priorityMap = { VERY_HIGH: 5, HIGH: 4, MEDIUM: 3, LOW: 2, VERY_LOW: 1 };
  return priorityMap[priority] || 3; // default MEDIUM
}

// Project board status → swatch color (subset of the legacy statusColors map covering
// the project board states).
export const statusColors = {
  IN_PROGRESS: "#0d9488",
  DESIGN_STAGE: "#10b981",
  THREE_D_STAGE: "#f59e0b",
  THREE_D_APPROVAL: "#0d9488",
  DRAWING_PLAN: "#f97316",
  FINAL_DELIVERY: "#0f766e",
  PROGRESS: "#0d9488",
  ACCEPTED: "#10b981",
  REJECTED: "#ef4444",
  ARCHIVED: "#0f757d",
};

// Task status / priority chip colors (ported from TaskActions.jsx).
export const TASK_STATUS_COLORS = {
  TODO: "default",
  IN_PROGRESS: "primary",
  DONE: "success",
  COMPLETED: "success",
};

export const TASK_PRIORITY_COLORS = {
  VERY_HIGH: "error",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "success",
  VERY_LOW: "default",
};

// Friendly priority label (ported from ProjectDetails.formatPriority).
export function formatPriority(priority) {
  if (!priority) return "";
  return priority
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
