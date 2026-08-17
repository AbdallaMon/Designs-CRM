import { CONTRACT_PAYMENT_STATUSES, WORK_STAGE_STATUSES } from "@dms/shared";
export const canEditStageDays = (stageStatus) =>
  stageStatus === WORK_STAGE_STATUSES.IN_PROGRESS || stageStatus === WORK_STAGE_STATUSES.NOT_STARTED;
export const canDeleteStage = (stageStatus) => stageStatus === WORK_STAGE_STATUSES.NOT_STARTED;

// payments: allow delete only when NOT_DUE or DUE (but not received/transfered)
export const canDeletePayment = (status) =>
  status === CONTRACT_PAYMENT_STATUSES.NOT_DUE || status === CONTRACT_PAYMENT_STATUSES.DUE;

// tiny diff util so we only send changed fields
export function diffPayload(original, changed) {
  const out = {};
  Object.keys(changed).forEach((k) => {
    const a = changed[k];
    const b = original?.[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) out[k] = a;
  });
  return out;
}

export function isoDateOnly(v) {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
