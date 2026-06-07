# Dream Studio — Backend Migration Plan

> Target plan for migrating the existing `server/` (legacy `routes/` + `services/`, plus the partial `server/v2/`)
> into a reference-mirroring npm-workspaces monorepo.
> Grounded in `docs/migration/01-current-audit.md` (current state) and `docs/migration/02-reference-patterns.md` (target patterns).
> Date: 2026-06-06 · Branch: `server-migration` · Status: **PLAN — pending approval, no code written.**

---

## 0. Executive summary & guiding principles

We restructure the backend into a reference-aligned monorepo (`packages/db`, `packages/shared`, `server/src/...`)
using the strict route → controller → usecase → repo (+validation, +dto) layering, real permission codes + object
scope, a single JWT, a single message-code mechanism resolving to **one language (Arabic)**, and server-owned BullMQ
workers. We do this **without changing the Prisma schema** (the data contract) and **without changing observable API
behavior** the frontend already depends on — except a small set of explicitly-flagged contract improvements that the
frontend plan must mirror (see §12).

### Guiding principles

1. **Strangler pattern.** Legacy `routes/*` + `services/*` and the new `server/src/modules/*` **coexist in one
   process** until each module is cut over. We never break the running app; we replace one module at a time, mount the
   new router, then retire the legacy route group. This is already how `server/v2/app.js` runs today (legacy routers +
   `/v2` router side-by-side) — we extend it, we do not restart from zero.
2. **Schema is frozen.** `server/prisma/schema.prisma` (2478 lines, ~120 models, ~40 enums) is the contract. We move it
   into `packages/db/prisma/schema.prisma` verbatim. Model/field/enum names are preserved exactly. No data migration is
   part of this plan beyond relocating the file and wiring the singleton client.
3. **Behavior preserved, structure improved.** The frontend must receive equivalent results. Where we propose a
   response-shape improvement (envelope normalization, message codes), it is called out as **CONTRACT CHANGE** and
   listed in §12 so the frontend plan reconciles.
4. **PDF is logic-frozen.** The two PDF subsystems are relocated **split-without-changing** — identical logic, identical
   bytes/visual output — with explicit handling of the fragile `__dirname`-relative font loading (see §7).
5. **Migrate FROM v2, but remediate v2 first.** Before module-by-module work, a remediation sub-phase fixes the v2 defects
   the audit found (duplicated infra, dual chat repo files, split queues/workers, broken pdf worker, role-only auth, two
   JWTs). We do not pile new modules onto a broken foundation.
6. **One suffix: `.repository.js`.** The repo already uses `.repository.js` (booking-leads, chat, telegram). We
   standardize on it everywhere and rename the stragglers (`auth.repo.js`, `chat.repo.js`). The reference uses `.repo.js`;
   we deliberately diverge to match the target's dominant existing pattern. All other suffixes match the reference
   (`.controller.js`, `.usecase.js`, `.validation.js`, `.dto.js`, `.routes.js`).
7. **Single language.** We adopt the message-code indirection (codes + `translationKey` namespace + central client
   resolution) but resolve to **Arabic only** — a single-language lookup map, not an ar/en split. The legacy ar/en
   dictionary toggle, `stylis-plugin-rtl` machinery as a *language* feature, and dual-language message tables are dropped
   (RTL stays as a layout default, not a toggle).

---

## 1. Target monorepo layout

```
<root>/                                  # design-managment-system
  package.json                           # npm workspaces: ["packages/*", "server", "ui"]
  packages/
    shared/                              # framework-agnostic: constants + helpers + message CODES (NO prisma/express/next)
      index.js                           #   barrel
      auth.js                            #   cookie-name + token constants
      brand.js                           #   brand/status colors (migrated from server/v2/shared/brand.js)
      helpers.js                         #   pure predicates; DB-needing helpers take `prisma` as a param
      messages-names.js                  #   namespace registry { authMessages: "authMessages", leadMessages: ..., ... }
      messages-codes/
        index.js
        core/general.js                  #   OK, CREATED, FORBIDDEN, NOT_FOUND, VALIDATION_FAILED ...
        auth/ leads/ contract/ image-session/ accounting/ courses/ chat/ telegram/ project/ upload/ ...
      constants/
        access/permissions.constants.js  #   PERMISSIONS.<DOMAIN>.<ACTION> (dot.case)
        access/roles/role-permission-profiles.js
        workflow/*.transitions.js        #   status transition maps (contract, image-session, lead, task, payment ...)
        audit/audit.constants.js         #   AUDIT_ACTION_TYPES / AUDIT_ENTITY_TYPES
        org/ system/                     #   enums mirrored from schema (UserRole, statuses) as constants
      package.json                       #   name: "@dms/shared"
    db/
      prisma.client.js                   #   THE singleton: export const prisma = new PrismaClient()
      prisma/schema.prisma               #   the frozen schema (moved verbatim from server/prisma/schema.prisma)
      prisma/migrations/                 #   existing migrations moved here
      generated/prisma/                  #   generated client (gitignored)
      scripts/                           #   seed/initData (moved from server/initData.js; NOT auto-run on postinstall)
      package.json                       #   name: "@dms/db"
  server/
    src/
      app.js                             #   express assembly; mounts /v2 (from server/v2/app.js)
      server.js                          #   http listen + socket bootstrap + startWorkers() + startCron()
      routes.js                          #   mounts every module router under /v2 (from server/v2/shared/routes.js)
      config/                            #   env.js, cors.config.js, redis.config.js
      infra/
        clients/prisma.client.js         #   thin re-export of @dms/db (the ONE tolerated re-export)
        security/{jwt.js,hash.js}
        mail/{mail.js,email-shell.js}
        socket/{index.js,handlers/*,socket.helpers.js}
        redis/{redis.client.js,bullmq.connection.js,cache.service.js,socket-pubsub/*}
        queues/{index.js,pdf.queue.js,telegram-*.queue.js}
        workers/{index.js,pdf.worker.js,telegram-*.worker.js,start-workers.js}
        cron/{index.js,reminders.cron.js,project-delivery.cron.js,telegram.cron.js}
        upload/{index.js,local-disk-storage.provider.js,ftp.provider.js}
        telegram/{client.js}             #   single GramJS connection owner
        pdf/                             #   PDF infra (fonts, low-level context engine) — see §7
        google/{drive.js,calendar.js}
      shared/
        errors/{AppError.js,error-handler.js}
        http/response.js
        middlewares/{auth.middleware.js,validate.middleware.js,async-handler.js}
        utility/{pagination.js,helper.js,arabic-text.js}   #   arabic shaping helpers (from utilityServices.js)
      modules/<domain>/<module>/         #   the six-file layout (see §4 + module map §2)
  ui/                                    #   frontend (planned separately; see frontend plan)
```

