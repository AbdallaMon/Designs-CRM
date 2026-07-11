# Lead access, profile signals & claim/kanban fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 7 lead defects by moving the leads module's sales-scoping off the legacy `isSuperSales`/`isPrimary` flags onto the `SUPER_SALES`/`PRIMARY_SALES` profiles (already seeded + backfilled at boot), and repairing the kanban 500, self-claim validation, and the preview error UX.

**Architecture:** Backend reads the active profile (`authUser.currentProfileKey` / `authUser.isAdminTier`, populated by `requireAuth` from the boot-backfilled `currentProfileId`) instead of the flags. Frontend surfaces the backend error envelope in a closeable dialog and exposes assign/claim on the New Leads card. No data migration is built — `runProfileBackfill` already runs at server boot.

**Tech Stack:** Express 4 + Zod 4 + Prisma 6 (server), Next.js 16 + MUI v7 (web), Vitest (tests). ESM, JavaScript only.

## Global Constraints

- **No reliance on `isSuperSales`/`isPrimary` in leads-module logic.** Read `currentProfileKey` / `isAdminTier` instead. The flag *columns* stay in the schema (they feed the boot backfill only).
- **Preserve observable authorization parity with `master`.** Super-sales/primary access must stay equivalent, now expressed via profiles.
- **Never change PDF logic. Never change the Prisma schema by hand. Never touch production.**
- **API envelope unchanged:** `{ success, message: CODE, data, translationKey, reason, redirectTo, redirectText, dontRedirect }`. `message` is always a language-neutral CODE.
- **Run a single test file:** from repo root, `npx vitest run <path>`.
- **Verify FE changes with a build** (`cd web && npx next build`) — the web ESLint config is known-broken.
- **Profile keys (from `PROFILE_META`):** `SUPER_SALES` (baseRole STAFF, admin-tier), `PRIMARY_SALES` (baseRole STAFF), `NORMAL_SALES` (baseRole STAFF). `SUPER_SALES` permissions ⊇ `PRIMARY_SALES` ⊇ `NORMAL_SALES`.

---

### Task 1: Profile signals in the leads module (+ fix #6 super-sales deals scope)

Replace every `isSuperSales`/`isPrimary` read in the leads module with profile-based signals. This also fixes defect #6 (SUPER_SALES self-scoped in `deals()`).

**Files:**
- Modify: `server/src/modules/leads/lead/lead.usecase.js` (`isAdminUser` ~L106; `columns` ~L269-283; `deals` ~L249-266; `#getDetail` ~L297-313; `#getStaffDetail` ~L361-368)
- Modify: `server/src/modules/leads/lead/lead.repo.js` (`hasFullScope` ~L37-42)
- Modify: `server/src/modules/leads/lead/lead.dto.js` (`canMutateLead` ~L16-20, `isFullScope` ~L22-27)
- Modify: `server/src/modules/leads/lead/lead.assign-status.usecase.js` (the `user.isPrimary` read ~L286)
- Test: `server/src/modules/leads/lead/__tests__/lead.scope-signals.test.js` (create)
- Test (update fixtures): `server/src/modules/leads/lead/__tests__/lead.usecase.test.js` if any case relies on `isSuperSales`

**Interfaces:**
- Produces: `LeadUsecase.isAdminUser(authUser) → boolean`; private `#isSuperSalesScope(authUser) → boolean`; private `#isPrimaryScope(authUser) → boolean`. `authUser` shape used: `{ id, role, currentProfileKey, isAdminTier }`.
- Repo produces: `hasFullScope({ role, currentProfileKey, isAdminTier, includeContactInitiator }) → boolean`.

- [ ] **Step 1: Write the failing test**

Create `server/src/modules/leads/lead/__tests__/lead.scope-signals.test.js`:

