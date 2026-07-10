import {
  AUDIT_ACTION_OPTIONS,
  AUDIT_ENTITY_TYPE_OPTIONS,
  AUDIT_MODULE_OPTIONS,
} from "@/features/audit/config/constant.js";

// Declarative filter-bar config for the audit viewer. Each entry maps 1:1 to a flat
// query param the /v2/audit-logs backend understands (see server audit.validation.js:
// actorUserId, module, action, entityType, entityId, clientLeadId, from, to). The
// AuditFilters bar renders each entry by `type` and writes the active value into the
// filters object the service turns into the flat query string.
export const auditFilters = [
  {
    key: "actorUserId",
    label: "Actor (user id)",
    type: "number",
    placeholder: "e.g. 42",
  },
  {
    key: "module",
    label: "Module",
    type: "select",
    options: AUDIT_MODULE_OPTIONS,
  },
  {
    key: "action",
    label: "Action",
    type: "select",
    options: AUDIT_ACTION_OPTIONS,
  },
  {
    key: "entityType",
    label: "Entity type",
    type: "select",
    options: AUDIT_ENTITY_TYPE_OPTIONS,
  },
  {
    key: "entityId",
    label: "Entity id",
    type: "number",
    placeholder: "e.g. 128",
  },
  {
    key: "clientLeadId",
    label: "Deal id",
    type: "number",
    placeholder: "e.g. 91",
  },
  {
    key: "from",
    label: "From",
    type: "date",
  },
  {
    key: "to",
    label: "To",
    type: "date",
  },
];

// The flat filter keys the backend consumes, in the order the service should serialize
// them. Kept beside the bar config so both stay in lock-step.
export const AUDIT_FILTER_KEYS = auditFilters.map((f) => f.key);
