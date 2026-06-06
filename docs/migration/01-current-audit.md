# Dream Studio — Current-State Migration Audit

> READ-ONLY audit of the existing codebase at `C:\coding\design-managment-system` (`server/`, `ui/`).
> Foundation document for the migration plan. Captures the CURRENT state only — no code was modified.
> Date: 2026-06-06 · Branch: `server-migration`

---

## 1. App Overview & UI Language

### What the app does
**Dream Studio** is a design / project-management system for a luxury interior-design studio operating in the UAE. It covers the full lifecycle:

- **Lead capture & sales** — client leads, sales stages, lead conversion, auto-assignment, commissions.
- **Contracts** — multi-stage contracts with payment schedules, drawings, special items, and **bilingual signed-PDF generation**.
- **Image / design sessions** — clients pick materials, styles, color patterns, design images per space; sessions produce a signed PDF.
- **Projects & tasks** — project delivery schedules, tasks, updates, delivery reminders.
- **Accounting** — invoices, payments, salaries, rent, operational expenses, monthly outcome.
- **Courses / LMS** — courses, lessons, videos, PDFs, tests, attempts, certificates, progress.
- **Chat** — full real-time chat (rooms, members, messages, attachments, reactions, mentions, calls, scheduled messages) over Socket.IO + Redis pub/sub.
- **Telegram integration** — a Telegram userbot (`telegram` / GramJS) that uploads files, posts to channels, adds users, and sends reminders, driven by BullMQ queues and cron.

### User roles (from `server/routes/*` and `enum UserRole`)
Route groups: `accountant`, `admin`, `auth`, `calendar`, `chat`, `client` (the public/client-facing app), `clients` (staff-side client management), `contract`, `courses`, `image-session`, `questions`, `shared`, `site-utilities`, `staff`, `utility`.

`enum UserRole` (schema): `ADMIN`, `SUPER_ADMIN`, `STAFF`, `THREE_D_DESIGNER`, `TWO_D_DESIGNER`, `TWO_D_EXECUTOR`, `ACCOUNTANT`, `CONTACT_INITIATOR`, plus the `isSuperSales` flag and a `UserSubRole` table for layered sub-roles. There is no granular permission model — see §6.

### UI language — **Arabic (RTL) is the single primary UI language**
**Verdict: Arabic-first, RTL by default**, with an optional ar↔en runtime toggle via a hand-rolled dictionary (NOT a real i18n library).

Evidence:
- `ui/src/app/layout.js`: global font is `Noto_Kufi_Arabic` (`subsets: ["arabic"]`); all `metadata` (title/description/keywords/openGraph) is Arabic; `openGraph.locale: "ar_AE"`.
- `ui/src/app/providers/LanguageProvider.jsx` and `ui/src/app/v2/providers/LanguageProvider.jsx`: `initialLng = "ar"`; falls back to `localStorage.getItem("lng") || "ar"`.
- `ui/src/app/providers/LanguageSwitcherProvider.jsx`: MUI theme `direction: lng === "ar" ? "rtl" : "ltr"`, `textAlign` right for ar; RTL is wired with **`stylis-plugin-rtl`** + a `muirtl` Emotion cache (`createCache({ key: "muirtl", stylisPlugins: [rtlPlugin] })`).
- Translation is a string-lookup dictionary: `translate(text) => lng === "ar" ? dictionary[text] : text` (`@/app/helpers/constants.js`). No `i18next` / `next-intl` / `react-intl` is installed.
- Hardcoded Arabic literals are widespread in client-facing components (e.g. `ui/src/app/UiComponents/client-page/FinalSelectionForm.jsx`: "نقوم بإعادة توجيهك … يرجى الانتظار قليلاً").
- The backend PDF generator (§3) defaults to `lng = "ar"` and renders RTL/Arabic shaping.

> Note: `<html>` in `layout.js` has **no `lang`/`dir` attribute** — direction is applied only at the MUI theme/Emotion layer, not the document root. Worth fixing in migration for SSR correctness.

---

## 2. Backend Inventory

### Route groups (`server/routes/*`) — ~393 endpoints total
Mounted in `server/v2/app.js`: `/shared`, `/utility`, `/staff`, `/admin`, `/accountant`, `/client`, and `/v2`. (Note: `clients`, `auth`, `calendar`, `chat`, `contract`, `courses`, `image-session`, `questions`, `site-utilities` are sub-mounted from inside those top routers, e.g. via `routes/shared/index.js`.)