Rules carried from the reference: `@dms/shared` and `@dms/db` are the import roots; `@dms/shared` must not import
Prisma/Express/Next; the Prisma client is a **singleton** in `packages/db/prisma.client.js` (the audit's duplicate
`v2/infra/prisma.js` vs `v2/infra/prisma/prisma.js` collapse to one + one thin re-export).

---

## 2. Module map (legacy routes/* + services/* → server/src/modules/<name>)

~393 endpoints grouped into coherent domain modules. Complexity: **L**ow / **M**edium / **H**igh / **XL** (logic-frozen
or 2k+ line source). "From v2" = a partial module already exists and is migrated/completed rather than built fresh.

| Target module (`server/src/modules/...`) | Legacy source(s) | Service source(s) | Cx | Key dependencies |
|---|---|---|---|---|
| `auth/auth` | `routes/auth/auth.js` | `services/main/auth/*`, `utility.js` token fns | M | from v2 (`auth/*`); JWT unification (§6) |
| `leads/client/booking-lead` | `routes/client/leads.js` (public path) | `services/main/client/*`, `shared/leadServices.js` | M | **from v2 (cleanest)**; notifications |
| `leads/lead` (staff/admin lead mgmt) | `routes/shared/client-leads.js` (659 ln), `routes/clients/clients.js` | `services/main/shared/leadServices.js` (1212), `client/clientServices.js` | H | permissions+scope, auto-assign, commissions |
| `leads/sales-stage` | `routes/shared/sales-stages.js` | `services/main/shared/*` | M | leads |
| `leads/auto-assignment` | (in admin/shared) | `services/main/shared/leadServices.js` | M | leads |
| `contract/contract` | `routes/contract/contracts.js` | `services/main/contract/contractServices.js` (1441) | H | **PDF (§7)**, payments, scope |
| `contract/client-contract` | `routes/contract/client-contract.js` | `contractServices.js`, `clientContractServices.js` | H | **PDF (§7)**, public signing token |
| `contract/pdf` (logic-frozen) | — | `generateContractPdf.js` (2332), `wittenBlocksData.js`, `generateDefaultContractData.js`, `pdf-utilities.js`, `rules.js` | **XL** | §7; fonts; FTP upload |
| `image-session/admin-image-session` | `routes/image-session/admin-image-session.js`, `image-session.js` | `services/main/image-session/imageSessionSevices.js` (1660) | H | spaces, materials, styles |
| `image-session/client-image-session` | `routes/image-session/client-image-session.js` | `client/clientServices.js` (1669) `uploadPdfAndApproveSession` | **XL** | **PDF (§7)**, pdf queue, scope |
| `projects/project` | `routes/shared/projects.js` | `services/main/shared/projectServices.js` (1474) | H | delivery, tasks, reminders cron |
| `projects/task` | `routes/shared/tasks.js` | `projectServices.js` | M | projects, status actions |
| `projects/delivery` | `routes/shared/delivery.js` | `projectServices.js` | M | projects, telegram reminders |
| `projects/update` | `routes/shared/updates.js` | `services/main/shared/*` | M | projects, leads |
| `accounting/invoice` | `routes/accountant/accountant.js` (invoices) | `services/main/accountant/*` | H | payments, scope |
| `accounting/payment` | `routes/client/payments.js`, accountant payments | `accountant/*`, Stripe | H | Stripe; payment status actions |
| `accounting/salary` | `routes/accountant/accountant.js` (salaries) | `accountant/*` | M | users |
| `accounting/expense` | accountant (rent, operational, outcome) | `accountant/*` | M | — |
| `courses/admin-course` | `routes/courses/adminCourses.js` | `services/main/courses/*` | H | lessons, tests, files |
| `courses/staff-course` | `routes/courses/staffCourses.js` | `staffCoursesServices.js` (1044) | H | progress, attempts, certificates |
| `chat/chat` | `routes/chat/*`, `routes/client/chat/*` | `services/main/chat/*`, `services/socket.js` | H | **from v2 (large)**; socket; dedup repo |
| `telegram/auth` + `telegram/manager` | `routes/client/telegram.js` | `services/telegram/telegram-functions.js` (1149) | H | **from v2**; single GramJS conn; queues |
| `upload/upload` | `routes/client/uploads.js`, `routes/utility/utility.js` | `main/utility/utility.js` (989) FTP helpers, `v2/infra/upload` | M | **from v2**; FTP/local providers |
| `calendar/calendar` | `routes/calendar/{calendar,new-calendar}.js` | `services/main/calendar/*` | M | meetings, reminders |
| `calendar/client-calendar` | `routes/calendar/client-calendar.js` | `calendar/*` | M | availability, slots |
| `calendar/google` | `routes/calendar/google.js` | `services/drive.js`/google | M | googleapis |
| `questions/question` | `routes/questions/questions.js` | `services/main/shared-questions/*` | M | objection categories, versa |
| `notes/note` | `routes/client/notes.js` | `services/main/*` | L | leads/clients scope |
| `reviews/review` | `routes/shared/reviews.js` | `services/reviews.js` | L | leads |
| `dashboard/dashboard` | `routes/shared/dashboard.js` | `dashboardServices.js` (1009) | H | cross-domain reads (read-only) |
| `users/user` | `routes/shared/users.js` | `services/main/*`, `utility.js` | M | permissions, sub-roles |
| `site/site-utility` | `routes/site-utilities/*` | `services/main/site-utilities/*` | M | config |
| `site/contract-utility` | `routes/site-utilities/contract-utilities.js` | `clientContractServices.js` | M | contract defaults |
| `languages/language` | `routes/client/languages.js` | — | L | image-session |
| `reports/report` (logic-frozen pdfkit) | `routes/admin/admin.js`, `routes/staff/staff.js` | `adminServices.js` (2246) lead/staff-report pdfkit | **XL** | §7; admin/staff data |
| `notifications/notification` | (cross-cutting) | `services/notification.js` (1364) | H | mail, telegram, socket |

