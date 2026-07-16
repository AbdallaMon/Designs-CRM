// my-day usecase — orchestration only, NO Prisma. Personal queues re-run the SAME pure
// engines the lead detail uses (spec §4: engine-reuse lens); the team lens assembles the
// repo's aggregate exceptions. Profile family comes from authUser.currentProfileKey with
// a role-only fallback for un-migrated sessions — NEVER the legacy isSuperSales/isPrimary
// flags (CLAUDE.md §2.8).
import { AppError } from "../../shared/errors/AppError.js";
import { myDayMessagesCodes, messagesNames } from "@dms/shared";
import { myDayRepository } from "./my-day.repo.js";
import { leadRepository } from "../leads/lead/lead.repo.js";
import { computeCockpit, poolTouchSeverity } from "../leads/lead/lead.cockpit.js";
import { normalizeBundle } from "../leads/lead/lead.cockpit.usecase.js";
import { computeWorkStageActions, PROJECT_TYPE_TO_LEVEL } from "../leads/lead/lead.workstage-cockpit.js";
import { MyDayDto } from "./my-day.dto.js";

const TK = messagesNames.myDayMessages;

// Queue cap (spec §7): oldest-touched-first, so the most-at-risk leads survive.
export const MY_DAY_QUEUE_CAP = 50;

// Profile → queue family. SUPER_SALES supervises but ALSO works own deals (spec §3).
const SALES_PROFILE_KEYS = ["NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES", "SUPER_SALES_BASE"];
const DESIGNER_PROFILE_KEYS = ["DESIGNER_3D", "DESIGNER_2D", "EXECUTOR_2D"];
// Role fallback for sessions minted before the profile backfill (transitional).
const ROLE_TO_FAMILY = {
  STAFF: "SALES",
  SUPER_SALES: "SALES",
  THREE_D_DESIGNER: "DESIGNER",
  TWO_D_DESIGNER: "DESIGNER",
  TWO_D_EXECUTOR: "DESIGNER",
  ACCOUNTANT: "FINANCE",
  CONTACT_INITIATOR: "INITIATOR",
};

function familyOf({ profileKey, role }) {
  if (SALES_PROFILE_KEYS.includes(profileKey)) return "SALES";
  if (DESIGNER_PROFILE_KEYS.includes(profileKey)) return "DESIGNER";
  if (profileKey === "ACCOUNTANT") return "FINANCE";
  if (profileKey === "CONTACT_INITIATOR") return "INITIATOR";
  return ROLE_TO_FAMILY[role] ?? null;
}

// Target user's active profile key WITHOUT reading the legacy flags: the relational
// currentProfile first, the transitional `profile` column second, role-only last
// (role STAFF can't distinguish sales tiers — but the FAMILY is all the scope needs).
function targetProfileKey(user) {
  return user?.currentProfile?.key ?? user?.profile ?? null;
}

function targetFamily(user) {
  const key = targetProfileKey(user);
  return familyOf({ profileKey: key, role: user?.role });
}

class MyDayUsecase {
  // ── personal queue ─────────────────────────────────────────────────────────────────

