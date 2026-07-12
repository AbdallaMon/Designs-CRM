// my-day usecase — orchestration only, NO Prisma. Personal queues re-run the SAME pure
// engines the lead detail uses (spec §4: engine-reuse lens); the team lens assembles the
// repo's aggregate exceptions. Profile family comes from authUser.currentProfileKey with
// a role-only fallback for un-migrated sessions — NEVER the legacy isSuperSales/isPrimary
// flags (CLAUDE.md §2.8).
import { AppError } from "../../shared/errors/AppError.js";
import { myDayMessagesCodes as C, messagesNames } from "@dms/shared";
import { myDayRepository } from "./my-day.repo.js";
import { leadRepository } from "../leads/lead/lead.repo.js";
import { computeCockpit } from "../leads/lead/lead.cockpit.js";
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
};

function familyOf({ profileKey, role }) {
  if (SALES_PROFILE_KEYS.includes(profileKey)) return "SALES";
  if (DESIGNER_PROFILE_KEYS.includes(profileKey)) return "DESIGNER";
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

export class MyDayUsecase {
  /**
   * @param {typeof import("./my-day.repo.js").myDayRepository} repository
   * @param {import("../leads/lead/lead.repo.js").LeadRepository} leadRepo
   */
  constructor(repository, leadRepo) {
    this.repo = repository;
    this.leadRepo = leadRepo;
  }

  // ── personal queue ─────────────────────────────────────────────────────────────────

  async getMyQueue({ authUser, now = new Date() }) {
    return this.#queueFor({
      userId: authUser.id,
      profileKey: authUser?.currentProfileKey ?? null,
      family: familyOf({ profileKey: authUser?.currentProfileKey, role: authUser?.role ?? authUser?.activeRole }),
      now,
    });
  }

  // Drill-down: target already scope-checked by checkIfUserCanViewMyDayOf (req.scoped).
  async getQueueForTarget({ targetUser, now = new Date() }) {
    return this.#queueFor({
      userId: targetUser.id,
      profileKey: targetProfileKey(targetUser),
      family: targetFamily(targetUser),
      now,
    });
  }

  async #queueFor({ userId, profileKey, family, now }) {
    if (family === "SALES") {
      const [bundles, total] = await Promise.all([
        this.leadRepo.findCockpitBundlesForUser({ userId, take: MY_DAY_QUEUE_CAP }),
        this.leadRepo.countMyDayLeads({ userId }),
      ]);
      const items = bundles
        .map((b) => {
          const { actions } = computeCockpit(normalizeBundle(b), now, { profileKey });
          return {
            kind: "LEAD",
            leadId: b.id,
            clientName: b.client?.name ?? null,
            status: b.status,
            sortAt: b.updatedAt ?? null,
            signals: actions,
          };
        })
        .filter((i) => i.signals.length > 0);
      return MyDayDto.toQueue({ profileKey, family, items, truncated: total > bundles.length, now });
    }

    if (family === "DESIGNER") {
      const rows = await this.repo.findDesignerAssignments({ userId });
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

    // Admins/accountants/contact-initiators have no personal queue (spec §3).
    throw new AppError(C.MY_DAY_PROFILE_UNSUPPORTED, 403, null, {
      translationKey: TK,
      reason: `no My Day queue family for profile "${profileKey}" / role fallback`,
    });
  }

  // ── supervisor scope checker (requireSpecialChecker contract: THROW on denial) ──────
  // ADMIN/SUPER_ADMIN target anyone; SUPER_SALES targets sales-tier users only (spec §5.1).
  async checkIfUserCanViewMyDayOf({ id, authUser }) {
    const target = await this.repo.findUserForScope({ userId: Number(id) });
    if (!target) throw new AppError(C.MY_DAY_TARGET_NOT_FOUND, 404, null, { translationKey: TK });

    const callerProfile = authUser?.currentProfileKey;
    const callerIsAdmin =
      callerProfile === "ADMIN" || callerProfile === "SUPER_ADMIN" ||
      (!callerProfile && ["ADMIN", "SUPER_ADMIN"].includes(authUser?.role ?? authUser?.activeRole));
    if (callerIsAdmin) return target;

    // Everyone else holding my_day.team.view is a SUPER_SALES-tier supervisor:
    // sales-domain targets only.
    if (targetFamily(target) === "SALES") return target;
    throw new AppError(C.MY_DAY_TEAM_SCOPE_DENIED, 403, null, {
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
      this.repo.staleLeadsByRep(now),
      this.repo.unclaimedAgingCount(now),
      this.repo.overdueCallsByRep(now),
      this.repo.signingStalled(now),
      this.repo.salesLoad(),
    ]);

    // Resolve names for reps that appear only in the groupBys.
    const knownIds = new Set(load.map((p) => p.userId));
    const extraIds = [...new Set([...stale, ...overdueCalls].map((g) => g.userId))].filter(
      (id) => id != null && !knownIds.has(id),
    );
    const extraNames = await this.repo.findUserNames(extraIds);
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
      this.repo.deliveriesAtRisk(now),
      this.repo.designerLoad(),
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

export const myDayUsecase = new MyDayUsecase(myDayRepository, leadRepository);