| Route file | Purpose (high level) |
|---|---|
| `routes/auth/auth.js` | Login, session/cookie, password — legacy auth endpoints. |
| `routes/admin/admin.js` (729 lines) | Admin dashboard ops, lead/user/report management, **lead-report PDF (pdfkit)**. |
| `routes/accountant/accountant.js` | Invoices, payments, salaries, rent, expenses, outcome. |
| `routes/staff/staff.js` | Staff-side operations + **staff-report PDF (pdfkit)**. |
| `routes/clients/clients.js` | Staff-side client CRUD/management. |
| `routes/client/*` (`leads.js`, `payments.js`, `notes.js`, `telegram.js`, `uploads.js`, `image-session.js`, `languages.js`, `chat/`) | Public/client-facing app endpoints. |
| `routes/contract/contracts.js`, `client-contract.js` | Contract CRUD, `generatePdfSessionToken`, client contract signing → triggers PDF build. |
| `routes/image-session/*` (`admin-`, `client-`, `image-session.js`) | Design/image sessions; client session approval → PDF + queue. |
| `routes/courses/adminCourses.js`, `staffCourses.js` | LMS admin + staff. |
| `routes/calendar/*` (`calendar.js`, `client-calendar.js`, `google.js`, `new-calendar.js`, `old-call.js`) | Meetings, availability, Google Calendar; `old-call.js` is dead legacy. |
| `routes/chat/*` (`rooms.js`, `members.js`, `messages.js`, `files.js`) | Legacy chat REST (note: chat is also being migrated to `v2/modules/chat`). |
| `routes/shared/*` (`index.js`, `client-leads.js` 659 ln, `dashboard.js`, `projects.js`, `tasks.js`, `delivery.js`, `reviews.js`, `sales-stages.js`, `updates.js`, `users.js`, `utilities.js`) | Cross-role shared endpoints; `index.js` is the shared router aggregator. |
| `routes/site-utilities/*`, `routes/utility/utility.js`, `routes/questions/questions.js` | Site config, utility/upload helpers, question bank. |
| `routes/tmp/chunks` | Chunked-upload temp dir. |

### Services (`server/services/*`)
| Service | Role |
|---|---|
| `services/main/*` | The bulk of business logic, grouped by domain (accountant, admin, auth, calendar, chat, client, contract, courses, email, image-session, shared, shared-questions, utility). Many files are very large (see §8). |
| `services/queues/*` | BullMQ **Queue** definitions: `pdfQueue`, `telegramAddUserQueue`, `telegramChannelQueue`, `telegram-cron-queue`, `telegram-message-queue`, `telegramUploadQueue`. **All are now 2-line re-exports** that forward to the canonical `v2/infra/queues/*`. |
| `services/workers/*` | BullMQ **Worker** definitions, same naming. **Also 2-line re-exports** forwarding to `v2/infra/workers/*`. |
| `services/redis/*` | `bullmqConnection.js`, `redis.js`, `socketPublisher.js`, `socketSubscriber.js` — Redis client + cross-process Socket.IO pub/sub. |
| `services/socket.js` (556 ln) | Legacy Socket.IO setup. |
| `services/telegram/*` | `connectToTelegram.js`, `telegram-functions.js` (1149 ln) — GramJS client + all telegram message/upload/reminder logic. |
| `services/upload/` | Empty directory (upload logic lives in `main/utility/utility.js` FTP helpers and `v2/infra/upload`). |
| `services/drive.js` | Google Drive integration (also `DriveNode`/`DriveAcl` models). |
| `services/notification.js` (1364 ln) | In-app + email + telegram notification fan-out. |
| `services/sendMail.js` | Nodemailer transport wrapper. |
| `services/reviews.js` | Review handling. |
| `services/utilityServices.js` (194 ln) | **Loads PDF fonts** (Amiri, Ya-ModernPro, CairoPlay) via `fs.readFileSync`, plus Arabic reshaping / RTL text helpers used by the PDF generator (see §3). |
| `services/constants.js`, `enums.js`, `links.js`, `fonts/` | Shared constants, enums, dashboard link builders (env-driven), font assets. |

