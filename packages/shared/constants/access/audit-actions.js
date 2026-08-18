// Action-audit vocabulary — language-neutral MODULE + ACTION codes for the rich
// `ActionAuditLog` trail (distinct from the authorization-only AuthAuditLog). These
// mirror the message-code convention: SCREAMING_SNAKE_CASE keys, string values that
// ARE the stored code. `@dms/shared` is framework-agnostic — no Prisma/Express here;
// the server writes these codes via `recordAction`, and the admin viewer filters on them.
//
// KEEP additive: new audited actions append a code here (never repurpose an existing
// value — a stored trail must stay interpretable). These starter codes are SEEDED for the
// upcoming Sales/Admin wiring but are NOT yet emitted by any business usecase —
// `recordAction` is not yet called from lead/contract/user (event wiring is a follow-up).
// More codes arrive as the Sales/Admin build grows the coverage floor.

// The audited business modules (the `module` column). Lowercase, matches the
// permission-code `<module>` segment where one exists.
export const AUDIT_MODULES = {
  AUTH: "auth",
  LEAD: "lead",
  CONTRACT: "contract",
  PAYMENT: "payment",
  PROJECT: "project",
  TASK: "task",
  USER: "user",
};

// The audited actions (the `action` column). Language-neutral, past-tense event codes.
export const AUDIT_ACTIONS = {
  // auth (mirrored from AuthAuditLog into the unified trail)
  PROFILE_SWITCH: "PROFILE_SWITCH",
  PROFILE_ASSIGN: "PROFILE_ASSIGN",
  PROFILE_REMOVE: "PROFILE_REMOVE",
  // lead
  LEAD_CREATED: "LEAD_CREATED",
  LEAD_STATUS_CHANGED: "LEAD_STATUS_CHANGED",
  PRICE_OFFER_CREATED: "PRICE_OFFER_CREATED",
  LEAD_CALL_LOGGED: "LEAD_CALL_LOGGED",
  // contract
  CONTRACT_CREATED: "CONTRACT_CREATED",
  CONTRACT_PAYMENT_PAID: "CONTRACT_PAYMENT_PAID",
  CONTRACT_STAGE_STATUS_OVERRIDDEN: "CONTRACT_STAGE_STATUS_OVERRIDDEN",
  // user
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_ROLE_CHANGED: "USER_ROLE_CHANGED",
};
