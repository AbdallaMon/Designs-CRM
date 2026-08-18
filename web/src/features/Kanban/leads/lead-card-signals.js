import { LEAD_STATUSES } from "@dms/shared";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function asDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(value) {
  return asDate(value)?.toISOString() ?? null;
}

export function getLeadNextAction(callReminders = [], { now = new Date() } = {}) {
  const openCalls = callReminders
    .filter((call) => call?.status === LEAD_STATUSES.IN_PROGRESS && asDate(call.time))
    .sort((a, b) => asDate(a.time) - asDate(b.time));

  if (!openCalls.length) {
    return { kind: "MISSING", dueAt: null, overdue: false };
  }

  const overdueCalls = openCalls.filter((call) => asDate(call.time) < now);
  const target = overdueCalls[0] ?? openCalls[0];
  return {
    kind: "CALL",
    dueAt: toIso(target.time),
    overdue: asDate(target.time) < now,
  };
}

export function getLatestLeadActivity(lead, { now = new Date() } = {}) {
  const candidates = [];

  for (const update of lead?.updates ?? []) {
    const at = asDate(update?.updatedAt ?? update?.createdAt);
    if (at && at <= now) {
      candidates.push({
        kind: "UPDATE",
        label: update.title || "Project update",
        at: at.toISOString(),
      });
    }
  }

  for (const call of lead?.callReminders ?? []) {
    const at = asDate(call?.time);
    if (at && at <= now && call?.status !== LEAD_STATUSES.IN_PROGRESS) {
      candidates.push({ kind: "CALL", label: "Call completed", at: at.toISOString() });
    }
  }

  const createdAt = asDate(lead?.createdAt);
  if (createdAt && createdAt <= now) {
    candidates.push({ kind: "CREATED", label: "Deal created", at: createdAt.toISOString() });
  }

  return candidates.sort((a, b) => asDate(b.at) - asDate(a.at))[0] ?? null;
}

export function getLeadAgeDays(createdAt, { now = new Date() } = {}) {
  const created = asDate(createdAt);
  if (!created) return null;
  return Math.max(0, Math.floor((now - created) / MS_PER_DAY));
}

export function getCurrentContractStage(contract) {
  return (
    contract?.stage?.title ??
    contract?.stages?.find((stage) => stage?.stageStatus === LEAD_STATUSES.IN_PROGRESS)?.title ??
    null
  );
}

