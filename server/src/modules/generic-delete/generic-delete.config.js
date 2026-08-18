import { PERMISSIONS } from "@dms/shared";

const P = PERMISSIONS;

function definition({ delegate, permission, scope, action = "delete", allowDesignerProjectAssignment = false }) {
  return Object.freeze({ delegate, permission, scope, action, allowDesignerProjectAssignment });
}

const note = definition({
  delegate: "note",
  permission: P.NOTE.DELETE,
  scope: "note",
});
const file = definition({
  delegate: "file",
  permission: P.LEAD.FILE_MANAGE,
  scope: "lead",
  allowDesignerProjectAssignment: true,
});
const priceOffer = definition({
  delegate: "priceOffers",
  permission: P.LEAD.PRICE_OFFER_MANAGE,
  scope: "lead",
});
const extraService = definition({
  delegate: "extraService",
  permission: P.LEAD.PAYMENT_MANAGE,
  scope: "lead",
});
const meetingReminder = definition({
  delegate: "meetingReminder",
  permission: P.LEAD.MEETING_MANAGE,
  scope: "lead",
  action: "delete-meeting",
});
const callReminder = definition({
  delegate: "callReminder",
  permission: P.LEAD.CALL_MANAGE,
  scope: "lead",
  allowDesignerProjectAssignment: true,
});
const clientLeadUpdate = definition({
  delegate: "clientLeadUpdate",
  permission: P.UPDATE.ARCHIVE,
  scope: "lead",
  action: "delete-client-lead-update",
});
const deliverySchedule = definition({
  delegate: "deliverySchedule",
  permission: P.DELIVERY.DELETE,
  scope: "project",
});
const task = definition({
  delegate: "task",
  permission: P.TASK.DELETE,
  scope: "project",
});
const contract = definition({
  delegate: "contract",
  permission: P.CONTRACT.EDIT,
  scope: "lead",
  action: "delete-contract",
});
const contractPaymentCondition = definition({
  delegate: "contractPaymentCondition",
  permission: P.SITE_UTILITY.PAYMENT_CONDITION_DELETE,
  scope: "site-utility",
});

// Compatibility aliases are explicit. A request can only resolve to one of these
// server-owned definitions; it can never select a Prisma delegate or action directly.
export const GENERIC_DELETE_MODEL_MAP = Object.freeze({
  Note: note,
  File: file,
  PriceOffers: priceOffer,
  ExtraService: extraService,
  MeetingReminder: meetingReminder,
  CallReminder: callReminder,
  ClientLeadUpdate: clientLeadUpdate,
  DeliverySchedule: deliverySchedule,
  contract,
  Contract: contract,
  contractPaymentCondition,
  ContractPaymentCondition: contractPaymentCondition,
  // Internal-only: the dedicated task endpoint reuses deleteAllowedModel after its own
  // permission and project-mutation scope checks. It is deliberately not public below.
  Task: task,
});

export const DELETABLE_MODELS = Object.freeze(
  Object.keys(GENERIC_DELETE_MODEL_MAP).filter((model) => model !== "Task"),
);

export function getGenericDeleteDefinition(model) {
  return GENERIC_DELETE_MODEL_MAP[model] ?? null;
}