**Dead/removed:** `routes/calendar/old-call.js` (dead), `routes/tmp/chunks/*` (temp upload artifacts), commented-out
queue call in `client-image-session.js`.

---

## 3. Migration phases / milestones

Each phase has dependencies and acceptance criteria. Phases 0–2 are foundational and **strictly ordered**; phases 3+ are
module-by-module and can partly parallelize once the foundation is in.

### Phase 0 — Monorepo skeleton + `packages/db` + `packages/shared`
- Create root `package.json` workspaces `["packages/*", "server", "ui"]`. Create `packages/db` and `packages/shared`
  package manifests (`@dms/db`, `@dms/shared`).
- Move `server/prisma/schema.prisma` → `packages/db/prisma/schema.prisma` **verbatim**; move existing migrations; move
  the singleton client to `packages/db/prisma.client.js`; add `generated/prisma` to gitignore. Move `server/initData.js`
  into `packages/db/scripts/` and **remove the `postinstall` auto-run** (manual `npm run db:seed`).
- Seed `packages/shared`: `index.js` barrel, `messages-names.js`, `messages-codes/core/general.js`, the
  `constants/access/permissions.constants.js` skeleton, `audit.constants.js`, and migrate `server/v2/shared/brand.js`.
- **Acceptance:** `npm install` at root links workspaces; `npm run db:generate -w packages/db` succeeds against the
  frozen schema; `import { prisma } from "@dms/db"` and `import { PERMISSIONS } from "@dms/shared"` resolve from a
  throwaway script. No behavior change (nothing imports the new client yet).

### Phase 1 — Relocate `server/v2` infra into `server/src` + de-duplicate
- Move `server/v2/{app.js,server.js,config,infra,shared}` → `server/src/...`. Repoint the singleton to
  `@dms/db` via the single `infra/clients/prisma.client.js` re-export.
- **Kill duplicates** (audit §4): delete `infra/prisma.js` (keep `infra/prisma/` → re-export), `infra/mailer.js` (keep
  `infra/mail/mail.js`), `infra/socket.js` (keep `infra/socket/index.js`), `infra/telegram.js` (fold into
  `infra/telegram/client.js`, one GramJS owner).
- Keep the permanent API base at `/v2` (**decision 2026-06-06: there is NO `/api/v1` — everything stays `/v2`**); keep legacy routers mounted at their current prefixes for
  coexistence. Update `server/index.js` to `import "./src/server.js"`.
- **Acceptance:** server boots; existing `/v2/*` endpoints (auth, booking-leads, telegram, chat, files) work identically
  on the permanent `/v2` base; legacy routes still serve; only one prisma/mail/socket/telegram
  implementation remains (grep confirms no duplicate paths imported).

### Phase 2 — v2 remediation (fix the known defects before adding modules)
- **Suffix convention:** rename `auth/auth.repo.js` → `auth.repository.js`, delete `chat/chat.repo.js`, keep
  `chat.repository.js` (resolve the dual-repo by diffing both, merging the live one, deleting the dead one); fix all
  importers.
- **Workers from server:** add `infra/workers/start-workers.js` exporting `startWorkers()`; **fix the broken
  `pdf.worker.js` import** (`services/main/clientServices.js` → the real `image-session` PDF usecase, see §8); register
  `startWorkers()` in `server/src/server.js`. Fold the standalone cron/bootstrap scripts (`reminderScheduler.js`,
  `projectDeliveryTimeReminder.js`, `tele-cron.js`, `start-telegram-system.js`, root `index.js`) into
  `infra/cron/*` + the server bootstrap (§8). Keep `tele.js` as a documented one-off dev script (not part of runtime).
- **Auth foundation:** introduce `requirePermissions` + scope-checker plumbing in `shared/middlewares/auth.middleware.js`
  and the `auth.dto` `mapUserWithPermissions` flattening (§6). Unify on ONE JWT (retire `currentMainTokenName` flag).
  Migrate the already-migrated v2 modules (auth, booking-leads, chat, telegram, upload) onto `requirePermissions`.
- **Cleanup:** remove debug `logToMd` logger reference path, dead code, normalize the `response.js` error helpers to
  include `translationKey` (§5).
- **Acceptance:** single worker process owns all 6 BullMQ workers and the pdf worker runs without crashing; one JWT/cookie;
  the 5 migrated modules gate on permission codes + scope; no duplicate-suffix repo files remain; cron jobs fire from the
  server process.