  async getMyQueue({ authUser, now = new Date() }) {
    const queue = await this.#queueFor({
      userId: authUser.id,
      profileKey: authUser?.currentProfileKey ?? null,
      family: familyOf({ profileKey: authUser?.currentProfileKey, role: authUser?.role ?? authUser?.activeRole }),
      now,
    });
    // Today's agenda (self surface only — the supervisor drill-down stays exception-
    // focused): the caller's schedule for the day + anything already overdue.
    queue.agenda = await this.#agendaFor({ userId: authUser.id, now });
    return queue;
  }

  async #agendaFor({ userId, now }) {
    const { calls, meetings } = await myDayRepository.findTodaysAgendaForUser({ userId, now });
    const toRow = (kind) => (r) => ({
      kind,
      id: r.id,
      leadId: r.clientLead?.id ?? null,
      clientName: r.clientLead?.client?.name ?? null,
      time: new Date(r.time).toISOString(),
      overdue: new Date(r.time).getTime() < now.getTime(),
      reminderReason: r.reminderReason ?? null,
    });
    return [...calls.map(toRow("CALL")), ...meetings.map(toRow("MEETING"))].sort(
      (a, b) => new Date(a.time) - new Date(b.time),
    );
  }

  // Drill-down: target already scope-checked by checkIfUserCanViewMyDayOf (req.scoped).
  // Unlike the personal queue, the supervisor drawer itemizes the rep's REAL work — every
  // active lead (SALES) / stage (DESIGNER), including on-track ones — so "1 active" always
  // shows that one lead with a link, and every counted issue names its lead/call.
  async getQueueForTarget({ targetUser, now = new Date() }) {
    // A drill-down target is surfaced by the team lens from actual WORK, not a profile: the
    // SALES rollup groups leads/calls by owner (role-agnostic), so a non-sales-profile user
    // who owns active leads — e.g. an ADMIN who holds leads (spec §1: "admin has 1 overdue
    // call(s)") — legitimately appears and must drill into that work. Designers are role-gated,
    // so targetFamily() always classifies them as DESIGNER; a null family therefore means the
    // target was listed via sales work → the SALES queue (all reads keyed purely by userId)
    // itemizes it. (Previously this threw MY_DAY_PROFILE_UNSUPPORTED, making every such card /
    // exception open an empty/errored drawer.)
    const family = targetFamily(targetUser) ?? "SALES";
    if (family === "DESIGNER") return this.#designerTargetQueue({ user: targetUser, now });
    return this.#salesTargetQueue({ user: targetUser, now });
  }

  // SALES drill-down: a flat, severity-sorted list of the rep's attention-worthy + active
  // leads. The item set = active leads ∪ any lead with an overdue call / unsigned contract
  // (so a counted issue surfaces even if the lead's status isn't "active"). Each row carries
  // issue flags; `counts` equal the person-card counts (same predicates as the team lens).
  async #salesTargetQueue({ user, now }) {
    const userId = user.id;
    const [active, stale, overdueCalls, unsigned] = await Promise.all([
      myDayRepository.activeLeadsForRep(userId),
      myDayRepository.staleLeadsForRep(userId, now),
      myDayRepository.overdueCallsForRep(userId, now),
      myDayRepository.signingStalledForRep(userId, now),
    ]);

    const staleSet = new Set(stale.map((l) => l.id));
    const unsignedSet = new Set(unsigned.map((c) => c.clientLeadId).filter((id) => id != null));
    const overdueByLead = new Map();
    for (const c of overdueCalls) {
      if (c.clientLeadId == null) continue;
      overdueByLead.set(c.clientLeadId, (overdueByLead.get(c.clientLeadId) ?? 0) + 1);
    }

    // Merge every source into one row per lead (first non-null wins for display fields).
    const rowById = new Map();
    const upsert = (leadId, base) => {
      if (leadId == null) return;
      const existing = rowById.get(leadId);
      if (!existing) { rowById.set(leadId, { leadId, clientName: null, status: null, sortAt: null, ...base }); return; }
      for (const [k, v] of Object.entries(base)) if (existing[k] == null && v != null) existing[k] = v;
    };
    for (const l of active) upsert(l.id, { clientName: l.client?.name ?? null, status: l.status, sortAt: l.updatedAt ?? null });
    for (const l of stale) upsert(l.id, { clientName: l.client?.name ?? null, status: l.status, sortAt: l.updatedAt ?? null });
    for (const c of overdueCalls) upsert(c.clientLeadId, { clientName: c.clientLead?.client?.name ?? null, status: c.clientLead?.status ?? null, sortAt: c.time ?? null });
    for (const c of unsigned) upsert(c.clientLeadId, { clientName: c.clientLead?.client?.name ?? null, status: c.clientLead?.status ?? null, sortAt: c.createdAt ?? null });

    const items = [...rowById.values()].map((r) => {
      const overdue = overdueByLead.get(r.leadId) ?? 0;
      const isStale = staleSet.has(r.leadId);
      const isUnsigned = unsignedSet.has(r.leadId);
      return {
        leadId: r.leadId,
        clientName: r.clientName,
        status: r.status,
        sortAt: r.sortAt ? new Date(r.sortAt).toISOString() : null,
        flags: { overdueCalls: overdue, stale: isStale, unsigned: isUnsigned },
        severity: overdue > 0 ? "critical" : isStale || isUnsigned ? "warning" : "info",
      };
    });

    const counts = {
      active: active.length,
      stale: stale.length,
      overdueCalls: overdueCalls.length,
      unsigned: unsigned.length,
    };
    return MyDayDto.toTargetQueue({ user, family: "SALES", counts, items, now });
  }

  // DESIGNER drill-down: the rep's active stages, on-track ones INCLUDED (empty signals →
  // "On track" in the FE), sorted most-at-risk first.
  async #designerTargetQueue({ user, now }) {
    const rows = await myDayRepository.findDesignerAssignments({ userId: user.id });
    const seen = new Set();
    const items = [];
    for (const row of rows) {
      const p = row.project;
      if (!p || seen.has(p.id)) continue;
      seen.add(p.id);
      const deliveryAt = resolveDeliveryAt(p);
      const signals = computeWorkStageActions(
        {
          assignments: [
            {
              projectType: p.type,
              contractLevel: PROJECT_TYPE_TO_LEVEL[p.type] ?? null,
              projectStatus: "IN_PROGRESS",
              stageStatus: "IN_PROGRESS",
              deliveryAt,
            },
          ],
        },
        now,
      );
      items.push({
        kind: "WORK_STAGE",
        projectId: p.id,
        leadId: p.clientLeadId,
        clientName: p.clientLead?.client?.name ?? null,
        projectType: p.type,
        level: PROJECT_TYPE_TO_LEVEL[p.type] ?? null,
        deliveryAt: deliveryAt ? new Date(deliveryAt).toISOString() : null,
        sortAt: deliveryAt ?? null,
        signals,
      });
    }
    const rankOf = (it) =>
      it.signals.length ? Math.min(...it.signals.map((s) => EXCEPTION_RANK[s.severity] ?? 2)) : 3;
    items.sort((a, b) => {
      const byRank = rankOf(a) - rankOf(b);
      if (byRank !== 0) return byRank;
      const at = a.sortAt ? new Date(a.sortAt).getTime() : 0;
      const bt = b.sortAt ? new Date(b.sortAt).getTime() : 0;
      return at - bt;
    });
    return {
      user: { id: user.id, name: user.name ?? null },
      family: "DESIGNER",
      generatedAt: now.toISOString(),
      items,
    };
  }

  // Aging unclaimed leads behind LEAD_UNCLAIMED_AGING — no owner, so anyone holding
  // my_day.team.view may list them to pick up. Sales-domain only (unclaimed leads are sales).
  async getUnclaimedLeads({ now = new Date() } = {}) {
    const rows = await myDayRepository.unclaimedAgingLeads(now);
    const items = rows.map((l) => ({
      leadId: l.id,
      clientName: l.client?.name ?? null,
      createdAt: new Date(l.createdAt).toISOString(),
      agingDays: Math.floor((now.getTime() - new Date(l.createdAt).getTime()) / 86400_000),
    }));
    return MyDayDto.toUnclaimed({ items, now });
  }

  async #queueFor({ userId, profileKey, family, now }) {
    if (family === "SALES") {
      const [bundles, total] = await Promise.all([
        leadRepository.findCockpitBundlesForUser({ userId, take: MY_DAY_QUEUE_CAP }),
        leadRepository.countMyDayLeads({ userId }),
      ]);
      const items = bundles
        .map((b) => {
          const { health, actions } = computeCockpit(normalizeBundle(b), now, { profileKey });
          return {
            kind: "LEAD",
            leadId: b.id,
            clientName: b.client?.name ?? null,
            status: b.status,
            sortAt: b.updatedAt ?? null,
            signals: actions,
            health: compactHealth(health),
          };
        })
        .filter((i) => i.signals.length > 0);
      return MyDayDto.toQueue({ profileKey, family, items, truncated: total > bundles.length, now });
    }

    if (family === "DESIGNER") {
      const rows = await myDayRepository.findDesignerAssignments({ userId });
      const seen = new Set();
      const items = [];
      for (const row of rows) {
        const p = row.project;
        if (!p || seen.has(p.id)) continue;
        seen.add(p.id);
        const deliveryAt = resolveDeliveryAt(p);
        const signals = computeWorkStageActions(
          {
            assignments: [
              {
                projectType: p.type,
                contractLevel: PROJECT_TYPE_TO_LEVEL[p.type] ?? null,
                projectStatus: "IN_PROGRESS", // repo already filtered to active projects
                stageStatus: "IN_PROGRESS",
                deliveryAt,
              },
            ],
          },
          now,
        );
        if (!signals.length) continue;
        items.push({
          kind: "WORK_STAGE",
          projectId: p.id,
          leadId: p.clientLeadId,
          clientName: p.clientLead?.client?.name ?? null,
          projectType: p.type,
          level: PROJECT_TYPE_TO_LEVEL[p.type] ?? null,
          deliveryAt: deliveryAt ? new Date(deliveryAt).toISOString() : null,
          sortAt: deliveryAt ?? null,
          signals,
        });
      }
      return MyDayDto.toQueue({ profileKey, family, items, truncated: false, now });
    }

    // FINANCE (accountant) — collections queue: every lead whose active contract carries
    // a DUE ContractPayment, run through the engine's ACCOUNTANT ruleset (spec §6.1).
    if (family === "FINANCE") {
      const bundles = await leadRepository.findCockpitBundlesWithDuePayments({
        take: MY_DAY_QUEUE_CAP,
      });
      const items = bundles
        .map((b) => {
          const { health, actions } = computeCockpit(normalizeBundle(b), now, {
            profileKey: profileKey ?? "ACCOUNTANT",
          });
          return {
            kind: "LEAD",
            leadId: b.id,
            clientName: b.client?.name ?? null,
            status: b.status,
            sortAt: b.updatedAt ?? null,
            signals: actions,
            health: compactHealth(health),
          };
        })
        .filter((i) => i.signals.length > 0);
      return MyDayDto.toQueue({ profileKey, family, items, truncated: false, now });
    }

    // INITIATOR (contact-initiator) — first-touch queue: their OWN claimed leads through
    // the sales engine PLUS the unclaimed NEW pool aging in hours (spec §6.2).
    if (family === "INITIATOR") {
      const [bundles, pool] = await Promise.all([
        leadRepository.findCockpitBundlesForUser({ userId, take: MY_DAY_QUEUE_CAP }),
        myDayRepository.unclaimedPoolLeads({ take: MY_DAY_QUEUE_CAP }),
      ]);
      const own = bundles
        .map((b) => {
          const { health, actions } = computeCockpit(normalizeBundle(b), now, { profileKey });
          return {
            kind: "LEAD",
            leadId: b.id,
            clientName: b.client?.name ?? null,
            status: b.status,
            sortAt: b.updatedAt ?? null,
            signals: actions,
            health: compactHealth(health),
          };
        })
        .filter((i) => i.signals.length > 0);
      const poolItems = pool
        .map((l) => {
          const severity = poolTouchSeverity(l.createdAt, now);
          if (!severity) return null; // fresher than the warn threshold — not queue-worthy
          return {
            kind: "LEAD",
            leadId: l.id,
            clientName: l.client?.name ?? null,
            status: "NEW",
            sortAt: l.createdAt ?? null,
            signals: [
              {
                type: "POOL_FIRST_TOUCH",
                severity,
                params: {
                  hoursSincePool: Math.floor(
                    (now.getTime() - new Date(l.createdAt).getTime()) / 3600_000,
                  ),
                },
                cta: { kind: "GOTO_TAB", capability: null, tabKey: null },
              },
            ],
          };
        })
        .filter(Boolean);
      return MyDayDto.toQueue({
        profileKey,
        family,
        items: [...own, ...poolItems],
        truncated: false,
        now,
      });
    }

    // Admins have no personal queue (spec §3 — team lens only).
    throw new AppError(myDayMessagesCodes.MY_DAY_PROFILE_UNSUPPORTED, 403, null, {
      translationKey: TK,
      reason: `no My Day queue family for profile "${profileKey}" / role fallback`,
    });
  }

  // ── supervisor scope checker (requireSpecialChecker contract: THROW on denial) ──────
  // ADMIN/SUPER_ADMIN target anyone; SUPER_SALES targets sales-tier users only (spec §5.1).
  async checkIfUserCanViewMyDayOf({ id, authUser }) {
    const target = await myDayRepository.findUserForScope({ userId: Number(id) });
    if (!target) throw new AppError(myDayMessagesCodes.MY_DAY_TARGET_NOT_FOUND, 404, null, { translationKey: TK });

    const callerProfile = authUser?.currentProfileKey;
    const callerIsAdmin =
      callerProfile === "ADMIN" || callerProfile === "SUPER_ADMIN" ||
      (!callerProfile && ["ADMIN", "SUPER_ADMIN"].includes(authUser?.role ?? authUser?.activeRole));
    if (callerIsAdmin) return target;

    // Everyone else holding my_day.team.view is a SUPER_SALES-tier supervisor:
    // sales-domain targets only.
    if (targetFamily(target) === "SALES") return target;
    throw new AppError(myDayMessagesCodes.MY_DAY_TEAM_SCOPE_DENIED, 403, null, {
      translationKey: TK,
      reason: "super-sales supervisors may only view sales-tier queues",
    });
  }

  // ── team lens ──────────────────────────────────────────────────────────────────────

  async getTeamOverview({ authUser, now = new Date() }) {
    const callerProfile = authUser?.currentProfileKey;
    const isAdmin =
      callerProfile === "ADMIN" || callerProfile === "SUPER_ADMIN" ||
      (!callerProfile && ["ADMIN", "SUPER_ADMIN"].includes(authUser?.role ?? authUser?.activeRole));

    const domains = { sales: await this.#salesDomain(now) };
    if (isAdmin) domains.designers = await this.#designersDomain(now);
    return MyDayDto.toTeam({ domains, now });
  }

  async #salesDomain(now) {
    const [stale, unclaimed, overdueCalls, signing, load] = await Promise.all([
      myDayRepository.staleLeadsByRep(now),
      myDayRepository.unclaimedAgingCount(now),
      myDayRepository.overdueCallsByRep(now),
      myDayRepository.signingStalled(now),
      myDayRepository.salesLoad(),
    ]);

    // Resolve names for reps that appear only in the groupBys.
    const knownIds = new Set(load.map((p) => p.userId));
    const extraIds = [...new Set([...stale, ...overdueCalls].map((g) => g.userId))].filter(
      (id) => id != null && !knownIds.has(id),
    );
    const extraNames = await myDayRepository.findUserNames(extraIds);
    const nameById = new Map([
      ...load.map((p) => [p.userId, p.name]),
      ...extraNames.map((u) => [u.id, u.name]),
    ]);

    const staleById = new Map(stale.map((g) => [g.userId, g._count._all]));
    const overdueById = new Map(overdueCalls.map((g) => [g.userId, g._count._all]));

    const exceptions = [];
    for (const g of stale) {
      exceptions.push({
        type: "LEAD_STALE_TEAM",
        severity: "warning",
        params: { userId: g.userId, userName: nameById.get(g.userId) ?? null, count: g._count._all },
      });
    }
    if (unclaimed > 0) {
      exceptions.push({ type: "LEAD_UNCLAIMED_AGING", severity: "warning", params: { count: unclaimed } });
    }
    for (const g of overdueCalls) {
      exceptions.push({
        type: "CALL_OVERDUE_TEAM",
        severity: "critical",
        params: { userId: g.userId, userName: nameById.get(g.userId) ?? null, count: g._count._all },
      });
    }
    for (const c of signing) {
      exceptions.push({
        type: "CONTRACT_SIGNING_STALLED",
        severity: "warning",
        params: {
          leadId: c.clientLeadId,
          clientName: c.clientLead?.client?.name ?? null,
          userId: c.clientLead?.userId ?? null,
          userName: c.clientLead?.userId != null ? (nameById.get(c.clientLead.userId) ?? null) : null,
          sinceDays: Math.floor((now.getTime() - new Date(c.createdAt).getTime()) / 86400_000),
        },
      });
    }
    for (const p of load) {
      if (p.maxLeads != null && p.activeLeads > p.maxLeads) {
        exceptions.push({
          type: "REP_OVER_CAPACITY",
          severity: "warning",
          params: { userId: p.userId, userName: p.name, activeCount: p.activeLeads, maxCount: p.maxLeads },
        });
      }
    }

    const people = load.map((p) => ({
      userId: p.userId,
      name: p.name,
      family: "SALES",
      activeCount: p.activeLeads,
      maxCount: p.maxLeads,
      staleCount: staleById.get(p.userId) ?? 0,
      overdueCount: overdueById.get(p.userId) ?? 0,
    }));

    return { exceptions: sortExceptions(exceptions), people };
  }

  async #designersDomain(now) {
    const [deliveries, load] = await Promise.all([
      myDayRepository.deliveriesAtRisk(now),
      myDayRepository.designerLoad(),
    ]);

    const exceptions = [];
    const overdueByUser = new Map();
    const soonByUser = new Map();
    for (const d of deliveries) {
      const isOverdue = new Date(d.deliveryAt).getTime() < now.getTime();
      const designers = (d.project?.assignments ?? [])
        .map((a) => a.user)
        .filter(Boolean);
      exceptions.push({
        type: isOverdue ? "DELIVERY_OVERDUE_TEAM" : "DELIVERY_DUE_SOON_TEAM",
        severity: isOverdue ? "critical" : "warning",
        params: {
          projectId: d.project?.id ?? null,
          leadId: d.project?.clientLeadId ?? null,
          projectType: d.project?.type ?? null,
          deliveryAt: new Date(d.deliveryAt).toISOString(),
          designers: designers.map((u) => ({ userId: u.id, name: u.name })),
        },
      });
      for (const u of designers) {
        const bucket = isOverdue ? overdueByUser : soonByUser;
        bucket.set(u.id, (bucket.get(u.id) ?? 0) + 1);
      }
    }

    const people = load.map((p) => ({
      userId: p.userId,
      name: p.name,
      family: "DESIGNER",
      activeCount: p.activeStages,
      overdueCount: overdueByUser.get(p.userId) ?? 0,
      atRiskCount: soonByUser.get(p.userId) ?? 0,
    }));

    return { exceptions: sortExceptions(exceptions), people };
  }
}

