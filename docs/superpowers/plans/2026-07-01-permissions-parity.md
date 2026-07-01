# Permissions Parity + Denial Reasons — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Dream Studio's authorization to full Transaction-app parity — a rich error/redirect contract so every denial states the real reason, a backend-computed per-role `navigationTabs` + action-flag `permissionsByModule`, a frontend `usePermission`/`PermissionGate`/route-guard layer, and a backend audit proving access equals the deployed `master` — while keeping observable access identical to `master`.

**Architecture:** Extend the existing `server/src` permission scaffold (do not rebuild). Backend errors carry `code`/`translationKey`/`reason`/`redirectTo`/`redirectText`/`details` and `requirePermissions` throws a specific coded denial with `requiredPermissions`. `@dms/shared` gains a pure `buildNavigationTabs()` + a `NAVIGATION` config (ported 1:1 from the current role→links map) and action-flag `permissionsByModule`; `/auth/me` returns both. The frontend gets `usePermission`, `<PermissionGate>`, rich-error handling in the data layer (show reason + explained redirect, never a silent blank), a sidebar driven by `navigationTabs`, and a page-level route guard.

**Tech Stack:** Node/Express 4 + `@dms/shared` (JS, ESM), Prisma via `@dms/db`, Next.js 16 App Router + React 19 + MUI 7 (`web/`), react-toastify, custom `apiClient` data layer, Vitest.

## Global Constraints

- **Baseline = the deployed `master` branch.** Observable access (which role reaches which route + object-scope) must stay IDENTICAL to master, per module per role. The master per-role nav contract is Appendix A of `docs/superpowers/specs/2026-07-01-permissions-parity-and-denial-reasons-design.md`.
- **`navigationTabs` is role-driven (primary rule):** an item shows when `role ∈ item.allowedRoles`, ported 1:1 from the current `linksForRole` (`web/src/app/(auth)/dashboard/(dashboard)/layout.jsx`). An optional `requiredPermission` may be added ONLY where it does not narrow below master. Per-role output must be identical to today (snapshot).
- **Keep the two security tightenings decided in the spec** (site-utility admin-only; reviews token-hiding; IDOR checkers; model allow-lists). Do NOT loosen them to match master.
- **Keep master's role-driven `SUPER_SALES` "Users" nav** (show Users for SUPER_SALES by role; do NOT add a narrowing permission there).
- **`message` is always a language-neutral CODE, never Arabic prose.** New codes live in `packages/shared/messages-codes/*`; the client resolves them via `resolveMessage(code)` (`web/src/app/helpers/messages/resolveMessage.js`). `reason` is an OPTIONAL developer-facing string; the USER-facing reason is `resolveMessage(code)`.
- **`AppError` stays backward-compatible** — the existing positional `new AppError(message, statusCode, details)` call sites (hundreds) must keep working unchanged.
- **No Prisma schema change. No TypeScript in app source. No new deps.** JS only, ESM.
- **Commit hygiene:** stage only each task's files; NEVER `git add -A`. The pre-existing modified `server/services/notification.js` must stay untouched. Branch is `frontend-redesign` (never merge to master).
- **Tests:** the repo runs `npx vitest run` from root (currently 575 passing). Every task keeps the suite green and adds tests where specified.

---

## File Structure (what each task creates/modifies)

- `server/src/shared/errors/AppError.js` — enriched, backward-compatible error (Task 1).
- `server/src/shared/errors/error-handler.js` — serialize the full error envelope (Task 2).
- `server/src/shared/middlewares/auth.middleware.js` — `requirePermissions` attaches `requiredPermissions` + a specific code (Task 3).
- `packages/shared/constants/access/navigation.js` — NEW: `NAVIGATION` config + `NAVIGATION_PERMISSION_ACTIONS` (Task 4).
- `packages/shared/helpers.js` — `buildNavigationTabs()` + action-flag `permissionsByModule` (Tasks 4–5).
- `server/src/modules/auth/auth.dto.js` (+ `auth.controller.js`) — `/auth/me` returns `navigationTabs` + action flags (Task 6).
- `docs/superpowers/specs/permissions-parity-matrix.md` — NEW: master↔current parity evidence (Task 7).
- `web/src/app/hooks/usePermission.js` — NEW hook (Task 8).
- `web/src/app/UiComponents/utility/PermissionGate.jsx` — NEW gate component (Task 9).
- `web/src/app/helpers/functions/handleSubmit.js` + `getData.js` + `apiClient.js` — rich-error (reason + redirect) handling (Task 10).
- `web/src/app/providers/AuthProvider.jsx` — store `navigationTabs` (Task 6/11).
- `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx` + `UiComponents/utility/SideNav.jsx` — nav from `navigationTabs` + page-guard (Tasks 11–12).

---

## PHASE 1 — Rich error/redirect contract (backend)

### Task 1: Enrich `AppError` (backward-compatible)

**Files:**
- Modify: `server/src/shared/errors/AppError.js`
- Test: `server/src/shared/errors/__tests__/AppError.test.js` (create)

**Interfaces:**
- Produces: `new AppError(message, statusCode=400, details=null, options={})` where `options` = `{ code?, translationKey?, redirectTo?, redirectText?, dontRedirect?, reason? }`. New fields: `err.code` (defaults to `message`), `err.translationKey`, `err.redirectTo`, `err.redirectText`, `err.dontRedirect` (default false), `err.reason`.

