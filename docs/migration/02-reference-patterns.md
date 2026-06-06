# Reference Patterns — Adoption Guide for the Design Management System

> Distilled from the mature reference project **Cases-Digital-Assets-Management**
> (`C:\coding\Cases-Digital-Assets-Managment`). This is a **pattern reference**, not
> a tour. Every pattern below is confirmed against real code; citations use exact
> reference-repo paths so the target team can look them up.
>
> **Single most important adoption note:** we adopt the *message-code indirection*
> mechanism (errors/success carry language-neutral CODES, never raw strings) but we
> **SKIP the bilingual ar/en i18n translation layer** — the target app is
> single-language. Codes still resolve through one lookup table; we just keep one
> language. See §8 for the explicit adopt/skip split.

---

## 1. Monorepo & workspaces layout

The reference is an npm-workspaces monorepo with three workspace roots: two shared
packages plus `server` and `web`.

Root `package.json` (`Cases-Digital-Assets-Managment/package.json`):

```json
{
  "private": true,
  "workspaces": ["packages/*", "web", "server"],
  "scripts": {
    "dev:server": "npm run dev -w server",
    "dev:web": "npm run dev -w web",
    "db:generate": "npm run generate -w packages/db",
    "db:migrate": "npm run migrate:dev -w packages/db"
  }
}
```

### Target folder tree we will mirror

```
<root>/
  package.json                 # npm workspaces: ["packages/*", "web", "server"]
  packages/
    shared/                    # framework-agnostic constants + helpers + message codes
      index.js                 #   barrel re-exporting everything
      auth.js                  #   cookie-name constants
      brand.js                 #   brand/theme tokens (colors, statusColors)
      helpers.js               #   pure cross-cutting helpers (role/scope predicates)
      messages-names.js        #   code-namespace registry ({ authMessages: "authMessages", ... })
      messages-codes/          #   language-neutral message CODES, grouped by area
        index.js               #     barrel
        core/ admin/ <domain>/ #     e.g. core/general.js, <domain>/<entity>.js
      constants/               #   permissions, roles, statuses, audit, navigation, ...
        access/ org/ workflow/ audit/ system/ ...
      package.json             #   name: "@my/shared" (target: pick your own scope)
    db/
      prisma.client.js         #   THE singleton Prisma client (export const prisma)
      prisma/schema.prisma     #   schema
      generated/prisma/        #   generated client (gitignored)
      scripts/                 #   seed scripts
      package.json             #   name: "@my/db"
  server/
    src/
      app.js                   #   express app assembly (middleware, mount /api/v1)
      server.js                #   http listen + socket bootstrap
      routes.js                #   mounts every module router under /api/v1
      config/                  #   env.js, cors.config.js, redis.config.js
      infra/                   #   crypto, mail, storage, queue, socket, security(jwt), clients
      shared/                  #   errors/ http/ middlewares/ utility/
      modules/<domain>/<m>/    #   the 6-file module layout (see §2)
  web/
    src/
      app/                     #   Next.js App Router (route segments only)
      features/<x>/            #   feature code: pages/ components/ config/ (hooks/)
      features/<x>Details/     #   detail screens split into their own feature folder
      shared/                  #   reusable components, data, workflow toolboxes
      hooks/                   #   request/ socket/ usePermission.js ...
      providers/               #   Auth, Theme, Toast, WebSocket, AppProviders
      lib/api/ApiFetch.js      #   the single fetch wrapper
      theme/                   #   MUI theme
```

Key rules confirmed in code:
- The shared package is imported as `@my/shared` / `@my/db` everywhere
  (`server/src/modules/case/keyword/keyword.route.js` line 7). Pick a scope for the
  target (e.g. `@dms/shared`) and keep it consistent.
- `@my/shared` is **framework-agnostic**: it must not import Prisma, Express, or
  Next. Helpers that need DB take `prisma` as a parameter
  (`packages/shared/helpers.js` `getOfficeManagersForBranch(branchId, prisma)`).
- The Prisma client is a **singleton** instantiated once in
  `packages/db/prisma.client.js`; never `new PrismaClient()` anywhere else. One
  thin re-export (`server/src/infra/clients/prisma.client.js`) is tolerated; do not
  add a third path.

---

## 2. Backend layering rules

Every backend module under `server/src/modules/<domain>/<module>/` is the same six
files. Strict one-way layering: **route → controller → usecase → repo**, with
**validation** and **dto** as siblings.