### Phase 3 — Low-risk leaf modules
`languages`, `notes`, `reviews`, `site`, `questions`, `users`. **Dependencies:** Phase 2. **Acceptance:** each cut over to
the six-file layout, permission+scope gated, Zod-validated, audited on mutations, legacy route group retired, response
envelope matches §5; smoke test passes.

### Phase 4 — Leads & sales (core hub)
`leads/lead`, `leads/sales-stage`, `leads/auto-assignment`, complete `leads/client/booking-lead`. **Dependencies:** Phase 3
(users, notes). This is the central `ClientLead` hub; scope checkers (`checkIfUserCanAccessLead/MutateLead`) are the
keystone for IDOR remediation. **Acceptance:** scope enforced for every lead read/mutate; auto-assign + commissions
preserved; status changes via `/actions/*`.

### Phase 5 — Projects, tasks, delivery, updates
**Dependencies:** Phase 4 (leads). Wire delivery reminders to `infra/cron`. **Acceptance:** task/delivery status only via
`/actions/<kebab>`; reminders fire from server cron; scope enforced.

### Phase 6 — Contracts + Contract PDF (logic-frozen)
`contract/contract`, `contract/client-contract`, `contract/pdf`. **Dependencies:** Phases 4–5, §7 PDF split. **Acceptance:**
generated AR+EN contract PDFs are **byte/visually identical** to legacy output (§7 verification); signing token flow + FTP
upload + post-sign email/telegram preserved.

### Phase 7 — Image sessions + session PDF + pdf queue
`image-session/*`. **Dependencies:** Phase 6 (shared PDF infra). **Acceptance:** session-approval PDF identical; the BullMQ
pdf path works end-to-end (fixed worker), with the inline fallback preserved as behavior; scope enforced.

### Phase 8 — Accounting
`accounting/{invoice,payment,salary,expense}`. **Dependencies:** Phase 4 (leads/clients), Stripe. **Acceptance:** payment
status via `/actions/*`; Stripe flows preserved; financial totals match legacy outputs.

### Phase 9 — Courses / LMS
`courses/{admin-course,staff-course}`. **Dependencies:** upload module, files. **Acceptance:** lessons/tests/attempts/
certificates/progress preserved; file access scope-gated.

### Phase 10 — Calendar + Google
`calendar/{calendar,client-calendar,google}`. **Dependencies:** notifications/cron. **Acceptance:** meetings, availability,
Google sync preserved.

### Phase 11 — Reports PDF (pdfkit, logic-frozen) + Dashboard + Notifications
`reports/report`, `dashboard/dashboard`, `notifications/notification`. **Dependencies:** all data modules. **Acceptance:**
lead-report.pdf / staff-report.pdf identical (§7); dashboard aggregates match; notification fan-out (in-app+mail+telegram)
preserved.

### Phase 12 — Cutover & legacy retirement
Delete retired legacy `routes/*` + `services/*` groups whose
modules are fully migrated, and remove the dual-JWT shim entirely. (No base-path flip — the frontend is already on `/v2`.) **Acceptance:** no legacy router mounted; full smoke runbook
green; rollback tag in place (§11).

---

## 4. The six-file module template

Every module under `server/src/modules/<domain>/<module>/` is the same six files (suffix `.repository.js`):

```
<module>/
  <module>.routes.js        # endpoints + middleware chain ONLY
  <module>.controller.js    # read validated req, coerce primitives, call usecase, respond — single exported instance
  <module>.usecase.js       # ALL business logic + orchestration; throws AppError; calls repos + infra
  <module>.repository.js    # Prisma I/O ONLY; this.model = prisma.<model>; scope `where` builders; $transaction
  <module>.validation.js    # Zod schemas as a class of static fields; messages are CODES, not prose
  <module>.dto.js           # select/shape helpers (placeholder shell allowed, kept for uniformity)
```

Tiny example (note action mutation):

```js
// note.routes.js
noteRouter.post(
  "/:leadId",
  authMiddleware.requirePermissions([PERMISSIONS.LEAD.NOTE_ADD]),
  authMiddleware.requireSpecialChecker(noteController.checkIfUserCanMutateLead),
  validate(NoteValidation.createNoteSchema),
  asyncHandler(noteController.createNote),
);

// note.controller.js  (thin: coerce + delegate + respond)
async createNote(req, res) {
  const result = await noteUsecase.createNote({
    leadId: parseInt(req.params.leadId), content: req.body.content, authUserId: req.auth.id });
  return created(res, result, coreMessagesCodes.CREATED);
}

// note.usecase.js  (rules + guard + audit in one transaction)
async createNote({ leadId, content, authUserId }) {
  await this.assertLeadActive(leadId);            // business guard, throws AppError
  return noteRepo.createNoteWithAudit({ leadId, content, authUserId });
}

// note.repository.js  (Prisma only; state + audit committed atomically)
async createNoteWithAudit({ leadId, content, authUserId }) {
  return prisma.$transaction(async (tx) => {
    const note = await tx.note.create({ data: { clientLeadId: leadId, content, createdById: authUserId } });
    await auditLogRepo.createAuditLog({ tx, actionType: AUDIT_ACTION_TYPES.NOTE_ADDED,
      entityType: AUDIT_ENTITY_TYPES.LEAD, entityId: leadId, createdById: authUserId });
    return note;
  });
}
```

Ordered usecase flow for any state-changing action: **validate → permission → scope → guard → transition-check →
mutate-in-`$transaction` → audit → recompute-derived-status.**

---

## 5. API contract & shared message-codes

### Envelope (normalize the existing one — CONTRACT CHANGE, see §12)
The current `response.js` returns `{ success, message, data }` but **omits `translationKey`** and `details` on success.
Target every response (success and error) to:

```json
{ "success": true, "message": "OK", "data": { }, "translationKey": "<namespace>" }
```

