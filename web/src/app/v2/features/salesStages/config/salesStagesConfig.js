// Sales-pipeline presentation config — the ORDERED stage list + Arabic labels and the
// derivation helpers the pipeline UI needs. The backend is the source of truth for which
// stages a lead has REACHED (it persists a SalesStage row per reached stage and deletes on
// roll-back); this file only describes the canonical ORDER + display, and derives "current"
// / "next" / "reached" from the rows the read returns.
//
// Stage keys are the SalesStageType enum (see config/constant.js → SALES_STAGE_TYPES, kept
// 1:1 with server/.../sales-stages.validation.js). The virtual NOT_INITIATED sentinel is the
// "no stage started yet" baseline — it is NOT a persisted row and never appears in the list.

import { SALES_STAGE_TYPES } from "./constant.js";

// Arabic display label per stage key (single-language, RTL).
export const SALES_STAGE_LABELS = {
  INITIAL_CONTACT: "التواصل الأولي",
  SOCIAL_MEDIA_CHECK: "مراجعة وسائل التواصل",
  WHATSAPP_QA: "أسئلة وأجوبة واتساب",
  MEETING_BOOKED: "تم حجز اجتماع",
  CLIENT_INFO_UPLOADED: "رفع معلومات العميل",
  CONSULTATION_BOOKED: "تم حجز استشارة",
  FOLLOWUP_AFTER_MEETING: "متابعة بعد الاجتماع",
  HANDLE_OBJECTIONS: "معالجة الاعتراضات",
  DEAL_CLOSED: "إغلاق الصفقة",
  AFTER_SALES_FOLLOWUP: "متابعة ما بعد البيع",
  NOT_INITIATED: "لم تبدأ بعد",
};

export function labelForStage(key) {
  return SALES_STAGE_LABELS[key] ?? key;
}

// The canonical ordered pipeline (index === position). Derived from SALES_STAGE_TYPES so it
// stays in lock-step with the backend enum/order.
export const PIPELINE = SALES_STAGE_TYPES.map((key, index) => ({
  key,
  index,
  label: labelForStage(key),
}));

/**
 * Build the per-step view model from the rows the read returns.
 *
 * The read returns ONLY reached stages (raw SalesStage rows: { id, clientLeadId, userId,
 * stage, createdAt }). We map each canonical pipeline step to whether it has a matching row,
 * carry its createdAt timestamp when present, and flag the CURRENT step = the last reached
 * step in pipeline order (the legacy notion of "current stage").
 *
 * @param {Array<{ stage: string, createdAt?: string, id?: number }>} rows
 * @returns {{
 *   steps: Array<{ key, index, label, reached: boolean, current: boolean, reachedAt: string|null }>,
 *   currentIndex: number,            // -1 when nothing reached yet (NOT_INITIATED baseline)
 *   currentKey: string,              // "NOT_INITIATED" when nothing reached yet
 *   nextKey: string|null,            // the next advanceable stage key, or null at the end
 *   reachedCount: number,
 * }}
 */
export function buildPipelineView(rows) {
  const reachedByKey = new Map();
  (Array.isArray(rows) ? rows : []).forEach((r) => {
    if (r?.stage) reachedByKey.set(r.stage, r);
  });

  // Current = highest-index reached stage (pipeline order), matching the legacy "current".
  let currentIndex = -1;
  PIPELINE.forEach((step) => {
    if (reachedByKey.has(step.key) && step.index > currentIndex) currentIndex = step.index;
  });

  const steps = PIPELINE.map((step) => {
    const row = reachedByKey.get(step.key) ?? null;
    return {
      key: step.key,
      index: step.index,
      label: step.label,
      reached: Boolean(row),
      current: step.index === currentIndex,
      reachedAt: row?.createdAt ?? null,
    };
  });

  const nextStep = PIPELINE.find((s) => s.index === currentIndex + 1) ?? null;

  return {
    steps,
    currentIndex,
    currentKey: currentIndex >= 0 ? PIPELINE[currentIndex].key : "NOT_INITIATED",
    nextKey: nextStep ? nextStep.key : null,
    reachedCount: reachedByKey.size,
  };
}
