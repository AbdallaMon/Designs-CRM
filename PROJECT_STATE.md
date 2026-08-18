# PROJECT STATE — Dream Studio Migration

> **Open this file in any new chat.** It tells you what we are doing and where we have reached.
> To resume: *"Read `PROJECT_STATE.md`, `CLAUDE.md`, and `docs/migration/`, then tell me where we are and what's next."*
>
> Last updated: **2026-08-18** · Branch: `feat/workstage-flow-redesign`
>
> **LATEST (2026-08-18) — legacy notification dashboard-link backfill added ✅.**
> `npm run notifications:normalize` now scans `Notification.content` and `Notification.link`
> in bounded batches and rewrites only legacy `dreamstudiio.com/dashboard/...` URLs to an explicit
> `--to-origin` (or `DASHBOARD_ORIGIN`). It is dry-run by default, writes a mode-0600 JSON audit
> report, and requires both `--apply` and `--backup-confirmed` before changing rows. Public-site URLs
> outside `/dashboard` and already-migrated links remain untouched. Verification: **7/7 focused
> notification/upload normalization tests**, script syntax check, and `git diff --check` passed.
>
> **LATEST (2026-08-18) — persisted lead uploads no longer fail on optional integrations; Courses origin/build verified ✅.**
> Lead file and note creation now return their saved record even if Telegram queueing or the related
> notification fails; those failures are logged as one concise error line and no synchronous Telegram
> channel lookup can turn an already-saved upload into an HTTP error. Routine Telegram cron/worker
> progress and full BullMQ job-object logs were removed, while failure logs remain. CORS now merges the
> explicit per-frontend origins (including `COURSES_ORIGIN`) with `ALLOW_ORIGIN` instead of letting the
> CSV replace them. The current Courses source/build uses `/v2/auth/me` and embeds the configured
> `NEXT_PUBLIC_API`; a browser call to the legacy `/auth/status` proves that the server is serving a stale
> pre-port `.next` bundle and requires a production rebuild before its PM2 restart. Verification:
> **33/33 focused tests**, server syntax checks, Courses production build, generated-bundle URL inspection,
> and `git diff --check` passed. No schema, migration, database, permission, or PDF behavior changed.
>
> **LATEST (2026-08-18) — logout recovers from stale CSRF state without a 403 ✅.**
> Both the CRM and Courses API clients now fetch a fresh CSRF token before `POST /auth/logout`,
> so logout clears the server session on its first attempt instead of sending a stale cached token.
> Any other authenticated mutation that receives the precise `FORBIDDEN / csrf token mismatch`
> response refreshes the token and retries exactly once; origin denials are never retried or hidden.
> The backend CSRF policy and logout permission/session revocation remain unchanged. Verification:
> **20/20 focused client + server CSRF tests**, targeted lint in both web workspaces, both production
> builds, and scoped `git diff --check` passed. No permission, endpoint, backend, schema, migration,
> database, or PDF behavior changed.
>
> **LATEST (2026-08-18) — Kanban infinite-scroll loading and recovery states fixed ✅.**
> Kanban columns no longer show `Loading more...` while idle or assume that an exact
> 20-item page has another page. The API-reported total now determines pagination, scroll-bottom
> detection tolerates fractional browser dimensions, and duplicate scroll triggers are guarded.
> When more data exists, the column exposes a manual `Load more` fallback; an unsuccessful next-page
> request keeps the existing cards visible and shows `Retry loading more`, while first-load failures
> retain their full-column retry state. Verification: **25/25 Kanban tests**, targeted lint, the main
> web production build, and scoped `git diff --check` passed. Authenticated browser QA remains manual
> because no signed-in browser session is available. No endpoint, backend, permission, schema,
> migration, database, or PDF behavior changed.
>
> **LATEST (2026-08-18) — Kanban triage and project-type clarity redesign ✅.**
> Deals, All Projects, and every Work Stage board now have a compact status navigator with visible
> Previous/Next controls, clickable status pills, smooth column centering, and contextual empty states.
> Deal cards promote one next client action with overdue/missing-follow-up treatment; All Projects
> promotes the current contract stage; both use one latest-activity/age summary instead of expanded
> call history. Finalized project updates show only the newest summary and open complete history in the
> existing responsive dialog. Work Stage cards retain progress, aging, tasks, and delivery signals while
> explicitly showing when no next task/delivery exists. `/dashboard/projects/:id` now opens with a prominent
> readable Project Type header (including project ID/group) and repeats the type in its metadata row.
> Safety checkpoint: `fe900202`. Verification: **17/17 focused tests**, targeted lint for the new/changed
> Kanban and project-type code, the main web production build, and scoped `git diff --check` passed; authenticated
> browser screenshot QA remains manual because the available test browser had no signed-in session. No endpoint,
> permission, backend, schema, migration, database, or PDF behavior changed.
>
> **LATEST (2026-08-18) — optional Telegram file buttons and automatic bot membership ✅.**
> When `TELEGRAM_BOT_TOKEN` is configured, the existing user-session integration now invites the
> bot into each newly created lead megagroup and repairs missing membership before sending a file.
> Lead files are sent by the bot with an inline `Open File` URL button while preserving the existing
> uploader, filename, and description text. Stable attachment buttons use the public
> `ASSET_DELIVERY_ORIGIN` (an HTTPS tunnel is required for local Telegram testing), and safe Bot API
> failure descriptions remain visible in server logs. Missing configuration or any bot/API failure falls back
> to the existing authenticated Markdown link, so channel creation and file notifications continue
> without interruption. Verification: **12/12 Telegram tests**, Node syntax checks, and repository
> `git diff --check` passed. No schema, migration, database, permission, upload-storage, attachment-
> authorization, or PDF behavior changed.
>
> **LATEST (2026-08-18) — Lead Kanban cards use the compact Image Sessions action ✅.**
> Deals and All Projects cards now place the existing accessible Image Sessions icon in the card-header
> action group beside Preview, matching Work-stage cards and removing the full-width `View Sessions`
> button from Kanban cards. Detail/dialog surfaces retain the full button. Verification: **6/6 focused
> Kanban/Image Session tests** passed. No navigation, permission, backend, schema, migration, database,
> or PDF behavior changed.
>
> **LATEST (2026-08-18) — Deals and Work Stages filters compacted; department-access shortcut added ✅.**
> The shared Kanban filter surface now uses small controls, a responsive search grid, and a contained
> secondary-filter row, so Deals keeps every existing date/contract-level filter while all Work Stages
> routes inherit the same cleaner layout. Mobile date pairs auto-fit side by side when space permits
> without horizontal overflow. Update cards now expose an accessible quick settings icon that opens the
> existing department authorization dialog for the same creators/admins who could already manage access.
> Verification: **7/7 focused UI tests**, the main web production build, responsive visual QA at 1440px
> and 390px, and scoped `git diff --check` passed. No filter/query behavior, permission, endpoint, backend,
> schema, migration, database, or PDF behavior changed.
>
> **LATEST (2026-08-18) — Contract stage chain hardened + audited admin repair ✅.**
> The existing signature → 2D Study → 3D → Final Plans → Quantity contract-level outcome is
> preserved, but transitions now complete the exact active level transactionally and start the
> next configured stage by order, skipping omitted levels safely. Repeat completion is idempotent,
> terminal stages close correctly, and all matching active contracts in the same lead/project group
> advance independently; cancelled contracts never advance. Stage activation still creates/upserts
> an internal delivery schedule at `startDate + deptDeliveryDays` in **calendar days**. The broken
> `ContractStage.createdAt` recalculation was replaced by `startDate` with a legacy schedule fallback,
> and schedules from cancelled/not-started contract stages are hidden without deleting history.
> ADMIN/SUPER_ADMIN now have a dedicated `contract.stage.override_status` action with a required
> reason, whole-chain reconciliation, lead scope + child ownership checks, and a
> `CONTRACT_STAGE_STATUS_OVERRIDDEN` audit event; the normal stage edit still cannot change status.
> Design/plan: `docs/superpowers/{specs,plans}/2026-08-18-contract-stage-chain-hardening*`.
> Verification: **82/82 focused workflow/permission/schedule tests**, the full repository suite
> (**1340/1340 across 164/164 files**), touched `StageRow` lint, and the main web production build
> (**45 routes**) passed. No schema, migration, database, or PDF behavior changed.
>
> **LATEST (2026-08-18) — Work-stage View Lead Details icon remains visible for Admin, Super Admin, and 3D Designer ✅.**
> The shared Kanban card header was rendering the full-width Image Sessions button for exactly these profiles,
> which pushed the Preview and Actions icons outside narrow cards. Kanban cards now use a compact Image Sessions
> icon and a non-shrinking action group, while detail/dialog surfaces keep the full button. The shared card fix
> covers the main Work stages board plus Study, Final Plans, Quantity, and Modification. Verification: **5/5
> focused component tests**, the full repository suite (**1322/1322 across 162/162 files**), and the main web
> production build passed. No permission, scope, backend, schema, migration, database, or PDF behavior changed.
>
> **LATEST (2026-08-18) — designer lead details, Image Sessions, attachments, and profile landing restored ✅.**
> The redesigned work-stage UI is preserved, while its preview now opens on Details and exposes a clear
> View Lead Details action for every in-scope card viewer, including Admin and Super Sales. Assigned 2D/3D
> designers can pass the exact lead-detail client route; server assignment scope remains authoritative.
> Image Session read/manage and durable lead-file/note downloads now accept the same assigned-project fallback,
> without granting unassigned designers or ordinary lead mutation access. The Image Session UI no longer turns
> a denial into a false empty list, and the generic attachment-error page no longer crashes at the Server/Client
> boundary. Profile switching now lands 3D on Work stages, 2D on its first Work-stage sub-link (Study fallback),
> and Sales profiles on Deals. Direct `master` parity was retained for detail data: 3D sees all lead files/notes,
> 2D sees only their own, and both see only calls assigned to themselves. Design and plan:
> `docs/superpowers/specs/2026-08-18-designer-details-image-session-profile-switch.md` and
> `docs/superpowers/plans/2026-08-18-designer-details-image-session-profile-switch.md`. Verification: **109/109
> focused tests**, **335/335 adjacent-module tests**, the full repository suite (**1317/1317 across 160/160 files**),
> and the main web production build passed. No schema, migration, database, permission grant, or PDF behavior changed.
>
> **LATEST (2026-08-18) — Projects board contract-level filter added ✅.**
> `/dashboard/projects` now exposes the same Contract Level selector used by Deals. Because
> the Projects board columns are themselves contract levels, choosing a level narrows the
> board to that single column and clearing the filter restores every level, avoiding duplicate
> cross-column results. Verification: **3/3 focused filter tests**, the main web production
> build, and scoped `git diff --check` passed. No backend, schema, migration, permission,
> contract-stage automation, delivery-schedule, or PDF behavior changed.
>
> **LATEST (2026-08-18) — Arabic image-session step navigation order fixed ✅.**
> The shared bottom step navigation now follows the page's RTL direction naturally, placing Previous
> on the right and Next on the left in Arabic while preserving the existing English layout. No tests
> were run per user request; no backend, schema, migration, permission, or PDF behavior changed.
>
> **LATEST (2026-08-18) — design-session PDFs can use a dedicated page frame ✅.**
> Per explicit user authorization to change the frozen image-session PDF behavior, Website Utility now
> exposes `General PDF Intro`, `Contract PDF Frame`, and `Design Session PDF Frame`. The new nullable
> `SiteUtility.imageSessionPdfFrame` schema field is used by image-session PDFs, with `pdfFrame` and then
> the shared default as fallbacks; the shared intro remains unchanged for both contracts and image sessions.
> Every non-intro image-session page also receives 30 points of additional top spacing. Prisma validation,
> targeted Node syntax checks, and scoped `git diff --check` passed. The Prisma migration and database
> application are intentionally left to the user; no permission or contract-PDF behavior changed.
>
> **LATEST (2026-08-18) — public booking hides booked/past slots and handles timezone days correctly ✅.**
> Client slot queries now retain their client-only predicates when a date is supplied: only
> unbooked, unreserved slots whose start time is still in the future are returned. Selected-day
> boundaries are calculated from the client's IANA timezone using local midnights (including DST),
> and final reservation rejects past, cross-owner, wrong-local-day, and concurrently claimed slots.
> A stale slot-details/booking 409 now displays the resolved English message, refreshes the slot list,
> and returns the client to time selection. Verification: **72/72 focused calendar/UI tests**, the
> full repository suite (**1300/1300 across 158/158 files**), and the main web production build passed.
> No schema, migration, database, permission, or PDF behavior changed.
>
> **LATEST (2026-08-18) — NEW leads open directly from shared search autocomplete ✅.**
> Scoped lead-search results now include the lead status. A `NEW` result carries a compact outlined
> `New lead` badge; selecting it navigates directly to `/dashboard/deals/:id` without applying it as a
> list/board filter. Every non-NEW lead and every non-lead search resource keeps the existing filter behavior.
> Verification: **40/40 focused search/utility tests**, server syntax check, and the main web production build
> passed. No search scope, permission, schema, migration, database, or PDF behavior changed.
>
> **LATEST (2026-08-18) — 2D/3D designer observable behavior matches `master` ✅.**
> A role-by-role sweep covered navigation/direct routes, dashboard metrics, every 2D/3D work-stage type,
> assigned and archived data scope, lead/project fields, project/task actions, chat, and work-stage activity.
> Two migrated permission gaps were fixed: assigned designers can again move their own non-terminal project
> status, and the assigned work-stage lead again exposes working notes, calls, and file uploads. Both use
> assignment-scoped server checks; designers still cannot mutate ordinary lead fields, manage designer
> assignments, see another designer's projects, or enter admin/accounting surfaces. The legacy delete time
> window and all existing terminal-status guards remain enforced. Design/spec and plan:
> `docs/superpowers/specs/2026-08-18-designer-master-parity-design.md` and
> `docs/superpowers/plans/2026-08-18-designer-master-parity.md`. Verification: **36/36 focused parity tests**,
> **378/378 designer-adjacent project/lead/dashboard/navigation/route-contract tests**, the full repository suite
> (**1292/1292 across 157/157 files**), the main web production build, server syntax checks, and `git diff --check`
> passed. No schema, migration, database, PDF, or navigation contract changed.
>
> **LATEST (2026-08-18) — concurrent access-token refresh no longer revokes the live session ✅.**
> The frontend already single-flights explicit refresh requests, but protected backend requests also perform silent
> refresh. When several requests arrived with the same expired access cookie, strict one-time refresh rotation treated
> the second in-flight request as token theft and revoked the newly issued family, causing repeated `INVALID_TOKEN`
> responses and forcing a new login. Refresh consumption now uses a Redis-atomic 30-second reuse grace window for both
> current and rollout-era legacy tokens: concurrent rotations remain valid, while reuse after the window still revokes
> the complete family. Family-revocation TTL now covers the configured refresh-token lifetime. Verification: focused
> auth/session and silent-refresh tests, the full repository suite (**1284/1284 tests across 156/156 files**), and scoped
> `git diff --check` passed. No API contract, cookie options, schema, database, permission, frontend, or PDF behavior changed.
>
> **LATEST (2026-08-18) — contract payment-condition picker now follows contract and lead scope ✅.**
> Contract creation and cloning now load payment-condition presets through a contract-context endpoint.
> The endpoint requires `contract.create` and the same lead mutate-scope check used by contract creation,
> so PRIMARY_SALES, SUPER_SALES, and other profiles can select presets only for leads they may contract.
> The admin-only site-utility management endpoint and create/edit/delete grants remain unchanged.
> Verification: **80/80 contract + site-utility tests**, **7/7 frontend/backend endpoint-parity tests**,
> the main web production build, and `git diff --check` passed. No schema, migration, database,
> permission grant, or frozen PDF-generation behavior changed.
>
> **LATEST (2026-08-18) — project designer removal fixed ✅.**
> Removing a designer no longer runs the add-path duplicate check with an undefined user ID. The assignment action
> now validates branch-specific identifiers, skips the duplicate query on removal, and verifies that the assignment
> belongs to the scoped project before deleting it. Verification: **73/73 project tests across 6/6 files** and
> `git diff --check` passed. No schema, migration, permission grant, or PDF behavior changed.
>
> **LATEST (2026-08-18) — attachment access failures now open a generic frontend error page ✅.**
> Browser requests to authenticated lead-file/note attachment links now redirect attachment-route errors only to
> the public `/error` page with a safe language-neutral code and HTTP status. The page resolves existing frontend
> message maps, so lead-scope denial displays `You do not have access to this lead`; unauthenticated users receive
> a sign-in action, and malformed or unexpected values fall back without exposing backend error text. All other
> `/v2` endpoints, including signed `/files/content/*` delivery, retain their existing JSON/error behavior.
> Verification: **36/36 focused tests across 5/5 files** and the main web production build passed. No schema,
> migration, database, permission grant, attachment authorization, upload-storage, Telegram, or PDF behavior changed.
>
> **LATEST (2026-08-18) — lead reminder result update crash fixed ✅.**
> Updating a call or meeting result no longer throws when the lead-card payload omits the corresponding reminder array.
> Reminder replacement now treats a missing collection as empty and updates lead state immutably. Focused verification:
> **2/2 tests**, the main web production build, and `git diff --check` passed. No API, schema, permission, or PDF change.
>
> **LATEST (2026-08-18) — Telegram project-delivery reminder observability verified ✅.**
> The server-owned two-hour delivery cron is regression-tested to query projects through the canonical Prisma client
> and dispatch the expected Telegram reminder payload. Reminder delivery failures are no longer silently swallowed:
> they log the affected project ID and original error while preserving the existing non-throwing cron flow.
> Focused verification passed: **3/3 tests across 2/2 files**. No Telegram trigger, message content, schema,
> database, permission, or PDF behavior changed.
>
> **LATEST (2026-08-18) — deal-card preview action parity ✅.**
> Deal cards now show the direct preview eye to sales employees as well as admins; non-admin users retain
> the adjacent actions menu, so both actions remain immediately available without changing lead access or
> backend permissions. Verification: targeted ESLint and the main web production build passed.
>
> **LATEST (2026-08-18) — scoped lead search, sales project visibility, and durable attachment links ✅.**
> Shared lead search now follows `master` parity: normal/primary sales search only their owned leads,
> super-sales/admin retain their broader scope, designers remain assignment-scoped, result IDs are deduplicated,
> and every lead option displays the seven-digit lead ID plus lead code used by lead details. Sales-family users
> with access to a lead can read that lead's project list/groups for contract create/edit without gaining any
> project mutation authority. Telegram now sends durable record URLs for lead notes/files; opening one requires
> authentication, `lead.view`, and object-level lead access before a fresh short-lived asset URL is generated.
> Existing signed content URLs remain unchanged. Shared file presentation now renders images inline and PDFs or
> other documents as named open/download links across lead notes/files, price offers, contract utility/drawings,
> contract PDFs, client drawings, and payment attachments. Verification: **1260/1260 tests across 150/150 files**,
> targeted **102/102** regression tests, the main web production build, and `git diff --check` passed. Main-web
> standalone ESLint remains unavailable because the repository has no ESLint v9 flat config. No schema,
> migration, production DB, permission grant, or frozen PDF-generation behavior changed. Design and plan:
> `docs/superpowers/specs/2026-08-18-scoped-search-project-attachments-design.md` and
> `docs/superpowers/plans/2026-08-18-scoped-search-project-attachments.md`.
>
> **LATEST (2026-08-17) — PDF frame/footer cleanup and durable intro assets ✅.**
> Per explicit user authorization to change frozen PDF behavior, image-session PDFs no longer draw the hand-built
> outer/inner page borders or the footer background, border, and separator line; the Generated/date and page-count text
> remains, with `SiteUtility.pdfFrame` as the sole page frame. Contract PDFs were confirmed by code inspection to already
> use only that PDF frame and a text-only footer. Website PDF-utility uploads now persist the canonical upload reference
> instead of an expiring signed URL, so the configured intro remains available to contract generation, and image-session
> intro rendering now shares the PNG/JPEG-capable contract renderer. No schema, migration, database, or authorization change.
>
> **LATEST (2026-08-17) — contract-utility editing works on fresh unseeded databases ✅.**
> Stage, special, and level clause creation no longer fails with `CONTRACT_UTILITY_NOT_FOUND` when the required
> `ContractUtility` singleton has not been seeded. The shared resolver atomically creates an editable singleton shell
> with the schema-required obligation fields, and the obligations save uses the same race-safe upsert path. Existing
> singleton IDs and data remain authoritative. Focused verification passed: **22/22 tests across 3/3 files** covering
> obligations, all three clause families, site-utility behavior, validation, and permissions. No schema, migration,
> production database, permission, contract-PDF, or legal-default change.
>
> **LATEST (2026-08-17) — client image-session note uploads and deferred side effects fixed ✅.**
> Public client note attachments now use the existing `IMAGE_SESSION` upload purpose with the owning session token,
> matching the signature flow and backend session-scope validation, and notes persist the canonical upload reference
> instead of an expiring access URL. Telegram note/file propagation no longer sleeps inside the HTTP request; the
> existing two-second delay is carried by the BullMQ job itself. Notification/email fan-out remains worker-queued.
> Focused verification passed: **42/42 tests across 5/5 files** covering client note scope, upload validation/security,
> canonical note attachment references, and delayed Telegram queue jobs. No schema, database, permission grant, or PDF change.
>
> **LATEST (2026-08-17) — local image-session image URLs fixed ✅.**
> The shared frontend HTTPS normalizer now preserves loopback HTTP URLs (`localhost`, `127.0.0.1`, and `::1`),
> so client image-session gallery cards and previews no longer rewrite local asset URLs to unavailable HTTPS.
> Non-local HTTP image URLs continue to be upgraded to HTTPS. No backend, schema, database, or PDF behavior changed.
>
> **LATEST (2026-08-17) — accurate reminder durations and shared contract enforcement ✅.**
> Client and staff reminder emails now calculate the displayed time from the scheduled event at send time,
> round it to the nearest whole hour, and keep a minimum of `1 Hour`; the 15-minute/4-hour/12-hour delivery
> windows and notified flags are unchanged. Profile, retained role, permission, workflow, upload-purpose,
> reminder-type, API message-code, and shared form-feedback values were centralized in `@dms/shared` across
> `server`, `web`, and `courses-web`; the drifted chat filter `CLIENT` was corrected to the backend contract
> value `CLIENT_LEADS`. `npm run contracts:check` now parses all production JS/JSX/MJS and fails when these
> contract values or user-facing error literals are reintroduced manually, excluding only the frozen PDF
> subsystem. Verification: **1236/1236 tests across 146/146 files**, frontend/backend endpoint parity, both
> production builds, the contract audit, courses lint (**0 errors / 23 warnings**), and `git diff --check`
> passed. Main-web full lint remains at the documented pre-existing **143 errors / 106 warnings** while its
> production build passes. No schema, database, authorization-grant, reminder-window, or PDF behavior changed.
>
> **LATEST (2026-08-17) — eleven browser-E2E findings and completed-register refresh fixed ✅.**
> ADMIN now correctly outranks SUPER_ADMIN in management lists and every target-user mutation; lead
> detail assignment data is reduced to safe identity fields; designer navigation points only to real
> routes; lead-pool mutations refresh dependent counts; route-specific headings and assignment wording
> are correct; and the reproduced Next/MUI hydration, image, date-picker, select, grid, and hook warnings
> were repaired. Public contracts with missing utility data now render a localized safe warning without
> touching frozen PDF generation. The external `C:\coding\eng-ahmed\eng-ahmed` registration flow honors
> `?lng`, exposes accessible email errors, localizes created/uploaded toasts and every upload-progress
> state, and restores a completed success screen after refresh through a short-lived capability-protected
> status endpoint. That endpoint returns only `id`, `completed`, and `item` and denies requests without the
> matching capability; the success screen keeps Arabic/English and starts a clean registration without a
> stale lead ID. Browser verification confirmed ADMIN/SUPER_ADMIN hierarchy, the narrowed lead payload,
> the safe contract fallback, English/Arabic completed-register refresh, and the clean new-registration
> action. Verification: **1218/1218 tests across 144/144 files**, frontend/backend endpoint parity,
> main-web and courses production builds, external targeted lint/tests and production build, focused
> syntax/lint checks, and targeted diff checks passed. The full main-web lint still contains unrelated
> pre-existing repository debt documented below; no schema, migration, production DB, or PDF behavior
> changed.
>
> **LATEST (2026-08-17) — private external document storage and production cutover tooling ✅.**
> Uploads now live under one external `ASSET_STORAGE_ROOT` instead of the repository or a public
> `public_html` directory. Database values remain canonical `/uploads/<key>` references; authorized API
> responses replace exact and embedded note/HTML references with short-lived HMAC-signed
> `/v2/files/content/<key>` URLs. The public static `/uploads` mount and Next rewrite were removed,
> protected image-session catalogs require a client session token or admin permission, public funnel
> uploads remain purpose/draft-bound, PDF readers resolve canonical files locally, email/Telegram links
> receive bounded signed lifetimes, and legacy remote reads reject untrusted origins/redirects. Chat and
> document responses are private-cache only and the service worker removes its old media caches.
> Copy-first and database-normalization scripts are dry-run/idempotent, hash-verify files, reject symlinks,
> refuse conflicting overwrites, scan every Prisma String/JSON field with cursor pagination, and require
> explicit backup confirmation before writes. The user-run sequence and same-host/container mounts are in
> `docs/operations/private-upload-cutover.md`; production readiness is checked without printing secrets by
> `npm run env:check:production`. The current production file passes every check except the two intentional
> user inputs: the new `dream_studio_crm` `DATABASE_URL` and a new independent asset-signing secret.
> `BOOKING_ORIGIN` keeps its `/register` Stripe base while CORS/CSRF now derive its origin correctly. The
> external `C:\coding\eng-ahmed\eng-ahmed` registration app matches the capability/upload/source contract;
> its tests, lint, and production build pass. Verification: **1206/1206 tests across 140/140 files**, both
> CRM Next production builds, external Next build/lint, Prisma schema validation, frontend/backend endpoint
> parity, PDF smoke tests, env parity, dependency tree, and `npm audit` (**0 vulnerabilities**) passed.
> Known non-deployment QA debt remains: full main-web lint reports **150 errors / 113 warnings** in existing
> React compiler/hook rules (the production build passes), courses lint has **0 errors / 23 warnings**, and a
> local Windows `prisma generate` retry is blocked by another running Node process holding Prisma's engine
> DLL; generate remains an explicit production-container rollout step.
>
> **LATEST (2026-08-17) — courses frontend/backend validation and runtime parity hardened ✅.**
> The current `courses-web` UI was compared with `AbdallaMon/Design-courses` and keeps that established
> user-visible structure/assets while its mutation layer was repaired end to end. Pure payload builders
> now whitelist course, lesson, video, PDF, link, test, question, ordering, and homework bodies and parse
> through the real backend Zod schemas. All successful 2xx responses (including creates returning 201)
> drive the expected close/refetch/redirect behavior; structured validation details reach the user; new
> tests start as drafts and can publish only after valid questions exist. Backend course schemas now use
> strict ids, enums, numeric bounds, command bodies, and separate create/edit contracts. Learner answer
> saves report failures, ordering no longer mutates during render, untimed tests no longer auto-submit and
> still require answers, and timed tests submit only at zero. The live login smoke also fixed a reload/auth
> refresh loop, legacy Next Image warnings, and Emotion/MUI App Router hydration by adding the supported
> Next 16 cache provider. Verification: focused cross-layer, admin/staff, and endpoint
> suites **57/57**; courses lint **0 errors** (23 non-blocking legacy warnings, down from 39 errors/34 warnings);
> courses production build passed; Next route compilation reported zero issues; a clean Playwright login
> smoke rendered with zero console errors/warnings and no API requests. The repository-wide suite is
> **1185/1186**: its sole failure is outside courses in the concurrently modified upload-security test,
> which expects a missing `uploadUsecase.resolvePublicContent`. No schema, migration, production DB, main
> `web`, or frozen PDF behavior changed. Design and plan: `docs/superpowers/specs/2026-08-17-courses-validation-parity-and-reliability-design.md`
> and `docs/superpowers/plans/2026-08-17-courses-validation-parity-and-reliability.md`.
>
> **LATEST (2026-08-17) — admin assignment now completes the intake handoff ✅.**
> Individual admin assignment now treats a lead that is `NEW` or `initialConsult:false` as an intake
> handoff: the same Prisma update assigns the owner and atomically writes `initialConsult:true` plus
> `status:IN_PROGRESS`. Reassigning a later already-consulted deal preserves its current workflow
> status; staff self-claim does not gain authority to mark a non-consulted lead as consulted, and the
> existing ON_HOLD reclaim behavior is unchanged. The assignment response now includes
> `initialConsult` alongside status/assignee. Verification: the complete leads-module suite passed
> **145/145 tests across 16/16 files**. No frontend, schema, database-migration, or PDF change.
>
> **LATEST (2026-08-17) — external register email-validation/resume mismatch fixed ✅.**
> A capability-bound `/register` resume in `C:\coding\eng-ahmed\eng-ahmed` previously used the numeric
> `leadId` as a truthy substitute for the already accepted email, then resent that value to
> `complete-register`; the CRM correctly returned `422 VALIDATION_ERROR` for an address such as `"77"`.
> Draft-existence state is now separate from the email value, the completion request no longer resends
> email, and both external email-entry paths use the same practical format rule as the CRM register
> schema. On the backend, `complete-register` strips legacy email keys because the capability-bound
> usecase neither reads nor updates email; initial registration still requires and validates it.
> Verification: focused CRM public-lead tests **11/11**, external email-contract tests **2/2**, targeted
> external lint passed, and the external Next production build passed. No schema, database, or PDF change.
>
> **LATEST (2026-08-17) — fresh local database migration + runtime connection alignment ✅.**
> The public-lead `P2022` was caused by two local env files targeting different database servers:
> the running server still used the old MySQL `design-system` schema without `ClientLead.source`, while
> Prisma migration commands targeted the new MariaDB `dream_studio_crm` schema. `server/.env` now uses
> the same local connection as `packages/db/prisma/.env`; all 10 canonical migrations were deployed to
> `dream_studio_crm`, Prisma Client was regenerated, and a real `prisma.clientLead.findFirst()` succeeds.
> The migration SQL already uses PascalCase identifiers (`ClientLead`); this MariaDB instance reports
> `lower_case_table_names=1`, so it intentionally stores/displays physical table names in lowercase and
> Prisma migrations cannot override that server setting. Verification: migration status up to date,
> schema validation passed, 119 tables with the required `source` default, env parity passed, and focused
> public-lead tests **10/10**. No production database was touched and the fresh local database was not seeded.
>
> **LATEST (2026-08-16) — public-funnel source, external booking compatibility, concurrency, and dependency fixes ✅.**
> `ClientLead.source` is now a required origin string with DB default
> `https://booking.ahmadmobayed.com`; both public lead funnels send `window.location.origin`, the
> backend validates/normalizes it, and CRM lead preview renders a safe HTTP(S) source link. The
> canonical migration `20260816192802_add_client_lead_source` was generated and verified against a
> disposable fresh database, which was then removed. The external
> `C:\coding\eng-ahmed\eng-ahmed` register/booking app now uses the canonical `/v2` paths, envelope,
> capability headers, upload exchange, and booking action endpoint; capabilities stay in same-tab
> memory/session storage and never enter URLs. Cookie-independent public mutations are explicitly
> CSRF-exempt, while public completion and booking submit use transactional single-winner claims.
> Upload/admin-import validation now emits message codes. The vulnerable `xlsx` dependency was
> removed, Excel import uses tested ExcelJS parsing, and patched `uuid@11.1.1` is enforced with a
> fail-closed upstream-manifest compatibility patch. A real integration-credential master key is in
> ignored runtime env files and examples contain placeholders only. Verification: **1173/1173 tests
> across 134/134 files**, both CRM Next builds, external register lint + production build, Prisma
> validate/generate, clean install, `npm ls --all`, `npm audit` (**0 vulnerabilities**), env parity,
> targeted lint, and both diff checks passed. The frozen `report-pdf.js` raw JSON fallback remains an
> explicit contract exception because changing it would violate the repository's PDF behavior lock.
> The existing local developer DB still has unrelated encryption-migration history drift; it was not
> reset or manually altered, so that local history must be reconciled before running `migrate dev`.
>
> **LATEST (2026-08-16) — Prompt 13 environment/tooling gate ✅; review blockers remain.**
> The safe examples now mirror the authoritative key names and order in `server/.env`, `web/.env`,
> `courses-web/.env.production`, and `packages/db/prisma/.env`; `npm run env:check` verifies that
> parity without reading values. Next 16 lint now runs through ESLint for both frontends, and shared
> JSX-bearing `.js` modules were safely renamed to `.jsx`, removing the Vitest/Rolldown parse failure.
> Verification: **1156/1156 tests** across **130/130 files**, both Next production builds, Prisma
> validate/generate, `npm ls --all`, env parity, and `git diff --check` passed. Lint is operational
> but not green: `web` has **158 errors / 119 warnings** and `courses-web` has **39 errors / 34
> warnings** in existing source. Review also found two deployment/integration blockers that were not
> silently changed: the new encrypted Google/Telegram write path requires
> `INTEGRATION_CREDENTIALS_MASTER_KEY`, which is absent from the authoritative backend env, and the
> external `C:\coding\eng-ahmed\eng-ahmed` register/booking client does not yet implement the new
> public-funnel capability/header/upload/action contract. No live env value or frozen PDF logic changed.
>
> **LATEST (2026-08-16) — lead edit permissions/state, assignment notifications, ON_HOLD pool, and notes route ✅.**
> Lead/client inline edit affordances now follow the exact `admin_residual.lead.edit` and
> `admin_residual.client.edit` permission codes, and successful name/phone/finalized-date writes merge into both the
> open detail and list state immediately. Individual admin assign/convert-to-user now notifies the recipient in
> addition to admins. The lead-pool page exposes **New non-consulted → New consulted → On hold leads** through explicit
> `lead.pool.*.view` permissions; the backend enforces the matching query access and suppresses unauthorized summary
> counts. The shared Notes component now maps its legacy `shared` slug to canonical `/v2/notes`, fixing
> `POST /v2/shared/notes → 404 NOT_FOUND`. Verification: focused tests **23/23**, expanded lead/shared-permission tests
> **220/220** across **26/26 files**, `web` production build passed, and `git diff --check` found no whitespace errors.
> No schema, production database, or frozen PDF change.
>
> **LATEST (2026-08-16) — profile settings persistence + Google connection state ✅.**
> Fixed the migrated user-profile endpoint dropping `allowNotification` and `allowEmailing` on writes and omitting
> both values from reads; the safe profile projection now also returns the non-secret `googleEmail` identity. The
> profile dialog now derives Google connection state from the dedicated self-scoped
> `GET /v2/calendar/google/status` response (refresh-token presence) and refreshes it on open, callback, disconnect,
> and an already-connected response, so a connected user sees the Disconnect action immediately. Inline profile
> errors now read the current flat frontend error shape. Added repository-projection and self-edit regression tests.
> Verification: focused profile/calendar tests **74/74**, `web` production build **44/44 routes**. The full Vitest
> run executed **936/936 tests green** across **97 passing suites**; one unrelated existing frontend suite failed
> before collection because Vitest/Rolldown does not parse JSX in `web/src/app/helpers/constants/ui.js` under its
> current `.js` loader configuration. No schema, production database, or frozen PDF change.
>
> **LATEST (2026-08-16) — lead consultation notification lifecycle + safe missing-detail actions ✅.**
> Publicly registered leads remain `initialConsult:false`, and their creation/registration notifications now target
> active ADMIN/SUPER_ADMIN profiles only. The first successful `false→true` consultation transition emits a separate
> `NEW_LEAD` notification to active NORMAL_SALES/PRIMARY_SALES/SUPER_SALES profiles, without duplicating it on repeated
> writes. The sales claimable pool now requires `initialConsult:true`, so a hidden non-consulted lead cannot surface a
> Start/Take Deal action. The preview also clears stale lead data before every detail request and ignores superseded
> responses, preventing actions from a previously opened lead appearing on a missing/denied record. Lead-pool tabs are
> now ordered **New non-consulted → New consulted → Overdue**. Verification: focused lifecycle/scope tests **14/14**,
> full server suite **821/821** across **77/77 files**, and `web` production build **44/44 static pages**. No schema,
> production database, or frozen PDF change.
>
> **LATEST (2026-08-02) — production configuration + one-command migration-history reconciliation ✅.**
> The duplicate main-web `CRM_ORIGIN` setting was removed from the backend, CORS fallback, Stripe/registration
> links, notifications, and Telegram connection allow-list; `DASHBOARD_ORIGIN` is now the single canonical
> main-web origin. `CRM_DOMAIN` remains intentionally separate as the root-relative PDF/upload asset base.
> Complete Git-ignored production files now exist for the backend, Prisma, `web`, and `courses-web`; they cover
> every active example key, contain no local/placeholder URLs, and preserve configured secrets without committing
> or printing them. The backend production file also adds distinct generated upload/backfill secrets and corrects
> the Google callback to the canonical `/v2/calendar/google/callback` URL. Migration-history reconciliation is now
> one idempotent metadata-only command: `npm run db:resolve`. It marks the four baseline migrations applied, skips
> Prisma `P3008` for already-recorded migrations, fails closed on every other Prisma error, and deliberately does
> not run deploy/generate/status. Verification: resolver tests **3/3**, dry run clean, full Vitest suite green,
> `web` production build **44/44 routes**, and `courses-web` production build **8/8 static pages** plus dynamic
> routes. No production database command was executed.
>
> **LATEST (2026-07-29) — Security, profile-only identity, canonical API, uploads, contracts, and courses cutover ✅.**
> Completed `docs/superpowers/{specs,plans}/2026-07-29-security-profile-only-cutover*`.
> **Authorization:** the active relational profile is now the sole runtime identity; auth fails closed when it is
> absent/invalid, and backend runtime code no longer reads or falls back to `role`, `subRoles`, `isPrimary`, or
> `isSuperSales`. ADMIN/SUPER_ADMIN profiles receive every explicit permission code and pass object-scope checks.
> Obsolete role-derived boot/user backfills and role-permission compatibility code were removed; retained schema
> columns remain untouched and are stripped from profile output. **Security:** utility search, notes, and the
> compatibility delete surface are permission/scope checked; arbitrary client cascades and obsolete delete adapters
> were removed. **API/contracts:** `/v2` is the only application mount; both frontends use canonical endpoints and
> the uniform coded-error envelope. Accountant payment-level payload now matches backend validation. Active contract
> CRUD/workflow data access lives in the contract module; frozen PDF rendering logic was not behaviorally changed.
> **Uploads:** public contract/image/chat/calendar/lead uploads require short-lived purpose/session-scoped signed
> capabilities verified before multipart parsing; internal PDF upload uses its own signed capability. **Courses:**
> frontend calls align with `/courses` + `/staff-courses`, course access is user/profile based, the UI is English,
> and the unused Arabic embedded/Google-font dependency was removed. **Verification:** Vitest **936/936** across
> **96/96 test files**; `web` production build **44/44 routes**; `courses-web` production build **8/8 static pages**
> plus its dynamic routes; canonical Prisma schema validates. Source gates found no runtime retained-identity reads,
> no compatibility path translator/old runtime names, and no Arabic text in `courses-web/src`.
> **Deployment prerequisite:** every existing user must already have at least one `UserProfile` and a valid
> `currentProfileId`; profileless users are intentionally denied and there is no role-derived fallback/backfill.
> The existing user-run production migration reconciliation runbook remains operationally pending. No schema change
> or production database action was performed in this work.
>
> **Final contract follow-up (2026-07-29):** all **355** production `AppError` calls now use the single object
> constructor and language-neutral message codes; the positional compatibility constructor was removed. HTTP and
> rate-limit responses now share one `{ success, message, data, translationKey }` envelope, including booking leads,
> Telegram auth, chat socket errors, reports, and admin lead imports. The final report pages were moved onto the shared
> frontend API client. The runtime `LEGACY_DASHBOARD_ORIGIN` name was replaced by `DASHBOARD_ORIGIN` with no fallback.
> AST/source gates report zero positional `AppError` calls, zero prose/raw top-level helper messages, zero direct
> `res.json`/`res.send` application responses, and zero first-party API `fetch` calls outside the shared frontend
> clients. Focused contract tests are **29/29**; the full result remains **936/936**. Both production frontend builds
> and Prisma validation pass. **Remaining code work for the agreed critical-fix scope: none.** Remaining work is
> deployment-only: configure `DASHBOARD_ORIGIN` in the deployed environment; confirm `UserSubRole` is empty and every
> user has a valid profile/current-profile relation; run the documented production migration reconciliation; then
> smoke-test authenticated flows against real DB/storage/email services in staging.
>
> **Environment templates (2026-07-29):** four safe, copy-ready templates now define the active configuration
> surface: root `.env.example` (backend; copy to `server/.env`), `packages/db/prisma/.env.example`,
> `web/.env.example`, and `courses-web/.env.example`. No live secret values are present. The mail transports now
> honor the documented `SMTP_PORT`/`SMTP_SECURE` settings through the central loader; the person-specific
> `AHMED_EMAIL` key was replaced by `CLIENT_EMAIL_FROM` with no fallback; unused FTP/bot/phone/`SECRET_KEY`/
> `COURSES_DOMAIN` loader entries were removed. The web Docker build now receives `NEXT_PUBLIC_COURSES_URL` and
> `UPLOADS_ORIGIN`, and its local upload fallback uses standard `NODE_ENV` instead of the lowercase `local` key.
> Verification remains **936/936** tests plus successful `web` and `courses-web` production builds.
>
> **LATEST (2026-07-17) — Profiles as single source of truth (auth boundary) + profile-switcher rebuild ✅.**
> Spec/plan `docs/superpowers/{specs,plans}/2026-07-17-profile-single-source-of-truth*`. Fixes the reported
> "the profile-switch tab disappeared" (it correctly hid — the account held 1 profile) AND the real bug behind it:
> `role` and the active profile were two competing sources that diverged on a self-switch. **Backend:** `role`/
> `activeRole` are now a DERIVED VIEW of the active profile's `baseRole` via new `AuthSchema.activeBaseRole` (resolves
> the EFFECTIVE `currentProfileId`, so the login/refresh correction path can't read a stale `currentProfile`);
> `toMe`/`toTokenPayload` return `subRoles: []`; `+baseRole` in `USER_PROFILES_SELECT`. **`@dms/shared`:** dropped the
> transitional `subRoles`/`isSuperSales` unions from `getEffectivePermissions` + the `isSuperSales→SUPER_SALES` nav
> fallback (dead on every live path — main auth resolves from the profile cache, `isSuperSales` isn't in the token);
> 8 test files migrated from subRole/flag fixtures to profile fixtures. **Frontend:** the toolbar chip IS the switcher
> now (`ProfileSwitcher.jsx`, caramel identity, MUI Menu; caret+menu only when holding >1 profile, static chip for 1,
> legacy label for 0) → `POST auth/profile/switch` → `refetchMe()`; `roleLabel` + drawer footer derive from the active
> profile's label via new `activeProfileLabel` helper; deleted legacy `UserRoles.jsx` (localStorage role-fake).
> **Verified: full suite 995/995 green + `next build` OK (44 routes).** Schema untouched, `User.role`/`UserSubRole`
> columns kept (frozen); complementary to the designer-picker DISCOVERY-axis fix below (that = held profiles; this =
> active-profile boundary). **⚠ Before prod deploy:** user runs `SELECT COUNT(*) FROM UserSubRole` and the
> profileless-users check — both must be `0` (see spec §5).
>
> **PRIOR (2026-07-17) — Work-stage preview bug-fix batch + designer-picker profile fix ✅.**
> Four reported issues on the work-stage/designer surface. **(1) Silent 500 on designer assign:** the projects
> flows/task layers still threw raw `new Error()` (8 sites), which skip the `AppError` branch in the global
> error-handler and collapse to "Internal server error" — so the real reason ("designer already assigned", status
> guard, not-in-modification, etc.) never reached the FE. Converted all 8 to `AppError(code, status)`; added 4 new
> message codes (`PROJECT_GROUP_TITLE_REQUIRED/_DUPLICATE`, `CLIENT_LEAD_NOT_FOUND`, `TASK_ACCESS_DENIED`) to
> `@dms/shared` + the FE `projectsMessages` map (`DESIGNER_ALREADY_ASSIGNED` etc. already existed but were never
> thrown). **(2) Designer picker missed multi-profile users:** `user.repo.js findDirectory` matched only legacy
> `role`+`subRoles`; a designer holding DESIGNER_3D **and** DESIGNER_2D whose ACTIVE profile is 3D has
> `role="THREE_D_DESIGNER"` (write-synced from the active profile) and no subRoles, so he vanished from 2D projects.
> Fix: new `matchClausesForRole()` also matches `userProfiles.some.profile.baseRole` (held profiles = source of
> truth) — deduped across role+subRoles+profiles; `exactRole` keeps dropping the loose subRole clause but keeps
> profile matches; `DIRECTORY_SELECT` now returns `userProfiles`. A 3D-only designer still never appears in a 2D
> list. 6 regression tests (4 fail on the old code). **⚠ This is the DISCOVERY axis** — held profiles — which the
> approved `2026-07-17-profile-single-source-of-truth-design.md` (active-profile boundary derivation) explicitly
> does NOT cover; the two are complementary. **(3) Work-stage preview now matches the deal preview:** built
> `web/src/features/work-stages/config/workStageSections.jsx` (mirrors `leadSections.jsx`) and rewrote
> `PreviewWorkStage.jsx` to render through the SHARED `LeadWorkspace` grouped rail + keyed sections (was a
> hardcoded MUI `<Tabs>` array). Dropped the dead inline status `<Menu>` (never triggered). The
> `files?.filter is not a function` crash (+ silently-broken Notes/Calls) was a MISROUTED per-tab fetch:
> `LeadDetailsContext` concatenated sub-resources onto a base url carrying `?type=`, yielding
> `.../designers/9?type=x/files` → server returned the lead OBJECT. Fixed `subResourcePath()` to splice the
> segment BEFORE the query (keeping `?type=`, which drives per-user narrowing) + coerce non-array tab payloads to
> `[]`. Added designer-scoped sub-resource routes `GET /projects/designers/:id/{notes,call-reminders,files}`
> (same object-scope as the detail; the lead routes can't be reused — they need lead `P.VIEW` designers lack),
> sliced from the already-scoped detail. **(4) React DOM prop warnings** (`statusColor`/`groupId`/`active`/
> `button` etc.): added `shouldForwardProp` to the Kanban + projectDetails styled() components and replaced the
> MUI-v7-removed `<ListItem button>` with `<ListItemButton>` in `RelatedLinks.jsx`. **Verified: full suite
> 1019/1019 green + `next build` compiled OK.** Remaining: the full ~90-site legacy-role→profile sweep is
> phased-later (user chose "bugs first"); end-state decision = stop reading AND stop returning `role` to the FE
> (needs `layout.jsx:703` + 12 page shells de-`role`d first, else the dashboard blanks).
>
> **PRIOR (2026-07-17) — Price-offers tab layout + contract-list UI/UX redesign ✅ (frontend-only).**
> Spec `docs/superpowers/specs/2026-07-17-price-offers-tab-contract-list-redesign-design.md`. The lead-detail
> **Price offers** tab was two clashing visual systems; contracts (tall, variable) were crammed into a 320px inner
> scroller with the first auto-expanded. Reordered per user: **price offers on top** in the shared `TabSection`,
> capped at `maxHeight:300` and scrolling inside themselves (small uniform cards); **contracts below, bare** — no
> frame, no "Contracts" heading, no height cap (they flow and take the rest of the lead). The accordion is retired:
> each contract is now a `RecordCard` (`ContractCard.jsx`) matching the price-offer cards, with its stages drawn as a
> horizontal **pipeline stepper** (`ContractStageStepper.jsx`) instead of a grid of near-empty cards — the raw
> `LEVEL_N` key no longer leaks, and an off-convention `stage.title` falls back to a neutral node instead of crashing
> (`ChipWithIcon` palette lookup now guarded). `Decimal?` amounts are `Number()`-coerced before `toLocaleString()`
> (string `.toLocaleString()` was a silent no-op). Deleted: `ContractAccordion.jsx`, `ContractStage.jsx`, a dead
> `openEdit`/`handleEditOpen` path, a stray `console.log`. **Decision (user):** contract level names **stay Arabic**
> (master's retained strings); `nameEn` left unused — do NOT Arabize→English here. `FinalizeModal`/`ViewContract`/
> backend untouched (`LeadContractList`'s `finalModal` picker path preserved). **Verified: `next build` compiled OK.**
>
> **PRIOR (2026-07-16) — In-app notifications now delivered via BullMQ queue ✅.**
> The module-tier `createNotification` (`modules/notifications/notification.usecase.js` — the choke point all
> `infra/notifications/senders/*` funnel through) now only **enqueues** to a new `notification-queue`
> (lazy `getNotificationQueue()` — no Redis connection at import, so tests/boot stay clean); the legacy fan-out
> (recipient resolution → DB row → socket emit → deferred email) moved **verbatim** into `deliverNotification`,
> processed by a new `notification.worker.js` (registered in `start-workers.js`, gated by `RUN_WORKERS` like the rest).
> Call sites unchanged (28 across senders). The telegram tier's private `createNotification` copy
> (`infra/telegram/functions/telegram-notification-dispatch.js`) is intentionally untouched. ⚠️ Documented deliberate
> behavior change vs master: notification side-effects are now async post-response and a delivery failure no longer
> fails the request (BullMQ retries instead). Cross-instance socket delivery already covered by the ioredis
> socket pub/sub adapter. **Verified: TDD (7 new tests) + full suite 996/996 green.**
>
> **PRIOR (2026-07-16) — My Day + Deal Preview productivity pass ✅ IMPLEMENTED (all 4 phases).**
> Spec `docs/superpowers/specs/2026-07-15-my-day-preview-productivity-pass-design.md`, plan
> `docs/superpowers/plans/2026-07-15-my-day-preview-productivity-pass.md`. **(A) Truth fixes:** preview payment
> chip now renders `ContractPayment`-derived `health.payment` (hidden pre-contract; the inert
> `ClientLead.paymentStatus` is no longer displayed); `PAYMENT_OVERDUE` rewired to real `dueDate` aging
> (SALES + ACCOUNTANT sets, survives FINALIZED); health gains `lastActivityDays` + `nextTouch` (shown in
> DealHealthBar). **(B) Rules:** `FIRST_TOUCH_SLA` (24h warn/48h crit, suppressed by LEAD_STALE),
> `OFFER_AWAITING_DECISION` (3d), `WORK_STAGE_ASSIGNED_TO_YOU` demoted to info + FE "On track" divider.
> **(C) Ritual:** `GET /v2/my-day` gains `agenda[]` (today's + overdue calls/meetings, self-only) + FE agenda
> rail with inline outcome logging; **next-touch required-with-escape** — closing the LAST touchpoint on an
> ACTIVE lead 422s (`NEXT_TOUCH_REQUIRED`) unless `next{}` (atomic follow-up) or `noFollowUp{reason}` (lead
> note) — ⚠️ documented intentional contract change on the two reminder-status PUTs (FE dialog shipped
> together; no other caller). Queue cards gain compact health (stage/contract/payment) + counts header +
> yours-vs-team captions. **(D) Coverage + digest:** `my_day.view` additively granted to ACCOUNTANT
> (collections queue via the dormant ACCOUNTANT ruleset over DUE-payment leads) and CONTACT_INITIATOR
> (own leads + hours-ramped `POOL_FIRST_TOUCH` unclaimed pool); 08:00 Asia/Dubai personal digest cron
> (in-app + email via `sendToUser`, top-5, empty-skipped; new `MY_DAY_DIGEST` Notification_type). Plus
> contextual `MyDayStrip` (counts + top item + Open My Day) on dashboard landing, deals board, and
> work-stages — the full queue stays ONLY at `/dashboard/my-day` (placement decision: one canonical page,
> contextual pulses elsewhere). Parity addendum 2026-07-15 in `permissions-parity-matrix.md`.
> **Verified: full suite 988/988 green + `next build` compiled OK.** **PENDING (user-run):**
> `npm run db:migrate -- --name add_my_day_digest_notification_type` → `npm run db:generate` → re-run
> `node packages/db/prisma/seed.js` (so the relational ProfilePermission rows pick up the 2 new grants),
> and commit schema+migration together. Also merged in: user's own drill-down fix (null target family →
> SALES itemization instead of 403) — reviewed + tested (37/37 at the time).
>
> **LATEST (2026-07-12) — PDF assets from SiteUtility + full elimination of `legacy`-named code (branch `feat/audit-log-sales-admin`).**
> Two-phase effort (`docs/superpowers/specs/2026-07-12-pdf-assets-from-site-utility-design.md`).
> **Phase 1 (feature):** both PDF subsystems (contract + image-session) now source their **intro page, company
> signature, and full-page background** from the `SiteUtility` singleton (`introPage`/`pdfSignaturePart`/`pdfFrame`),
> each with a shared `PDF_ASSET_DEFAULTS` fallback resolved against `CRM_DOMAIN`. The image-session PDF **drops its
> per-page banner** and draws a full-page background behind the border like the contract PDF. The company signature is
> **validated at save** (`site-utility` `updatePdfConfig`): must be a PNG cropped tight to content and a safe
> root-relative CRM path — SSRF-guarded — else `422` (`SIGNATURE_MUST_BE_PNG` / `_CROPPED` / `_INVALID_PATH`).
> ⚠️ Prod check pending: confirm `CRM_DOMAIN` serves `/Pdf-intro.png` + `/dream-signature.png` (or set real `/uploads/…`
> paths), since intro/signature previously came from `dreamstudiio.com`/`COOKIE_DOMAIN`.
> **Phase 2 (cleanup):** every `legacy`-named file/folder under `server/src` was relocated to its proper home and the
> `legacy` marker dropped — `infra/config/enums.js`, `infra/notifications/senders/*` + `index.js` barrel,
> `accounting/accounting.errors.js`, `admin-residual/reports/report-{pdf,excel}.js`,
> `contracts/services/*` (frozen PDF), `image-sessions/services/client-services.js`, `projects/project/project.flows.js`.
> Behavior-preserving (same-depth moves → frozen-PDF fonts + internal imports untouched); **968 tests unchanged + all
> moved modules import at runtime.** The `legacyDefaults`/`this.legacy` DI-seam name (~40 usecases) was left intact — it
> is the repo's dominant convention, not a stray legacy file. Commits path-isolated from the concurrent session's tree.
> **Phase 3 (deeper split, behaviour-preserving):** the relocated PDF code was split by concern with better names —
> shared `PDF_COLORS` (`infra/pdf/pdf-theme.js`) + `drawFullBackgroundImage` (`infra/pdf/pdf-draw.js`) extracted from
> both PDFs (were duplicated verbatim); `image-sessions/services/client-services.js` → `generate-image-session-pdf.js`
> + `session-approval.js` + `languages.js`; `contracts/services/generate-contract-pdf.js` (2346 lines) →
> `contract-pdf-context.js` + `sections/*.js` (one file per render section) + a slim orchestrator. Functions moved
> **verbatim** (each file's imports auto-derived from the exact symbols it references); **font-embed approach untouched.**
> Added structural smoke tests that actually generate a contract PDF (ar+en) and an image-session PDF. **Verified: full
> suite 970 green + all split modules import at runtime.** ⚠️ Final byte/visual PDF diff (§4) still needs a real DB/render.
>
> **PRIOR (2026-07-12) — My Day work queue + supervisor team lens on branch `feat/audit-log-sales-admin`.**
> A new `/dashboard/my-day` screen that inverts the per-lead Deal Cockpit into a prioritized, profile-scoped
> "what needs my action today" queue. Full spec→plan→subagent-driven TDD build
> (`docs/superpowers/specs/2026-07-12-my-day-work-queue-design.md`, `docs/superpowers/plans/2026-07-12-my-day-work-queue.md`).
> **(1) New `my-day` backend module** (six-file, command-center-style) with 3 read endpoints: `GET /v2/my-day`
> (personal queue, `my_day.view`), `GET /v2/my-day/team` (supervisor exception rollup, `my_day.team.view`),
> `GET /v2/my-day/users/:userId` (drill-down, `my_day.team.view` + object-scope checker). The personal queue
> **reuses the real pure engines** (`computeCockpit` per batched lead, `computeWorkStageActions` per designer
> assignment) so the queue can never disagree with the lead detail; the team lens is aggregate exception SQL.
> **(2) Two additive permission codes** (`my_day.view` = sales tiers + designers; `my_day.team.view` = super-sales
> + admins — **admins have NO personal queue**, team lens only). Super-sales supervises the sales domain only;
> admins see sales + designers and can drill into anyone (super-sales→designer drill-down is 403-scoped).
> **(3) Three new pure-rule signals** on the existing engines: `LEAD_STALE` (5 days no activity + no future touch,
> in `lead.cockpit.js`), `DELIVERY_OVERDUE` + `STAGE_DUE_SOON` (48h window, in `lead.workstage-cockpit.js`).
> Money boundary preserved (team lens never reads Payment/ContractPayment/Outcome, like command-center).
> **(4) FE `/dashboard/my-day`** — two permission-gated tabs (My work / Team) + drill-down drawer, reusing the
> cockpit signal copy. **Verified: feature-scoped suite 289/289 green (my-day 30 + leads/lead + shared); `next build`
> exit 0.** Each of the 9 tasks was subagent-implemented + independently reviewed (all Spec✅/Approved). Additive —
> parity unchanged (`permissions-parity-matrix.md` addendum 2026-07-12). **Prereq fix landed first:** the pre-existing
> cockpit bundle selected the nonexistent `Contract.payments` relation (runtime PrismaClientValidationError) — corrected
> to `paymentsNew` across the repo select + engine reads + test fixtures.
> **NOTE:** built on a working tree **shared with a concurrent session**; every commit was path-isolated + hunk-checked.
> Integration (merge/PR) deferred to the user.
>
> **PRIOR (2026-07-11) — Profile-Aware Deal Cockpit on branch `feat/audit-log-sales-admin`.**
> The Sales Deal Cockpit now speaks to EVERY person by their **active profile** instead of going dark at `FINALIZED`.
> Full spec→plan→build→TDD (`docs/superpowers/specs/2026-07-11-*`, `docs/superpowers/plans/2026-07-11-profile-aware-deal-cockpit.md`).
> **(1)** The pure `computeCockpit` engine gained a `profileKey` input + a widened language-neutral bundle (active
> `Contract` + its `ContractStage`s/`ContractPayment`s) and a profile-scoped rule registry; the `FINALIZED` **blackout is
> removed** (only `REJECTED`/`ARCHIVED` stay action-silent) and the sales funnel rules are suppressed on closed-won deals
> (fixes the `1/10 + Finalized + "nothing to action"` contradiction). New sales signals: `SIGNING_AWAITED`,
> `CONTRACT_STAGE_IN_PROGRESS`, `AFTER_SALES_DUE`, `CONTRACT_COMPLETED` (replacing the proxy `AWAIT_SIGNATURE`); `health`
> gains `contract` + `payment` blocks (payment **derived from `ContractPayment`** — `ClientLead.paymentStatus` is inert —
> **no migration**). **(2)** Accountant rule set: `DOWNPAYMENT_DUE`/`PAYMENT_DUE`. **(3)** Designers/executor get an
> assignment-scoped `WORK_STAGE_ASSIGNED_TO_YOU` strip on their own `PreviewWorkStage` surface (pure
> `computeWorkStageActions` + a legacy `lead.projects` adapter wired into `designerLeadDetail`) — **no lead-IDOR widening,
> no legacy edit**. FE: new signal copy in `cockpitActions.jsx`, contract `LEVEL_N/7` in `DealHealthBar`, new
> `WorkStageCockpit.jsx`. **Verified: leads module 75 green (cockpit unit/usecase/integration + work-stage); `next build`
> compiled OK.** (Pre-existing, unrelated: 2 failing cases in `projects.security-fixes.test.js` — Zod strict-update schema,
> present before this work.)
>
> **PRIOR (2026-07-10) — Sales/Admin feature workstream on branch `feat/audit-log-sales-admin` (off `reorg/ref-alignment`).**
> Three new features, each spec→plan→build→review→verify (specs/plans in `docs/superpowers/`), all following the
> repo's layered conventions. **Full suite 855 green; `next build` exit 0; security + convention reviewed.**
> **(1) Action Audit Log** — new additive `ActionAuditLog` model; non-blocking `recordAction` infra (secret-redacting
> diff) wired into lead/contract/user usecases + auth-event mirror; admin-only `GET /v2/audit-logs` + `audit.log.view`
> (ADMIN/SUPER_ADMIN only) + a config-driven viewer at `/dashboard/audit-logs`.
> **(2) Sales Deal Cockpit** — `GET /v2/leads/:id/cockpit` (pure `computeCockpit` next-best-action engine, object-scoped)
> + a capability-gated cockpit strip on the deal detail (CTAs reuse existing dialogs).
> **(3) ~~Admin Command Center~~ — REMOVED (2026-07-15).** The admin-only Command Center (`command_center.view`,
> `GET /v2/command-center/overview`, `/dashboard/command-center`) was deleted at the user's request: the backend module,
> frontend feature/page, shared permission/navigation/message-code constants, message maps, and its tests are all gone.
> The status-vocabulary constants it exported (`ACTIVE_DEAL_STATUSES`, `ACTIVE_LEAD_STATUSES`, `DESIGNER_ROLES`,
> `INACTIVE_PROJECT_STATUSES`) — still needed by My Day — were relocated into `server/src/modules/my-day/my-day.repo.js`.
> Plus tech-debt fixes: chat↔socket import cycle broken (lazy import), `LOCKED_FROM_STATUSES_FOR_NON_ADMIN` deduped,
> notification icon/color key `LEAD_STATUS_CHANGE`→`LEAD_STATUS_CHANGED`, 15 raw `throw new Error(prose)` in the lead
> usecases → `AppError`+message-codes (+ stop swallowing column-status errors), and a stray `oad()` ReferenceError in
> PaymentRow removed. **PENDING (user-run):** apply the audit migration — `npm run db:migrate -- --name add_action_audit_log`
> then `npm run db:generate`, and commit `schema.prisma` + the generated migration together (agent env has no `DATABASE_URL`).
>
> **PRIOR (2026-07-10) — Ref-alignment reorganization (behavior-preserving) on branch `reorg/ref-alignment`.**
> A large file/structure reorg to match the reference monorepos (`Transaction-app` request-flow, `school-system`
> validation). **46 commits, all verified green** (backend `npm test` 733/57, `next build` OK, 0 broken imports).
> DONE: suffix rename `*.repository.js`→`*.repo.js` + `*.routes.js`→`*.route.js`; extracted shared `pagination.js`;
> **decomposed every non-frozen `legacy/` folder into proper module layers** (Prisma repo-only) and **deleted the
> `shared/legacy` barrel**; split the god-files (`admin-services.js` 2246L→10 modules; infra `legacy-notification`
> 1355L + `telegram-functions` 1149L split behind barrels; ~25 frontend god-files split, configs extracted).
> **🔴 Also fixed a real production bug**: the staged services-elimination had **71 broken lazy-import paths** (extra
> `../`) that threw `ERR_MODULE_NOT_FOUND` at runtime — masked by mock-seam tests. **The branch needs a runtime
> server smoke.** Frozen PDF tier (`contracts/legacy`, `image-sessions/legacy/client-services.js`) left AS-IS per
> §4 (no byte-diff harness). **REMAINING (one phase):** the frontend `features/` migration (relocate
> `app/UiComponents/DataViewer/*` → `src/features/*`) — a pure mechanical relocation, not yet done. Full detail:
> `docs/superpowers/plans/2026-07-09-ref-alignment-PROGRESS.md` + `…-reorg-master.md`. NOTE: this reorg is on a
> separate branch and NOT yet merged into `frontend-redesign`.
>
> **LATEST (2026-07-04) — UI language reverted to English (matching `master`).**
> The redesign had introduced ~1050 Arabic UI strings on top of `master`; these were converted back to
> English in 6 `i18n(web): …` commits (`2745493`→`24f1221`). Two surfaces: the message-resolution maps
> (`web/src/app/helpers/messages/authMessages.js` + `maps/*.js` — string VALUES → English, KEYS/codes
> unchanged, `{ success, message, translationKey }` contract intact) and inline component strings across
> `web/src/**`. Method = match `master`'s exact English (`git show master:ui/<path>`; master's FE lives
> under `ui/`, ours under `web/`), keeping only the handful of strings `master` itself has in Arabic
> (contract legal blocks `wittenBlocksData.js`, the client-facing `image-session/*` flow, `constants.js`
> status labels, SalesStage `مراحل البيع` + SalesToolsTabs captions, backend `questions.repository.js`
> SPIN seed, the `payments.stripe.js` bilingual ternary). **Backend needed zero changes** (all Arabic
> there is comments, test fixtures, master's own seed, or bilingual data). Verified: `cd web && npx next
> build` (exit 0) + `npm test` (**733/57 green**); a Unicode scan confirms no `web` file has Arabic
> beyond what `master` itself keeps. **This supersedes the earlier "single Arabic UI" decision** (§2 #5).
>
> **LATEST (2026-07-10) — Action Audit Log (admin-only trail), Tasks 1–5 (implemented on `feat/audit-log-sales-admin`).**
> Additive `ActionAuditLog` model (rich semantic trail, distinct from the authz-only `AuthAuditLog`),
> a non-blocking `recordAction` infra service + `diffFields` redact helper, and a read-only
> `/v2/audit-logs` six-file module gated by the new `audit.log.view` permission (ADMIN/SUPER_ADMIN
> only). Wired in `@dms/shared` (audit-actions codes, permission, role-permissions, profiles, nav).
> **PENDING (user-run):** the additive `ActionAuditLog` migration — `npm run db:migrate -- --name
> add_action_audit_log` then `npm run db:generate`, and commit `schema.prisma` + the generated
> migration together (the model edit is committed; the agent env has no `DATABASE_URL`, and
> `npx prisma generate` could not finish offline because the query-engine dll is locked by the
> running dev servers — backend tests run against the mocked prisma seam meanwhile). Task 6 (wiring
> `recordAction` into lead/contract/user/auth usecases) + Task 7 (frontend viewer) still to do.
> Design/plan: `docs/superpowers/specs/2026-07-10-action-audit-log-design.md`,
> `docs/superpowers/plans/2026-07-10-action-audit-log.md`.
>
> **LATEST (2026-07-03) — DB-relational permissions & switchable profiles (implemented, local-verified; prod pending).**
> Authorization moved from the code-defined role→codes map to DB tables: `PermissionCode`,
> `Profile`, `ProfilePermission`, `UserProfile` (replaces subRoles), + `User.currentProfileId`
> and an `AuthAuditLog` (additive migration `20260703194146_add_relational_permissions`, applied
> to the local dev DB; **no columns dropped** — `role`/`profile`/`isPrimary`/`isSuperSales`/
> `subRoles` retained for rollback). Effective permissions now come from the user's **current
> profile ONLY** (the one intentional divergence from master — multi-role users switch instead of
> holding a subRole union), resolved per request from an in-process **profile→codes cache** (zero
> DB read on the auth hot path; the token carries `currentProfileId` + `profileIds`; a transitional
> legacy-code-map fallback means a deploy never locks anyone out). `isAdminTier`/`isAdminUser` and
> the sidebar now follow the active profile. New: `POST /v2/auth/profile/switch` (self-service,
> audited, re-mints cookies), `PUT /v2/users/:id/profiles` + `GET /v2/users/assignable-profiles`
> (admin assign/remove, audited). `/auth/me` contract preserved + extended (`profiles[]`,
> `currentProfileId`). FE: `AuthProvider` exposes profiles + `refetchMe`; a header **ProfileSwitcher**;
> an admin **ProfileManagerDialog** on the Users page; Arabic message mirror added. Idempotent
> catalog **seed** (`packages/db/prisma/seed.js`) + **user-migration** (`packages/db/scripts/
> migrate-users-to-profiles.js`), both upsert-only. **Full suite 738/57 green**; real-DB e2e verified
> the migrate→resolve→switch flow. **PENDING (user-run):** the prod rollout —
> `docs/superpowers/plans/prod-rollout-db-relational-permissions.md` (migrate deploy → seed →
> user-migration → deploy code; never reset). Design: `docs/superpowers/specs/
> 2026-07-03-db-relational-permissions-design.md`; plan: `docs/superpowers/plans/
> 2026-07-03-db-relational-permissions.md`; parity addendum in `permissions-parity-matrix.md`.
>
> **CURRENT STATUS (2026-07-02) — full detail in §0 below.** The BE+FE migration is COMPLETE (legacy removed; boots `server/src/server.js`; frontend is `web/`). On `frontend-redesign` these forward workstreams are now **DONE**: **(1) DB-migration reconciliation** — schema + migrations reconciled to the deployed production DB, single canonical `packages/db/prisma`, migrations verified (Docker) to build a fresh DB byte-equal to prod; a **user-run** metadata-only prod runbook is pending. **(2) Permissions parity** — rich denial-reason/redirect contract, backend per-role `navigationTabs` + action-flag `permissionsByModule`, frontend `usePermission`/`PermissionGate`/route-guard, audited identical-to-master (0 mismatches). **(3) Frontend review fixes** — Kanban optimistic drag + terminal-transition confirm, lead-detail reload removal + capability-gated status action, SalesStage unified on `LeadDetailsContext`, dead-code removal, design-token harmonization. **(4) Permission profiles — Phases 1–2** — code-defined `PROFILES` in `@dms/shared` (one profile per user), `getEffectivePermissions` resolves via profile (parity-preserved: same access on the old code universe, only 5 additive `lead.*.view` codes), idempotent bootstrap backfill from the RETAINED `isPrimary`/`isSuperSales`, `/auth/me` emits `profile`, FE profile picker; 8 subagent-driven tasks, final whole-branch review clean after 1 blocker fix. **(5) Permission profiles — Phase 3 (the FE sweep)** — the leads area (detail sections → `lead.*.view` codes; kanban admin affordance → `lead.assign.other`; 6 lead-tab action buttons → `lead.capabilities.canAddX`) AND the projects/dashboard/users modules (backend `computeProjectCapabilities` wired onto the designer detail; ProjectDetails/PreviewWorkStage management gates → project capabilities/`project.manage`; project-group/manage-roles/auto-assign/designer-dashboard/telegram admin gates → codes) all moved off scattered `isPrimary`/`isSuperSales`/role branches. Each conversion subagent-driven + independently reviewed. Two accepted simplifications documented (subRole-STAFF hybrids resolve by base profile — narrowing; accountants/full-scope now see the lead-tab create buttons the backend permits — widening) plus one closed authz gap (the auto-assignment dialog was ungated). Vitest **699/699 green**, `web` build 42/42. **Remaining TODOs (documented in code):** no admin-tier `delivery.*` code (delivery gates left as role checks); designer area-only edit has no capability; the JWT/auth-selects still omit `profile` (runtime rides the derived fallback — parity-neutral). **PENDING (user-run):** the additive `User.profile` migration — `npm run db:migrate -- --name add_user_profile` then `npm run db:generate`, and commit `schema.prisma` + the generated migration together (the column edit is currently staged in the working tree; no `DATABASE_URL` in the agent env). Design + plans: `docs/superpowers/specs/2026-07-02-permission-profiles-design.md`, `docs/superpowers/plans/2026-07-02-permission-profiles*.md`. UI redesign continues.
>
> _(Historical server-migration / cutover detail retained below.)_
>
> Migration-cutover snapshot — Last updated: **2026-06-10** · Branch: `server-migration`
>
> **Phase (2026-06-10):** BE + FE migration COMPLETE; UX/UI redesign feature builds (Phases 0–4)
> COMPLETE; post-redesign FE message-resolver centralization (`73e7f9d`) reconciled + fixed (`6193984`).
> **Runtime browser verification DONE (Playwright, all 22 v2 routes)** — 18 screens clean, 4 blockers
> found. **✅ ALL 4 BLOCKERS NOW FIXED (2026-06-10)** — reviewed (no blockers/no token leak),
> full suite **571/34 green**, guarded boot clean: (1) `useLoading` callbacks memoized → dashboard
> refetch loop gone (`0cf427a`); (2) v2 projects board now sends per-type `?type=` + BE null-guards →
> designers board stops 500ing for admins (`ed28386`); (3) built the v2 contract-payments page (legacy
> parity on the redesign shell) → dead `/v2/contracts/payments` nav fixed (`2d55b84`); (4) calendar
> google/status derives `connected` from token presence instead of the phantom `googleCalendarConnected`
> column → 500 gone on both v2 and the still-live legacy route (`442d7b2`). Master's week commit
> `fdefbbf` (client register) ported (`e04dabb`). **CUTOVER (task #13) IN PROGRESS (2026-06-11):**
> Steps **A (entry flip)**, **B (legacy @role-slot removal)**, **C (redirect shells)** DONE + commits
> `6d45f0b`/`189f75b`/`d09ca57` + fixes `9d2bd07`/`3a5a82d`; **runtime-verified** (real boot: 15/15 redirect
> routes, admin login OK ADMIN/123-perms, public v2 surfaces un-gated, npm test 571/34, next build clean).
> Caught+fixed a Step-A regression (the server-side `ui/src/proxy.js` middleware gated `/v2` public surfaces).
> **CUTOVER COMPLETE (2026-06-11).** `ui→web` rename done (`a849f58`); ALL legacy removed (`b107dda`→`4499332`):
> legacy FE (`UiComponents/helpers/providers/fonts`, ~342 files), ALL legacy backend routers (`server/routes/**`,
> 59 files) + the JWT legacy read-shim, and the dead `legacyApiFetch`. Public client-chat migrated to v2
> (`/v2/client-chat`; `/chats` redirects); v2 chat makes zero legacy calls. Verified: npm 571/34, web build 54
> routes, boot + admin login 200, `/v2/users/chat-directory` 200, legacy `/shared`+`/client` → 404. KEPT (not
> legacy): `server/services/**` frozen logic (lazy-imported by modules) + `SECRET_KEY`. The "v2" label is now a
> namespace only (no duality); dropping the literal `/v2` URL/folder is a separate optional cosmetic rename
> (frozen-service redirect bridges + prod API base end in `/v2`). See `docs/migration/RESUME-CHECKPOINT.md`.
> For the authoritative latest state + commit trail see **`docs/migration/RESUME-CHECKPOINT.md`** (this
> file's §3 commit trail below is kept at the FE-features milestone and is not the latest).

---

## 0. Current status — `frontend-redesign` branch (2026-07-02)

Migration is done (see §3 for the historical migration trail). Two workstreams on `frontend-redesign` are now complete; both preserve behavior identical to the deployed `master` baseline.

### ✅ DB-migration reconciliation (COMPLETE)
**Problem:** `master` recorded only 3 Prisma migrations; later schema changes were applied **by hand in MySQL** (chat, telegram, booking-lead, notif enums). The committed `catch_up_full_schema` migration was **broken** (couldn't build a fresh DB — errno 150 on `TextLong`), and `schema.prisma` itself was **drifted from prod + unbuildable** (missing 10 prod columns; an invalid `TextLong→Con` relation). Three duplicate schema/migration locations existed.
**Fix (verified against the prod structure dump `C:\coding\backup\dreamstudiio\drea_studio_db.sql` in a throwaway MariaDB 10.11 Docker container):**
- `prisma db pull` reconciled `packages/db/prisma/schema.prisma` to production (adopted all 10 prod columns; made it buildable) — proven `migrate diff prod↔schema = 0`.
- Regenerated `catch_up_full_schema` as a valid `(3-old → prod)` diff — the migrations now build a fresh DB **byte-equal to prod** (`VERIFY: PASS`, re-run independently).
- Consolidated to the single canonical `packages/db/prisma`; removed the stale `server/prisma/{schema,migrations}` + `server/src/infra/prisma/{schema,model,migrations}` copies (kept the `prisma.js` re-export shims).
- Fixed 2 app call sites in `accountantServices.js` for the renamed inverse relations (behavior-preserving).
- Guardrails: `docs/db-migrations-workflow.md` + a repo verification harness `packages/db/scripts/verify-migrations-against-dump.sh`.
**PENDING (user action):** run the metadata-only prod reconciliation — `docs/superpowers/plans/prod-migration-runbook.md` (backup → `prisma migrate resolve --applied` the 4 migrations → `migrate status`). **The agent does not touch production.**
Design: `docs/superpowers/specs/2026-07-01-prisma-migration-reconciliation-design.md`.

### ✅ Permissions parity + denial reasons (COMPLETE)
Brought authorization to Transaction-app parity, identical-to-master:
- **Error/redirect contract:** `AppError` carries `code/translationKey/reason/redirectTo/redirectText/dontRedirect` (backward-compatible); the error-handler serializes them + `route`; `requirePermissions` emits a specific `PERMISSION_DENIED` + `details.requiredPermissions`; the FE resolves codes to Arabic and shows the reason (no silent failures).
- **`/auth/me`** returns backend-computed per-role **`navigationTabs`** (role-driven, 1:1 with master's `linksForRole`) + action-flag **`permissionsByModule`** (`buildNavigationTabs` + `NAVIGATION` in `@dms/shared`).
- **Frontend layer:** `usePermission` (hasPermission/any/all/hasAction), `<PermissionGate>`, data-layer reason/redirect surfacing, sidebar driven by `navigationTabs` (identical per-role output; dev role-switcher fallback preserved), and a **RouteGuard** that shows an explicit "no access" reason + redirect instead of a silent blank.
- **Audit:** `docs/superpowers/specs/permissions-parity-matrix.md` — **0 real mismatches** vs master across ~200 routes; only 4 **intentional** security tightenings kept (site-utility→admin-only, reviews token-hiding, IDOR object-scope checkers, model allow-lists).
Design: `docs/superpowers/specs/2026-07-01-permissions-parity-and-denial-reasons-design.md`; plan: `docs/superpowers/plans/2026-07-01-permissions-parity.md`.

**Verification:** full vitest suite **619/619 green**; both workstreams whole-branch-reviewed (READY, no critical/important findings). Includes **runtime verification** beyond unit tests: a real **HTTP integration test** (`authz.integration.test.js`) exercising the live chain JWT→`requireAuth`→`requirePermissions`→`errorHandler`→envelope + `/auth/me` navigationTabs per role (403 carries `PERMISSION_DENIED`+`requiredPermissions`; scoped-checker denial carries `redirectTo`/`reason`), and the RouteGuard decision logic extracted to a pure `routeAccess.js` with per-role allow/block unit tests. Commits are on `frontend-redesign` (not merged to master — the user directed staying on this branch).

**Follow-ups / recommendations (not done):**
- **Prod runbook (user):** the metadata-only `migrate resolve --applied` on production — the one blocking real-world step; agent never touches prod.
- **Browser E2E:** the full app was NOT booted (its boot awaits Redis + a live Telegram connection before listening); actual in-browser render of the sidebar/RouteGuard/denial-toasts per role is verified by logic+HTTP tests but not by a running browser. Needs a running app (or a jsdom + @testing-library setup) — left for the user.
- **Per-screen action gating:** `usePermission`/`PermissionGate` + `capabilities.*` (already attached on ~21 module DTOs) should be wired into each screen's buttons as screens are redesigned — not done speculatively (YAGNI).
- **Audit logging:** a real who-did-what audit trail needs a NEW schema table (the existing `UserLog` is time-tracking). Schema is frozen → this is a user decision; NOT added autonomously.

**Next:** run the prod migration runbook (user); continue the UI redesign, wiring the permission primitives into each screen as it's redesigned.

---

## 1. What we are doing — in one paragraph

We are migrating the **entire Dream Studio app** (backend + frontend) from a messy legacy structure into a **clean modular npm-workspaces monorepo** that mirrors a mature reference project, **while preserving identical behavior** (same Prisma schema, same observable APIs). A strangler migration is already underway: `server/index.js` boots `server/v2/server.js`, and legacy + `v2` routers run side-by-side. We **complete the migration from `v2`** (after fixing v2's defects), redesign the weak permissions/auth layer, consolidate workers/cron to run from the server only, and **keep the PDF generation logic byte-for-byte frozen** (split into files only). i18n is dropped (single **English** UI, matching `master` — reverted from the redesign's Arabic on 2026-07-04) but the message-code pattern is kept. A separate, forward-looking UX plan rides alongside, feature-by-feature.

Full operating manual: [`CLAUDE.md`](CLAUDE.md).

---

## 2. Locked decisions (confirmed with the user)

| # | Decision |
|---|---|
| 1 | Target = **monorepo** mirroring the reference: `packages/db` + `packages/shared` + `server` (`src/modules`) + `web` (`features`). |
| 2 | **Prisma schema frozen** — relocated verbatim, not redesigned. |
| 3 | **Same observable API behavior** — restructure + harden, but the frontend contract stays equivalent; real changes tracked explicitly. |
| 4 | 🔒 **PDF generation logic-frozen** — split into files only, identical output. |
| 5 | **Drop bilingual i18n; keep message-code mechanism** resolving to a single **English** source (matching `master`; superseded the earlier "Arabic" decision 2026-07-04). |
| 6 | **Complete from `v2`** after remediating its defects. |
| 7 | **Workers run as a bootstrap from the server only.** |

---

## 3. Where we have reached — STATUS

**Current phase: 🎉 MIGRATION COMPLETE (BE + FE). NEXT = UX/UI REDESIGN.** Backend fully migrated;
frontend fully on `/v2` — 7 features have full screens (chat, site-utility, leads, projects/tasks,
accounting, calendar, contracts); 10 more have the v2 FOUNDATION (data layer: service→/v2, config,
permissions mirror, message resolver, route shell, wiring-proof page) with their real screens deferred
to the redesign (image-sessions, dashboard, notifications, utilities, courses/LMS, questions,
sales-stages, reviews, users, admin-residual). This is the user's **"Option A" (2026-06-08)**: build
each complex screen ONCE — in the redesign — directly on the foundation, instead of a throwaway 1:1
port of the bespoke legacy editors. FE foundation commits `5a44477` (image-sessions) → `127f414`
(permission mirror) → `42d62f9` (9 feature foundations); reviewed by 2 reconciliation agents with
**no blockers/should-fixes**. **Legacy removal is deferred to ride with the redesign** (per-screen, as
each redesigned screen replaces its legacy screen — NOT a big pre-redesign cutover; legacy still serves
the un-redesigned screens + the @role-slot dashboard shell). NEXT: shared-ui-ux-planner → redesign plan
→ shared-frontend builds screens feature-by-feature → per-screen legacy removal.

Commits on `server-migration`: foundation `3c84d5a` → chat `d980950` → site-utility `38f7bf0` → courses `1dbc181` → leads `c709d14` → users `5cf59ee` → validation-fix `934ba69` → projects `fe9957b` → accounting `d2bce49` → calendar `174e8e1` → notifications+utilities `6cac14e` → dashboard `bf5845b` → leaf-domains `e3da3a8` → contracts `ef95b73` → image-sessions `4f2baf0` → admin-residual `9325e29` → client-portal `e943739` → client-chat `efefedc` → web/leads `110948d` → web/projects `3216f31` → web/accounting `ea088f9`. App boots; legacy + `/v2` coexist (strangler). Full suite: **571 tests / 34 files green**. **🎉 BACKEND MIGRATION COMPLETE — every legacy router group now has a `/v2` equivalent (all domains + all client-facing surfaces). FE migration phase now IN PROGRESS — done: chat, site-utility, leads, projects/tasks, accounting; next: calendar.**

**Modules done (BE):** Chat (+FE), site-utility (+FE), Courses/LMS, Leads/clientLead CORE (IDOR keystone), Users (unblocks chat's `/v2/users` directory), Projects domain (project+task+update+delivery; IDOR keystone for designers/executors), Accounting (payment+expense+note+rent+salary+report; ACCOUNTANT-only money module), Calendar (availability+google-oauth+public client-booking), Notifications+Utilities (notifications IDOR-fixed + lookup helpers), Dashboard (9 role-scoped aggregations, IDOR-hardened), Leaf domains (questions+sales-stages+reviews), Contracts (authed CRUD + public e-sign; 🔒PDF wrapped), Image-sessions (admin+shared+public client; 🔒PDF + 🔒upload-chunk wrapped), Admin/staff residual (reports[🔒pdfkit]/commissions/fixed-data/admin-leads/archive/staff — the last BE module). Each went through review (+rework where needed) → verify. Security holes fixed in every module: Courses 2 critical IDOR; Leads 2 HIGH; Users profile-IDOR (full-row+password-hash leak + escalation) + mass-assign; Projects broad-delete IDOR + PII enumeration + mass-assign; Accounting money-validation + `.strict()` mass-assign defense + dropped client-trusted `oldPaymentLevel` + safe-parse filters (role parity ACCOUNTANT-only preserved); Calendar SAFE/0-introduced (client-booking kept public + token-over-body, no Google-token leak, role parity SHARED preserved) — 3 ported access-control quirks logged as a hardening backlog (see `docs/migration/RESUME-CHECKPOINT.md` §5b); Notifications closed an UNAUTH cross-user read/mark-read IDOR + a HIGH user-logs IDOR (self-scoped) + locked an open `prisma[model]` read to fixed pick-list projections; Dashboard closed a cross-user metric/activity over-exposure (non-admins forced to `req.auth.id`, admin-tier preserved 1:1, + non-numeric-id 403 guard); Leaf domains questions/sales-stages were unscoped lead data → reads access-scope + writes mutate-scope via the leads keystone, reviews OAuth token-leak closed; Contracts unscoped contract IDOR → lead-scope via `:contractId→lead` + public e-sign SSRF on `signatureUrl` locked in validation (PDF only wrapped, not modified); Image-sessions public token IDOR + an UNAUTH cross-session DELETE-images IDOR + SSRF closed, admin role-parity enforced, both frozen subsystems only wrapped; Admin-residual restored a base-role-ADMIN narrowing on destructive lead-delete (legacy had it, v2 had widened it) + closed staff latest-calls IDOR + field-update mass-assignment. Shared: validate middleware now emits a CODE not Zod prose.
**Remaining BE:** none — **the entire backend is migrated** (all domain modules + the client-facing sweep: public-lead funnel, client-portal payments/uploads/notes/languages, and client-chat). What's left: the **FE migration phase** (build `web/features/*` for the BE-only modules, applying the FE-repoint contract deltas in `RESUME-CHECKPOINT §5c`), then **Phase 12 cutover** (flip the FE fully to `/v2`, retire the legacy routers, rename `ui/→web/`). Also a small **hardening backlog** to raise with the user (RESUME-CHECKPOINT §5b + the ported public-surface quirks: calendar availability-delete scope, OAuth state, complete-register ownership token, upload/​pay rate-limits, e-sign replay guards). **FE:** the next major phase.
**Key finding:** the legacy code's leaf domains (questions, notes, sales-stages, client-payments) are **entangled with the `clientLead` keystone**, so they migrate with/after **Leads** (the biggest module + the IDOR/security keystone). Reviews = thin Google-OAuth integration (no FE).
**Next targets:** remaining standalone domains (courses/LMS, calendar) + the **Leads keystone**, then its dependents, then the frozen-PDF contract/image-session flows, then accounting/dashboard/notifications, then cutover.

### ✅ Done
- **Audit of the current app** → `docs/migration/01-current-audit.md`
- **Reference patterns distilled** → `docs/migration/02-reference-patterns.md`
- **Backend migration plan** → `docs/migration/03-backend-plan.md`
- **Frontend migration plan** → `docs/migration/04-frontend-plan.md`
- **UX / layout improvement plan** → `docs/migration/05-ux-plan.md`
- **Reconciliation of all plans** → `docs/migration/06-reconciliation.md`
- **All 10 decisions resolved** → `docs/migration/07-decisions-resolved.md` (authoritative addendum)
- **CLAUDE.md** (operating manual) + **PROJECT_STATE.md** (this file)

### ⏳ Pending before implementation
- A detailed, step-by-step **implementation plan** (the user will direct the next step). The natural start is BE Phase 0 + FE Phase 0.

### ▶️ Not started
- Any code changes, file moves, scaffolding, or package restructuring. (Planning was explicitly plans-only.)

---

## 4. Migration roadmap (from the plans)

> Phase ordering between BE and FE has a known inversion (Leads) — see decision #5 in §5.

### Backend phases (`03-backend-plan.md`)
0. Monorepo skeleton + `packages/db` (frozen schema, singleton client) + `packages/shared` seed
1. Relocate `server/v2` infra → `server/src`, kill duplicate infra, mount under `/api/v1`
2. v2 remediation: one repo suffix, fix broken pdf worker, server-owned workers/cron, unify JWT, add `requirePermissions` + scope checkers
3. Low-risk leaf modules (languages, notes, reviews, site, questions, users)
4. Leads & sales core hub (keystone for the IDOR/permission fix)
5. Projects, tasks, delivery, updates
6. Contracts + contract PDF (🔒 logic-frozen, byte/visual diff gate)
7. Image sessions + session PDF + working pdf queue
8. Accounting (invoice, payment, salary, expense; Stripe)
9. Courses / LMS
10. Calendar + Google
11. Reports PDF (🔒 pdfkit) + dashboard + notifications
12. Cutover: flip FE to `/api/v1`, remove aliases + dual-JWT shim, retire legacy

### Frontend phases (`04-frontend-plan.md`)
0. Foundation (promote v2, DataTable/AppForm, upgrade `useRequest`, `usePermission`, RTL theme)
1. i18n removal + providers consolidation (`AppProviders`, Arabic message map)
2. Auth (finalize `features/auth`, AuthProvider exposes permissions)
3. Booking (public) + Leads/Sales
4. Chat
5. Contracts + Image-sessions (+ client public flows)
6. Projects, Tasks, Payments, Accounting, Users; collapse role slots into permission-gated nav
7. Calendar, Notifications, Website-utilities, Courses
8. Cutover & cleanup (delete legacy, rename `ui/ → web/`, wire workspaces)

### UX rollout (`05-ux-plan.md`)
- **P0** App shell (side-nav + persistent role chip + breadcrumbs), `usePermission`, shared screen-state components, a11y root fix (`<html lang dir>`), theme `status.*` palette.
- **P1** Feature-by-feature redesign in migration order: Leads → Contracts → Image-sessions → Dashboards → Chat (role clarity, 5 states, capability-gated actions).
- **P2** Polish & density.

---

## 5. Decisions — ALL RESOLVED ✅ (authoritative: `07-decisions-resolved.md`)

1. **API base** — permanently `/v2`; **no `/api/v1`**, no cutover flip.
2. **Pagination** — `{items,total,page,pageSize}` normalized (contract change, approved).
3. **`capabilities.*`** — every scoped list/detail response attaches per-record capability booleans (dto-computed).
4. **Permissions** — built fresh: codes in `@dms/shared`, role→profiles seeded BE Phase 2, `auth/me` emits real `permissions[]` from then; **no role-fallback shim**. Role/sub-role exposed for display only.
5. **Phase order** — re-sequenced so each FE feature trails its BE module (see 07 §5 roadmap).
6. **Booking-lead** — `submit` → `POST /:leadId/actions/submit`; `PATCH /:leadId` for draft edits.
7. **Client app** — booking/contract/image-session flows stay in THIS app under a `(public)` group (not separate).
8. **Drive subsystem** — dead/schema-only (no live endpoints); models stay (frozen schema), no Drive module.
9. **`ui`→`web` rename** — at the final cutover step (Phase 12).
10. **Telegram + upload contracts** — enumerated (07 §10).

---

## 6. Known landmines (verified)

- 🔒 **PDF logic must not change** — two subsystems (pdf-lib + pdfkit); fragile `__dirname` font loading. See `CLAUDE.md` §4.
- **Auth is the weakest area** — two parallel JWT systems, role-only checks, no object scope = broad IDOR surface. The leads module is the keystone fix.
- **Workers don't run in-process today**; the pdf worker has a **broken import**; telegram workers run detached. Target: all from the server bootstrap.
- **Duplicated v2 infra** — prisma/mail/socket/telegram each implemented twice; chat has both `chat.repo.js` and `chat.repository.js`; queues/workers split across `services/` and `v2/infra/`. Redundant redis clients (`ioredis` + `redis`).
- Stray `console.log`s in live v2 (`auth.controller.js`).

---

## 7. Doc index

- [`CLAUDE.md`](CLAUDE.md) — operating manual & conventions
- [`docs/migration/01-current-audit.md`](docs/migration/01-current-audit.md)
- [`docs/migration/02-reference-patterns.md`](docs/migration/02-reference-patterns.md)
- [`docs/migration/03-backend-plan.md`](docs/migration/03-backend-plan.md)
- [`docs/migration/04-frontend-plan.md`](docs/migration/04-frontend-plan.md)
- [`docs/migration/05-ux-plan.md`](docs/migration/05-ux-plan.md)
- [`docs/migration/06-reconciliation.md`](docs/migration/06-reconciliation.md)
- [`docs/migration/07-decisions-resolved.md`](docs/migration/07-decisions-resolved.md) — **authoritative; overrides 03/04/05 where they differ**

---

## 8. Next step

The planning + documentation phase is **done and awaiting the user's direction**. The user said they will state the next step. The natural next move is: settle open decisions 1–6 (§5), then produce a detailed implementation plan starting with **Backend Phase 0** (monorepo skeleton + `packages/db` + `packages/shared`) in lockstep with **Frontend Phase 0**.

---

## Update 2026-07-11 — Lead access, profile signals & claim/kanban fixes

Fixed 7 lead defects (spec/plan: `docs/superpowers/{specs,plans}/2026-07-11-lead-access-profile-signals-and-claim-fixes.*`):
- **Leads scoping moved onto profiles.** The leads module no longer reads the legacy `isSuperSales`/`isPrimary` flags — it reads the active profile (`currentProfileKey` / `isAdminTier`, backfilled for every account at boot). `#isSuperSalesScope`/`#isPrimaryScope`/`isAdminUser` helpers.
- **#6:** `deals()` no longer self-scopes a SUPER_SALES profile (they now see all deals/leads), aligned with `columns()`/`getById`.
- **#7:** kanban `columns` 500 fixed (`filters` defaults to `{}`); the same hardening also landed in `getClientLeadsByDateRange`.
- **#4:** self-claim `assign` schema tolerates `null/0/""` `userId`; FE self-claim posts `{ id }` only.
- **#5:** NEW/ON_HOLD → IN_PROGRESS on claim (extracted `claimStatus`, tested).
- **#1/#2:** `#getStaffDetail` returns `LEAD_CLAIM_REQUIRED` (409) / `LEAD_ACCESS_DENIED` (403) instead of a misleading 404; the preview renders the error in a **closeable dialog** with a Start Deal CTA when claimable.
- **#3:** assign/claim action added to the New Leads card for `ASSIGN_OTHER` holders.

**LOCKED DECISION (2026-07-11): profiles are the sole source of truth for sales tier.** See `CLAUDE.md` §2.8 / §6. A user is super-sales/primary iff their **active profile** is `SUPER_SALES`/`PRIMARY_SALES`; both search-scoping and display derive from the active profile (`currentProfileKey`/`isAdminTier` backend, `user.profile` frontend). The `isSuperSales`/`isPrimary` columns stay in the schema but are read ONLY by (a) the boot backfill/derivation and (b) the user-CRUD write-sync. Reading them anywhere else is a bug.

**Phase-2 flag purge (✅ COMPLETE 2026-07-11):** every application-logic read of `isSuperSales`/`isPrimary` is gone (backend + frontend). Verified by grep gate: the ONLY residual occurrences are the sanctioned write-sync (`user.repo` `setUserProfile` / `user.usecase` `syncLegacyFlags`, writing the columns from profile meta), the `auth.dto` derivation `select` fragments, and `packages/shared` derivation (`deriveProfilesFromLegacy`/`resolveProfileKey`). Backend authorizes on `authUser.currentProfileKey`/`isAdminTier` (acting user) or `user.currentProfile.key` (DB-loaded user); FE reads `user.profile`. Super-sales is treated as ≥ primary-tier consistently (backend `#isPrimaryScope` + FE gates). Per owner decision the `auth.middleware` transitional `legacyIsAdminTier` fallback was DROPPED (un-migrated sessions → `isAdminTier: false`, waived — they self-heal on next token refresh after the boot backfill). Plan: `docs/superpowers/plans/2026-07-11-flags-to-profiles-purge.md`. Tests green (leads/users/projects/dashboard/calendar/contracts/auth/shared; 2 pre-existing projects FIX-3 validation failures are flag-unrelated); FE builds. Final review (opus): READY TO MERGE, 0 critical.

---

## Update 2026-07-16 — Work-stage flow redesign (implemented, `feat/workstage-flow-redesign`)

Work-stage flow redesign implemented end-to-end (spec: `docs/superpowers/specs/2026-07-16-workstage-flow-redesign-design.md`; plan: `docs/superpowers/plans/2026-07-16-workstage-flow-redesign.md`). Backend adds `Project.statusChangedAt` + a `cardMeta` DTO block (assignee/value/status-age signals) consumed by a redesigned kanban card; frontend adds key-based preview tabs with a role-appropriate default tab (Work tab for designers, Details for admin), project-surface "open project page" shortcuts, and a unified tabbed 2D-designer board on the main work-stages page.

- **Schema change:** one additive migration adding `Project.statusChangedAt` (nullable, backfilled) — see `packages/db/prisma/migrations` + `schema.prisma`. Not yet applied to production; the user applies it via the standard runbook in `docs/db-migrations-workflow.md` (never applied by hand/by the agent).
- **Verification (Task 7):** full server suite green — 69 files / 820 tests passed (`npx vitest run server`), zero failures, including the pre-existing unrelated notification/worker WIP tests in the working tree. Frontend production build succeeds (`cd web && npx next build`, all 44 routes compiled). E2E smoke skipped — no dev backend available in this environment. Parity re-check: `git diff 1ac4c915..HEAD --stat -- server/src packages/db` touches only `project.flows.js`, `project.repo.js`, `project.dto.js`, two new test files, and the migration+schema under `packages/db/prisma` — no route, permission, or scope-checker files changed.
- **Known environment limitation:** the repo's Prisma drift-check script cannot cleanly 0-exit against the local MariaDB instance here because it runs with `lower_case_table_names=1`, which the check's comparison isn't tolerant of; this is a local-environment artifact, not real drift. Zero real drift against production was proven separately via a shadow-DB diff during the migration design work (see the reconciliation spec/plan under `docs/superpowers/`).

---

## Update 2026-07-17 — courses-web port, Phase 1 (port + /v2 API fix)

New `courses-web/` npm workspace: the standalone Design-courses LMS frontend ported into the monorepo and rewired to the current `/v2` backend. Spec: `docs/superpowers/specs/2026-07-17-courses-web-port-phase1-design.md`; plan: `docs/superpowers/plans/2026-07-17-courses-web-port-phase1.md`.

- **Port:** all 95 files copied verbatim (no reorg — that's Phase 2). Registered in root `workspaces`; dev port 4011, start 4010.
- **API fix:** adopted `web/`'s proven `/v2` data layer (`apiClient` + `apiPathMap` + `getData`/`handleRequestSubmit` + `resolveMessage`), copied in and repointed. Course rules: `admin/courses`→`courses`, `shared/courses`→`staff-courses`, `auth/status`→`auth/me`, `auth/reset*`→`request-password-reset`/`reset-password`. Uploads use `files/chunks`. Backend mounts `v2Routes` at both root and `/v2`, so the origin-relative client works.
- **Profiles, not role (§2.8):** courses-web derives the current user's base role from the ACTIVE profile via a local mirror (`helpers/profiles.js`, copied from web/) — `PROFILE_BASE_ROLE_BY_KEY[user.profile]`. Replaced every `user.role` read (dashboard slot routing, `checkIfAdmin`/`checkIfADesigner`, and the `?role=` course content-filter). No `user.role`/`subRoles` reliance. Legacy `shared/roles` sub-role switcher retired (unmounted) — the concept is profiles now.
- **Auth model:** login lives on the lead site (`web/`); a "Courses" link in web/'s SideNav (gated on `NEXT_PUBLIC_COURSES_URL`) opens courses-web with the shared session cookie. Unauthenticated loads redirect to `${NEXT_PUBLIC_WEB_URL}/login`.
- **Verification:** `courses-web` builds clean (Next 16, 14 routes); `web` builds clean with the nav link. Live screen smoke against a running backend + real session is PENDING (needs the user's env).
- **PENDING (ask the user):** port web/'s in-progress **ProfileSwitcher** into courses-web (replaces the retired role switcher) once it's done. **Phase 2** = reorganize courses-web into features/components (school-system shape) + unify theme (colors/MUIContext) with web/.

---

## Update 2026-07-17 — courses-web Phase 2 (reorg to web/ conventions + theme unification)

courses-web restructured from the flat verbatim port into `web/`'s `features` + `shared/components` layout, and its theme unified with web/. Spec: `docs/superpowers/specs/2026-07-17-courses-web-phase2-reorg-design.md`. Behavior-preserving (moves/renames/import-rewrites only) — no API/route/URL/logic changes; Phase 1 wiring intact.

- **New layout:** `src/features/{courses,lessons,tests,dashboard}/{admin,staff}` (screens) + `src/shared/components/{buttons,common,feedback/loaders/toast,formComponents/{MUIInputs,forms},models,utility}`. `src/app/` keeps routes + `helpers/` + `providers/` + `fonts/` + globals. `UiComponents/` and `app/models/` are gone.
- **Cleanups folded in:** `taost`→`toast` typo fixed; `test`→`tests`; `TestAttempts;.jsx`→`TestAttempts.jsx`; latent case bugs (`FormComponents` vs `formComponents`, wrong `@/app/UiComponents/models/*` specifiers) normalized — these would have broken on Linux/CI (case-sensitive) though they resolved on Windows.
- **Theme:** `colors.js` + `MUIContext.jsx` copied byte-identical from web/ (same export surface: default `colors` + `COLORS`/`STATUS_COLORS`/`NotificationColors`/`contractLevelColors`). courses-web now renders in web/'s caramel theme. No new deps (MUIContext uses only createTheme/ThemeProvider; web/'s RTL/stylis wiring lives in web/'s root layout and isn't needed here).
- **Verification:** 3 grouped commits (shared → features → theme), each gated by `next build`. Final: grep gate clean (no `UiComponents`/`DataViewer`/`taost`/`FormComponents`/`@/app/models` specifiers), `next build` green (14 routes, identical to Phase 1). `web/` untouched. Live screen-smoke against a running backend still pending (needs user env).
- **NOT done (deliberate, deferred):** component dedup against web/'s shared components (web/ isn't a package; cross-workspace imports painful) and extracting a shared theme package outside web/ — both belong to the eventual courses-web→web/ merge.

---

## Update 2026-08-17 — sales assignment, transferred reminders, and SUPER_SALES parity

Fixed the sales/user-management regressions and reconciled active-profile `SUPER_SALES`
authority with the deployed-master behavior plus the approved permissions matrix. Design and
plan: `docs/superpowers/{specs,plans}/2026-08-17-{sales-directory-user-state-and-reminder-transfer,super-sales-master-parity}*`.

- Convert/assign pickers now query assigned `NORMAL_SALES` **or** `PRIMARY_SALES` profiles;
  `SUPER_SALES` directory access remains constrained to non-admin SALES-family accounts.
- Profile assignment no longer reloads the page. Profile saves reconcile the row locally, and
  identity edits preserve relational `userProfiles/currentProfile` UI state.
- Transferred calls/meetings are visible to both their creator and the lead's current owner. A
  reminder may be updated by its creator, current lead owner, or full lead scope
  (`ADMIN`/`SUPER_ADMIN`/`SUPER_SALES`).
- Lead/project/task/update inner workflow branches now honor the active `SUPER_SALES` profile
  where their permission/scope layers already grant supervisor authority. The inverted deals
  aggregation `isAdmin` signal was corrected.
- Express errors delegate when headers are already sent, preventing a second response and
  `ERR_HTTP_HEADERS_SENT` noise.
- Verification: full Vitest suite green (**145 files / 1,233 tests**), static frontend↔backend
  endpoint-parity tests green, and the web production build succeeds. Scoped lint on every
  touched frontend file has zero errors (one existing `AdminTable` `<img>` warning). The global
  web lint remains red on the repository's pre-existing React-compiler rule backlog in unrelated
  files.