- [ ] **Step 1: Write the failing test**

```js
// server/src/shared/errors/__tests__/AppError.test.js
import { describe, it, expect } from "vitest";
import { AppError } from "../AppError.js";

describe("AppError", () => {
  it("preserves the legacy positional shape", () => {
    const e = new AppError("FORBIDDEN", 403, { requiredPermissions: ["lead.list"] });
    expect(e.message).toBe("FORBIDDEN");
    expect(e.statusCode).toBe(403);
    expect(e.details).toEqual({ requiredPermissions: ["lead.list"] });
    expect(e.code).toBe("FORBIDDEN"); // code defaults to message
    expect(e.dontRedirect).toBe(false);
  });
  it("carries the options bag for reasons + redirects", () => {
    const e = new AppError("LEAD_ACCESS_DENIED", 403, null, {
      translationKey: "leadsMessages",
      redirectTo: "/dashboard/leads",
      redirectText: "BACK_TO_LEADS",
      reason: "lead not owned by user",
    });
    expect(e.code).toBe("LEAD_ACCESS_DENIED");
    expect(e.translationKey).toBe("leadsMessages");
    expect(e.redirectTo).toBe("/dashboard/leads");
    expect(e.redirectText).toBe("BACK_TO_LEADS");
    expect(e.reason).toBe("lead not owned by user");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run server/src/shared/errors/__tests__/AppError.test.js`
Expected: FAIL (new fields undefined).

- [ ] **Step 3: Implement**

```js
// server/src/shared/errors/AppError.js
export class AppError extends Error {
  // Legacy positional form still works: new AppError(code, 403, details).
  // `options` adds the reason/redirect metadata (Transaction-app parity).
  constructor(message, statusCode = 400, details = null, options = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.code = options.code ?? message; // message already IS a code in this codebase
    this.translationKey = options.translationKey ?? null;
    this.redirectTo = options.redirectTo ?? null;
    this.redirectText = options.redirectText ?? null;
    this.dontRedirect = options.dontRedirect ?? false;
    this.reason = options.reason ?? null; // developer-facing; user reason = resolveMessage(code)
  }
}
```

- [ ] **Step 4: Run the test + full suite**

Run: `npx vitest run server/src/shared/errors/__tests__/AppError.test.js` → PASS
Run: `npx vitest run` → all pass (no regression from added fields).

- [ ] **Step 5: Commit**

```bash
git add server/src/shared/errors/AppError.js server/src/shared/errors/__tests__/AppError.test.js
git commit -m "feat(errors): enrich AppError with reason/redirect metadata (backward-compatible)"
```

### Task 2: Serialize the full error envelope

**Files:**
- Modify: `server/src/shared/errors/error-handler.js`
- Test: `server/src/shared/errors/__tests__/error-handler.test.js` (create)

**Interfaces:**
- Consumes: `AppError` fields from Task 1.
- Produces: the error JSON now includes `code`, `translationKey`, `reason`, `redirectTo`, `redirectText`, `dontRedirect`, `details`, and `route` (`"<METHOD> <url>"`), alongside the existing `success:false` + `message`.

- [ ] **Step 1: Write the failing test**

```js
// server/src/shared/errors/__tests__/error-handler.test.js
import { describe, it, expect, vi } from "vitest";
import { AppError } from "../AppError.js";
import { errorHandler } from "../error-handler.js";

function mockRes() {
  return { statusCode: 0, body: null,
    status(c){ this.statusCode = c; return this; },
    json(b){ this.body = b; return this; } };
}

describe("errorHandler", () => {
  it("serializes the full envelope for an AppError", () => {
    const res = mockRes();
    const err = new AppError("LEAD_ACCESS_DENIED", 403, { requiredPermissions: ["lead.view"] }, {
      translationKey: "leadsMessages", redirectTo: "/dashboard/leads", redirectText: "BACK_TO_LEADS",
    });
    errorHandler(err, { method: "GET", originalUrl: "/leads/9" }, res, () => {});
    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({
      success: false, message: "LEAD_ACCESS_DENIED", code: "LEAD_ACCESS_DENIED",
      translationKey: "leadsMessages", redirectTo: "/dashboard/leads",
      redirectText: "BACK_TO_LEADS", dontRedirect: false,
      details: { requiredPermissions: ["lead.view"] }, route: "GET /leads/9",
    });
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run server/src/shared/errors/__tests__/error-handler.test.js`
Expected: FAIL (envelope missing the new fields).

- [ ] **Step 3: Implement** — in `error-handler.js`, replace ONLY the `if (err instanceof AppError)` branch's `res.status(...).json(...)` with the full envelope (keep the multer + generic-error branches unchanged):

```js
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,        // CODE (unchanged key the FE already reads via resolveMessage)
      code: err.code,
      translationKey: err.translationKey,
      reason: err.reason,          // developer-facing "why"
      redirectTo: err.redirectTo,
      redirectText: err.redirectText,
      dontRedirect: err.dontRedirect,
      details: err.details,        // e.g. { requiredPermissions: [...] }
      route: `${req.method} ${req.originalUrl}`,
    });
  }
```