```
<module>/
  <module>.route.js        # endpoints + middleware wiring ONLY
  <module>.controller.js   # read validated req, coerce primitives, call usecase, respond
  <module>.usecase.js      # ALL business logic + orchestration; throws AppError
  <module>.repo.js         # Prisma calls ONLY; this.model = prisma.<model>
  <module>.validation.js   # Zod schemas as a class with static fields
  <module>.dto.js          # shaping/select helpers (often a placeholder shell)
```

Layer responsibilities (confirmed against the `keyword` module, read end-to-end):

| Layer | Allowed | Forbidden |
|---|---|---|
| **route** (`keyword.route.js`) | mount `requireAuth` once at router; per-route chain `requirePermissions → requireSpecialChecker → validate → asyncHandler` | any logic |
| **controller** (`keyword.controller.js`) | read `req.body/query/params/auth.id`, `parseInt(...)`, call usecase, return via response helpers | branching, rules, Prisma |
| **usecase** (`keyword.usecase.js`) | business rules, orchestration, guards, throw `AppError`, call repos + infra services | direct HTTP, raw Prisma for normal CRUD |
| **repo** (`keyword.repo.js`) | Prisma I/O, build `where` scope helpers, `prisma.$transaction` for multi-write | authorization decisions |

### Tiny representative example (the create path)

**route** — middleware chain only:
```js
keywordRoutes.post(
  "/link/:keywordId",
  authMiddleware.requirePermissions([PERMISSIONS.TRANSACTION.KEYWORD_ADD]),
  authMiddleware.requireSpecialChecker(keywordController.checkIfUserCanMutateTarget),
  validate(KeywordValidation.linkKeywordSchema),
  asyncHandler(keywordController.linkKeyword),
);
```

**controller** — thin; coerce + delegate + respond:
```js
async linkKeyword(req, res) {
  const { keywordId } = req.params;
  const { transactionId, keyword } = req.body;
  const result = await keywordUsecase.linkKeyword(
    { keywordId: parseInt(keywordId), transactionId: parseInt(transactionId),
      authUserId: req.auth.id, keyword },
  );
  return ok(res, result);
}
```

**usecase** — rules + guards (here an archive guard) then delegate to repo:
```js
async linkKeyword({ keywordId, transactionId, authUserId, keyword }) {
  await assertTransactionMutable(transactionId);          // business guard
  return keywordRepo.linkKeyword({ keywordId, transactionId, authUserId, keyword });
}
```

**repo** — Prisma only, multi-write inside `$transaction`:
```js
async createKeyword({ keyword, transactionId, authUserId }) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.keyword.create({ data: { keyword, createdById: authUserId } });
    await this.#linkToTransaction({ tx, keywordId: created.id, transactionId, authUserId });
    return created;
  });
}
```

Additional confirmed rules:
- **Prisma only in repos.** The one sanctioned exception: a usecase may drive
  `prisma.$transaction(async (tx) => ...)` when a multi-write spans more than one
  repo, passing `tx` down (`server/src/modules/admin/user/user.usecase.js`). Don't
  use it as a shortcut for ordinary CRUD.
- **Controllers/usecases export a single instance**: `export const keywordController = new KeywordController();`.
- **Validation** (`keyword.validation.js`) is a class with `static` Zod schemas;
  Zod messages are message CODES, never prose. The `validate(schema, source="body")`
  middleware (`server/src/shared/middlewares/validate.middleware.js`) replaces
  `req[source]` with parsed data and returns **422 with `details`** on failure.
  Almost every route validates `body` only.
- **Pagination & filters** go through `paginate({ page, limit })`
  (`server/src/shared/utility/pagination.js`) and `buildOrderBy / buildSearchQuery /
  buildDateRangeFilter` (`server/src/shared/utility/helper.js`). Repos return
  `{ items, total, page, pageSize }`.
- **Workflow status** (system-managed fields) must never go through a generic
  `PATCH`. Use dedicated `POST /<resource>/:id/actions/<action-kebab>` endpoints
  driven by a transition map in `@my/shared`
  (`packages/shared/constants/transaction-department/transaction-department.transitions.js`).
  The usecase runs an explicit ordered flow: validate → permission → scope → guard
  → transition-check → mutate-in-`$transaction` → audit → recompute-derived-status.
- **All routes mounted under `/api/v1`** (`server/src/app.js` line 69; module
  routers wired in `server/src/routes.js`).

---

## 3. API contract + AppError + message-codes

### The envelope

Every response — success or error — shares one shape:

```json
{ "success": true, "message": "OK", "data": { }, "translationKey": "<namespace>" }
```