```js
import { describe, it, expect } from "vitest";
import { LeadUsecase } from "../lead.usecase.js";
import { leadRepository } from "../lead.repo.js";

const uc = new LeadUsecase({}, {});

describe("LeadUsecase profile scope signals", () => {
  it("isAdminUser: true for ADMIN/SUPER_ADMIN base role and admin-tier profiles, false otherwise", () => {
    expect(uc.isAdminUser({ role: "ADMIN" })).toBe(true);
    expect(uc.isAdminUser({ role: "SUPER_ADMIN" })).toBe(true);
    expect(uc.isAdminUser({ role: "STAFF", isAdminTier: true })).toBe(true); // SUPER_SALES profile
    expect(uc.isAdminUser({ role: "STAFF", currentProfileKey: "NORMAL_SALES" })).toBe(false);
    expect(uc.isAdminUser({ role: "STAFF", isSuperSales: true })).toBe(false); // flags are NOT read
  });

  it("repo.hasFullScope keys off the profile, not the flags", () => {
    expect(leadRepository.hasFullScope({ role: "STAFF", currentProfileKey: "SUPER_SALES" })).toBe(true);
    expect(leadRepository.hasFullScope({ role: "STAFF", isSuperSales: true })).toBe(false);
    expect(leadRepository.hasFullScope({ role: "ADMIN" })).toBe(true);
    expect(leadRepository.hasFullScope({ role: "CONTACT_INITIATOR", includeContactInitiator: true })).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/src/modules/leads/lead/__tests__/lead.scope-signals.test.js`
Expected: FAIL (`hasFullScope` still true for `isSuperSales`, `isAdminUser` still true for `isSuperSales`).

- [ ] **Step 3: Implement — `lead.usecase.js` signals**

Replace `isAdminUser` (currently ~L106-112) with:

```js
  // Admin-tier lead operator = ADMIN/SUPER_ADMIN base role OR an admin-tier profile
  // (SUPER_SALES). Profile-authoritative — the legacy isSuperSales flag is NOT read.
  isAdminUser(authUser) {
    return (
      Boolean(authUser?.isAdminTier) ||
      authUser?.role === "ADMIN" ||
      authUser?.role === "SUPER_ADMIN"
    );
  }

  // Full read-scope over ALL leads (the super-sales pool), by active profile.
  #isSuperSalesScope(authUser) {
    return authUser?.currentProfileKey === "SUPER_SALES";
  }

  // Primary-tier lead-visibility carve-out (SUPER_SALES ⊇ PRIMARY_SALES).
  #isPrimaryScope(authUser) {
    return (
      authUser?.currentProfileKey === "SUPER_SALES" ||
      authUser?.currentProfileKey === "PRIMARY_SALES"
    );
  }
```

In `columns()` (~L269-283) replace `!authUser.isSuperSales` with `!this.#isSuperSalesScope(authUser)` and `Boolean(authUser.isSuperSales)` with `this.#isSuperSalesScope(authUser)`.