- `message` is **always a CODE** (`"OK"`, `"LEAD_NOT_FOUND"`), never a sentence. Today legacy returns raw Arabic strings
  in `{ message }` (audit §8) — those are replaced with codes.
- `data` is an object or `{ items, total, page, pageSize }` for lists (via `paginate`).
- `translationKey` names the `@dms/shared` namespace the client resolves the code in.
- Add success helpers parity (`ok/created/updated/deleted/noContent`) + error helpers with `dontRedirect: true` baked in
  for in-action errors.

### AppError
Replace today's positional `new AppError("Unauthorized", 401)` with the object form carrying codes:

```js
new AppError({
  message: leadMessagesCodes.LEAD_NOT_FOUND, code: leadMessagesCodes.LEAD_NOT_FOUND,
  statusCode: 404, translationKey: messagesNames.leadMessages, dontRedirect: true,
});
```

`error-handler.js` renders the envelope and special-cases `PrismaClientKnownRequestError` 1062 (duplicate) / 1451 (FK) →
mapped codes, and `MulterError` → bounded upload codes (never leak limits). Validation failures → **422 + `details`**.

### Message-code registry (single language = Arabic)
- Code objects per area in `packages/shared/messages-codes/<area>/*.js` — SCREAMING_SNAKE_CASE, key == value; barrel at
  `messages-codes/index.js`.
- `messages-names.js` maps each namespace to itself.
- **Resolution is single-language:** the client lookup leaf is a plain Arabic string,
  `messages[translationKey][code] -> "لم يتم العثور على العميل"`, **not** an `{ ar, en }` object. The indirection (codes +
  namespace + central resolution) is kept; the second language is dropped. Leaf can later widen to a per-language object
  without backend change.

---

## 6. Permissions & auth redesign

Authorization = **authentication + permission code + object scope + status/workflow guard.** Never role-only; never
wildcard. `User.role` becomes descriptive only.

### Unify the two JWT systems → one
Today: legacy `utility.js` `generateToken` (`SECRET_KEY`, 4h, cookie `token`) **and** v2 `JwtService` (access/refresh,
cookie via `currentMainTokenName` flag) run together (audit §6). Target:
- One `infra/security/jwt.js` `JwtService` with one access secret (+ optional refresh), one cookie name constant in
  `@dms/shared/auth.js`. Retire `SECRET_KEY` 4h path and the `currentMainTokenName` feature flag.
- Transitional shim during cutover: `requireAuth` accepts both cookie names for one release, then drops the legacy one in
  Phase 12. Document the cutover window.

### `requirePermissions` (route guard)
Replace `AuthMiddleware.requireRole` (role-string only, audit §6) with:
```js
requirePermissions(required = [], anyOf = []) { /* require.every | anyOf.some over req.auth.permissions; else 403 AppError */ }
```
`requireAuth` (mounted once per router) verifies JWT, loads user (Redis-cached via `cache.service`), checks `isActive`/
session validity, and attaches `req.auth` with **flattened `permissions[]` + `permissionsByModule{}`** produced by
`auth.dto` `mapUserWithPermissions` (effective = direct permissions ∪ role-profile permissions from
`role-permission-profiles.js`). `isSuperSales` and `UserSubRole` privileges fold into permission profiles, removing the
ad-hoc escalation paths (audit §6.6).

### Object-scope checkers (the IDOR fix)
Controller methods `checkIfUserCanAccessX` (read) / `checkIfUserCanMutateX` (write), wired via
`authMiddleware.requireSpecialChecker(fn)` **after** `requirePermissions`. The usecase builds a scoped `where`, loads the
row, and **throws** `AppError` (403) when not visible. **Critical gotcha:** checkers MUST throw on denial — returning
`false`/`undefined` lets the request through. Priority targets (highest IDOR risk): `ClientLead`, `Contract`, `Project`,
`ChatRoom`, `ClientImageSession`, `Payment/Invoice`, course `LessonAccess`, `Note`.

### Capabilities + workflow guards
Derived FE-facing booleans (e.g. `canSignContract`, `canApproveSession`) layered on top of permission codes via
`@dms/shared/helpers.js`. Status changes only through `/actions/<kebab>` validated against transition maps in
`@dms/shared/constants/workflow/*.transitions.js` — never a generic PATCH on a status field.

---

## 7. PDF logic-frozen split plan

**Mandate:** split/relocate only. Identical logic, identical output. Two subsystems.

### 7A. Contract & Image-Session PDFs (`pdf-lib` + `fontkit`) — the important one
Target layout (logic copied verbatim, only import paths adjusted):
```
server/src/infra/pdf/
  fonts/                                  # MOVE server/services/fonts/* here (Amiri-Regular, Ya-ModernPro-Bold, CairoPlay-*)
  fonts.loader.js                         # the font byte loaders + arabic text helpers from services/utilityServices.js
                                          #   (fontBase64, enfontBase64, getRTLTextX, reText, splitTextIntoLines, isArabicText,
                                          #    formatAED, formatNumber, formatDate, reverseString, fetchImageBuffer)
modules/contract/pdf/
  contract-pdf.usecase.js                 # generateContractPdf + buildAndUploadContractPdf (from generateContractPdf.js, 2332 ln) — VERBATIM
  contract-pdf.context.js                 # createPdfContext + widthOf/drawFullBackgroundImage/line-writers (split out, unchanged logic)
  contract-pdf.data.js                    # wittenBlocksData.js (780) + generateDefaultContractData.js (121) — static data, verbatim
  contract-pdf.email.js                   # pdf-utilities.js sendSuccessEmailAfterContractSigned (263) — verbatim
modules/image-session/pdf/
  image-session-pdf.usecase.js            # uploadPdfAndApproveSession (from client/clientServices.js l.67) — split out VERBATIM
```
FTP upload stays via `infra/upload` (`uploadToFTPHttpAsBuffer` from `main/utility/utility.js` → `infra/upload/ftp.provider.js`).

