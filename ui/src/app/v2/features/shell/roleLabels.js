// Arabic role-chip labels for the TopBar/PageHeader role chip. The chip uses the DISPLAY-only
// `activeRole` + `isSuperSales` / `isPrimary` flags from auth/me (auth.dto.js toMe) — it is
// NEVER a gate (we gate on permission codes only). VALUES are the Prisma UserRole enum keys
// (packages/db schema.prisma `UserRole`); sub-roles reuse the same enum (UserSubRole.subRole).
//
// ⚠️ PROVISIONAL COPY — these are sensible defaults. The user will confirm the exact brand
// wording for each persona; every label here is intentionally easy to change in ONE place.

// Base UserRole → Arabic label (provisional).
export const ROLE_LABELS = {
  ADMIN: "مدير",
  SUPER_ADMIN: "مدير عام",
  STAFF: "موظف مبيعات",
  SUPER_SALES: "مشرف مبيعات",
  CONTACT_INITIATOR: "مسؤول التواصل",
  ACCOUNTANT: "محاسب",
  THREE_D_DESIGNER: "مصمم ثلاثي الأبعاد",
  TWO_D_DESIGNER: "مصمم ثنائي الأبعاد",
  TWO_D_EXECUTOR: "منفّذ ثنائي الأبعاد",
};

// Flag-derived chips shown ALONGSIDE the base role (provisional).
export const ROLE_FLAG_LABELS = {
  isSuperSales: "مبيعات أول", // staff-extra: super-sales power
  isPrimary: "أساسي", // staff-extra: primary salesperson
};

/** Resolve a base role enum value to its Arabic label; falls back to the raw value. */
export function resolveRoleLabel(role) {
  return ROLE_LABELS[role] ?? role ?? "—";
}

/**
 * Build the ordered list of role chips to show for a user: the base (active) role first,
 * then any flag chips (super-sales / primary). Returns [{ key, label }].
 */
export function buildRoleChips(user) {
  if (!user) return [];
  const chips = [];
  const base = user.activeRole ?? user.role;
  if (base) chips.push({ key: "role", label: resolveRoleLabel(base) });
  if (user.isSuperSales)
    chips.push({ key: "isSuperSales", label: ROLE_FLAG_LABELS.isSuperSales });
  if (user.isPrimary)
    chips.push({ key: "isPrimary", label: ROLE_FLAG_LABELS.isPrimary });
  return chips;
}
