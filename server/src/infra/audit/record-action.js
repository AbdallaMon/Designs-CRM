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
// explicit `detail` wins over the computed diff — but is ITSELF run through the same
// top-level redaction first (so a hand-built detail can't smuggle a secret into the
// trail). Callers passing an explicit `detail` MUST pass a FLAT snapshot: redaction is
// top-level only, so nested secrets would not be caught.
import { diffFields, redactObject } from "./diff-fields.js";
import { actionAuditRepository } from "./action-audit.repo.js";

export async function recordAction(ctx = {}, event = {}) {
  try {
    const { before, after, allowedKeys, detail, ...rest } = event;
    const diff = before || after ? diffFields(before, after, allowedKeys) : null;
    // An explicit detail bypasses the diff redaction path, so redact it here too.
    const safeDetail = detail != null ? redactObject(detail) : null;

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
      detail: safeDetail ?? diff ?? null,
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