- [ ] **Step 4: Run test + full suite** → PASS / green.

- [ ] **Step 5: Commit**

```bash
git add server/src/shared/errors/error-handler.js server/src/shared/errors/__tests__/error-handler.test.js
git commit -m "feat(errors): serialize reason/redirect/details/route in the error envelope"
```

### Task 3: `requirePermissions` emits a specific coded denial + `requiredPermissions`

**Files:**
- Modify: `server/src/shared/middlewares/auth.middleware.js`
- Modify: `packages/shared/messages-codes/auth/auth.js` (add `PERMISSION_DENIED`)
- Test: `server/src/shared/middlewares/__tests__/auth.middleware.test.js` (extend the existing file)

**Interfaces:**
- Produces: on a missing permission, `requirePermissions` throws `new AppError(authMessagesCodes.PERMISSION_DENIED, 403, { requiredPermissions }, { translationKey: messagesNames.authMessages, reason })` where `requiredPermissions` = the `required` list (or `anyOf` when `required` is empty). `requireSpecialChecker` already forwards the checker's AppError unchanged.

- [ ] **Step 1: Add the code.** In `packages/shared/messages-codes/auth/auth.js` add under `// authorization`: `PERMISSION_DENIED: "PERMISSION_DENIED",` (specific gate-1 denial, distinct from the generic `FORBIDDEN` legacy value).

- [ ] **Step 2: Write the failing test** (extend `auth.middleware.test.js`):

```js
it("requirePermissions throws PERMISSION_DENIED with the requiredPermissions details", () => {
  const req = { auth: { permissions: ["lead.list"] } };
  let captured;
  const next = (e) => { captured = e; };
  AuthMiddleware.requirePermissions(["lead.edit"])(req, {}, next);
  expect(captured).toBeInstanceOf(AppError);
  expect(captured.message).toBe("PERMISSION_DENIED");
  expect(captured.statusCode).toBe(403);
  expect(captured.details).toEqual({ requiredPermissions: ["lead.edit"] });
});
```

- [ ] **Step 3: Run it and confirm it fails** (`npx vitest run server/src/shared/middlewares/__tests__/auth.middleware.test.js`).

- [ ] **Step 4: Implement** — replace ONLY the `if (!ok)` block in `requirePermissions`:

```js
      if (!ok) {
        const requiredPermissions = required.length ? required : anyOf;
        return next(
          new AppError(authMessagesCodes.PERMISSION_DENIED, 403, { requiredPermissions }, {
            translationKey: messagesNames.authMessages,
            reason: `missing permission(s): ${requiredPermissions.join(", ")}`,
          }),
        );
      }
```
Add `messagesNames` to the existing `@dms/shared` import at the top of the file.

- [ ] **Step 5: Run test + full suite** → PASS / green.

- [ ] **Step 6: Add the FE resolution** — in `web/src/app/helpers/messages/authMessages.js` add `PERMISSION_DENIED: "ليس لديك صلاحية للقيام بهذا الإجراء",` (Arabic: "you don't have permission for this action"). Verify the map has an entry so `resolveMessage("PERMISSION_DENIED")` returns prose, not the raw code.

- [ ] **Step 7: Commit**

```bash
git add server/src/shared/middlewares/auth.middleware.js server/src/shared/middlewares/__tests__/auth.middleware.test.js packages/shared/messages-codes/auth/auth.js web/src/app/helpers/messages/authMessages.js
git commit -m "feat(authz): requirePermissions emits PERMISSION_DENIED + requiredPermissions + FE reason"
```

---

## PHASE 2 — `auth/me` enrichment (shared + backend)

### Task 4: `NAVIGATION` config + `buildNavigationTabs()` (ported 1:1 from master)

**Files:**
- Create: `packages/shared/constants/access/navigation.js`
- Modify: `packages/shared/helpers.js` (add `buildNavigationTabs`)
- Modify: `packages/shared/index.js` (export both)
- Test: `packages/shared/__tests__/navigation.test.js` (create)

**Interfaces:**
- Produces:
  - `NAVIGATION`: an ordered array of `{ key, label, href, icon?, allowedRoles: string[], requiredPermission?: string, subLinks?: [{ label, href, active? }] }`.
  - `buildNavigationTabs(user)` → the ordered subset of `NAVIGATION` where `user.role ∈ item.allowedRoles` (primary rule) AND, if `item.requiredPermission` is set, the user's effective permissions include it (non-narrowing guard). `user` carries `{ role, isSuperSales, subRoles, permissions? }`; effective permissions are computed via `getEffectivePermissions` when `permissions` is absent. Returns `[{ key, label, href, subLinks? }]` (icons are FE-only; omitted from the payload).

**PORT SOURCE (must reproduce exactly):** the `adminLinks / staffLinks / superSalesLinks / threeDLinks / twoDLinks / accountantLinks / exacuterLinks / contactInitiatorLinks` arrays and the `linksForRole(user)` role mapping in `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx`. Each nav item's `allowedRoles` = exactly the set of roles whose `linksForRole` currently returns a list containing that item (see Appendix A of the spec). `SUPER_SALES` (role) and `STAFF`+`isSuperSales` both include "Users" — encode via `allowedRoles` including `SUPER_SALES` and a special-case for STAFF+isSuperSales.