### Root bootstrap / cron files
| File | What it starts |
|---|---|
| `server/index.js` | One line: `import "./v2/server.js"` — **the v2 server is now the single entry point.** |
| `server/v2/server.js` | Creates HTTP server from `v2/app.js`, `initSocket`, `startSocketSubscriber`, `connectRedis`, `coonnectToTelegramV2`, then `httpServer.listen(env.PORT)`. **Does NOT start any BullMQ workers** (see §5). |
| `server/reminderScheduler.js` | `node-cron` every minute — meeting reminders to clients/users via email templates. Standalone process (not imported by server.js). |
| `server/projectDeliveryTimeReminder.js` | Connects telegram, cron every 2h — project delivery reminders via telegram. Standalone. |
| `server/tele-cron.js` | Connects telegram (`coonnectToTelegramV2`), cron every 10 min — enqueues finalized-lead jobs to `telegramCronQueue`. Standalone. |
| `server/tele.js` | One-off interactive script to generate a Telegram `StringSession` (uses `input` prompts). Dev tool. |
| `server/start-telegram-system.js` | Connects telegram once, then **imports the five telegram workers** (`v2/infra/workers/telegram-*.worker.js`). This is the only process that actually runs BullMQ workers. |

---

## 3. PDF Generation (logic-frozen — most important)

There are **two distinct PDF subsystems** using two different libraries. Behavior of both must be preserved exactly; the migration may only split/move files.

### 3A. Contract & Image-Session PDFs — **`pdf-lib` + `fontkit`** (the important one)

**Library:** `pdf-lib` (`^1.17.1`) with `fontkit` (`^2.0.4`) for custom embedded fonts; `arabic-persian-reshaper` / `bidi` / `bidi-js` for Arabic shaping.

**Core file — `server/services/main/contract/generateContractPdf.js` (2332 lines).**
Imports `PDFDocument, rgb, degrees` from `pdf-lib`, `* as fontkit`. Exports:
- `generateContractPdf({...})` (line 2013) — builds the PDF bytes for one language.
- `buildAndUploadContractPdf({...})` (line 2219) — orchestrator: generates **both AR and EN** PDFs, uploads each, returns public URLs (`generateContractPdfLinksInBothLanguages`, internal at line 2310).

Internal helpers in this file (all must move together): `widthOf`, `drawFullBackgroundImage`, `createPdfContext` (page/cursor engine), title/line-writer factories, RTL line layout, etc.

**Supporting files (the full split-without-changing set):**
| File | Lines | Role |
|---|---|---|
| `services/main/contract/generateContractPdf.js` | 2332 | Main renderer + orchestrator (`generateContractPdf`, `buildAndUploadContractPdf`). |
| `services/main/contract/wittenBlocksData.js` | 780 | Static contract text/clause data (AR/EN), labels, enums consumed by the renderer. |
| `services/main/contract/pdf-utilities.js` | 263 | `sendSuccessEmailAfterContractSigned` (post-PDF email to client + admins). |
| `services/main/contract/generateDefaultContractData.js` | 121 | Builds default contract data structure for rendering. |
| `services/main/contract/contractServices.js` | 1441 | `generatePdfSessionToken` (l.481), `updateContractPaymentOnContractSign`; calls `buildAndUploadContractPdf` (l.1100). |
| `services/main/contract/clientContractServices.js` | 63 | `getDefaultContractUtilityData` used by the renderer. |
| `services/main/contract/rules.js` | 5 | Tiny rules constant. |
| `services/utilityServices.js` | 194 | **Font loaders + Arabic text helpers** used by the renderer: `fontBase64`, `fontBoldBase64`, `enfontBase64`, `enfontBoldBase64` (from `fs.readFileSync`), `fetchImageBuffer`, `getRTLTextX`, `reText`, `splitTextIntoLines`, `isArabicText`, `formatAED`, `formatNumber`, `formatDate`, `reverseString`. |
| `services/main/utility/utility.js` | 989 | `uploadToFTPHttpAsBuffer` — uploads generated PDF buffer to FTP and returns URL. |