- `message` is **always a CODE** (e.g. `"OK"`, `"TRANSACTION_NOT_FOUND"`), never a
  user-facing sentence.
- `data` is either an object or `{ items, total, page, pageSize }` for lists.
- `translationKey` names the code-namespace the client looks the code up in.

Success helpers live in `server/src/shared/http/response.js`:
`ok / created / updated / deleted / noContent` and error helpers
`badRequest / unauthorized / forbidden / notFound / conflict / InternalServerError`.
The error helpers bake in `dontRedirect: true` (in-action errors → toast).

### AppError

`server/src/shared/errors/AppError.js` — a single error class carrying everything
the client needs to render a localized message and decide navigation:

```js
new AppError({
  message: keywordMessagesCodes.TRANSACTION_ID_REQUIRED,  // a CODE
  code:    keywordMessagesCodes.TRANSACTION_ID_REQUIRED,  // same CODE
  statusCode: 400,
  translationKey: messagesNames.keywordMessages,          // which namespace
  dontRedirect: true,                                     // toast vs redirect
  // redirectTo / redirectText / details / reason optional
});
```

The error middleware (`server/src/shared/errors/error-handler.js`) renders the
envelope and special-cases:
- `PrismaClientKnownRequestError` 1062 (duplicate) / 1451 (FK) → mapped to
  `prismaKnowMessagesCodes` (a constraint-name → code table).
- `MulterError` → bounded upload codes (never leaks configured limits).

**Redirect vs toast** is the `dontRedirect` rule:
- In-action/business errors (validation, invalid transition, "already linked") →
  `dontRedirect: true` → client shows a toast, user stays put.
- Auth-class errors (403 on unowned resource, unrecoverable 404) → set `redirectTo`
  and omit `dontRedirect` → client navigates to a recovery page.

### Message-codes mechanism (the part we KEEP)

Three pieces, all in `@my/shared`:
1. **Code constant objects**, one per area, under `messages-codes/<area>/<file>.js`.
   Example `packages/shared/messages-codes/case/keyword.js`:
   ```js
   export const keywordMessagesCodes = {
     KEYWORD_NOT_FOUND: "KEYWORD_NOT_FOUND",
     TRANSACTION_ID_REQUIRED: "TRANSACTION_ID_REQUIRED",
     KEYWORD_ALREADY_LINKED: "KEYWORD_ALREADY_LINKED",
   };
   ```
   Codes are SCREAMING_SNAKE_CASE and the key equals the value (the string IS the
   code). A barrel (`messages-codes/index.js`) re-exports every area.
2. **`messages-names.js`** — a registry mapping each namespace to itself
   (`{ keywordMessages: "keywordMessages", ... }`). The `translationKey` on every
   error/response is one of these names; it tells the client which lookup table the
   `code` belongs to.
3. **Client-side resolution** — the client takes `(translationKey, code)` and
   resolves it to a displayed string. In the reference this is the i18n layer with
   `ar`/`en` blocks; **in the target it is a single-language lookup map** (see §8).

This indirection is what we adopt: the backend never decides wording, it emits a
stable code + namespace; the frontend owns wording.

---

## 4. Permissions model

Authorization = **authentication + permission code + object scope + status (+ workflow
guard)**. Never authorize on role alone; never use wildcard permissions. `User.role`
is descriptive only.

### Permission codes

Defined in `packages/shared/constants/access/permissions.constants.js` as flat
`dot.case` strings, grouped per domain, and exposed two ways:

```js
export const TRANSACTION_TEMPLATE_PERMISSIONS = {
  VIEW: "transaction_template.view",
  EDIT: "transaction_template.edit",
  REQUEST_SIGNATURE: "transaction_template.request_signature",
};
```

- **Nested** `PERMISSIONS.<DOMAIN>.<ACTION>` is the canonical style for route gates,
  usecase checks, and FE checks (greppable). The flat `*_PERMISSIONS` form is used
  inside the shared package itself and the navigation map.
- **Role → permission profiles** live in
  `packages/shared/constants/access/roles/role-permission-profiles.js`. Roles map to
  reusable permission bundles; effective permissions = direct user permissions ∪
  assigned role-profile permissions. The DB stores assignments; the auth DTO
  (`server/src/modules/auth/auth.dto.js` `mapUserWithPermissions`) flattens them into
  `user.permissions[]` + `user.permissionsByModule{}` at login/`/me`.

### `requirePermissions` (route guard)