// Compact per-item deal-health strip for queue cards (the engine computes the full
// health anyway — this keeps only the display-safe progress/payment facts, no amounts).
function compactHealth(health) {
  if (!health) return null;
  return {
    stageIndex: health.stageIndex,
    stageCount: health.stageCount,
    contractLevel: health.contract?.currentLevel ?? null,
    levelsDone: health.contract?.levelsDone ?? null,
    levelsTotal: health.contract?.levelsTotal ?? null,
    paymentFlag:
      health.payment?.overdueCount > 0
        ? "OVERDUE"
        : health.payment?.hasDue
          ? "DUE"
          : health.contract
            ? "OK"
            : null,
  };
}

// Earliest live-stage delivery date, else the project fallback (spec §5.2).
function resolveDeliveryAt(project) {
  const liveDeliveries = (project.contractStages ?? [])
    .filter((s) => s.stageStatus !== "COMPLETED" && s.deliverySchedule?.deliveryAt)
    .map((s) => new Date(s.deliverySchedule.deliveryAt))
    .sort((a, b) => a - b);
  return liveDeliveries[0] ?? project.deliveryTime ?? null;
}

const EXCEPTION_RANK = { critical: 0, warning: 1, info: 2 };
function sortExceptions(list) {
  return [...list].sort((a, b) => (EXCEPTION_RANK[a.severity] ?? 2) - (EXCEPTION_RANK[b.severity] ?? 2));
}

export const myDayUsecase = new MyDayUsecase();
export { MyDayUsecase };