**Fonts/assets** (`server/services/fonts/`): Amiri-Regular/Bold, AmiriQuran, CairoPlay-Regular/Bold, harir/harir-bold, NotoSansArabic-Regular/Bold, Ya-ModernPro-Bold. Active set per `utilityServices.js`: **Amiri-Regular** + **Ya-ModernPro-Bold** (Arabic body/bold) and **CairoPlay-Regular/Bold** (the "en" font slots). Path resolved as `path.join(__dirname, "./fonts/...")` — **note `utilityServices.js` sits in `services/` and references `./fonts/`, so the relative path is migration-sensitive.**

**Image-Session PDF — `services/main/client/clientServices.js` (1669 ln).**
Line 1 imports `{ PDFDocument, rgb }` from `pdf-lib`. `uploadPdfAndApproveSession({ sessionData, signatureUrl, lng })` (l.67) creates the PDF (`PDFDocument.create()` l.121), uploads it, and approves the session.

**Triggers (inputs → outputs):**
- Contract signing: `routes/contract/client-contract.js` (l.47) → `buildAndUploadContractPdf({...})` → uploads AR+EN PDFs to FTP, emails URLs, notifies via telegram (`notifyUsersThatAContractWasSigned`).
- Contract flow internal: `contractServices.js` l.1100 → `buildAndUploadContractPdf`.
- Image session approval: `routes/image-session/client-image-session.js` (l.171) → `uploadPdfAndApproveSession(...)`. **The BullMQ path is commented out** (l.161 `// await pdfQueue.add("generate-approve-pdf", ...)`); it currently runs **inline/synchronously** in the request. The `pdfWorker` (below) is the queued alternative but is not currently wired into a running process.

### 3B. Lead / Staff Report PDFs — **`pdfkit`**
**Library:** `pdfkit` (`^0.17.1`).
- `server/services/main/admin/adminServices.js` (2246 ln): `import PDFDocument from "pdfkit"`; builds `lead-report.pdf` (l.533) and `staff-report.pdf` (l.1080) streamed as `attachment` downloads via admin routes.

### BullMQ PDF path (defined but dormant)
- `v2/infra/queues/pdf.queue.js`: `new Queue("pdf-approval-queue", bullmqConnection)`.
- `v2/infra/workers/pdf.worker.js`: `Worker("pdf-approval-queue", …)` → calls `uploadPdfAndApproveSession`. **Imports `../../../services/main/clientServices.js` — a path that does not match the actual file `services/main/client/clientServices.js` (missing `/client/`). This import is broken** and the worker is not started anywhere (only telegram workers run, in `start-telegram-system.js`). So the image-session PDF currently relies on the inline path in 3A.

---

## 4. v2 Migration State

### Backend `server/v2/`
**Bootstrap:** `index.js → v2/server.js → v2/app.js`. v2 is already the live server. `app.js` mounts the **legacy** routers (`/shared /utility /staff /admin /accountant /client`) AND the new v2 router at `/v2` (`v2/shared/routes.js`), which mounts: `/v2/auth`, `/v2/client/booking-leads`, `/v2/telegram`, `/v2/chat`, `/v2/files`. So v2 and legacy run side-by-side in one process.

**Patterns already established (good, reference-aligned):**
- Layered modules: `routes → controller → usecase → repository → validation → dto`. Booking-leads is the cleanest example (constructor DI: `new Repo()` → `new Usecase(repo)` → `new Controller(usecase)`, `routes/leads/client/booking-lead/*`).
- Shared middleware: `asyncHandler`, `validate(schema, "body|params")` (Zod), `AuthMiddleware.requireAuth/requireRole` (`v2/shared/middlewares/`).
- Error contract: `AppError` (`v2/shared/errors/AppError.js`), `errorHandler` + `notFoundHandler`, unified `response.js` envelope (`v2/shared/http/response.js`).
- Config: `v2/config/env.js` (central env object), `cors.js`, `redis.config.js`.
- Infra: `prisma`, `redis` (client + `cache.service` + `bullmq.connection`), `security` (`jwt.js`, `hash.js`), `socket` (index + 5 handlers), `mail`, `upload` (local-disk provider). BullMQ queues/workers all canonicalized here with `index.js` barrels.
- Validation via **Zod 4** throughout v2; rate limiting via `express-rate-limit`.

**Modules present:** `auth` (full 8-file layering incl. emails), `chat` (large; handlers + socket + has **duplicate `chat.repo.js` AND `chat.repository.js`** — likely a half-finished rename), `leads/client/booking-lead` (cleanest, complete), `telegram/auth` + `telegram/manager` + `connect.js`, `upload` (controller/usecase/validation/middleware/dto/internal).