In `deals()` (~L249-266) change the self-scope guard to also exclude super-sales (the #6 fix). Replace the `if (...) { searchParams.selfId... }` condition's `authUser.role !== "SUPER_SALES"` term so the whole guard is:

```js
    if (
      authUser.role !== "ADMIN" &&
      authUser.role !== "SUPER_ADMIN" &&
      authUser.role !== "ACCOUNTANT" &&
      !this.#isSuperSalesScope(authUser)
    ) {
      searchParams.selfId = authUser.id;
      searchParams.userId = authUser.id;
    }
```

Leave the verbatim-legacy `isAdmin` expression below it unchanged (a SUPER_SALES profile has `role === "STAFF"`, so `role !== "SUPER_SALES"` is already truthy → admin aggregation path).

In `#getDetail()` (~L300-308) replace both `authUser.isSuperSales` reads with `this.#isSuperSalesScope(authUser)`.

In `#getStaffDetail()` (~L365) replace `!user.isPrimary` with `!this.#isPrimaryScope(user)`.

- [ ] **Step 4: Implement — `lead.repo.js` `hasFullScope`**

Replace (~L37-42):

```js
  hasFullScope({ role, currentProfileKey, isAdminTier, includeContactInitiator = false }) {
    if (currentProfileKey === "SUPER_SALES" || isAdminTier) return true;
    if (FULL_SCOPE_ROLES.includes(role)) return true;
    if (includeContactInitiator && role === "CONTACT_INITIATOR") return true;
    return false;
  }
```

`buildAuthUserLeadWhere` already spreads `...authUser` into `hasFullScope`, so `currentProfileKey`/`isAdminTier` flow through unchanged.

- [ ] **Step 5: Implement — `lead.dto.js`**

Replace `canMutateLead` (~L16-20) and `isFullScope` (~L22-27):

```js
function canMutateLead({ record, authUser }) {
  if (isFullScope(authUser)) return true;
  return record?.userId != null && Number(record.userId) === Number(authUser?.id);
}

function isFullScope(authUser) {
  return (
    Boolean(authUser?.isAdminTier) ||
    authUser?.currentProfileKey === "SUPER_SALES" ||
    ["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"].includes(authUser?.role)
  );
}
```

- [ ] **Step 6: Implement — `lead.assign-status.usecase.js`**

At the `user.isPrimary` read (~L286), change it to read the profile. Load the surrounding function; replace `if (!user.isPrimary) {` with `if (user?.currentProfileKey !== "PRIMARY_SALES" && user?.currentProfileKey !== "SUPER_SALES") {`. (This mirrors `#isPrimaryScope`; the `user` object here is the same authUser.)

- [ ] **Step 7: Run the new signal test to verify it passes**

Run: `npx vitest run server/src/modules/leads/lead/__tests__/lead.scope-signals.test.js`
Expected: PASS.

- [ ] **Step 8: Run the whole leads test folder; fix any fixture that set `isSuperSales`/`isPrimary`**

Run: `npx vitest run server/src/modules/leads`
Expected: PASS. If a pre-existing test constructs an authUser with `isSuperSales: true` / `isPrimary: true` and asserts super/primary behavior, update that fixture to `currentProfileKey: "SUPER_SALES"` / `"PRIMARY_SALES"` (and `isAdminTier: true` for super-sales) so it exercises the new signal. Do not change assertions.

- [ ] **Step 9: Commit**

```bash
git add server/src/modules/leads
git commit -m "refactor(leads): scope on SUPER_SALES/PRIMARY_SALES profiles, not isSuperSales/isPrimary flags; fix super-sales deals scope"
```

---

### Task 2: Fix kanban `columns` 500 (defect #7)

**Files:**
- Modify: `server/src/modules/leads/lead/lead.assign-status.usecase.js` (`getClientLeadsColumnStatus` ~L369-374)
- Test: `server/src/modules/leads/lead/__tests__/lead.columns-filters.test.js` (create)

**Interfaces:**
- Consumes: nothing new.
- Produces: `getClientLeadsColumnStatus` no longer throws when `searchParams.filters` is absent.

- [ ] **Step 1: Write the failing test**

Create `server/src/modules/leads/lead/__tests__/lead.columns-filters.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lead.repo.js", () => ({
  leadRepository: {
    findDeals: vi.fn().mockResolvedValue([]),
  },
}));

import { getClientLeadsColumnStatus } from "../lead.assign-status.usecase.js";

describe("getClientLeadsColumnStatus filters default", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not throw when no filters param is supplied", async () => {
    await expect(
      getClientLeadsColumnStatus({
        searchParams: { status: "NEGOTIATING", type: "STAFF" }, // no `filters`
        isAdmin: true,
        user: { id: 1, role: "ADMIN" },
      }),
    ).resolves.toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/src/modules/leads/lead/__tests__/lead.columns-filters.test.js`
Expected: FAIL with `Cannot read properties of undefined (reading 'id')`.

- [ ] **Step 3: Implement**

In `getClientLeadsColumnStatus` change the `filters` initializer (~L371-374) to default to `{}`:

```js
    const filters =
      (searchParams.filters &&
        searchParams.filters !== "undefined" &&
        JSON.parse(searchParams.filters)) ||
      {};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run server/src/modules/leads/lead/__tests__/lead.columns-filters.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/leads/lead/lead.assign-status.usecase.js server/src/modules/leads/lead/__tests__/lead.columns-filters.test.js
git commit -m "fix(leads): kanban columns 500 when no filters param (default filters to {})"
```

---

### Task 3: Self-claim assign validation + NEW→IN_PROGRESS verification (defects #4, #5)

**Files:**
- Modify: `server/src/modules/leads/lead/lead.validation.js` (`assign` ~L25)
- Modify: `server/src/modules/leads/lead/lead.assign-status.usecase.js` (extract `claimStatus`, use it in `assignLeadToAUser` ~L105-110)
- Test: `server/src/modules/leads/lead/__tests__/lead.assign-validation.test.js` (create)

**Interfaces:**
- Produces: the `assign` schema parses `{ id, userId? }` where `userId` absent/`null`/`0`/`""`/`NaN` → `undefined` (self-claim), and a positive integer stays a positive integer (assign-to-other). `.passthrough()` retained.

- [ ] **Step 1: Write the failing test**

Create `server/src/modules/leads/lead/__tests__/lead.assign-validation.test.js`:

```js
import { describe, it, expect } from "vitest";
import { LeadValidation } from "../lead.validation.js";

describe("assign schema — self-claim tolerance", () => {
  it("drops null/0/'' userId to undefined (self-claim)", () => {
    for (const userId of [null, 0, "", "0"]) {
      const out = LeadValidation.assign.parse({ id: 2, userId });
      expect(out.id).toBe(2);
      expect(out.userId).toBeUndefined();
    }
  });

  it("keeps a real positive userId (assign-to-other)", () => {
    const out = LeadValidation.assign.parse({ id: 2, userId: 7 });
    expect(out.userId).toBe(7);
  });

  it("passes through extra lead fields without failing", () => {
    const out = LeadValidation.assign.parse({ id: 2, userId: null, status: "NEW", client: {} });
    expect(out.id).toBe(2);
  });
});
```

(If `LeadValidation` is a default export or named differently, import to match the file; the schema is the static `assign`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/src/modules/leads/lead/__tests__/lead.assign-validation.test.js`
Expected: FAIL (`userId: 0/null` → "Too small: expected number to be >0").

- [ ] **Step 3: Implement**

In `lead.validation.js` replace the `assign` schema (~L25):

```js
  // PUT / — assign / convert. Self-claim (the FE Start-Deal buttons POST the whole
  // lead, whose userId is null for a NEW lead) must NOT 422: coerce absent/empty/
  // non-positive userId to undefined. A real positive id = admin assign-to-other.
  static assign = z
    .object({
      id: z.coerce.number().int().positive(),
      userId: z.preprocess(
        (v) =>
          v === "" || v === null || v === undefined || Number(v) <= 0 || Number.isNaN(Number(v))
            ? undefined
            : v,
        z.coerce.number().int().positive().optional(),
      ),
    })
    .passthrough();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run server/src/modules/leads/lead/__tests__/lead.assign-validation.test.js`
Expected: PASS.

- [ ] **Step 5: Extract `claimStatus` and cover it (behavior-preserving, gives #5 a real test)**

The claim status rule is currently an inline ternary in `assignLeadToAUser`. Extract it to a named export so the test exercises the REAL production code (no re-implementation). In `lead.assign-status.usecase.js`, add near the top (after imports):

```js
// Claim status rule: a NEW or ON_HOLD lead (or a missing record) becomes IN_PROGRESS
// on assignment; any other status is preserved. Extracted verbatim from the previous
// inline ternary so behavior is identical — exported for direct testing (#5).
export function claimStatus(lead) {
  return !lead || lead.status === "ON_HOLD" || lead.status === "NEW" ? "IN_PROGRESS" : lead.status;
}
```

Then replace the inline `status:` ternary in the `assignLeadUpdate` call (~L105-110) with `status: claimStatus(clientLead),`. Verify the surrounding `data` object is otherwise unchanged.

Add to the test file a check that imports the real function:

```js
import { claimStatus } from "../lead.assign-status.usecase.js";

describe("claimStatus rule (#5)", () => {
  it("NEW → IN_PROGRESS", () => expect(claimStatus({ status: "NEW" })).toBe("IN_PROGRESS"));
  it("ON_HOLD → IN_PROGRESS", () => expect(claimStatus({ status: "ON_HOLD" })).toBe("IN_PROGRESS"));
  it("missing record → IN_PROGRESS", () => expect(claimStatus(null)).toBe("IN_PROGRESS"));
  it("NEGOTIATING preserved", () => expect(claimStatus({ status: "NEGOTIATING" })).toBe("NEGOTIATING"));
});
```

> `lead.assign-status.usecase.js` imports side-effectful modules; if importing it into the test pulls in heavy deps, they are already mocked by the existing lead tests' patterns — if a bare import fails, add `vi.mock("../lead.repo.js", () => ({ leadRepository: {} }))` at the top of the test (mirroring Task 2's mock) so the module loads without a DB.

- [ ] **Step 6: Run the file; commit**

Run: `npx vitest run server/src/modules/leads/lead/__tests__/lead.assign-validation.test.js`
Expected: PASS.

```bash
git add server/src/modules/leads/lead/lead.validation.js server/src/modules/leads/lead/lead.assign-status.usecase.js server/src/modules/leads/lead/__tests__/lead.assign-validation.test.js
git commit -m "fix(leads): tolerate self-claim userId (null/0) in assign schema; extract+test claimStatus (NEW->IN_PROGRESS)"
```

---

### Task 4: Meaningful claim-required / access-denied preview error (defect #1)

**Files:**
- Modify: `packages/shared/messages-codes/leads/leads.js` (add `LEAD_CLAIM_REQUIRED`)
- Modify: `server/src/modules/leads/lead/lead.usecase.js` (`#getStaffDetail` ~L369-375)
- Test: `server/src/modules/leads/lead/__tests__/lead.claim-required.test.js` (create)

**Interfaces:**
- Consumes: repo `findUnassignedNew({ id })` (returns the row when status NEW + userId null), `findLeadOwner({ id })` (`{ id, userId, status }`).
- Produces: `#getStaffDetail` throws `AppError(LEAD_CLAIM_REQUIRED, 409)` for a NEW/unassigned claimable lead, `AppError(LEAD_ACCESS_DENIED, 403)` for an existing lead owned by another, `AppError(LEAD_NOT_FOUND, 404)` only when the id truly does not exist.

- [ ] **Step 1: Add the message code**

In `packages/shared/messages-codes/leads/leads.js`, under "errors / scope / guards" add:

```js
  LEAD_CLAIM_REQUIRED: "LEAD_CLAIM_REQUIRED", // NEW/unassigned lead — must be claimed as a deal to view
```

- [ ] **Step 2: Write the failing test**

Create `server/src/modules/leads/lead/__tests__/lead.claim-required.test.js`:

```js
import { describe, it, expect, vi } from "vitest";
import { LeadUsecase } from "../lead.usecase.js";
import { leadsMessagesCodes as C } from "@dms/shared";

// Build a usecase whose detail query returns null (lead filtered out by the status
// carve-out) but the ownership probes distinguish the reason.
function makeUc({ unassignedNew, owner }) {
  const repo = {
    findFirstByUserId: vi.fn().mockResolvedValue(null),
    findOnHoldOwner: vi.fn().mockResolvedValue(null),
    findUnassignedNew: vi.fn().mockResolvedValue(unassignedNew),
    findLeadOwner: vi.fn().mockResolvedValue(owner),
    findLeadDetail: vi.fn().mockResolvedValue(null),
  };
  return new LeadUsecase(repo, {});
}

const STAFF = { id: 5, role: "STAFF", currentProfileKey: "NORMAL_SALES" };

describe("#getStaffDetail meaningful errors (#1)", () => {
  it("NEW/unassigned claimable lead → LEAD_CLAIM_REQUIRED 409", async () => {
    const uc = makeUc({ unassignedNew: { id: 2 }, owner: { id: 2, userId: null, status: "NEW" } });
    await expect(uc.getById({ id: 2, query: {}, authUser: STAFF }))
      .rejects.toMatchObject({ code: C.LEAD_CLAIM_REQUIRED, statusCode: 409 });
  });

  it("lead owned by another → LEAD_ACCESS_DENIED 403", async () => {
    const uc = makeUc({ unassignedNew: null, owner: { id: 2, userId: 99, status: "NEGOTIATING" } });
    await expect(uc.getById({ id: 2, query: {}, authUser: STAFF }))
      .rejects.toMatchObject({ code: C.LEAD_ACCESS_DENIED, statusCode: 403 });
  });

  it("truly missing lead → LEAD_NOT_FOUND 404", async () => {
    const uc = makeUc({ unassignedNew: null, owner: null });
    await expect(uc.getById({ id: 2, query: {}, authUser: STAFF }))
      .rejects.toMatchObject({ code: C.LEAD_NOT_FOUND, statusCode: 404 });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run server/src/modules/leads/lead/__tests__/lead.claim-required.test.js`
Expected: FAIL (all three currently throw `LEAD_NOT_FOUND`).

- [ ] **Step 4: Implement**

In `#getStaffDetail`, replace the single `if (!clientLead) throw new AppError(C.LEAD_NOT_FOUND, 404);` (~L375) with a disambiguating block. Import stays the same (`AppError`, `C`). The method already computed `isNew` via `findUnassignedNew`; reuse it:

```js
    if (!clientLead) {
      // The gate allowed the read (owned OR NEW-claimable pool), but the staff status
      // carve-out filtered the row out. Turn the misleading 404 into a meaningful,
      // closeable domain error the FE can act on.
      if (isNew) {
        throw new AppError(C.LEAD_CLAIM_REQUIRED, 409, null, {
          translationKey: messagesNames.leadsMessages,
          reason: "This lead is new — claim it as a deal to open it.",
          redirectText: C.LEAD_CLAIM_REQUIRED,
          dontRedirect: true,
        });
      }
      const owner = await this.repo.findLeadOwner({ id: Number(clientLeadId) });
      if (owner && owner.userId != null && Number(owner.userId) !== Number(userId)) {
        throw new AppError(C.LEAD_ACCESS_DENIED, 403);
      }
      throw new AppError(C.LEAD_NOT_FOUND, 404);
    }
```

Add `messagesNames` to the existing `@dms/shared` import at the top of `lead.usecase.js` if not already imported (check the import line; `leadsMessagesCodes as C` is already there). If `messagesNames` is unavailable, drop the `translationKey`/`redirectText` options and throw `new AppError(C.LEAD_CLAIM_REQUIRED, 409, null, { reason: "This lead is new — claim it as a deal to open it." })` — the envelope still carries the code and reason.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run server/src/modules/leads/lead/__tests__/lead.claim-required.test.js`
Expected: PASS.

- [ ] **Step 6: Run the shared package tests (new code must not break message-code tests)**

Run: `npx vitest run packages/shared`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/messages-codes/leads/leads.js server/src/modules/leads/lead/lead.usecase.js server/src/modules/leads/lead/__tests__/lead.claim-required.test.js
git commit -m "fix(leads): meaningful LEAD_CLAIM_REQUIRED/LEAD_ACCESS_DENIED instead of misleading 404 on staff preview"
```

---

### Task 5: FE — closeable preview error dialog + Start Deal CTA (defects #1, #2)

**Files:**
- Modify: `web/src/app/helpers/messages/maps/leadsMessages.js` (add `LEAD_CLAIM_REQUIRED`)
- Modify: `web/src/features/leads/features/PreviewLead.jsx` (error capture + closeable state + CTA)
- Test: `web/src/app/helpers/messages/__tests__/leadsMessages.claim.test.js` (create)

**Interfaces:**
- Consumes: `getData(...)` returns `{ error: { message, redirectTo, redirectText, dontRedirect }, ... }` on non-2xx (already implemented in `getData.js` L61-63), and the envelope `code`.
- Produces: the preview renders a closeable dialog carrying the resolved message; when the code is `LEAD_CLAIM_REQUIRED`, a Start Deal button.

- [ ] **Step 1: Write the failing test (message resolution)**

Create `web/src/app/helpers/messages/__tests__/leadsMessages.claim.test.js`:

```js
import { describe, it, expect } from "vitest";
import { leadsMessages } from "../maps/leadsMessages";

describe("leadsMessages LEAD_CLAIM_REQUIRED", () => {
  it("resolves to a claim-as-deal message", () => {
    expect(leadsMessages.LEAD_CLAIM_REQUIRED).toBeTruthy();
    expect(leadsMessages.LEAD_CLAIM_REQUIRED.toLowerCase()).toContain("claim");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run web/src/app/helpers/messages/__tests__/leadsMessages.claim.test.js`
Expected: FAIL (`LEAD_CLAIM_REQUIRED` undefined).

- [ ] **Step 3: Add the FE resolution**

In `web/src/app/helpers/messages/maps/leadsMessages.js`, under "errors / scope / guards" add:

```js
  LEAD_CLAIM_REQUIRED: "This lead is new — claim it as a deal to open it",
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run web/src/app/helpers/messages/__tests__/leadsMessages.claim.test.js`
Expected: PASS.

- [ ] **Step 5: Capture the error envelope in `PreviewLead.jsx`**

In the `getALeadDetails` effect (currently only sets lead on `status === 200`), capture the failure. Add state `const [errorInfo, setErrorInfo] = useState(null);` near the other state. Update the effect body:

```js
    async function getALeadDetails() {
      if (open) {
        const leadDetails = await getData({ url, setLoading });
        if (leadDetails && leadDetails.status === 200) {
          setLead(leadDetails.data);
          setErrorInfo(null);
        } else if (leadDetails) {
          // getData attaches `error` (resolved message + redirect meta) on non-2xx.
          setErrorInfo({
            code: leadDetails.message || null,
            message: leadDetails.error?.message || null,
          });
        }
      }
    }
```

(`leadDetails.message` is the raw CODE from `normalizeEnvelope`; `leadDetails.error.message` is the resolved copy from `describeApiError`.)

- [ ] **Step 6: Render the error state inside a closeable surface + CTA**

Replace the current not-allowed block (the `if ((!loading && !lead) || …) return (<Container>…generic Paper…</Container>)`, ~L166-209) so that in **modal** mode it renders inside the `Dialog` with a Close button, and shows the resolved message + a Start Deal CTA when `errorInfo?.code === "LEAD_CLAIM_REQUIRED"`. Use the existing `createADeal`-style self-claim (POST `shared/client-leads` with `{ id }`, method PUT via `handleRequestSubmit`) and on success re-run `getALeadDetails` (lift it out of the effect or expose a `refetch`).

Concrete shape:

```jsx
  const resolvedErrorMessage =
    errorInfo?.message ||
    "You are not allowed to access this page or the lead doesn't exist";
  const canClaim = errorInfo?.code === "LEAD_CLAIM_REQUIRED";

  if (!loading && !lead) {
    const body = (
      <Box sx={{ p: 4, textAlign: "center", display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
        <FaExclamationTriangle size={28} color={theme.palette.error.dark} />
        <Typography variant="h6" sx={{ color: theme.palette.error.dark }}>
          {resolvedErrorMessage}
        </Typography>
        {canClaim && (
          <Button variant="contained" startIcon={<MdWork />} onClick={handleClaim}>
            Start Deal
          </Button>
        )}
      </Box>
    );
    if (page) {
      return <Container maxWidth="sm" sx={{ mt: 6 }}><Paper elevation={0} sx={{ borderRadius: 4 }}>{body}</Paper></Container>;
    }
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
        {body}
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Button onClick={onClose} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
```

Add `MdWork` to the `react-icons/md` import. Add `handleClaim`:

```js
  const { setLoading: setToastLoading } = useToastContext(); // if a toast provider is available here; else use setLoading
  async function handleClaim() {
    const res = await handleRequestSubmit({ id }, setLoading, `shared/client-leads`, false, "Assigning", false, "PUT");
    if (res.status === 200) {
      setErrorInfo(null);
      await getALeadDetails();
    }
  }
```

Import `handleRequestSubmit` from `@/app/helpers/functions/handleSubmit`. Keep the existing CONVERTED/ON_HOLD shadow-lead branch behavior intact (it can stay as its own earlier check).

> Keep this minimal and match surrounding style. The essential guarantees: (a) modal mode renders inside a `Dialog` with a working Close button, (b) the resolved message is shown, (c) a Start Deal CTA appears only for `LEAD_CLAIM_REQUIRED`.

- [ ] **Step 7: Verify the FE build**

Run: `cd web && npx next build`
Expected: build succeeds (no type/import errors in `PreviewLead.jsx`).

- [ ] **Step 8: Commit**

```bash
git add web/src/app/helpers/messages/maps/leadsMessages.js web/src/app/helpers/messages/__tests__/leadsMessages.claim.test.js web/src/features/leads/features/PreviewLead.jsx
git commit -m "fix(web): closeable preview error dialog with resolved message + Start Deal CTA for claimable leads"
```

---

### Task 6: FE — self-claim payload + New Leads card assign/claim (defects #3, #4-FE)

**Files:**
- Modify: `web/src/features/leads/core/LeadSliderCard.jsx` (self-claim payload → `{ id }`; add admin/super-sales assign action)
- Modify: `web/src/features/leads/shared/LeadDialogHeader.jsx` and `web/src/features/leads/shared/MoreActionsMenu.jsx` and `web/src/features/leads/PreviewLeadDialog.jsx` (self-claim payload → `{ id }`)
- Reuse: `web/src/features/leads/AssignNewStaffModal.jsx` (already gated on `LEAD_CODES.ASSIGN_OTHER`)

**Interfaces:**
- Consumes: `usePermission().hasPermission(LEAD_CODES.ASSIGN_OTHER)` (admin/super-sales), `AssignNewStaffModal` (renders an assign dialog for a lead; already appears for `ASSIGN_OTHER` holders regardless of assignment).
- Produces: self-claim requests POST `{ id }` (not the whole lead); the New Leads card shows Assign (admin/super-sales) or Start Deal (claimant).

- [ ] **Step 1: Self-claim payload → `{ id }` (defensive FE half of #4)**

In `LeadSliderCard.jsx` `createADeal` (L49-63), change the POST body from `lead` to `{ id: lead.id }`:

```js
  async function createADeal(lead) {
    const assign = await handleRequestSubmit(
      { id: lead.id },
      setLoading,
      `shared/client-leads`,
      false,
      "Assigning",
      false,
      "PUT",
    );
    if (assign.status === 200) {
      setData((data) => data.filter((l) => l.id !== lead.id));
    }
    return assign;
  }
```

Apply the same `{ id: lead.id }` change to the self-claim submit in `LeadDialogHeader.jsx` (the `createADeal` used by the Start Deal CTA), `MoreActionsMenu.jsx` (Start Deal action), and `PreviewLeadDialog.jsx` (its assign submit) — anywhere the self-claim currently posts the whole `lead`. Do NOT change `AssignNewStaffModal.jsx` (it correctly posts `{ userId, id }`).

- [ ] **Step 2: Add the assign action to the New Leads card**

In `LeadSliderCard.jsx`, import the permission hook + modal:

```js
import { usePermission } from "@/app/hooks/usePermission";
import { LEAD_CODES } from "@/app/helpers/permissionCodes";
import { AssignNewStaffModal } from "@/features/leads/AssignNewStaffModal.jsx";
```

Inside the component: `const { hasPermission } = usePermission(); const canAssignOther = hasPermission(LEAD_CODES.ASSIGN_OTHER);`

In the `actions` Stack, add — above the existing STAFF Start-a-Deal block — the assign entry for admin/super-sales:

```jsx
            {canAssignOther && (
              <AssignNewStaffModal
                lead={lead}
                onUpdate={() => setData((data) => data.filter((l) => l.id !== lead.id))}
              />
            )}
```

The existing `user.role === "STAFF" && !user.isSuperSales` Start-a-Deal block stays for the claimant path. (Leave that flag read in the FE for now — the FE flag-purge is the phase-2 sweep; this task only adds the assign entry point and fixes the payload.)

- [ ] **Step 3: Verify the FE build**

Run: `cd web && npx next build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add web/src/features/leads
git commit -m "fix(web): post {id} on self-claim; add assign action to New Leads card for ASSIGN_OTHER holders"
```

---

### Task 7: Full regression + parity gate

**Files:** none (verification only).

- [ ] **Step 1: Run the full backend + shared test suite**

Run: `npx vitest run server packages/shared`
Expected: PASS (no regressions; new lead tests green).

- [ ] **Step 2: Run the permissions parity tests specifically**

Run: `npx vitest run packages/shared/__tests__/permissions.test.js packages/shared/__tests__/navigation.test.js`
Expected: PASS — super-sales/primary authorization unchanged (now via profiles).

- [ ] **Step 3: Verify the FE build once more**

Run: `cd web && npx next build`
Expected: build succeeds.

- [ ] **Step 4: Update `PROJECT_STATE.md`**

Add a short entry: the 7 lead defects fixed; leads-module scoping moved onto SUPER_SALES/PRIMARY_SALES profiles; note the phase-2 codebase-wide flag-purge follow-up.

- [ ] **Step 5: Commit**

```bash
git add PROJECT_STATE.md
git commit -m "docs: record lead access + profile-signals fixes; note phase-2 flag-purge follow-up"
```

---

## Self-Review

**Spec coverage:**
- Profile signals (spec §4.1) → Task 1 ✅ (usecase/repo/dto/assign-status remap).
- Fix #7 kanban (spec §4.2) → Task 2 ✅.
- Fix #4 self-claim (spec §4.3) → Task 3 (BE) + Task 6 Step 1 (FE) ✅.
- Fix #1/#2 preview (spec §4.4) → Task 4 (BE code + message) + Task 5 (FE dialog) ✅.
- Fix #6 deals scope (spec §4.5) → Task 1 `deals()` guard ✅.
- Fix #3 external assign (spec §4.6) → Task 6 Step 2 (New Leads card) ✅.
- Fix #5 NEW→IN_PROGRESS (spec §4.7) → Task 3 Step 5 (verification) ✅.
- Error contract `LEAD_CLAIM_REQUIRED` (spec §5) → Task 4 Step 1 + Task 5 Step 3 ✅.
- Testing (spec §6) → per-task tests + Task 7 ✅.
- Scope boundary (spec §7): FE flag reads left for phase-2 (noted in Task 6 Step 2 + Task 7 Step 4) ✅.

**Placeholder scan:** none — every code step shows the actual code.

**Type/name consistency:** `#isSuperSalesScope`/`#isPrimaryScope`/`isAdminUser` are defined in Task 1 and referenced consistently; `hasFullScope` signature updated in Task 1 and matched by `buildAuthUserLeadWhere`'s existing `...authUser` spread; `LEAD_CLAIM_REQUIRED` code added in Task 4 and consumed in Task 5; `getData` error shape matches `getData.js`.

**Risk note:** Task 1 Step 8 explicitly catches any pre-existing test that constructed authUser with `isSuperSales`/`isPrimary` and updates the fixture to profile keys — do not skip it, or the suite will show pre-existing-fixture failures unrelated to the change.