`server/src/shared/middlewares/auth.middleware.js`:
```js
requirePermissions(required = [], anyOf = []) {
  return (req, res, next) => {
    const have = req.auth?.permissions || [];
    const ok = required.length
      ? required.every((p) => have.includes(p))
      : anyOf.some((p) => have.includes(p));
    if (!ok) return next(new AppError({ code: authMessagesCodes.FORBIDDEN, statusCode: 403, ... }));
    return next();
  };
}
```
`requireAuth` (mounted once per router) verifies the JWT, loads the user (Redis-cached),
checks `sessionVersion`, `isActive`, `isDepartmentActive`, and attaches `req.auth`.

### Object-scope checkers (the part beyond mere permission)

A permission code answers "may this kind of user do this action?". Scope answers
"may this user touch *this specific row*?". Implemented as controller methods named
`checkIfUserCanAccessX` (read scope) / `checkIfUserCanMutateX` (write scope), wired
via `authMiddleware.requireSpecialChecker(fn)` **after** `requirePermissions`:

```js
// controller
async checkIfUserCanMutateTarget(req) {
  return keywordUsecase.checkIfUserCanMutateTarget({
    transactionId: parseInt(req.body.transactionId), authUserId: req.auth.id });
}
// usecase — build a scoped `where`, load, throw AppError if not visible
async checkIfUserCanAccessCase({ caseId, authUserId }) {
  let where = await caseRepo.buildAuthUserCasesWhere({ authUserId, where: { id: caseId } });
  const found = await caseRepo.getUserCaseByWhere({ where });
  if (!found) throw new AppError({ code: caseMessagesCodes.CASE_ACCESS_DENIED, statusCode: 403, ... });
  return found;
}
```

**Critical gotcha (documented in the reference):** checkers must **throw** on
denial — a `return false`/`undefined` silently lets the request through, because
`requireSpecialChecker` only catches thrown errors.

### Capabilities (FE-facing fine-grained flags)

Beyond raw permission codes, the reference computes derived **capability** booleans
(e.g. `canEditTemplate` = Higher Manager OR an assignee whose purpose is
edit-capable — `packages/shared/helpers.js` `canUserEditTransactionTemplate`). These
are layered on top of a permission code, not a replacement for it.

### Audit logging + multi-write transactions

Important business actions write an `AuditLog` row through
`auditLogRepo.createAuditLog({ actionType, entityType, entityId, createdById, ... })`
using `AUDIT_ACTION_TYPES / AUDIT_ENTITY_TYPES` from `@my/shared`. Field-diff updates
use `auditLogRepo.logUpdatesForAnEntity({ updates, ... })`. State mutation + its audit
row live in the same `prisma.$transaction` so they commit atomically.

> NOTE: the reference's `AUDIT_TITLE_FN` returns frozen **Arabic** title snapshots —
> a documented exception to its own "codes only" rule. For the single-language
> target this collapses to a non-issue (titles are just strings in our one
> language); keep `actionType` + structured params, drop the bilingual concern.

---

## 5. Frontend feature structure

Next.js App Router + MUI + react-hook-form. The App Router (`web/src/app/`) holds
**route segments only**; all real screen code lives in `web/src/features/<x>/`.

### `features/<x>` + `features/<x>Details` shape

```
features/transaction/
  config/
    constant.js              # URL bases: export const TRANSACTION_URL = "/transactions";
    transactionColumns.js    # column descriptors (drive both table + form fields)
    transactionFilters.js    # filter-bar config
  components/                # feature-specific components (CreateTransaction.jsx, ...)
  pages/                     # the page component(s) the App Router route renders
features/transactionDetails/ # the detail screen is its OWN feature folder
```
List feature and detail feature are **separate folders** (`transaction` vs
`transactionDetails`). All subfolders are **plural** (`pages/`, `components/`,
`config/`). Cross-feature workflow toolboxes (shared dialogs/menus/action hooks) live
under `web/src/shared/workflow/`, not inside a feature.

### Config-driven `DataTable`

`web/src/shared/components/tables/DataTable.jsx` is the canonical list view. The page
feeds it `columns` (from `config/*Columns.js`), `filterConfig` (from
`config/*Filters.js`), paginated state from `useRequest`, and per-action callbacks
that are **permission-gated in the caller** (`canEdit ? handleEdit : undefined`).
`renderViewLink(item) => "/dashboard/<feature>/<id>"` controls navigation.
Column descriptors do double duty: `getFormFieldsFromColumns(columns, t)` derives RHF
form fields from the same column config (`creatable`/`editable`/`rules`/`type`).