**Fragile `__dirname`-relative font loading — explicit handling.** `services/utilityServices.js` loads fonts at module
load via `path.join(__dirname, "./fonts/...")`; under ESM `__dirname` is derived from `import.meta.url`. Because we MOVE
the fonts next to the loader (`infra/pdf/fonts/`), the **relative path string stays `./fonts/...` and continues to
resolve** — i.e. we move loader + fonts together so the relative anchor is preserved. The loader will compute
`__dirname` from `fileURLToPath(import.meta.url)` (already required under ESM) and read from the co-located `fonts/`. We do
**not** switch to absolute project-root paths or bundler asset handling (would change behavior/risk). Acceptance includes
a startup assertion that all active font files exist and are non-empty.

**Verification (byte/visual diff):** before the move, capture a corpus of generated PDFs — one signed contract (AR and EN)
and one approved image session — as golden files. After the move, regenerate from identical inputs and diff: (1) byte-diff;
(2) if byte-diff differs only by PDF object ordering/timestamps, fall back to rendered-page image diff (rasterize pages,
pixel-compare). Sign-off requires zero visual diff. Run this gate in Phase 6 and Phase 7.

### 7B. Lead / Staff Report PDFs (`pdfkit`)
Split the two report builders out of `adminServices.js` (2246 ln) without changing logic:
```
server/src/modules/reports/report/
  report.usecase.js          # orchestration
  lead-report.pdf.js         # buildLeadReport (from adminServices.js l.533) — VERBATIM pdfkit stream
  staff-report.pdf.js        # buildStaffReport (from adminServices.js l.1080) — VERBATIM pdfkit stream
```
Streamed as `attachment` downloads exactly as today. Same byte/visual diff gate against golden report PDFs (Phase 11).

Both subsystems are marked **"split-without-changing"**: no refactor of the rendering math, no font substitution, no
reflow — only file relocation and import-path edits, gated by the diff verification.

---

## 8. Workers / queues / cron consolidation

**Model:** the **server process owns the workers** (no detached worker process). Telegram's single-GramJS-connection
constraint is respected by initializing one client in `infra/telegram/client.js` during bootstrap, before workers start.

### Target layout
```
server/src/infra/
  queues/{index.js, pdf.queue.js, telegram-message.queue.js, telegram-cron.queue.js,
          telegram-channel.queue.js, telegram-add-user.queue.js, telegram-upload.queue.js}
  workers/{index.js, start-workers.js, pdf.worker.js, telegram-message.worker.js,
           telegram-cron.worker.js, telegram-channel.worker.js, telegram-add-user.worker.js, telegram-upload.worker.js}
  cron/{index.js, reminders.cron.js, project-delivery.cron.js, telegram.cron.js}
```

### Fix list (from audit §5)
1. **Fix the broken pdf worker import.** `v2/infra/workers/pdf.worker.js` imports `../../../services/main/clientServices.js`
   (missing `/client/`). Repoint to the new `modules/image-session/pdf/image-session-pdf.usecase.js`.
2. **Single source for queues/workers.** Delete the `services/queues/*` and `services/workers/*` re-export shims; everything
   imports from `infra/queues|workers`. (Audit confirms `services/*` are already 2-line re-exports.)
3. **`startWorkers()` in server bootstrap.** `infra/workers/start-workers.js` imports all six workers and the pdf worker;
   `server/src/server.js` calls `startWorkers()` after Redis + Telegram connect. Remove the detached
   `start-telegram-system.js`.
4. **Fold the standalone cron/bootstrap files into one server bootstrap:**
   - `server/reminderScheduler.js` (meeting reminders, node-cron/min) → `infra/cron/reminders.cron.js`.
   - `server/projectDeliveryTimeReminder.js` (telegram delivery reminders, 2h) → `infra/cron/project-delivery.cron.js`.
   - `server/tele-cron.js` (enqueue finalized-lead jobs, 10min) → `infra/cron/telegram.cron.js`.
   - root `server/index.js` → just `import "./src/server.js"`.
   - `server/tele.js` (one-off StringSession generator, interactive) → keep as `packages/db/scripts/` or a dev tool;
     **not** part of runtime.
   `server.js` calls `startCron()` once. Guard with an env flag (`RUN_WORKERS`, `RUN_CRON`) so multi-instance deploys can
   designate one worker/cron owner.
5. **Image-session PDF path.** Currently inline-in-request (queue call commented out). Preserve the inline behavior as the
   default; once the fixed pdf worker runs, the queued path becomes available behind the existing (uncommented) enqueue —
   but flip it only with explicit sign-off so observable timing/behavior is a deliberate choice, not an accident.

---

## 9. Security hardening (from audit §8)

| Issue | Action | Phase |
|---|---|---|
| **IDOR / no object scope** across ~393 endpoints (biggest risk) | object-scope checkers that **throw**, per priority list §6 | 2 (plumbing) → per module |
| **Two auth stacks + two JWT secrets**, error-swallowing legacy verify | unify to one JWT; remove `SECRET_KEY` 4h path + `currentMainTokenName` flag | 2 → 12 |
| **Inconsistent validation** (legacy trusts bodies) | Zod on every mutating route; 422 + `details` | per module |
| **Raw user-facing strings** (Arabic literals in errors/notifications) | replace with message codes (§5) | per module |
| **Broken pdf worker import** | fix path (§8) | 2 |
| **Font path fragility** at module load | move loader + fonts together; startup font-existence assertion (§7) | 6 |
| **`postinstall` runs migrate deploy + initData** automatically | remove from `postinstall`; make explicit `npm run db:*` | 0 |
| **Oversized files** (12 files 989–2332 ln mixing routing/logic/Prisma) | split per layering; PDF/report files split-without-changing | per module / §7 |
| **Weak/undefined env defaults** (e.g. `MAX_FILE_SIZE`) + secret fallbacks | central `config/env.js` validates required env at boot; bound upload size | 1 |
| **Dead/transitional code** (`old-call.js`, `logToMd`, commented queue, dual repo files, tmp chunks) | delete during remediation | 2 |
| **Data exposure** (raw FTP/S3 keys, internal fields) | dto `select` shaping; never return raw storage keys/ciphertext | per module |
| **No encryption-at-rest model** in schema | out of scope (schema frozen); flag as follow-up if sensitive text is added later | — |

