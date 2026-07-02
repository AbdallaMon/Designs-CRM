# Permission Profiles — Phase 3 (chunk 1: lead-detail FE gating) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the lead-detail section-visibility gates (`admin`/`isPrimaryStaff`/role branches) in `leadSections.jsx` with permission-code checks via `usePermission`, using the `lead.*.view` codes added in Phases 1–2 — parity-preserving, migration-independent.

**Architecture:** The lead-detail `ctx` already flows through `getVisibleLeadSections(ctx)`. We add a `perms` object (from the existing `usePermission()` hook) to that ctx and rewrite the 5 gates to read codes. The backend already grants these codes to the right users (via the derived profile), so the FE just consumes them.

**Tech Stack:** Next.js 16 + MUI + `usePermission` (`web/src/app/hooks`), Vitest (root `npm test`).

## Global Constraints

- **PARITY (hard):** the set of visible sections per user must be IDENTICAL to today for every role/flag combination. This holds because the `lead.*.view` codes are granted to exactly `{ADMIN, SUPER_ADMIN, PRIMARY_SALES, SUPER_SALES}` profiles, and — **under the invariant that `isSuperSales` is only ever set on a STAFF user** (enforced by the UI: the flag toggle only renders for STAFF rows) — that equals `{admin (checkIfAdminOrSuperSales) OR isPrimaryStaff}`. Document this invariant in the code.
- **Migration-independent:** do NOT touch the JWT payload, auth selects, or the schema. The codes already reach the FE via `/auth/me` → `getEffectivePermissions` (derives the profile from the existing flags).
- The FE has NO `@dms/shared` dependency — mirror the code strings locally (like `PROFILE_OPTIONS` in UsersPage).
- `usePermission()` returns `{ hasPermission(code), hasAnyPermission, hasAllPermissions, hasAction(module, flag) }` (raw string codes).
- JS/JSX only. Verify FE with `cd web && npx next build` (repo eslint is broken).

---

## Task 1: Convert lead-detail section gates to permission codes

**Files:**
- Create: `web/src/app/helpers/permissionCodes.js` (tiny local mirror of the lead view codes)
- Modify: `web/src/app/UiComponents/DataViewer/leads/config/leadSections.jsx` (the 5 gates + import)
- Modify: `web/src/app/UiComponents/DataViewer/leads/PreviewLeadDialog.jsx` (add `perms` to `leadCtx`)
- Test: `web/src/app/UiComponents/DataViewer/leads/config/__tests__/leadSections.test.js`

**Interfaces:**
- Consumes: `usePermission()` from `@/app/hooks/usePermission`.
- Produces: `getVisibleLeadSections(ctx)` now reads `ctx.perms.hasPermission(...)` for the gated sections; `ctx.perms` is a `{ hasPermission }` object.

- [ ] **Step 1: Create the local code mirror** `web/src/app/helpers/permissionCodes.js`:

```js
// Local mirror of the lead section-visibility permission codes. The web workspace
// has no @dms/shared dependency, so these strings mirror
// packages/shared/constants/access/permissions.constants.js (LEAD_PERMISSIONS.*_VIEW).
// Keep in sync if those change.
export const LEAD_CODES = {
  PRICE_OFFER_VIEW: "lead.price_offer.view",
  PROJECTS_VIEW: "lead.projects.view",
  MODIFICATIONS_VIEW: "lead.modifications.view",
  UPDATES_VIEW: "lead.updates.view",
  ANALYSIS_VIEW: "lead.analysis.view",
};
```

- [ ] **Step 2: Write the failing parity test** `web/src/app/UiComponents/DataViewer/leads/config/__tests__/leadSections.test.js`:

```js
import { describe, it, expect } from "vitest";
import { getVisibleLeadSections } from "../leadSections";

// Build a ctx for an archetype: `codes` is the user's effective permission set.
function ctxFor({ codes = [], status = "IN_PROGRESS", payments = [] }) {
  const set = new Set(codes);
  return {
    lead: { id: 1, status, callReminders: [], meetingReminders: [], notes: [], priceOffers: [], files: [] },
    user: {},
    perms: { hasPermission: (c) => set.has(c) },
    admin: false, isPrimaryStaff: false, notUser: false,
    payments,
    setLead() {}, setleads() {}, setPayments() {},
  };
}
const keys = (ctx) => getVisibleLeadSections(ctx).map((s) => s.key);
const ALL_VIEW = ["lead.price_offer.view","lead.projects.view","lead.modifications.view","lead.updates.view","lead.analysis.view"];

describe("leadSections visibility by permission code", () => {
  it("a user with NO view codes sees only the always-on sections", () => {
    const k = keys(ctxFor({ codes: [] }));
    expect(k).toEqual(expect.arrayContaining(["details","salesStage","calls","meetings","notes","files","chats"]));
    for (const gated of ["analysis","priceOffers","projects","modifications","updates"]) expect(k).not.toContain(gated);
  });

  it("analysis shows with the analysis view code", () => {
    expect(keys(ctxFor({ codes: ["lead.analysis.view"] }))).toContain("analysis");
  });

  it("primary/admin (all view codes) see the commercial + delivery sections when applicable", () => {
    const k = keys(ctxFor({ codes: ALL_VIEW, status: "FINALIZED" }));
    for (const g of ["analysis","priceOffers","projects","modifications","updates"]) expect(k).toContain(g);
  });

  it("updates requires FINALIZED even with the code", () => {
    expect(keys(ctxFor({ codes: ALL_VIEW, status: "IN_PROGRESS" }))).not.toContain("updates");
  });

  it("extraServices still keys off payments, not a code", () => {
    expect(keys(ctxFor({ codes: [], payments: [{ id: 1 }] }))).toContain("extraServices");
  });
});
```