### `useRequest` (under `hooks/request/`)

`web/src/hooks/request/useRequest.js` is the single data-fetching primitive (and
`useMultiRequest.js` for CRUD against one base URL). It wraps the lone fetch wrapper
`web/src/lib/api/ApiFetch.js`. **Components never call `fetch` directly.**

```js
const { data, page, setPage, pageSize, setPageSize, total,
        isLoading, error, filters, setFilters, triggerRefetch } = useRequest({
  url: `${TRANSACTION_URL}?transactionType=${type}`,
  method: "get", isPaginated: true, autoFetch: canList, isPublic: false,
});
```
- Syncs filters to URL params (`syncToUrl` default true), auto-extracts
  `data.items/total/page/pageSize` for paginated GETs, supports `scrollLoad` infinite
  scroll, `isPublic` for logged-out calls, and `uploadWithProgress` for uploads.
- On error it reads the envelope's `code`/`translationKey`/`dontRedirect` and either
  toasts (resolving the code to a string) or redirects.

### `AppForm` + react-hook-form

`web/src/shared/components/common/form/AppForm.jsx` renders an array of field
descriptors and dispatches each to the matching `RHF*` input
(`web/src/shared/components/common/form/rhf/`). Field `rules` reference message keys,
not prose, mirroring the backend. With `hideActions`, the parent `FormDialog` submits
via `document.getElementById(formId)?.requestSubmit()`.

### `usePermission` (FE gating)

`web/src/hooks/usePermission.js` derives `{ hasPermission, hasAnyPermission,
hasAllPermissions, hasPermissionByModule, hasAction }` from `user.permissions` /
`user.permissionsByModule`. Gate every action button/route:
```js
const { hasPermission } = usePermission();
const canCreate = hasPermission(TRANSACTION_PERMISSIONS.CREATE_INCOMING);
<PageHeader onCreate={canCreate ? openCreate : undefined} />
```
The backend remains source of truth — the UI only hides/disables; it must still call
the proper endpoint.

### Providers & socket hooks

`web/src/providers/`: `AppProviders.jsx` composes `AuthProvider` (`useAuth` →
current user + permissions), `ThemeRegistery`, `ToastProvider` (`useToast`),
`WebSocketProvider`, `UploadQueueProvider`. Socket hooks under `web/src/hooks/socket/`
(`useSocket`, `useSocketEvent`, `useRegisterSocketEvents`) consume server lifecycle
events (e.g. upload progress).

---

## 6. Testing conventions

**The reference has no automated test runner** — no `jest`/`vitest`, no `*.test.js`/
`*.spec.js` files, no `test` script in any `package.json`. Verification is done via
**manual smoke runbooks** captured in `PROJECT_STATE.md` (e.g. the "Test runbook
(smoke)" §, the DocuSign and confidential-queue end-to-end scenarios, and grep-based
verification like `grep -ri "caseId" server/src/` to confirm a refactor is complete).

What this tells the target team about *what to test* (the layers that carry risk):
- **Usecases** — they hold all business logic and the ordered workflow flow.
- **Authorization & scope** — `requirePermissions` + the `checkIfUserCanAccessX /
  MutateX` checkers (the "throw, don't return false" gotcha is exactly the kind of
  bug a test should catch).
- **Validation** — Zod schemas (422 + `details`).
- **End-to-end behavior** — exercise the real flow (envelope shape, audit row
  written, derived status recomputed), not just types.

**Adoption recommendation for the target:** keep the reference's *focus* (test
usecases + authorization/scope + validation, verify behavior end-to-end) but
**upgrade the mechanism** — introduce a real runner (vitest/jest) since the reference
left this as a gap. Write usecase + scope-checker tests against a test DB or mocked
repos; assert the envelope and the audit side-effects.

---

## 7. Naming & file conventions

**Backend files:** `<module>.route.js`, `<module>.controller.js`, `<module>.usecase.js`,
`<module>.repo.js`, `<module>.validation.js`, `<module>.dto.js`. Six files per module,
even when `.dto.js` is a placeholder shell (kept so layout is uniform). Modules group
under domain folders (`server/src/modules/case/transaction/...`).

> The reference uses `.repo.js`. The target may standardize on `.repository.js` (the
> target already has files like `chat.repository.js`); pick ONE suffix and apply it
> everywhere. The skill descriptions list both forms — choose the target's dominant
> existing pattern.