- [ ] **Step 1: Write the failing per-role test**

```js
// packages/shared/__tests__/navigation.test.js
import { describe, it, expect } from "vitest";
import { buildNavigationTabs } from "../helpers.js";

const hrefs = (u) => buildNavigationTabs(u).map((t) => t.href);

describe("buildNavigationTabs matches master's per-role nav", () => {
  it("ACCOUNTANT sees only the accounting screens (no leads/deals)", () => {
    const h = hrefs({ role: "ACCOUNTANT" });
    expect(h).toContain("/dashboard"); // Payments landing
    expect(h).toContain("/dashboard/operational-expenses");
    expect(h).toContain("/dashboard/rents");
    expect(h).toContain("/dashboard/salaries");
    expect(h).toContain("/dashboard/outcome");
    expect(h).not.toContain("/dashboard/leads");
    expect(h).not.toContain("/dashboard/users");
  });
  it("STAFF (sales) sees dashboard/leads/deals/calendar/payments, NOT users", () => {
    const h = hrefs({ role: "STAFF" });
    expect(h).toEqual([
      "/dashboard", "/dashboard/leads", "/dashboard/deals",
      "/dashboard/calendar", "/dashboard/payments",
    ]);
  });
  it("STAFF + isSuperSales additionally sees users", () => {
    expect(hrefs({ role: "STAFF", isSuperSales: true })).toContain("/dashboard/users");
  });
  it("SUPER_SALES (role) sees users by role (master behavior)", () => {
    expect(hrefs({ role: "SUPER_SALES" })).toContain("/dashboard/users");
  });
  it("CONTACT_INITIATOR sees only leads", () => {
    expect(hrefs({ role: "CONTACT_INITIATOR" })).toEqual(["/dashboard"]);
  });
  it("ADMIN sees users + website utilities + reports", () => {
    const h = hrefs({ role: "ADMIN" });
    expect(h).toContain("/dashboard/users");
    expect(h).toContain("/dashboard/website-utilities");
    expect(h).toContain("/dashboard/report");
  });
  it("THREE_D_DESIGNER sees work-stages, not leads/deals", () => {
    const h = hrefs({ role: "THREE_D_DESIGNER" });
    expect(h).toContain("/dashboard/work-stages");
    expect(h).not.toContain("/dashboard/leads");
    expect(h).not.toContain("/dashboard/deals");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails** (`npx vitest run packages/shared/__tests__/navigation.test.js`).

- [ ] **Step 3: Implement `navigation.js`** — port the master link sets into ONE ordered `NAVIGATION` array with `allowedRoles`. Roles: `ADMIN`, `SUPER_ADMIN` (= ADMIN set), `STAFF`, `THREE_D_DESIGNER`, `TWO_D_DESIGNER`, `TWO_D_EXECUTOR`, `ACCOUNTANT`, `SUPER_SALES`, `CONTACT_INITIATOR`. Example (fill ALL items per Appendix A — this shows the shape and the Users special-case):

```js
// packages/shared/constants/access/navigation.js
import { USER_ROLES } from "./roles.constants.js";
const R = USER_ROLES;
const ADMIN_SET = [R.ADMIN, R.SUPER_ADMIN];

// Ordered exactly as master renders each role's sidebar. `allowedRoles` = the roles
// whose master linksForRole() included this item. Ported 1:1 from
// web/src/app/(auth)/dashboard/(dashboard)/layout.jsx (see spec Appendix A).
export const NAVIGATION = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard",
    allowedRoles: [R.ADMIN, R.SUPER_ADMIN, R.STAFF, R.SUPER_SALES, R.THREE_D_DESIGNER, R.TWO_D_DESIGNER] },
  { key: "users", label: "Users", href: "/dashboard/users", allowedRoles: [...ADMIN_SET, R.SUPER_SALES] },
  { key: "leads", label: "Leads", href: "/dashboard/leads",
    allowedRoles: [R.ADMIN, R.SUPER_ADMIN, R.STAFF, R.SUPER_SALES, R.TWO_D_EXECUTOR, R.CONTACT_INITIATOR] },
  { key: "deals", label: "Deals", href: "/dashboard/deals",
    allowedRoles: [R.ADMIN, R.SUPER_ADMIN, R.STAFF, R.SUPER_SALES],
    subLinks: [
      { label: "Current Deals", href: "/dashboard/deals" },
      { label: "On hold Deals", href: "/dashboard/on-hold-deals" },
      { label: "All Deals", href: "/dashboard/all-deals" },
    ] },
  // … continue for: work-stages (+subLinks per 3D/2D/admin), reports, image-sessions,
  //    calendar, payments (+accountant landing), website-utilities, operational-expenses,
  //    rents, salaries, outcome — EACH with the exact allowedRoles from Appendix A.
];