**Broken / half-done / gaps:**
- **`pdf.worker.js` import path is wrong** (`services/main/clientServices.js` vs `…/client/clientServices.js`) — would crash if started.
- **No worker is started by the server** — `v2/server.js` never imports `v2/infra/workers/index.js`. Only telegram workers run, and only via the separate `start-telegram-system.js` (§5).
- **Duplicate infra files**: `v2/infra/prisma.js` vs `v2/infra/prisma/prisma.js`; `v2/infra/mailer.js` vs `v2/infra/mail/mail.js`; `v2/infra/socket.js` vs `v2/infra/socket/index.js`; `v2/infra/telegram.js` vs `v2/modules/telegram/connect.js`. Indicates incomplete consolidation.
- **Chat module dual repo files** (`chat.repo.js` + `chat.repository.js`).
- `auth.middleware.js` (module-level) only holds rate limiters; the real auth is in `shared/middlewares/auth.middleware.js`. `requireRole` still authorizes on **role only** (`req.auth.activeRole || req.auth.role`) — no permission-code or scope checks (see §6).
- JWT cookie name is feature-flagged: `currentMainTokenName` may be `"token"` (legacy, signs with `env.SECRET_KEY`) OR the new access secret — a transitional shim, not finished.

### Frontend `ui/src/app/v2/`
Mature scaffolding, partially populated:
- `features/auth/*` — complete: service, validation, constants, components (`LoginForm`, `RequestResetForm`, `ResetPasswordForm`, `AuthCard`, `AuthGuard`, `AuthLayout`), pages, `hooks/useAuthHooks.js`.
- `features/leads/*` — partial: `BookingLeadDetailsCard.jsx`, field-label constants, `index.js`. No list/table feature yet.
- `features/chat` — directory exists but **empty** (no files).
- `hooks/` — `useRequest`, `useDebounce`, `useLoading`, `useOverlay`, `useToast`, `useUpload`.
- `lib/api/` — `ApiFetch` (with a debug `logToMd` localStorage logger), `getData`, `getDataAndSet`, `handleRequestSubmit`, `legacyApiFetch` shim; `lib/config.js`, `lib/constant.js`, `lib/toast/`.
- `providers/` — full set (`AuthProvider`, `LanguageProvider`, `LanguageSwitcherProvider`, `MUIProvider`, `MuiAlertProvider`, `SocketProvider`, `ToastProvider`, `UploadingProvider`, `theme.js`). The **legacy** providers now delegate to these v2 providers (e.g. legacy `LanguageProvider.jsx` just wraps `LanguageProviderV2` — and contains dead unreachable code after the early return).
- `shared/` — `components/feedback/*` (Toast/LoadingOverlay/UploadOverlay), `constants`, `form/AuthForm.jsx` + `FormField.jsx`.
- Typo folder: `v2/utlis/helpers.js` (should be `utils`).

**Quality:** the v2 layering is consistent and reference-aligned where present; main issues are duplication, dead code, empty stubs, and a debug logger left in `ApiFetch`.

---

## 5. Workers / Queues

**Library:** BullMQ `^5.54.0` over **ioredis** (`bullmqConnection` from `v2/infra/redis/bullmq.connection.js`). Plain `redis` `^5.11.0` is also used for Socket.IO pub/sub.

**Queues (6):** `pdf-approval-queue`, telegram message / cron / channel / add-user / upload. Canonical defs in `v2/infra/queues/*`; legacy `services/queues/*` re-export them.

**Workers (6):** matching set in `v2/infra/workers/*`; legacy `services/workers/*` re-export them. Barrels `v2/infra/{queues,workers}/index.js` aggregate exports.

**How they run TODAY:**
- **Telegram workers** run only in the **separate process** `server/start-telegram-system.js`, which first calls `coonnectToTelegramV2()` (single GramJS connection) then imports the five telegram workers. It does NOT import `pdfWorker`.
- **pdfWorker** is defined but **never imported into any running process** (and its import path is broken — §3). The image-session PDF therefore runs inline in-request, not via the queue.
- Cron producers (`tele-cron.js`, `projectDeliveryTimeReminder.js`, `reminderScheduler.js`) are additional standalone processes that enqueue jobs / send reminders.
- The main API (`v2/server.js`) starts **no workers at all**.