**Frontend files:** `features/<feature>/pages/<Page>.jsx`,
`features/<feature>/components/<Comp>.jsx`,
`features/<feature>/config/{constant,*Columns,*Filters,fields}.js`. Subfolders always
plural. Shared components PascalCase, re-exported through a `shared/components/index.js`
barrel.

**Identifiers:**
- Models PascalCase; fields camelCase; enums PascalCase with SCREAMING_SNAKE_CASE
  values.
- Permission codes: `dot.case` (`"transaction.approve.final"`).
- Message codes: SCREAMING_SNAKE_CASE, key == value.
- Status/action enum values used in code: SCREAMING_SNAKE_CASE.
- API action URL segments: kebab-case (`/actions/submit-to-manager`).

**Routes:** mounted at `/api/v1/<plural-kebab>` (`/transaction-departments`);
sub-routes kebab-case; workflow actions at `<resource>/:id/actions/<action-kebab>`.

**Shared constants:** never duplicate statuses/permission codes/action keys/audit
titles that already live in `@my/shared`. The barrel `packages/shared/index.js`
re-exports everything; import nested `PERMISSIONS.<DOMAIN>.<ACTION>` in app code.

---

## 8. What we ADOPT vs what we SKIP

### ADOPT (carry over as-is, adapted to one language)

| Pattern | Why | Reference anchor |
|---|---|---|
| **Message-code indirection** | backend emits stable language-neutral CODES + a namespace; UI owns wording | `packages/shared/messages-codes/*`, `messages-names.js` |
| **`{ success, message, data, translationKey }` envelope** | one predictable response shape for success and error | `server/src/shared/http/response.js` |
| **`AppError` class** | carries `code`/`statusCode`/`translationKey`/`dontRedirect`/`redirectTo` | `server/src/shared/errors/AppError.js` |
| **Backend layering** (route→controller→usecase→repo + validation + dto) | thin controllers, Prisma confined to repos, logic in usecases | `server/src/modules/case/keyword/*` |
| **Permissions model** | permission code + object scope checker + status; never role-only; no wildcards | `permissions.constants.js`, `auth.middleware.js`, `checkIfUserCan*` |
| **`/actions/<kebab>` for workflow status** | no generic PATCH on system-managed status; transition map in shared | `transaction-department.transitions.js` |
| **Audit on important actions** + multi-write `prisma.$transaction` | atomic state+audit, traceability | `auditLogRepo`, repo `$transaction` usage |
| **Frontend feature structure** | `features/<x>` + `features/<x>Details`, `config/`-driven `DataTable`, `useRequest`, `AppForm`+RHF, `usePermission`, providers | `web/src/features/transaction/*`, `hooks/request/`, `usePermission.js` |
| **Singleton Prisma client** in `packages/db` | one client, imported everywhere | `packages/db/prisma.client.js` |
| **Testing focus** | test usecases, authorization/scope, validation; verify behavior end-to-end | `PROJECT_STATE.md` smoke runbooks |

### SKIP (deliberately not carried over)

- **The bilingual ar/en i18n translation layer.** The target app is
  **single-language**, so we drop: the per-feature `{ ar: {...}, en: {...} }` data
  blocks (`web/src/shared/data/<area>/*`), the i18next/RTL machinery
  (`web/src/i18n/*`, the RTL emotion plugin, `dir` toggling), and the
  per-code dual-language message tables.
- **The `AUDIT_TITLE_FN` Arabic-snapshot exception** and the whole "Arabic primary /
  English secondary" framing.

### KEEP THE INDIRECTION, DROP THE SECOND LANGUAGE — the precise distinction

This is the subtle but load-bearing point:

- We **still** make the backend emit `message` as a **code** (e.g.
  `"TRANSACTION_NOT_FOUND"`) plus a `translationKey` namespace. We do **not** let the
  backend return ready-made user prose.
- On the client we **still** resolve `(translationKey, code)` to a display string
  through a **lookup table** — but that table has **one language**, not an `ar`/`en`
  split. Concretely: a single map like
  `messages[translationKey][code] -> "Transaction not found"`, instead of
  `messages[translationKey][code] = { ar: "...", en: "..." }`.
- The win we keep: centralized, consistent wording; no hardcoded strings scattered in
  controllers; trivial to restyle/reword copy in one place; and a clean upgrade path
  if a second language is ever added later (just widen the leaf from a string to a
  per-language object).
- RHF `rules` and Zod messages still reference these **keys/codes**, not prose — same
  as the reference — they just resolve against the single-language map.

In short: **codes + namespaces + central resolution = ADOPT. Two languages + RTL =
SKIP.**
