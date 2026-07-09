# Services Elimination Plan — delete `server/services/` entirely

> Date: 2026-07-09 · Branch: `frontend-redesign` · Status: PLAN (no code changed)
> Author: shared-backend (planning agent). Another agent will execute strictly from this doc.
>
> **Directive (user):** "services and routes used to sit outside `src`; we moved everything into `src`
> as infra + modules. Anything still using `services` must be moved and wired the way we write code NOW.
> Then delete `services`." Goal: **`server/services/` no longer exists.**

---

## 1. Summary

`server/services/` holds **80 git-tracked files** (70 code + 10 font assets). After auditing every file
and every importer, they fall into four dispositions:

| Disposition | Files | Where |
|---|---:|---|
| **→ `src/infra/`** (relocate) | **21** | singletons, integrations, socket pub/sub, mail, telegram, the frozen PDF-font loader + 10 font assets |
| **→ `src/modules/**`** (co-locate into owner module) | **38** | business logic (29 Phase-2) + frozen PDF/contract/upload (9 Phase-3) |
| **DELETE — dead shim** | **16** | re-export shims already superseded by canonical `src/infra/*`, + one dead subsystem (`drive.js`) |
| **DELETE — reimplemented** | **5** | business services a module already ported VERBATIM (courses, questions, site-utility, auth) |
| **Total** | **80** | |

**Key architectural fact discovered:** the migration already wraps every live `services/main/**` file
through the modules via **lazy `await import("…/services/…").then(m => m.fn())` adapters** (not static
top-level imports as the brief assumed — that pattern is confined to `src/infra`). So "eliminate services"
means: (a) delete the many `services/*` files that are already dead shims or already reimplemented, then
(b) **relocate the remaining live implementations into their owner module / infra and repoint the lazy
adapters + the ~12 static infra importers**, then (c) delete the now-empty `services/` tree.

