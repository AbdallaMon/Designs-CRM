import { LEAD_STATUSES } from "@dms/shared";
export const LeadCategory = {
  CONSULTATION: "Consultation",
  DESIGN: "Design",
  OLDLEAD: "Lead via excel",
};
export const LeadType = {
  ROOM: "Room",
  PLAN: "Plan",
  CITY_VISIT: "City Visit",
  APARTMENT: "Apartment",
  CONSTRUCTION_VILLA: "Construction Villa",
  UNDER_CONSTRUCTION_VILLA: "Villa Under Construction",
  PART_OF_HOME: "Part of Home",
  COMMERCIAL: "Commercial",
  NONE: "None",
};

export const ClientLeadStatus = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  INTERESTED: "Interested",
  NEEDS_IDENTIFIED: "Needs Identified",
  LEADEXCHANGE: "Lead Exchange",
  NEGOTIATING: "Negotiating",
  REJECTED: "Rejected",
  FINALIZED: "Finalized",
  CONVERTED: "Converted",
  ON_HOLD: "On Hold",
  ARCHIVED: "Archived",
};

export const KanbanLeadsStatus = {
  IN_PROGRESS: "In Progress",
  INTERESTED: "Interested",
  NEEDS_IDENTIFIED: "Needs Identified",
  NEGOTIATING: "Negotiating",
  LEADEXCHANGE: "Lead Exchange",
  FINALIZED: "Finalized",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
  ON_HOLD: "On Hold",
};

export const KanbanBeginerLeadsStatus = {
  IN_PROGRESS: "In Progress",
  INTERESTED: "Interested",
  NEEDS_IDENTIFIED: "Needs Identified",
  NEGOTIATING: "Negotiating",
  LEADEXCHANGE: "Lead Exchange",
};

export const KanbanStatusArray = [
  LEAD_STATUSES.IN_PROGRESS,
  LEAD_STATUSES.INTERESTED,
  LEAD_STATUSES.NEEDS_IDENTIFIED,
  LEAD_STATUSES.NEGOTIATING,
  LEAD_STATUSES.FINALIZED,
  LEAD_STATUSES.REJECTED,
  "ARCHIVED",
];
export const AccountantKanbanStatusArray = [
  LEAD_STATUSES.IN_PROGRESS,
  LEAD_STATUSES.INTERESTED,
  LEAD_STATUSES.NEEDS_IDENTIFIED,
  LEAD_STATUSES.NEGOTIATING,
  LEAD_STATUSES.FINALIZED,
  LEAD_STATUSES.REJECTED,
];