- [ ] **Step 3: Run it — watch it fail**

Run: `npx vitest run web/src/app/UiComponents/DataViewer/leads/config/__tests__/leadSections.test.js`
Expected: FAIL — the current gates read `ctx.admin`/`ctx.isPrimaryStaff` (both `false` in the test ctx), so `analysis`/`priceOffers`/... never show even when the code is present; the "primary/admin sees sections" and "analysis shows" cases fail.

- [ ] **Step 4: Convert the gates** in `leadSections.jsx`. Add the import at the top:

```js
import { LEAD_CODES } from "@/app/helpers/permissionCodes";
```

Then change ONLY the `visible` functions of these five sections (leave everything else untouched). The parity holds under the "isSuperSales ⟹ STAFF" invariant — add a one-line comment noting it above the first converted gate.

- `analysis`:
```js
    // Parity: master shows this to admin || any STAFF; lead.analysis.view is granted to all
    // sales profiles + admin (isSuperSales ⟹ STAFF invariant makes this exact).
    visible: (ctx) => ctx.perms.hasPermission(LEAD_CODES.ANALYSIS_VIEW),
```
- `priceOffers`:
```js
    visible: (ctx) => ctx.perms.hasPermission(LEAD_CODES.PRICE_OFFER_VIEW),
```
- `projects`:
```js
    // The old role restriction (ADMIN/SUPER_ADMIN/STAFF) is redundant with the code under
    // the isSuperSales⟹STAFF invariant, so the code alone preserves visibility.
    visible: (ctx) => ctx.perms.hasPermission(LEAD_CODES.PROJECTS_VIEW),
```
- `modifications`:
```js
    visible: (ctx) => ctx.perms.hasPermission(LEAD_CODES.MODIFICATIONS_VIEW),
```
- `updates`:
```js
    visible: (ctx) =>
      ctx.lead.status === "FINALIZED" && ctx.perms.hasPermission(LEAD_CODES.UPDATES_VIEW),
```

- [ ] **Step 5: Thread `perms` into the ctx** in `PreviewLeadDialog.jsx`. Add the import:

```js
import { usePermission } from "@/app/hooks/usePermission";
```

In `LeadContent`, add near the other hooks:

```js
  const perms = usePermission();
```

Add `perms` to the `leadCtx` object (next to `admin`, `isPrimaryStaff`):

```js
  const leadCtx = {
    lead, user, admin, isPrimaryStaff, notUser, perms,
    setLead, setleads, payments, setPayments,
  };
```

(Keep `admin`/`isPrimaryStaff` in the ctx — other code + the header still use them; this task only changes the 5 section gates.)

- [ ] **Step 6: Run the test to green**

Run: `npx vitest run web/src/app/UiComponents/DataViewer/leads/config/__tests__/leadSections.test.js`
Expected: PASS (all cases).

- [ ] **Step 7: Verify the FE build**

Run: `cd /c/coding/design-managment-system/web && npx next build 2>&1 | tail -8`
Expected: "✓ Compiled successfully" + "Generating static pages (42/42)" + route table — no errors.

- [ ] **Step 8: Run the full suite**

Run: `npx vitest run`
Expected: PASS (687 + the new leadSections tests).

- [ ] **Step 9: Commit**

```bash
git add web/src/app/helpers/permissionCodes.js \
        web/src/app/UiComponents/DataViewer/leads/config/leadSections.jsx \
        web/src/app/UiComponents/DataViewer/leads/PreviewLeadDialog.jsx \
        web/src/app/UiComponents/DataViewer/leads/config/__tests__/leadSections.test.js
git commit -m "feat(web): gate lead-detail sections on permission codes (parity-preserved)"
```

---

## Self-Review

- **Spec coverage:** implements spec §8 (the sweep) for the lead-detail section gates — the direct consumer of the §4 view codes. Parity argument (isSuperSales⟹STAFF invariant) documented in code + constraints.
- **Placeholder scan:** all code present; commands have expected output.
- **Type consistency:** `ctx.perms.hasPermission(code)` matches the `usePermission()`/`permissionApi` contract (`hasPermission(code) -> boolean`). `LEAD_CODES.*` strings match `permissions.constants.js` verbatim.
- **Parity risk:** the test proves the gate logic keys off the codes; the code→user mapping was proven equal to `admin||isPrimaryStaff` under the documented invariant.

## Continuation (NOT in this chunk — later Phase 3 plans)
- Kanban card admin affordance (`checkIfAdminOrSuperSales`) → `hasPermission("lead.assign.other")` (proven-equivalent to `checkIfAdminOrSuperSales`).
- Lead-tab action buttons (`notUser`) → `lead.capabilities.canAddX` (verified equivalent).
- Then projects/dashboard/users module sweeps.
- Enabling task (deferred, migration-coupled): put `profile` into the JWT payload + auth selects so the STORED profile is authoritative (currently rides the derived fallback).