**Requirement target (for the plan):** workers should be **started as a bootstrap from the server** (single process owns the BullMQ workers), rather than relying on the detached `start-telegram-system.js`. Fix the `pdf.worker.js` import path and register a `startWorkers()` from `v2/infra/workers/index.js` in the server bootstrap. The Telegram single-connection constraint (one GramJS client per process) must be respected when colocating.

---

## 6. Permissions / Auth (weakest area)

**Two parallel auth systems run simultaneously.**

### Legacy (most endpoints)
`server/services/main/utility/utility.js` →
- `generateToken(payload)` — `jwt.sign(payload, SECRET_KEY, { expiresIn: "4h" })`.
- `verifyTokenAndHandleAuthorization(req, res, next, role)` (l.199) — reads `req.cookies.token`, decodes, fetches user, then does **hardcoded role-string allow-lists** per coarse bucket (`"ADMIN"`, `"SHARED"`, `"STAFF"`, or exact role match). `handleTokenSession` silently **refreshes the cookie** on each call.
- `getCurrentUser(req)` = `jwt.verify(cookies.token, SECRET_KEY)`.

### v2
`v2/shared/middlewares/auth.middleware.js`:
- `requireAuth` — reads cookie `JwtService.currentMainTokenName`, `JwtService.verifyAccess`, sets `req.auth`.
- `requireRole(allowedRoles)` — checks `allowedRoles.includes(req.auth.activeRole || req.auth.role)`.

### Problems (specifics)
1. **Role-only authorization.** Both systems gate on role strings — no permission codes, no per-action capabilities. Adding a capability means editing hardcoded arrays in `utility.js`.
2. **No object-level scope checks.** Nothing verifies the authenticated user owns/can-access the specific `clientLead`/`contract`/`project`/`chatRoom` being mutated → broad **IDOR risk** across the ~393 endpoints.
3. **Scattered logic.** Auth allow-lists are duplicated inline across `routes/*` (each route passes a `role` string), and partly in `searchData()` in `utility.js` (different role logic again).
4. **Two JWT secrets / cookie schemes coexist** (`SECRET_KEY` 4h vs new access/refresh secrets), bridged by the `currentMainTokenName` flag — fragile transitional state.
5. **Inconsistent error shape** — legacy returns `{ message }`, v2 returns the `AppError`/envelope shape.
6. `subRoles` and `isSuperSales` add ad-hoc privilege escalation paths checked in several places independently.

**Migration target:** centralized `requirePermissions(...)` (permission code) + object-level scope checkers + status/confidential guards, never role-alone. (See `shared-permissions` skill.)

---

## 7. Prisma Schema (the contract to preserve)

`server/prisma/schema.prisma` — **single file, 2478 lines** (NOT split; `prisma/schema/` exists but is empty). Datasource: **MySQL**, generator `prisma-client-js`. Long text via `@db.Text`. No encryption-at-rest metadata model present. Header comment instructs to keep generator/datasource/enums as-is. Loose `.sql` files in `prisma/` (`mig.sql`, `complete-chat-migration.sql`, `add-telegram-connection-model.sql`, `add-v2-notification-types.sql`, `v2-booking-leads-alters.sql`) are manual migration scratch.