// module → { permissionCode → actionFlagName } for the action-flag permissionsByModule (Task 5).
export const NAVIGATION_PERMISSION_ACTIONS = { /* filled in Task 5 */ };
```

Then in `helpers.js`:

```js
import { NAVIGATION } from "./constants/access/navigation.js";
// ...
/** Per-role visible-routes list (role-driven; optional non-narrowing permission guard). */
export function buildNavigationTabs(user) {
  if (!user?.role) return [];
  const { permissions } = user.permissions
    ? { permissions: user.permissions }
    : getEffectivePermissions(user);
  const role = user.activeRole || user.role;
  return NAVIGATION
    .filter((item) => item.allowedRoles.includes(role))
    .filter((item) => !item.requiredPermission || permissions.includes(item.requiredPermission))
    .map(({ key, label, href, subLinks }) => ({ key, label, href, ...(subLinks ? { subLinks } : {}) }));
}
```

- [ ] **Step 4: Run the per-role test + full suite.** Iterate `NAVIGATION` until every assertion passes AND the output order/set matches master for all 9 roles. `npx vitest run packages/shared/__tests__/navigation.test.js` → PASS; `npx vitest run` → green.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/constants/access/navigation.js packages/shared/helpers.js packages/shared/index.js packages/shared/__tests__/navigation.test.js
git commit -m "feat(shared): NAVIGATION config + buildNavigationTabs (1:1 with master per-role nav)"
```

### Task 5: Action-flag `permissionsByModule`

**Files:**
- Modify: `packages/shared/constants/access/navigation.js` (fill `NAVIGATION_PERMISSION_ACTIONS`)
- Modify: `packages/shared/helpers.js` (`getEffectivePermissions` also returns action flags, additively)
- Test: `packages/shared/__tests__/permissions.test.js` (extend)

**Interfaces:**
- Produces: `getEffectivePermissions(user)` returns `{ permissions, permissionsByModule }` where `permissionsByModule[module]` is now an OBJECT: it keeps a `codes: string[]` array (back-compat) PLUS boolean action flags (`canList`, `canView`, `canCreate`, …) derived from `NAVIGATION_PERMISSION_ACTIONS`. Existing consumers that read the array must switch to `.codes` OR keep working — see Step 3 (keep a plain array under the same key is NOT possible; instead expose flags AND `codes`; update the one internal consumer).

- [ ] **Step 1: Decide the shape (avoid breaking the array consumers).** `getEffectivePermissions` currently returns `permissionsByModule[module] = [codes]`. Grep consumers: `grep -rn "permissionsByModule" server/src web/src packages/shared`. If the only real consumer is `toMe` (pass-through) + tests, change the shape to `{ module: { codes: [...], canList, canView, ... } }` and update those consumers + tests. Capture the consumer list in the report.

- [ ] **Step 2: Write the failing test** (extend `permissions.test.js`):

```js
it("permissionsByModule exposes codes + action flags per module", () => {
  const { permissionsByModule } = getEffectivePermissions({ role: "ADMIN" });
  expect(permissionsByModule.lead.codes).toContain("lead.list");
  expect(permissionsByModule.lead.canList).toBe(true);
  expect(permissionsByModule.user.canCreate).toBe(true);
});
```

- [ ] **Step 3: Implement** — fill `NAVIGATION_PERMISSION_ACTIONS` (e.g. `{ lead: { "lead.list": "canList", "lead.view": "canView", "lead.edit": "canEdit" }, user: { "user.list": "canList", "user.create": "canCreate", ... } }`) for the modules the FE gates on, then in `getEffectivePermissions` build `permissionsByModule[module] = { codes: [...] }` and set each mapped `actionFlag = true`. Update the consumers found in Step 1.

- [ ] **Step 4: Run tests** (`npx vitest run packages/shared`) → PASS; `npx vitest run` → green.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/constants/access/navigation.js packages/shared/helpers.js packages/shared/__tests__/permissions.test.js
git commit -m "feat(shared): action-flag permissionsByModule (codes + canX flags)"
```

### Task 6: `/auth/me` returns `navigationTabs` (+ action flags); FE stores it

**Files:**
- Modify: `server/src/modules/auth/auth.dto.js` (`toMe` adds `navigationTabs`)
- Modify: `web/src/app/providers/AuthProvider.jsx` (store `navigationTabs`)
- Test: `server/src/modules/auth/__tests__/auth.me.test.js` (create)

**Interfaces:**
- Consumes: `buildNavigationTabs` (Task 4), enriched `permissionsByModule` (Task 5).
- Produces: `/auth/me` `data` includes `navigationTabs` (from `buildNavigationTabs`) at the same level the FE already reads `permissions`/`permissionsByModule`. `AuthProvider` exposes `navigationTabs` via `useAuth()`.

- [ ] **Step 1: Confirm the /me response shape.** Read `server/src/modules/auth/auth.controller.js` `me` handler to see how `toMe`'s output maps into `ok(res, data, ...)` and where the FE reads `permissions` (the FE `AuthProvider` reads `me.user`, `me.permissions`, `me.permissionsByModule`). Add `navigationTabs` at that same level. Record the exact shape in the report.

- [ ] **Step 2: Write the failing test**

```js
// server/src/modules/auth/__tests__/auth.me.test.js
import { describe, it, expect } from "vitest";
import { AuthSchema } from "../auth.dto.js";

