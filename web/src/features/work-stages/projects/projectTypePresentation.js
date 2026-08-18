import { PROJECT_TYPES_LABELS } from "@/app/helpers/constants";

export function getProjectTypeLabel(type) {
  if (!type) return "Project type not specified";

  return PROJECT_TYPES_LABELS[type]?.en || String(type).replace(/_/g, " ");
}