**Model groups (~120 models, ~40 enums):**
- **Leads/Sales:** `ClientLead` (central hub, l.624), `ClientLeadUpdate`, `SharedUpdate`, `SalesStage`, `AutoAssignment`, `Commission`, `CallReminder`, `MeetingReminder`. Enums: `LeadSource`, `LeadCategory`, `LeadType`, `ClientLeadStatus`, `BookingLeadRequestStatus`, `LeadConversionType`, `SalesStageType`, `CallReminderStatus`, `ClientPersonality`.
- **Contracts:** `Contract`, `ContractStage`, `ContractPayment`, `ContractPaymentCondition`, `ContractDrawing`, `ContractSpecialItem`, `ContractUtility`, `ContractStageClauseTemplate`, `ContractSpecialClauseTemplate`, `ContractLevelClauseTemplate`. Enums: `ContractStatus`, `ContractSessionStatus`, `StageStatus`, `PaymentStatusNew`, `ContractLevel`.
- **Projects/Tasks:** `Project`, `Task`, `DeliverySchedule`, `Update`-family. Enums: `TaskStatus`, `UpdateStatus`, `Priority`.
- **Users/Identity:** `User`, `UserSubRole`, `UserLog`, `Assignment`, `Client`, `Note`. Enums: `UserRole`, `Emirate`.
- **Payments/Accounting:** `Payment`, `Invoice`, `ExtraService`, `PriceOffers`, `BaseEmployeeSalary`, `MonthlySalary`, `Rent`, `RentPeriod`, `OperationalExpenses`, `Outcome`, `FixedData`. Enums: `PaymentStatus`, `PaymentLevel`.
- **Image/Design sessions:** `ClientImageSession`, `MaterialOnClientImageSession`, `ClientSelectedImage`, `ClientImageSessionToSpace`, `DesignImage`, `DesignImageSpace`, `Space`, `Material`, `Style`, `ColorPattern`, `ColorPatternColor`, `Template`, `PageInfo`, `Pro`, `Con`, `TextShort`, `TextLong`, `Language`. Enums: `SessionStatus`, `PageInfoType`, `TemplateType`.
- **Questions/Versa:** `QuestionType`, `BaseQuestion`, `SessionQuestion`, `Answer`, `ObjectionCategory`, `VersaModel`, `VersaStep`, `AvailableDay`, `AvailableSlot`. Enums: `MeetingType`.
- **Courses/LMS:** `Course`, `CourseRole`, `Lesson`, `LessonAccess`, `LessonHomework`, `LessonVideo`, `LessonVideoPdf`, `LessonPDF`, `LessonLink`, `Test`, `TestQuestion`, `TestChoice`, `TestAttempt`, `UserAnswer`, `SelectedAnswer`, `CourseProgress`, `CompletedLesson`, `CompletedTest`, `Certificate`. Enums: `CoursesQuestionType`, `TestType`, `LessonVideoType`, `HomeworkType`.
- **Chat:** `ChatRoom`, `ChatMember`, `ChatMessage`, `ChatAttachment`, `ChatReadReceipt`, `ChatTypingStatus`, `ChatReaction`, `ChatMention`, `ChatPinnedMessage`, `ChatBookmark`, `ChatTemplate`, `ChatScheduledMessage`, `ChatRoomProject`, `Call`, `CallParticipant`. Enums: `ChatRoomType`, `ChatMessageType`, `ChatMessageStatus`, `ChatMemberRole`, `CallStatus`, `CallType`, `ScheduledMessageStatus`.
- **Telegram:** `TelegramChannel`, `TelegramConnection`, `FetchedTelegramMessage`. Enums: `TelegramConnectionStatus`.
- **Drive/Files:** `DriveNode`, `DriveAcl`, `DrivePublicShare`, `DriveNodeProject`, `DriveNodeClientLead`, `File`. Enums: `DriveNodeType`, `DriveVisibility`, `StorageProvider`.
- **Site/Notifications:** `SiteUtility`, `Notification` (+ `NotificationType`, `ContentType` enums).

> The schema is the migration contract — model/field/enum names must be preserved exactly.

---

## 8. Security Issues & Code Smells

**Oversized files (worst offenders, line counts):**
| File | Lines |
|---|---|
| `services/main/contract/generateContractPdf.js` | 2332 |
| `services/main/admin/adminServices.js` | 2246 |
| `services/main/client/clientServices.js` | 1669 |
| `services/main/image-session/imageSessionSevices.js` (typo in name) | 1660 |
| `services/main/shared/projectServices.js` | 1474 |
| `services/main/contract/contractServices.js` | 1441 |
| `services/notification.js` | 1364 |
| `services/main/shared/leadServices.js` | 1212 |
| `services/telegram/telegram-functions.js` | 1149 |
| `services/main/courses/staffCoursesServices.js` | 1044 |
| `services/main/shared/dashboardServices.js` | 1009 |
| `services/main/utility/utility.js` | 989 |

Total ~37.5k lines across `routes/` + `services/`. These mix routing, business logic, Prisma access, and PDF/email side-effects in single files — no layering in legacy.