describe("toMe", () => {
  it("includes navigationTabs for the role", () => {
    const me = AuthSchema.toMe({ id: 1, email: "a@b.c", name: "A", role: "ACCOUNTANT", subRoles: [] });
    expect(Array.isArray(me.navigationTabs)).toBe(true);
    expect(me.navigationTabs.map((t) => t.href)).toContain("/dashboard/salaries");
    expect(me.navigationTabs.map((t) => t.href)).not.toContain("/dashboard/leads");
  });
});
```

- [ ] **Step 3: Run it and confirm it fails.**

- [ ] **Step 4: Implement** — in `toMe`, after computing `permissions`, add `navigationTabs: buildNavigationTabs({ role: user.role, activeRole: user.activeRole, isSuperSales: user.isSuperSales, subRoles, permissions })` to the returned object (import `buildNavigationTabs` from `@dms/shared`). If the controller nests `toMe` output, ensure `navigationTabs` lands where the FE reads `permissions`.

- [ ] **Step 5: Wire the FE** — in `AuthProvider.jsx` add `const [navigationTabs, setNavigationTabs] = useState([]);`, set it from `me.navigationTabs ?? []` in `fetchData`, reset to `[]` on error, and add `navigationTabs` to the context value.

- [ ] **Step 6: Run tests** → PASS; `npx vitest run` green.

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/auth/auth.dto.js server/src/modules/auth/__tests__/auth.me.test.js web/src/app/providers/AuthProvider.jsx
git commit -m "feat(auth): /auth/me returns per-role navigationTabs; FE stores it"
```

---

## PHASE 3 — Backend audit vs master

### Task 7: Master↔current authorization parity matrix + fix real mismatches

**Files:**
- Create: `docs/superpowers/specs/permissions-parity-matrix.md`
- Modify (only if a real mismatch is found): the offending `role-permissions.js` entry or module checker.

**Interfaces:** none (audit + targeted fixes). This task is analysis-first; code changes ONLY for a proven divergence from master (excluding the two intentional tightenings).

- [ ] **Step 1: Build the matrix.** For every module (auth, leads +sub-resources, contracts, projects/tasks/updates/delivery, accounting, courses admin+staff, image-sessions admin+session, chat, telegram, users directory/admin/self, dashboard, notifications, calendar, questions, sales-stages, reviews, utilities, site-utility, admin-residual, staff, upload), write a row per role: `route → master-allowed? (from the master matrix in the spec) → current code grants it? (from packages/shared/constants/access/role-permissions.js + the route's requirePermissions) → object-scope rule → MATCH / MISMATCH / INTENTIONAL-TIGHTENING`.

- [ ] **Step 2: Classify each MISMATCH.** Intentional tightenings (site-utility→admin-only, reviews token-hiding, IDOR checkers, model allow-lists) are expected — mark them `INTENTIONAL` with a one-line justification. Anything else is a real defect.