> Encryption-at-rest is noted but **not** introduced here because the schema is frozen and no `EncryptionMetadata` model
> exists. If sensitive fields are later identified, it becomes a separate additive-schema workstream.

---

## 10. Testing strategy

The reference has **no runner** (audit of 02 §6); we keep its *focus* but **add a real runner (vitest)** at the root with a
`test` script per workspace.

- **Usecases (primary target):** business rules, the ordered workflow flow, transition guards. Mock repos or use a test DB.
- **Authorization & scope:** unit-test each `checkIfUserCanAccessX/MutateX` — explicitly assert it **throws** on denial
  (the "throw, don't return false" gotcha) and that `requirePermissions` 403s without the code.
- **Validation:** Zod schemas return 422 + `details` on bad input; coercion happens in controller only.
- **Audit side-effects:** assert the `AuditLog` row is written **in the same transaction** as the state change.
- **Envelope:** assert `{ success, message(code), data, translationKey }` shape and that no raw Arabic prose leaks from the
  backend.
- **PDF:** the byte/visual golden-file diff gate (§7) is the acceptance test for the logic-frozen workstreams.
- **End-to-end smoke runbook** per phase (login → list → detail → action → audit row → reminder fires), mirroring the
  reference's manual smoke approach, automated where cheap.

---

## 11. Risks, rollback, and cutover

- **Strangler coexistence:** legacy + new run in one process throughout; mounting a new module router and retiring its
  legacy route group is the unit of cutover. Each is independently revertable (re-mount the legacy router, unmount the new
  one — one line in `routes.js`).
- **Per-module flip:** keep the legacy route alias live until the new module passes its smoke runbook; then remove the
  alias. The frontend is already on `/v2`, so there is no base-path flip; cutover only removes legacy routers + aliases.
- **PDF risk (highest):** any diff in golden-file comparison **blocks** the contract/image-session/report phases. Rollback =
  keep calling the legacy generator (it remains in `services/` until §12).
- **Auth risk:** dual-cookie transitional shim avoids logging everyone out; the legacy cookie is removed only after the new
  one is proven (Phase 12). Misconfigured permission profiles could lock users out — seed/verify profiles in Phase 2 and
  test against real role coverage.
- **Workers/cron:** colocating workers in the API process risks one GramJS connection contention and double-firing cron on
  multi-instance deploys — gated by `RUN_WORKERS`/`RUN_CRON` env flags so exactly one instance owns them.
- **Schema freeze:** no migration risk by design; the only DB change is relocating the schema file and the migrate command
  owner.
- **Rollback tag:** tag the repo at the start of each phase; revert is `git checkout <tag>` of `server/` + re-point
  `server/index.js`. Database is untouched, so rollback is code-only.
- **Cutover gate (Phase 12):** full smoke runbook green, no legacy router mounted, single JWT, all `/v2` paths
  reconciled with the frontend contract index (§12).

---

## 12. API contract index (FRONTEND must rely on this)

This is the authoritative module → endpoint list the frontend plan reconciles against. **All paths target `/v2`** — the
permanent API base (there is **no `/api/v1`**; legacy prefixes aliased only during transition). Method + path + purpose.
Workflow status changes are `POST .../:id/actions/<kebab>`, never PATCH-on-status.

> **CONTRACT CHANGES the frontend MUST mirror** (everything else is strict preservation of observable results):
> 1. **Base path** `/v2/<plural-kebab>` — the permanent base (was scattered `/shared /staff /admin /accountant /client`); there is no `/api/v1`.
> 2. **Envelope** always includes `translationKey`; `message` is always a **CODE** (was raw Arabic strings on legacy) — applies to success responses too, not just errors.
> 3. **Errors** use the `AppError` envelope (`code` + `translationKey` + `dontRedirect`); the client resolves codes via a
>    **single-language (Arabic)** lookup map, not an ar/en object, and not server-sent prose.
> 4. **Status changes** move to `POST /:id/actions/<kebab>` (any legacy `PATCH { status }` is replaced).
> 5. **Auth cookie** unified to one name (`@dms/shared/auth.js`); dual-cookie only during the transition window.
> 6. **Validation** failures return **422 + `details`** uniformly.
> 7. **Pagination** — list endpoints return `data: { items, total, page, pageSize }` (normalized; legacy list shapes varied). *(Approved 2026-06-06.)*
> 8. **Capabilities** — every scoped list/detail response attaches a per-record `capabilities.{...}` object of FE-facing booleans, computed in the dto via `@dms/shared/helpers.js`. *(Approved 2026-06-06.)*

