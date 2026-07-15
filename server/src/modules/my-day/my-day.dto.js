// my-day DTOs — pure whitelisted projections (no Prisma, no business rules).
const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 };

function itemRank(item) {
  if (!item.signals.length) return 3;
  return Math.min(...item.signals.map((s) => SEVERITY_RANK[s.severity] ?? 2));
}

export class MyDayDto {
  // Queue items sorted most-severe-first, ties broken oldest sortAt first (spec §5.5).
  static toQueue({ profileKey, family, items, truncated, now }) {
    const sorted = [...items].sort((a, b) => {
      const bySeverity = itemRank(a) - itemRank(b);
      if (bySeverity !== 0) return bySeverity;
      const at = a.sortAt ? new Date(a.sortAt).getTime() : 0;
      const bt = b.sortAt ? new Date(b.sortAt).getTime() : 0;
      return at - bt;
    });
    return {
      profileKey: profileKey ?? null,
      family,
      generatedAt: now.toISOString(),
      truncated: Boolean(truncated),
      items: sorted,
    };
  }

  static toTeam({ domains, now }) {
    return { generatedAt: now.toISOString(), domains };
  }

  // Supervisor drill-down for a SALES target: a flat, severity-sorted list of the rep's
  // attention-worthy + active leads, each carrying issue flags + a derived severity so the
  // FE can chip + link every row. `counts` mirror the person-card counts.
  static toTargetQueue({ user, family, counts, items, now }) {
    const sorted = [...items].sort((a, b) => {
      const bySeverity = (SEVERITY_RANK[a.severity] ?? 2) - (SEVERITY_RANK[b.severity] ?? 2);
      if (bySeverity !== 0) return bySeverity;
      const at = a.sortAt ? new Date(a.sortAt).getTime() : 0;
      const bt = b.sortAt ? new Date(b.sortAt).getTime() : 0;
      return at - bt;
    });
    return {
      user: user ? { id: user.id, name: user.name ?? null } : null,
      family,
      generatedAt: now.toISOString(),
      counts,
      items: sorted,
    };
  }

  // The aging unclaimed leads behind LEAD_UNCLAIMED_AGING — oldest first, each linkable.
  static toUnclaimed({ items, now }) {
    return { generatedAt: now.toISOString(), items };
  }
}