- [ ] **Step 3: Fix real defects only.** For each genuine mismatch (a role that master allowed but current denies, or vice-versa, outside the tightenings), fix the `role-permissions.js` grant or the checker to match master, and add/extend a usecase test asserting the corrected access. If NONE are found, state that explicitly (the 575 passing tests + the code's behavior-preserving comments suggest few/none).

- [ ] **Step 4: Verify** — `npx vitest run` green; the matrix has no unexplained MISMATCH row.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/permissions-parity-matrix.md
# plus any fixed role-permissions.js / *.usecase.js / test files
git commit -m "docs(authz): master<->current parity matrix + fix any real mismatch"
```

---

## PHASE 4 — Frontend permission layer

### Task 8: `usePermission()` hook

**Files:**
- Create: `web/src/app/hooks/usePermission.js`
- Test: `web/src/app/hooks/__tests__/usePermission.test.js` (create; vitest + @testing-library/react if present, else a pure-function unit test of the predicate)

**Interfaces:**
- Produces: `usePermission()` → `{ hasPermission(code), hasAnyPermission(codes[]), hasAllPermissions(codes[]), hasAction(module, flag) }`, reading `permissions` + `permissionsByModule` from `useAuth()`.

- [ ] **Step 1: Write the failing test** — extract the pure predicate so it is testable without React:

```js
// web/src/app/hooks/usePermission.js will export makePermissionApi(permissions, permissionsByModule)
// web/src/app/hooks/__tests__/usePermission.test.js
import { describe, it, expect } from "vitest";
import { makePermissionApi } from "../usePermission.js";

describe("makePermissionApi", () => {
  const api = makePermissionApi(["lead.list", "lead.view"], { lead: { canList: true } });
  it("hasPermission / any / all", () => {
    expect(api.hasPermission("lead.list")).toBe(true);
    expect(api.hasPermission("lead.edit")).toBe(false);
    expect(api.hasAnyPermission(["lead.edit", "lead.view"])).toBe(true);
    expect(api.hasAllPermissions(["lead.list", "lead.view"])).toBe(true);
    expect(api.hasAllPermissions(["lead.list", "lead.edit"])).toBe(false);
  });
  it("hasAction reads permissionsByModule flags", () => {
    expect(api.hasAction("lead", "canList")).toBe(true);
    expect(api.hasAction("lead", "canEdit")).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails.**

- [ ] **Step 3: Implement**

```js
// web/src/app/hooks/usePermission.js
"use client";
import { useMemo } from "react";
import { useAuth } from "@/app/providers/AuthProvider";

export function makePermissionApi(permissions = [], permissionsByModule = {}) {
  const set = new Set(permissions);
  return {
    hasPermission: (code) => set.has(code),
    hasAnyPermission: (codes = []) => codes.some((c) => set.has(c)),
    hasAllPermissions: (codes = []) => codes.every((c) => set.has(c)),
    hasAction: (module, flag) => Boolean(permissionsByModule?.[module]?.[flag]),
  };
}

export function usePermission() {
  const { permissions, permissionsByModule } = useAuth();
  return useMemo(
    () => makePermissionApi(permissions, permissionsByModule),
    [permissions, permissionsByModule],
  );
}
```

- [ ] **Step 4: Run test + full suite** → PASS / green.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/hooks/usePermission.js web/src/app/hooks/__tests__/usePermission.test.js
git commit -m "feat(web): usePermission hook (hasPermission/any/all/hasAction)"
```

### Task 9: `<PermissionGate>` component

**Files:**
- Create: `web/src/app/UiComponents/utility/PermissionGate.jsx`

**Interfaces:**
- Consumes: `usePermission` (Task 8).
- Produces: `<PermissionGate required={["code"]} anyOf={["code"]} fallback={null}>{children}</PermissionGate>` — renders `children` only when the user holds ALL `required` (and/or ANY `anyOf`); else `fallback`.

- [ ] **Step 1: Implement**

```jsx
// web/src/app/UiComponents/utility/PermissionGate.jsx
"use client";
import { usePermission } from "@/app/hooks/usePermission";
export default function PermissionGate({ required = [], anyOf = [], fallback = null, children }) {
  const { hasAllPermissions, hasAnyPermission } = usePermission();
  const okRequired = required.length ? hasAllPermissions(required) : true;
  const okAny = anyOf.length ? hasAnyPermission(anyOf) : true;
  return okRequired && okAny ? <>{children}</> : fallback;
}
```

- [ ] **Step 2: Verify it builds** — `npx --no-install next lint web/src/app/UiComponents/utility/PermissionGate.jsx` if lint is configured, else confirm the file parses by importing it in a scratch check. Run `npx vitest run` (no regression).

- [ ] **Step 3: Commit**

```bash
git add web/src/app/UiComponents/utility/PermissionGate.jsx
git commit -m "feat(web): PermissionGate component"
```

### Task 10: Data-layer surfaces the reason + explained redirect (no silent blanks)

**Files:**
- Modify: `web/src/app/helpers/functions/handleSubmit.js`
- Modify: `web/src/app/helpers/functions/getData.js` (+ `getDataAndSet.js` if it swallows errors)
- Test: `web/src/app/helpers/functions/__tests__/rich-error.test.js` (create — unit-test a pure `describeApiError(body)` helper)

**Interfaces:**
- Produces: a small pure helper `describeApiError(body)` → `{ message: resolveMessage(body.message), redirectTo, redirectText, dontRedirect }`, used by the data-layer error paths so a 401/403 shows the resolved reason toast and, when `redirectTo` is present and `!dontRedirect`, navigates there (with the resolved `redirectText`) instead of failing silently.

- [ ] **Step 1: Write the failing test**

```js
// web/src/app/helpers/functions/__tests__/rich-error.test.js
import { describe, it, expect } from "vitest";
import { describeApiError } from "../richError.js";

describe("describeApiError", () => {
  it("resolves the code and passes redirect metadata through", () => {
    const d = describeApiError({ message: "PERMISSION_DENIED", redirectTo: "/dashboard", redirectText: "BACK_TO_DASHBOARD", dontRedirect: false });
    expect(typeof d.message).toBe("string");
    expect(d.message).not.toBe("PERMISSION_DENIED"); // resolved to Arabic prose
    expect(d.redirectTo).toBe("/dashboard");
    expect(d.dontRedirect).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails.**

- [ ] **Step 3: Implement** the pure helper `web/src/app/helpers/functions/richError.js`:

```js
import { resolveMessage } from "@/app/helpers/messages/resolveMessage";
export function describeApiError(body = {}) {
  return {
    message: resolveMessage(body.message),
    redirectTo: body.redirectTo ?? null,
    redirectText: body.redirectText ? resolveMessage(body.redirectText) : null,
    dontRedirect: Boolean(body.dontRedirect),
  };
}
```
Then in `handleSubmit.js` error path, replace the bare `Failed(resolveMessage(response.message))` toast with `describeApiError(response)`'s `message`, and — when `redirectTo` is set and `!dontRedirect` — trigger a navigation (return the redirect info to the caller / use the app router) so the denial is never a silent failure. In `getData.js`, ensure a 401/403 sets an error state carrying `describeApiError(...)` (so pages can render "no access: <reason>") instead of returning empty data with no signal.

- [ ] **Step 4: Run test + full suite** → PASS / green.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/helpers/functions/richError.js web/src/app/helpers/functions/handleSubmit.js web/src/app/helpers/functions/getData.js web/src/app/helpers/functions/__tests__/rich-error.test.js
git commit -m "feat(web): surface denial reason + explained redirect in the data layer"
```

---

## PHASE 5 — Nav + page guards (frontend)

### Task 11: Sidebar renders `navigationTabs` (identical per-role output)

**Files:**
- Modify: `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx` (use `user.navigationTabs` from `useAuth()` instead of `linksForRole`)
- Keep: `SideNav.jsx` (unchanged rendering; it already takes a `links` array of `{ name/label, href, subLinks }`)

**Interfaces:**
- Consumes: `navigationTabs` from `useAuth()` (Task 6). Note `navigationTabs` items use `label` (not `name`) and have no `icon` — map them to the `{ name, href, icon, subLinks }` shape `SideNav` expects, attaching icons on the client by `key`.

- [ ] **Step 1: Capture the current per-role nav as a snapshot** — before changing anything, record (in the report) the exact `linksForRole` output (names+hrefs, with subLinks) for each of the 9 roles. This is the equality target.

- [ ] **Step 2: Implement** — in `layout.jsx`, build a client-side `ICON_BY_KEY` map (reusing the existing `react-icons/fi` icons), and derive `links` from `user.navigationTabs` by mapping `{ key, label, href, subLinks }` → `{ name: label, href, icon: ICON_BY_KEY[key], subLinks: subLinks?.map(s => ({ name: s.label, href: s.href, active: s.active })) }`. Replace `const links = linksForRole(user);` with this. Keep `linksForRole` exported temporarily (Task 12 may still import label helpers) but no longer used for rendering.

- [ ] **Step 3: Verify identical per-role output** — for each of the 9 roles, confirm the derived `links` (names + hrefs + subLinks, in order) equals the Step 1 snapshot. Document the 9 comparisons in the report. Run `npx vitest run` (backend nav test already guards the source of truth).

- [ ] **Step 4: Commit**

```bash
git add "web/src/app/(auth)/dashboard/(dashboard)/layout.jsx"
git commit -m "feat(web): drive sidebar from backend navigationTabs (identical per-role output)"
```

### Task 12: Page-level route guard with an explicit reason (no blank pages)

**Files:**
- Create: `web/src/app/UiComponents/utility/RouteGuard.jsx`
- Modify: `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx` (wrap `children` in `RouteGuard`)

**Interfaces:**
- Consumes: `navigationTabs` (Task 6). Produces: a guard that, for the current `pathname`, checks whether ANY `navigationTabs` entry (or its subLinks) matches the path prefix. If none matches (role can't see this route), it renders an explicit "ليس لديك صلاحية للوصول إلى هذه الصفحة" (you don't have access to this page) panel with a button to the user's default landing (`navigationTabs[0].href`), and redirects there — instead of rendering the page shell and letting its data fetch fail. The existing not-logged-in → `/login` redirect stays but shows a clear reason toast.

- [ ] **Step 1: Implement `RouteGuard.jsx`**

```jsx
// web/src/app/UiComponents/utility/RouteGuard.jsx
"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/app/providers/AuthProvider";

// A path is allowed if it equals or is nested under any navigationTabs href (or subLink href).
function isAllowed(pathname, tabs) {
  const hrefs = tabs.flatMap((t) => [t.href, ...(t.subLinks?.map((s) => s.href) ?? [])]);
  return hrefs.some((h) => pathname === h || pathname.startsWith(h + "/"));
}

export default function RouteGuard({ children }) {
  const { navigationTabs = [], validatingAuth, isLoggedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const landing = navigationTabs[0]?.href || "/dashboard";
  const allowed = !isLoggedIn || validatingAuth || isAllowed(pathname, navigationTabs);

  useEffect(() => {
    if (isLoggedIn && !validatingAuth && !isAllowed(pathname, navigationTabs)) {
      const t = setTimeout(() => router.push(landing), 1500);
      return () => clearTimeout(t);
    }
  }, [pathname, isLoggedIn, validatingAuth, navigationTabs, landing, router]);

  if (isLoggedIn && !validatingAuth && !allowed) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <h2>ليس لديك صلاحية للوصول إلى هذه الصفحة</h2>
        <p>سيتم تحويلك إلى صفحتك الرئيسية…</p>
      </div>
    );
  }
  return children;
}
```

- [ ] **Step 2: Wrap `children`** in `layout.jsx`: replace `{children}` in the content `<Box>` with `<RouteGuard>{children}</RouteGuard>`.

- [ ] **Step 3: Verify** — reason: build the app (`npx --no-install next build web` may be heavy; at minimum confirm the files parse and `npx vitest run` stays green). Manually reason through: ACCOUNTANT navigating to `/dashboard/leads` (not in their `navigationTabs`) → sees the no-access panel + redirect to `/dashboard` (their landing), NOT a blank page. Document the check in the report.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/UiComponents/utility/RouteGuard.jsx "web/src/app/(auth)/dashboard/(dashboard)/layout.jsx"
git commit -m "feat(web): page-level route guard with explicit no-access reason + redirect"
```

---

## Notes for the executor

- Order matters: Phases 1→2→(3)→4→5. Phase 3 (audit) is analysis-first and can run in parallel with Phase 4/5 since it rarely changes code, but keep it before the final review.
- Every task keeps `npx vitest run` green (575+ baseline).
- The nav source of truth is the BACKEND `NAVIGATION` config; the FE only renders it. The per-role output must remain byte-identical to today's `linksForRole` (Task 4 test + Task 11 snapshot are the two guards).
- Do NOT loosen the two intentional security tightenings; do NOT add a narrowing `requiredPermission` to the `users` nav item (SUPER_SALES must keep seeing it by role).