| Module | Method | Path (`/v2` + ) | Purpose |
|---|---|---|---|
| auth | POST | `/auth/login` | login, sets cookie |
| auth | POST | `/auth/logout` | clear session |
| auth | GET | `/auth/me` | current user + flattened permissions |
| auth | POST | `/auth/request-reset` / `/auth/reset-password` | password reset |
| leads/booking-lead | POST | `/client/booking-leads` | public booking lead create |
| leads/booking-lead | GET | `/client/booking-leads/:leadId` | booking lead detail |
| leads/booking-lead | PATCH | `/client/booking-leads/:leadId` | update draft booking lead |
| leads/booking-lead | POST | `/client/booking-leads/:leadId/actions/submit` | submit booking lead *(was `PUT /:leadId/submit` — converted to the actions convention, decision 2026-06-06)* |
| leads/lead | GET | `/leads` | list (paginated, scoped) |
| leads/lead | GET | `/leads/:id` | detail (scope-checked) |
| leads/lead | POST | `/leads` · PUT `/leads/:id` | create / update |
| leads/lead | POST | `/leads/:id/actions/<kebab>` | status/stage transitions, convert, assign |
| leads/sales-stage | GET/POST | `/sales-stages` ... | sales-stage CRUD |
| leads/auto-assignment | GET/POST | `/auto-assignments` | auto-assign rules |
| contract/contract | GET | `/contracts` · `/contracts/:id` | list / detail (scoped) |
| contract/contract | POST/PUT | `/contracts` · `/contracts/:id` | create / update |
| contract/contract | POST | `/contracts/:id/actions/<kebab>` | stage/payment transitions |
| contract/contract | POST | `/contracts/:id/pdf-session-token` | generate PDF session token |
| contract/client-contract | POST | `/client-contracts/:id/actions/sign` | client sign → builds AR+EN PDFs, returns URLs |
| image-session/admin | GET/POST/PUT | `/image-sessions` ... | session + spaces/materials/styles CRUD |
| image-session/client | GET | `/client-image-sessions/:id` | client session view (scoped) |
| image-session/client | POST | `/client-image-sessions/:id/actions/approve` | approve → PDF + queue, returns URL |
| projects/project | GET/POST/PUT | `/projects` ... | project CRUD (scoped) |
| projects/task | GET/POST | `/tasks` · POST `/tasks/:id/actions/<kebab>` | tasks + status actions |
| projects/delivery | GET/POST | `/deliveries` · `/deliveries/:id/actions/<kebab>` | delivery schedule + actions |
| projects/update | GET/POST | `/updates` | project/lead updates |
| accounting/invoice | GET/POST | `/invoices` | invoices (scoped) |
| accounting/payment | GET/POST | `/payments` · POST `/payments/:id/actions/<kebab>` | payments + status actions (Stripe) |
| accounting/salary | GET/POST | `/salaries` | salaries |
| accounting/expense | GET/POST | `/expenses`, `/rents`, `/outcomes` | operational expenses, rent, outcome |
| courses/admin-course | GET/POST/PUT | `/courses` + `/lessons` + `/tests` ... | LMS admin CRUD |
| courses/staff-course | GET/POST | `/staff-courses` + `/attempts` + `/progress` | staff LMS, attempts, certificates |
| chat | GET/POST | `/chat/rooms`, `/chat/rooms/:id/members`, `/chat/rooms/:id/messages`, `/chat/files` | chat REST (+ Socket.IO realtime) |
| telegram | GET | `/telegram/current` | current telegram auth state (auth + ADMIN) |
| telegram | POST | `/telegram/auth/init` · `/telegram/auth/verify-code` · `/telegram/auth/verify-password` | telegram userbot login flow (auth + ADMIN) |
| upload | POST | `/files/single` · `/files/chunks` | authed file upload (single + chunked) |
| upload | POST | `/files/client/single` · `/files/client/chunks` | public/client file upload (single + chunked) |
| calendar | GET/POST | `/calendar`, `/client-calendar`, `/calendar/google` | meetings, availability, Google sync |
| questions | GET/POST | `/questions` | question bank / objection / versa |
| notes | GET/POST | `/notes/:leadId` | lead/client notes (scoped) |
| reviews | GET/POST | `/reviews` | reviews |
| dashboard | GET | `/dashboard` | role-scoped aggregates (read-only) |
| users | GET/POST/PUT | `/users` | user mgmt, sub-roles → permission profiles |
| site | GET/PUT | `/site-utilities`, `/contract-utilities` | site config, contract defaults |
| languages | GET | `/languages` | image-session languages |
| reports | GET | `/reports/lead-report`, `/reports/staff-report` | streamed pdfkit attachment downloads |
| notifications | GET/POST | `/notifications` | in-app notifications (fan-out to mail+telegram) |

> Exact sub-paths/query params per module are finalized when each module is migrated; the **shapes and contract changes
> above are fixed** and are what the frontend reconciliation reviewer checks. Endpoint-level granularity within a module
> preserves the legacy request/response data shape unless flagged as a CONTRACT CHANGE here.

### Dashboard module — contract deltas

Per-endpoint deltas from the dashboard migration (security review). These are scoping/behavior
changes the frontend must mirror; **metric payload shapes are unchanged** in every case.

- **Non-admin scoping tightening** on `monthly-performance`, `emirates-analytics`,
  `leads-monthly-overview`, `week-performance`, `designer-metrics`: legacy returned GLOBAL
  totals to a non-admin who omitted `?staffId`; v2 forces the non-admin's own id (self-view).
  Admin-tier (ADMIN / SUPER_ADMIN / isSuperSales) still honors a client `?staffId` or omits
  it for the global aggregate (preserved 1:1). (`week-performance`'s `newLeads` count remains
  a global aggregate — frozen legacy math.)
- **`recent-activities`**: admin-tier now honors only `?staffId` (legacy also honored
  `?userId`); non-admins are self-scoped to their own `userId`. Defense-in-depth: a non-admin
  whose resolved self-scope id is not a finite number is REJECTED (403 `ACCESS_DENIED`) rather
  than silently falling back to the global feed.
- **`latest-leads`**: unchanged — global newest-5 NEW leads to all authed roles (preserved
  legacy behavior).

---

*End of backend migration plan.*
