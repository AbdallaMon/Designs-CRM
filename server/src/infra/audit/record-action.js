// recordAction — the non-blocking recorder usecases call AFTER a successful write to
// append a semantic row to the ActionAuditLog trail. Two hard guarantees:
//   1. NEVER throws — a logging failure must not break the business operation. Any
//      error is swallowed and console.error'd; the audit write lives OUTSIDE the
//      caller's transaction, so the real op is already committed by the time this runs.
//   2. NEVER logs secrets — before/after snapshots are diffed + redacted via diffFields.
//
// `ctx`   = { actorUserId, actorRole, ip } (derive from req via auditCtxFromReq).
// `event` = { module, action, entityType?, entityId?, clientLeadId?, summary?,
//             before?, after?, allowedKeys?, detail? }.
// When before/after are given, the changed-only redacted diff becomes `detail`; an
// explicit `detail` wins over the computed diff.
import { diffFields } from "./diff-fields.js";
import { actionAuditRepository } from "./action-audit.repo.js";

export async function recordAction(ctx = {}, event = {}) {
  try {
    const { before, after, allowedKeys, detail, ...rest } = event;
    const diff = before || after ? diffFields(before, after, allowedKeys) : null;

    await actionAuditRepository.create({
      actorUserId: ctx.actorUserId ?? null,
      actorRole: ctx.actorRole ?? null,
      ip: ctx.ip ?? null,
      module: rest.module,
      action: rest.action,
      entityType: rest.entityType ?? null,
      entityId: rest.entityId ?? null,
      clientLeadId: rest.clientLeadId ?? null,
      summary: rest.summary ?? null,
      detail: detail ?? diff ?? null,
    });
  } catch (e) {
    // Swallow: the audit trail is best-effort and must never break the caller.
    console.error("[audit] recordAction failed:", e?.message);
  }
}

// Build the audit context from an Express request. The actor is ALWAYS the
// authenticated caller (req.auth), never client-supplied input.
export function auditCtxFromReq(req) {
  return {
    actorUserId: req?.auth?.id ?? null,
    actorRole: req?.auth?.role ?? null,
    ip: req?.ip ?? null,
  };
}