**Two migration depths are possible — this needs a user decision (see Open Question #1).** This plan is
written for the **behavior-preserving default (Depth A): co-locate each surviving implementation verbatim
into a `legacy/` subfolder of its owner module (or into `src/infra`), repoint importers, delete
`services/`.** This deletes `services/` with zero behavior change and keeps the frozen/parity guarantees.
Full strict-layer decomposition (route→controller→usecase→repository, Prisma only in repos) of 38
frozen/parity-critical files is a **separate, higher-risk follow-up** — do NOT fold it into this move.

Verification per phase: `npm test` (vitest, currently green at ~699) + `npm run build:server` (prisma
generate) + a guarded server boot smoke + a **PDF byte-diff harness** for the frozen tier.

---

## 1b. Decisions LOCKED by user (2026-07-09)

1. **Depth A.** Co-locate each surviving live implementation verbatim into a `legacy/` subfolder of its
   owner module (or into `src/infra`), repoint importers, delete `services/`. **Zero behavior change.**
   Full strict-layer decomposition (route→controller→usecase→repository) is a **separate later effort a
   different agent will do** — do NOT attempt it here.
2. **Delete-unused is a global mandate.** For EVERY file (not only the 21 pre-flagged), the executor must
   verify real live importers (an actual `import(...)`/`import ... from`, not a comment). **If a file has
   zero live importers → DELETE it, do not move it.** This may push more files from RELOCATE→DELETE than
   the table below predicts; that is expected and correct. Re-grep at execution time; the table is a
   starting estimate.
3. **Shared cluster:** single `src/shared/legacy/` keeping the barrel (lowest churn) — but drop any
   `shared/*` member that turns out to have zero live importers (per #2).
4. Secondary defaults accepted: `constants.js`/`enums.js` → `src/infra/config/`; `legacy/` subfolder
   naming OK; `drive.js` confirmed dead → delete.

---

## 2. Conventions to match (verified in-repo)

- **Owner-module co-location:** put a relocated implementation at
  `server/src/modules/<module>/legacy/<kebab-name>.js`. Rationale: these files carry Prisma + business
  logic + side-effects intermixed; they cannot become a clean `.repository.js` without a rewrite that
  risks parity. `legacy/` marks them as "frozen import target, decompose later". (If the user picks
  Depth B / full decomposition, replace `legacy/<x>.js` with proper `.repository.js` + `.usecase.js`.)
- **Cross-module shared cluster:** `services/main/shared/*` + `shared/index.js` barrel is imported by 7
  modules (leads, projects×?, task, update, delivery, generic-delete) and resists single ownership. See
  Open Question #2 for the two placement options; this plan's default is a single
  `server/src/shared/legacy/` cluster that keeps the barrel intact (lowest churn).
- **Infra:** mirror the existing `src/infra/<area>/` shape — `src/infra/mail`, `src/infra/redis`,
  `src/infra/socket`, `src/infra/queues`, `src/infra/workers`, `src/infra/cron`, `src/infra/config`
  (already has `env.js`), plus new `src/infra/telegram/`, `src/infra/notifications/`, `src/infra/pdf/`.
- **Prisma client:** all these files already import `../../prisma/prisma.js` (the re-export shim of
  `@dms/db`). On move, repoint to the correct relative `src/infra/prisma/prisma.js` (or import `@dms/db`
  directly). **Do not introduce a new PrismaClient.**
- **Suffix:** repos are `.repository.js`. Relocated verbatim files keep descriptive kebab names under
  `legacy/` (they are not repos yet).
- **ESM, JS only.** No `.ts`.

---

## 3. Full file-by-file mapping

Legend — **DEST**: `INFRA` / `MODULE` / `DELETE`. **PH**: phase. **F**: 🔒 frozen (byte/behavior-diff gate).

### 3a. Infrastructure — dead shims & dead subsystem → DELETE (Phase 1)

| Source (`server/services/…`) | DEST | PH | Notes |
|---|---|---|---|
| `redis/redis.js` | DELETE | 1 | Self-labeled DEPRECATED shim; canonical `src/infra/redis/ioredis.connection.js`. 0 importers. |
| `redis/bullmqConnection.js` | DELETE | 1 | DEPRECATED shim → `src/infra/redis/bullmq.connection.js`. 0 live importers. |
| `queues/pdfQueue.js` | DELETE | 1 | 2-line re-export of `src/infra/queues/pdf.queue.js`. |
| `queues/telegram-cron-queue.js` | DELETE | 1 | shim → `src/infra/queues/telegram-cron.queue.js`. |
| `queues/telegram-message-queue.js` | DELETE | 1 | shim → `src/infra/queues/telegram-message.queue.js`. |
| `queues/telegramAddUserQueue.js` | DELETE | 1 | shim → `src/infra/queues/telegram-add-user.queue.js`. |
| `queues/telegramChannelQueue.js` | DELETE | 1 | shim → `src/infra/queues/telegram-channel.queue.js`. |
| `queues/telegramUploadQueue.js` | DELETE | 1 | shim → `src/infra/queues/telegram-upload.queue.js`. |
| `workers/pdfWorker.js` | DELETE | 1 | shim → `src/infra/workers/pdf.worker.js`. |
| `workers/telegramAddUserWorker.js` | DELETE | 1 | shim → `src/infra/workers/telegram-add-user.worker.js`. |
| `workers/telegramChannelWorker.js` | DELETE | 1 | shim → `src/infra/workers/telegram-channel.worker.js`. |
| `workers/telegramCronWorker.js` | DELETE | 1 | shim → `src/infra/workers/telegram-cron.worker.js`. |
| `workers/telegramMessageWorker.js` | DELETE | 1 | shim → `src/infra/workers/telegram-message.worker.js`. |
| `workers/telegramUploadWorker.js` | DELETE | 1 | shim → `src/infra/workers/telegram-upload.worker.js`. |
| `socket.js` | DELETE | 1 | shim re-exporting `src/infra/socket/index.js` (`getIo/initSocket/normalizeOrigin`). The dead `_legacy*` body is reference-only. Consumers that `getIo()` from here (the `services/main/chat/*`, `services/main/utility/*` files) get repointed to `src/infra/socket/index.js` when THEY move in Phase 2. |
| `drive.js` | DELETE | 1 | Google-Drive subsystem — **0 importers**; per locked decision #8 it is dead/schema-only. Delete. |

**Phase-1 delete pre-check (executor MUST run):** for each shim confirm the only referrers are (i) other
files being deleted, or (ii) the canonical `src/infra` file it re-exports. Grep:
`grep -rn "services/redis/redis\|services/redis/bullmqConnection\|services/queues/\|services/workers/\|services/socket\.js\|services/drive" server --include=*.js`.

### 3b. Infrastructure — live implementations → RELOCATE to `src/infra/` (Phase 1)

| Source | → Destination | PH | Notes |
|---|---|---|---|
| `redis/socketPublisher.js` | `src/infra/socket/socket.publisher.js` | 1 | **Already staged untracked** (`git status` shows `src/infra/socket/socket.publisher.js`). Finalize it, delete the `services/` original, repoint `telegram-functions.js` (moving in same phase). |
| `redis/socketSubscriber.js` | `src/infra/socket/socket.subscriber.js` | 1 | **Already staged untracked.** Repoint `src/server.js` import (`../services/redis/socketSubscriber.js` → `./infra/socket/socket.subscriber.js`). |
| `sendMail.js` | `src/infra/mail/send-mail.js` | 1 | 🔒 behavior — client-facing from-name/address must stay byte-identical (booking/public-lead rely on it). Do **not** merge into the existing `src/infra/mail/mail.js` (different transport config). Repoint `constants.js` import to its new home. |
| `constants.js` | `src/infra/config/brand.constants.js` | 1 | `engName/companyName/…`. 0 `src` importers; consumed internally by `sendMail`, `notification`, `telegram-functions`. Alt: `@dms/shared` (see OQ #3). |
| `enums.js` | `src/infra/config/legacy-enums.js` | 1 | `ClientLeadStatus` label map. 0 `src` importers. Alt: `@dms/shared/constants` (OQ #3). |
| `links.js` | `src/infra/config/links.js` | 1 | dashboard/deal deep-link builders from env. Consumed by `notification` + `telegram-functions`. |
| `notification.js` (1355 lines) | `src/infra/notifications/legacy-notification.js` | 1 | Cross-cutting dispatcher (DB write + email + socket). Live importers: admin-leads, client-portal/payments, staff-course, public-lead usecases. Sits beside the newer clean `src/shared/notifications/*` (do not conflate). Imports `links.js`, email templates, socket publisher, prisma — repoint all. |
| `telegram/telegram-functions.js` (1149 lines) | `src/infra/telegram/telegram-functions.js` | 1 | Telegram integration engine. Consumers = `src/infra/cron/project-delivery.cron.js` + 5 `src/infra/workers/telegram-*.worker.js`. Internal imports to repoint: `connectToTelegram`, `../redis/socketPublisher`→`../socket/socket.publisher`, `../links`, `../sendMail`, 4 `../queues/*`→`../queues/*.queue`, `../../prisma/prisma`. |
| `telegram/connectToTelegram.js` | `src/infra/telegram/connect-to-telegram.js` | 1 | Imported by `telegram-functions` (`getTeleClient`). Already imports `src/modules/telegram/manager/telegram.manager.js` (cross-ref kept). Fix its `../../.env` `__dirname` path resolution after the move. |
| `main/email/emailTemplates.js` | `src/infra/mail/email-templates.js` | 1 | HTML email templates. Consumers: `src/infra/cron/reminders.cron.js` + `services/main/client/{calendar,clientServices}.js` (repoint those when they move in Phase 2/3). Templates = infra/mail concern. |

### 3c. Infrastructure — frozen PDF font loader + assets → `src/infra/pdf/` (Phase 3)

| Source | → Destination | PH | Notes |
|---|---|---|---|
| `utilityServices.js` (top-level, 194 lines) | `src/infra/pdf/pdf-fonts.js` | 3 | 🔒🔒 **Fragile `__dirname`-relative font loading.** Reads `./fonts/*.ttf/.otf` via `path.join(__dirname, "./fonts/…")` and exports `fontBase64/fontBoldBase64/enfontBase64/enfontBoldBase64` consumed by the contract PDF + client image-approve. Also holds arabic-reshaper/sharp utilities. **Move the `fonts/` folder alongside it and keep the `./fonts/` relative path** so `__dirname` still resolves. Importers to repoint: `main/contract/generateContractPdf.js`, `main/contract/wittenBlocksData.js`, `main/client/clientServices.js` (all Phase 3). |
| `fonts/Amiri-Bold.ttf` | `src/infra/pdf/fonts/Amiri-Bold.ttf` | 3 | 🔒 move as binary; verify byte-identical (`git mv`). |
| `fonts/Amiri-Regular.ttf` | `src/infra/pdf/fonts/…` | 3 | 🔒 |
| `fonts/AmiriQuran.ttf` | `src/infra/pdf/fonts/…` | 3 | 🔒 |
| `fonts/CairoPlay-Bold.ttf` | `src/infra/pdf/fonts/…` | 3 | 🔒 (active EN font). |
| `fonts/CairoPlay-Regular.ttf` | `src/infra/pdf/fonts/…` | 3 | 🔒 (active EN font). |
| `fonts/NotoSansArabic-Bold.ttf` | `src/infra/pdf/fonts/…` | 3 | 🔒 |
| `fonts/NotoSansArabic-Regular.ttf` | `src/infra/pdf/fonts/…` | 3 | 🔒 |
| `fonts/Ya-ModernPro-Bold.otf` | `src/infra/pdf/fonts/…` | 3 | 🔒 (active AR-bold font). |
| `fonts/harir-bold.otf` | `src/infra/pdf/fonts/…` | 3 | 🔒 (commented-out but keep). |
| `fonts/harir.otf` | `src/infra/pdf/fonts/…` | 3 | 🔒 |

> If, after the move, the PDF byte-diff (§6) does not match: **KEEP-IN-PLACE-AND-REPORT** the font loader
> + fonts + contract files, and stop. Do not "fix" font output.

### 3d. Business logic → co-locate into owner MODULE (Phase 2)

Default destination form: `server/src/modules/<module>/legacy/<name>.js`. "Consumers" = the module
usecases whose lazy adapters must be repointed.

| Source (`services/main/…`) | → Owner module | PH | Consumers / notes |
|---|---|---|---|
| `accountant/accountantServices.js` | `accounting/legacy/accountant-services.js` | 2 | payment/expense/note/rent/report/salary usecases (6). |
| `admin/adminServices.js` (god-file, 43 fns) | `admin-residual/legacy/admin-services.js` | 2 | **Cross-module**: also imported by users, image-sessions, leads, accounting/salary usecases. Contains **pdfkit lead/staff reports** — but they use built-in Helvetica (no `__dirname` fonts), so relocation is low-risk; still **byte-diff the report PDFs** (§6). Keep whole-file; do not split now. |
| `calendar/calendarServices.js` | `calendar/legacy/calendar-services.js` | 2 | client-calendar + availability usecases. |
| `calendar/googleCalendar.js` | `calendar/legacy/google-calendar.js` | 2 | google usecase + internal. |
| `client/calendar.js` | `calendar/legacy/client-calendar-service.js` | 2 | client-calendar usecase. |
| `chat/chatMessageServices.js` | `chat/legacy/chat-message-services.js` | 2 | **Cross-layer**: imported by `src/infra/socket/handlers/{message,typing}.handler.js` + chat. Repoint those two infra handlers. |
| `chat/chatRoomServices.js` | `chat/legacy/chat-room-services.js` | 2 | internal chat coupling. |
| `chat/chatMemberServices.js` | `chat/legacy/chat-member-services.js` | 2 | internal. |
| `chat/chatFileServices.js` | `chat/legacy/chat-file-services.js` | 2 | internal. |
| `chat/utils.js` | `chat/legacy/utils.js` | 2 | internal. |
| `client/leads.js` | `leads/legacy/client-leads-service.js` | 2 | public-lead + admin-leads usecases. |
| `client/payments.js` | `client-portal/payments/legacy/client-payments-service.js` | 2 | client-portal/payments usecase (`first`/`asKV`). |
| `image-session/imageSessionSevices.js` | `image-sessions/legacy/image-session-services.js` | 2 | session/admin/client usecases (3). Heavy image processing (sharp) — behavior-sensitive; smoke-test upload flow. |
| `image-session/clientImageServices.js` | `image-sessions/legacy/client-image-services.js` | 2 | client-image-session usecase. |
| `staff/staffServices.js` | `leads/legacy/staff-services.js` | 2 | **Cross-module**: lead.usecase + admin-residual/staff usecase (call/meeting reminders, price offers). |
| `utility/utility.js` | `utilities/legacy/utility.js` | 2 | **Cross-module**: utilities usecase + notifications + client-portal/uploads (`searchData`, `getPagination`). Internal coupling (4). |
| `reviews.js` (top-level) | `reviews/legacy/reviews-integration.js` | 2 | reviews usecase (Google Business OAuth). Studio-wide, single-owner. |

**Cross-module `shared/*` cluster** — default: one home `server/src/shared/legacy/` keeping the barrel
(see OQ #2 for the alternative "scatter to owner modules"):

| Source (`services/main/shared/…`) | → Destination (default) | PH | Notes |
|---|---|---|---|
| `index.js` (barrel) | `src/shared/legacy/index.js` | 2 | Re-exports the 10 below. Imported via lazy adapters by leads, projects×2, task, update, delivery, generic-delete (7). Keeping the barrel = 7 adapter repoints only. |
| `leadServices.js` | `src/shared/legacy/lead-services.js` | 2 | via barrel + lead.repository. |
| `paymentServices.js` | `src/shared/legacy/payment-services.js` | 2 | via barrel. |
| `projectServices.js` | `src/shared/legacy/project-services.js` | 2 | project.usecase + admin-projects; internal (2). |
| `taskServices.js` | `src/shared/legacy/task-services.js` | 2 | via barrel (task). |
| `noteServices.js` | `src/shared/legacy/note-services.js` | 2 | via barrel + client-portal/notes usecase. |
| `updateServices.js` | `src/shared/legacy/update-services.js` | 2 | via barrel (update). |
| `dashboardServices.js` | `src/shared/legacy/dashboard-services.js` | 2 | dashboard usecase. |
| `deliveryServices.js` | `src/shared/legacy/delivery-services.js` | 2 | via barrel (delivery). |
| `salesStageServices.js` | `src/shared/legacy/sales-stage-services.js` | 2 | via barrel + sales-stages.repository. |
| `utilityServices.js` (shared, ≠ top-level) | `src/shared/legacy/shared-utility-services.js` | 2 | `getNextCalls/getNextMeetings` — via barrel + lead.repository. **Name collision** with the top-level `utilityServices.js` (§3c); the new name disambiguates. |
| `userProfile.js` | `users/legacy/user-profile.js` | 2 | user.usecase (single owner → into users module, not the shared cluster). |

### 3e. FROZEN PDF / contract / chunk-upload → co-locate LAST (Phase 3)

| Source (`services/main/…`) | → Owner module | PH | Notes |
|---|---|---|---|
| `contract/contractServices.js` | `contracts/legacy/contract-services.js` | 3 | 🔒 contract.usecase (18 adapters) + internal (2). |
| `contract/clientContractServices.js` | `contracts/legacy/client-contract-services.js` | 3 | 🔒 client-contract.usecase. |
| `contract/generateContractPdf.js` | `contracts/legacy/generate-contract-pdf.js` | 3 | 🔒🔒 pdf-lib; imports the PDF font loader (§3c) — repoint to `src/infra/pdf/pdf-fonts.js`. **Byte-diff gate.** |
| `contract/generateDefaultContractData.js` | `contracts/legacy/generate-default-contract-data.js` | 3 | 🔒 |
| `contract/pdf-utilities.js` | `contracts/legacy/pdf-utilities.js` | 3 | 🔒 |
| `contract/rules.js` | `contracts/legacy/rules.js` | 3 | 🔒 contract legal blocks. |
| `contract/wittenBlocksData.js` | `contracts/legacy/witten-blocks-data.js` | 3 | 🔒 imports PDF font loader — repoint. Contains AR legal text (kept, per lang decision). |
| `client/clientServices.js` | `image-sessions/legacy/client-services.js` | 3 | 🔒 **Cross-module + font-dependent**: PDF approve path; imports the font loader (§3c) + email templates. Consumers: `src/infra/workers/pdf.worker.js`, client-image-session, client-portal/languages, client-contract usecases. Move with the frozen tier; byte-diff any PDF it emits. |
| `utility/uploadAsChunk.js` | `client-portal/uploads/legacy/upload-as-chunk.js` | 3 | 🔒 chunk-upload handler (`/uploads/<uuid>.<ext>`). Consumer: client-portal/uploads controller. Verify upload-dir path resolution after move. |

### 3f. DELETE — already reimplemented VERBATIM in a module (Phase 2 opening step)

| Source | Reimplemented by | Evidence |
|---|---|---|
| `main/auth/authServices.js` | `modules/auth/*` (full six-file module) | **0 references** anywhere (grep clean). |
| `main/courses/adminCourseServices.js` | `modules/courses/admin-course/*` | Only **comment** references ("ported VERBATIM from …") in repository/usecase; 0 imports. |
| `main/courses/staffCoursesServices.js` | `modules/courses/staff-course/*` | Only comment references; 0 imports. |
| `main/shared-questions/shared-questions.js` | `modules/questions/*` | Only a comment reference in `questions.repository.js`; 0 imports. |
| `main/site-utilities/siteUtilityServices.js` | `modules/site-utility/*` | **0 references**. |

**Delete pre-check:** confirm every remaining hit is a comment, not an `import(...)`. If any live import
exists, downgrade that file to a Phase-2 co-locate instead of delete.

---

## 4. Importer-rewrite inventory (grouped by phase)

Total importer files: **~57 module + ~12 infra ≈ 63 files, ~228 import/adapter lines** (matches the
brief). Grouping keeps each phase self-consistent (never repoint to a not-yet-moved target).

### Phase 1 — infra importers (12)
- `src/server.js` — `../services/redis/socketSubscriber.js` → `./infra/socket/socket.subscriber.js`.
- `src/infra/cron/reminders.cron.js` — `services/main/email/emailTemplates.js` → `../mail/email-templates.js`.
- `src/infra/cron/project-delivery.cron.js` — `services/telegram/telegram-functions.js` → `../telegram/telegram-functions.js`.
- `src/infra/workers/telegram-add-user.worker.js` — telegram-functions → `../telegram/telegram-functions.js`.
- `src/infra/workers/telegram-channel.worker.js` — same.
- `src/infra/workers/telegram-cron.worker.js` — same.
- `src/infra/workers/telegram-message.worker.js` — same.
- `src/infra/workers/telegram-upload.worker.js` — same.
- `src/infra/workers/pdf.worker.js` — `services/main/client/clientServices.js` → **deferred to Phase 3** (target is a Phase-3 move). In Phase 1 leave as-is; repoint in Phase 3. (Flag: this is the one infra→business-frozen coupling.)
- `src/infra/socket/handlers/message.handler.js` — `services/main/chat/chatMessageServices.js` → **Phase 2** target. Repoint in Phase 2.
- `src/infra/socket/handlers/typing.handler.js` — same → Phase 2.
- Internal (within the moved infra files): `telegram-functions.js` (queues×4, socketPublisher, links, sendMail, connectToTelegram, prisma), `notification.js` (links, email templates, socket publisher, prisma), `sendMail.js` (constants), `connect-to-telegram.js` (`.env` path).

### Phase 2 — module lazy-adapter repoints (~50 files)
Repoint `import("…/services/main/<x>.js")` → the new in-repo path. Grouped by owner:
- **accounting** (6): note, salary, report, expense, payment, rent usecases → `../legacy/accountant-services.js`.
- **admin-residual** (7): commissions, admin-projects, admin-leads, model-archive, reports, fixed-data, staff usecases → `../legacy/admin-services.js` (+ admin-projects also → shared `project-services`; admin-leads also → `leads/legacy/client-leads-service.js`, `notification`, staff via cross-module path).
- **calendar** (3): client-calendar, availability, google usecases → `../legacy/*`.
- **chat** (module + infra handlers): repoint chat internals + the 2 infra socket handlers → `chat/legacy/chat-message-services.js`.
- **dashboard** (1) → `src/shared/legacy/dashboard-services.js`.
- **generic-delete** (1) → `src/shared/legacy/index.js`.
- **leads** (1 core + 2 client): lead.usecase (many adapters) → `src/shared/legacy/index.js`, `admin-services`, `staff-services`; public-lead + booking-lead → `client-leads-service`, `notification`, `send-mail`.
- **image-sessions** (3): session/admin/client usecases → `../legacy/*`.
- **users** (1): user.usecase → `../legacy/user-profile.js` + cross to `admin-services`.
- **reviews** (1): reviews.usecase → `../legacy/reviews-integration.js`.
- **client-portal** (4): notes → shared `note-services`; payments → `client-payments-service` + `notification`; languages → **Phase 3** (`client-services`); uploads → **Phase 3** (`upload-as-chunk`, `utility`).
- **projects** (4): project/task/update/delivery usecases → `src/shared/legacy/index.js` (+ project.usecase static `projectServices` import).
- **courses** (1): staff-course usecase → `../../../../services/notification.js` → `src/infra/notifications/legacy-notification.js`.
- **utilities** (1) + **notifications** (repository comment only) → `utilities/legacy/utility.js`.
- **sales-stages** (1 repo), **questions** (1 repo comment): repoint or drop comment after Phase-2f deletes.

### Phase 3 — frozen-tier repoints
- **contracts**: contract.usecase (18 adapters) + client-contract.usecase → `../legacy/*`; internal contract-file imports of the font loader → `src/infra/pdf/pdf-fonts.js`.
- **image-sessions / client-portal**: client-image-session, languages, uploads, and `src/infra/workers/pdf.worker.js` → `image-sessions/legacy/client-services.js`; uploads → `.../legacy/upload-as-chunk.js`.

---

## 5. Phased execution

Each phase is a self-contained, independently-verifiable commit. Use `git mv` for every relocation
(preserves history + guarantees binary fonts are byte-identical). Never repoint to a target that has not
moved yet.

### Phase 0 — prep (no moves)
1. Re-run the delete pre-checks (§3a, §3f). Confirm shim/dead status still holds.
2. Confirm the two untracked files `src/infra/socket/socket.{publisher,subscriber}.js` are the intended
   canonical versions and are byte-equivalent to the `services/redis/socket{Publisher,Subscriber}.js`
   bodies. If not, reconcile first.
3. Baseline: `npm test` (record pass count) and generate the golden PDFs (§6) from `master`-equivalent
   fixtures — contract PDF, image-session PDF, lead-report.pdf, staff-report.pdf.

### Phase 1 — infra (lowest risk)
1. Finalize `src/infra/socket/socket.publisher.js` + `socket.subscriber.js`; delete the `services/redis`
   originals; repoint `src/server.js`.
2. `git mv` the live singletons/integrations (§3b) into `src/infra/{mail,config,notifications,telegram}`;
   fix their internal imports and `__dirname`/`.env` paths.
3. Repoint the 12 infra importers (§4 Phase 1) **except** the two chat-handler + pdf.worker couplings
   (their targets move later — leave those pointing at `services/…` until Phase 2/3).
4. Delete the 16 dead shims/dead files (§3a).
5. **Verify** (§6). The chat handlers + pdf.worker still importing `services/main/*` is expected here.

### Phase 2 — business logic (co-locate into modules)
1. Delete the 5 reimplemented-dead files (§3f) and strip their stale comment references.
2. Create `legacy/` folders; `git mv` the 29 Phase-2 files (§3d) into owner modules + `src/shared/legacy/`.
3. Fix each moved file's internal imports (prisma, cross-file, `src/infra/socket/index.js` for `getIo`,
   email templates, notification, sendMail — all now in their Phase-1 homes).
4. Repoint the ~50 module lazy adapters + the 2 infra chat handlers (§4 Phase 2).
5. **Verify** (§6) including the pdfkit report byte-diff for `admin-services.js`.

### Phase 3 — frozen PDF / contract / fonts / chunk-upload (last)
1. `git mv` the font loader + `fonts/` (§3c) into `src/infra/pdf/`, preserving the `./fonts/` relative
   path. `git mv` the 9 frozen module files (§3e) into their `legacy/` folders.
2. Repoint the frozen-file font-loader imports → `src/infra/pdf/pdf-fonts.js`; repoint the contracts /
   image-session / uploads / `pdf.worker.js` consumers.
3. **Verify (byte-diff gate, §6).** If any PDF differs → revert that file to KEEP-IN-PLACE and report.
4. Confirm `server/services/` is empty and remove the directory. Final full verification.

---

## 6. Verification per phase

There is **no server unit-test script or lint** in `server/package.json`; the suite runs from the repo
root via **`npm test` → `vitest run`** (config includes `server/**/*.test.js`; ~699 green today). Use:

- **After every phase:** `npm test` (must stay green — the module usecase tests exercise the lazy
  adapters, so a broken repoint fails here) **and** `npm run build:server` (`prisma generate`, cheap
  import-graph sanity is *not* covered by this — see boot smoke).
- **Import-resolution smoke (every phase):** guarded boot — `node -e "import('./server/src/server.js')"`
  will attempt Redis + Telegram; instead do a **static resolve check**: a scratch script that
  `await import()`s every touched module entrypoint (routes barrels) to surface unresolved paths without
  needing Redis. (The app's real boot awaits Redis + a live Telegram connection before listening, so a
  full listen smoke is optional and user-run.)
- **PDF byte-diff gate (Phase 2 for pdfkit reports; Phase 3 for pdf-lib):** generate each PDF from fixed
  fixtures before and after the move; compare with `cmp`/sha256. Targets: contract PDF
  (`generateContractPdf`), image-session PDF, `lead-report.pdf`, `staff-report.pdf`. **Byte-identical =
  pass. Any difference = revert + KEEP-IN-PLACE-AND-REPORT.** (Fonts are embedded, so a broken
  `__dirname` surfaces as a diff or a throw.)
- **grep sweep (final):** `grep -rn "services/" server/src --include=*.js` returns only comments (ideally
  zero), and `server/services/` does not exist.

---

## 7. Risks & open questions

### Top risks
1. **The `main/shared/*` cross-module cluster + `shared/index.js` barrel** (imported by 7 modules across
   leads / projects / task / update / delivery / generic-delete). Scattering it into owner modules breaks
   the barrel and multiplies cross-module imports; keeping it as one `src/shared/legacy/` cluster is lower
   risk but is neither "module" nor "infra" (though `src/shared/` already exists). Wrong call here = a
   cascade of broken adapters. **Mitigation:** default to the single-cluster placement (barrel intact);
   only 7 adapters repoint.
2. **Frozen PDF + fragile `__dirname` font loading.** `utilityServices.js` (top-level) resolves
   `./fonts/*` relative to its own dir and feeds base64 fonts into the contract PDF + image-approve. A
   move that changes `__dirname` resolution or misses a font silently corrupts/breaks PDF output.
   **Mitigation:** move `fonts/` with the loader, keep the relative path, and gate on byte-diff; revert to
   KEEP-IN-PLACE if the diff fails.
3. **Migration-depth ambiguity ("wired the way we write code NOW").** Behavior-preserving co-location
   under `legacy/` deletes `services/` safely but leaves Prisma + business logic outside the
   route→controller→usecase→repository layering (Prisma-only-in-repos is violated inside `legacy/`). Full
   decomposition of 38 frozen/parity-critical files (incl. `adminServices` 43 fns, `notification` 1355
   lines, the whole `shared/*` cluster) is a multi-week, high-parity-risk rewrite. **Needs a user
   decision** — see OQ #1. This plan executes the safe co-location; decomposition is a documented
   follow-up done per-module later.

Secondary: `admin-services.js` mixes frozen pdfkit reports with ordinary CRUD in one god-file (moved
whole; report byte-diff required). `clientServices.js` is both cross-module and font-dependent (Phase 3,
also consumed by an infra worker → an infra→business-frozen edge). `image-session` services do heavy
`sharp` processing (behavior-sensitive; smoke the upload flow). Full server boot needs Redis + Telegram,
so the strongest end-to-end check (browser/live boot) is user-run, not automatable here.

### Open questions (need user decision before/**during** execution)
1. **Depth A vs B.** A = co-locate verbatim under `legacy/` (this plan; deletes `services/`, zero behavior
   change, Prisma stays outside repos temporarily). B = full strict-layer decomposition now
   (route/controller/usecase/repository, Prisma→repos). Recommend **A now + B as an incremental per-module
   follow-up** to protect the master parity baseline. Confirm?
2. **Shared cluster placement.** (a) single `src/shared/legacy/` keeping the barrel [default, lowest
   churn] vs (b) scatter each `shared/*` file into its natural owner module (`leadServices→leads`,
   `projectServices→projects`, …) and repoint all barrel consumers. (b) is "cleaner modules" but ~30+
   extra repoints and messier cross-module imports. Which?
3. **`constants.js` / `enums.js` placement.** Co-locate to `src/infra/config/` [default] vs promote the
   genuinely shared ones (`ClientLeadStatus`, brand names) into `@dms/shared/constants` (they overlap
   conceptually with existing shared constants). The latter is "more correct" but widens scope. Preference?
4. **`legacy/` naming.** OK to introduce a `legacy/` subfolder convention inside modules for frozen import
   targets, or prefer another name (`_frozen/`, `services/`, `internal/`)?
5. **`drive.js` + Drive models.** Confirm the Drive subsystem is dead (0 importers) and safe to delete
   outright (locked decision #8 says models stay in the frozen schema; only the code file is removed).
```