**Other smells / risks:**
- **No object-level authorization / IDOR** across legacy routes (see §6) — the single biggest security concern.
- **Two auth stacks + two JWT secrets** running at once; legacy `verifyToken` swallows errors and silently refreshes cookies.
- **Raw user-facing strings** everywhere (Arabic literals in both UI components and backend error/notification text) — no language-neutral message codes; impedes i18n and the api-contract envelope.
- **Inconsistent validation** — v2 modules use Zod; legacy routes largely trust request bodies directly.
- **Duplicate/competing infra in v2** (prisma, mail, socket, telegram each have two implementations; chat has two repo files; queues/workers exist in both `services/` and `v2/infra`).
- **Dead/transitional code:** `routes/calendar/old-call.js`, the unreachable block after the early `return` in legacy `LanguageProvider.jsx`, commented-out queue call in `client-image-session.js`, debug `logToMd` localStorage logger in `v2/lib/api/ApiFetch.js`.
- **Broken import** in `v2/infra/workers/pdf.worker.js` (`services/main/clientServices.js`).
- **Font path fragility** — `services/utilityServices.js` loads fonts via `path.join(__dirname, "./fonts/...")` at module load; any file move breaks PDF rendering at startup.
- **`postinstall` runs `prisma migrate deploy && node initData.js`** automatically — risky to run in arbitrary environments.
- Secrets are correctly read from env (`v2/config/env.js`, `services/links.js`) — no hardcoded credentials found in scanned config; but a large surface of env vars with weak/`undefined` defaults (e.g. `MAX_FILE_SIZE`) and the `SECRET_KEY` fallback path.

---

## 9. Tech Stack & Versions

### Backend (`server/package.json`, `"type": "module"`)
| Concern | Package | Version |
|---|---|---|
| Runtime | Node | (no `engines` declared) |
| Web | express | ^4.21.2 |
| ORM | @prisma/client | ^6.9.0 |
| DB | MySQL (Prisma datasource) | — |
| Queues | bullmq | ^5.54.0 |
| Redis | ioredis ^5.6.1 + redis ^5.11.0 | — |
| Realtime | socket.io ^4.8.1 (+ socket.io-client ^4.8.1) | — |
| Uploads | multer ^1.4.5-lts.1, multer-sftp ^1.1.1, basic-ftp ^5.0.5, ssh2-sftp-client ^12.0.1 | — |
| Images | sharp ^0.34.5, canvas ^3.2.0 | — |
| PDF | **pdf-lib ^1.17.1**, **pdfkit ^0.17.1**, fontkit ^2.0.4 | — |
| Arabic | arabic-persian-reshaper ^1.0.1, bidi ^0.0.1, bidi-js ^1.0.3 | — |
| Auth | jsonwebtoken ^9.0.2, bcrypt ^5.1.1, express-rate-limit ^8.3.2 | — |
| Validation | zod ^4.3.6 | — |
| Telegram | telegram (GramJS) ^2.26.22, input ^1.0.1 | — |
| Mail | nodemailer ^6.9.16 | — |
| Payments | stripe ^18.0.0 | — |
| Google | googleapis ^150.0.1 | — |
| Cron | node-cron ^4.1.0, node-schedule ^2.1.1 | — |
| Misc | dayjs ^1.11.13, date-fns ^4.1.0, lodash ^4.17.21, exceljs ^4.4.0, xlsx ^0.18.5, axios ^1.7.9, uuid ^11.1.0 |
| Scripts | `dev`: `nodemon index.js` · `dev:v2`: `nodemon v2/server.js` · `postinstall`: prisma migrate deploy + initData |

### Frontend (`ui/package.json`)
| Concern | Package | Version |
|---|---|---|
| Framework | next | ^16.0.7 (App Router, `--turbopack`) |
| UI lib | react / react-dom | 19.2.1 |
| Components | @mui/material | ^7 |
| Styling | @emotion/react | ^11.14.0 |
| RTL | stylis-plugin-rtl | ^2.1.1 |
| Forms | react-hook-form | ^7.54.2 |
| Realtime | socket.io-client | ^4.8.1 |
| Dates | dayjs | ^1.11.13 |
| Scripts | `dev`: `next dev --turbopack` · `build`: `next build` · `start`: `next start -p 4001` |

> Note: `axios` and `@mui/x-data-grid` are NOT in `ui` dependencies — the frontend uses a custom `ApiFetch` (`v2/lib/api`) and likely a custom/MUI table, not the X DataGrid. Worth confirming in the plan.

---

*End of audit.*
