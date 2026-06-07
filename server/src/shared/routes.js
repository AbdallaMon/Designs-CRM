import { Router } from "express";
import { bookingLeadsRouter } from "../modules/leads/client/booking-lead/booking-leads.routes.js";
import { leadRouter } from "../modules/leads/lead/lead.routes.js";
import { userRouter } from "../modules/users/user/user.routes.js";
import { telegramRouter } from "../modules/telegram/auth/telegram.routes.js";
import { chatRouter } from "../modules/chat/chat.routes.js";
import { uploadRouter } from "../modules/upload/upload.routes.js";
import { siteUtilityRouter } from "../modules/site-utility/site-utility.routes.js";
import { adminCourseRouter } from "../modules/courses/admin-course/admin-course.routes.js";
import { staffCourseRouter } from "../modules/courses/staff-course/staff-course.routes.js";
import { projectRouter } from "../modules/projects/project/project.routes.js";
import { taskRouter } from "../modules/projects/task/task.routes.js";
import { updateRouter } from "../modules/projects/update/update.routes.js";
import { deliveryRouter } from "../modules/projects/delivery/delivery.routes.js";
import { accountingRouter } from "../modules/accounting/accounting.routes.js";
import { calendarRouter } from "../modules/calendar/calendar.routes.js";
import { clientCalendarRouter } from "../modules/calendar/client/client-calendar.route.js";
import { notificationRouter } from "../modules/notifications/notification.route.js";
import { utilityRouter } from "../modules/utilities/utility.route.js";
import { dashboardRouter } from "../modules/dashboard/dashboard.route.js";
import { questionsRouter } from "../modules/questions/questions.route.js";
import { salesStagesRouter } from "../modules/sales-stages/sales-stages.route.js";
import { reviewsRouter } from "../modules/reviews/reviews.route.js";
import { contractRouter } from "../modules/contracts/contract/contract.route.js";
import { clientContractRouter } from "../modules/contracts/client/client-contract.route.js";
import { adminImageSessionRouter } from "../modules/image-sessions/admin/admin-image-session.route.js";
import { imageSessionRouter } from "../modules/image-sessions/session/image-session.route.js";
import { clientImageSessionRouter } from "../modules/image-sessions/client/client-image-session.route.js";

import authRoutes from "../modules/auth/auth.routes.js";
const router = Router();

router.use("/auth", authRoutes);

router.use("/client/booking-leads", bookingLeadsRouter);
// Authenticated leads-management surface (legacy `/shared/client-leads`, kept mounted
// in parallel during the strangler window). Object scope enforced per `/:id` route.
router.use("/leads", leadRouter);
// Users — three merged legacy surfaces: the authed directory pick-lists (legacy
// `/shared/all-chat-users` etc. — the chat module consumes `/v2/users/directory`), the
// admin user-management endpoints (legacy `/admin/users*`), and self-profile (legacy
// `/shared/users/:userId/profile`, now object-scope checked — the IDOR fix). Legacy
// routers stay mounted in parallel during the strangler window.
router.use("/users", userRouter);
router.use("/telegram", telegramRouter);
router.use("/chat", chatRouter);
router.use("/files", uploadRouter);
router.use("/site-utilities", siteUtilityRouter);
// Courses / LMS — admin management surface (legacy `/admin/courses`) and staff
// consumption surface (legacy `/shared/courses`). Both mount under `/v2`; legacy
// routers stay mounted in parallel (strangler) until cutover.
router.use("/courses", adminCourseRouter);
router.use("/staff-courses", staffCourseRouter);

// Projects domain — four coupled surfaces centered on the Project/ClientLead entity
// (legacy `/shared/{projects,tasks,updates,delivery}`, kept mounted in parallel during
// the strangler window). A single shared project-scope checker enforces object access
// (the IDOR fix); legacy `/:id/...` sub-resources had no consistent scope check.
router.use("/projects", projectRouter);
router.use("/tasks", taskRouter);
router.use("/updates", updateRouter);
router.use("/delivery", deliveryRouter);

// Accounting — the MONEY-sensitive accountant surface (legacy `/accountant/*`, kept
// mounted in parallel during the strangler window). Auth once at the aggregate router;
// every route is gated by an ACCOUNTING.* code granted to the ACCOUNTANT role only —
// reproducing the legacy ACCOUNTANT-only gate exactly. Money workflow actions
// (pay / mark-overdue / change-level) use `/:id/actions/*` with strict money validation.
router.use("/accounting", accountingRouter);

// Calendar — the authed staff availability/slots + meeting/call month-views + Google
// Calendar OAuth surface (legacy `routes/calendar/calendar.js`, the SHARED router
// DOUBLE-MOUNTED at `/shared/calendar` AND `/shared/calendar-management`). The v2 aggregate
// is mounted twice to mirror that double-mount exactly; legacy routers stay live (strangler).
// Auth once at the aggregate; every route is gated by a CALENDAR.* code granted to EVERY
// authed role (CALENDAR_AUTHED) — reproducing the legacy SHARED gate. Availability rows have
// no per-owner scope in legacy (the code is the gate); Google actions are self-scoped to the
// caller. The Google OAuth sub-router lives at `/google` under each mount.
router.use("/calendar", calendarRouter);
router.use("/calendar-management", calendarRouter);
// PUBLIC client booking surface (legacy `/client/calendar`, token-based, NO auth). Mounted
// ungated, exactly like the booking funnel and `/files/client/*` — gating it would break the
// public client booking flow.
router.use("/client/calendar", clientCalendarRouter);

// Notifications — the SELF-SCOPED notification surface. Legacy `/utility/notification/*`
// was UNAUTHENTICATED and filtered by a CLIENT-SUPPLIED userId (`/notification/unread`) /
// trusted the `:userId` PATH param (`/notification/users/:userId`) → a textbook IDOR; the
// paginated all-notifications read also lived behind the SHARED gate at
// `/shared/utilities/notifications`. The v2 module authenticates once, gates on a
// NOTIFICATION code (granted to every authed role), and derives the subject from
// req.auth.id ONLY — no route accepts a target userId. Legacy routers stay mounted in
// parallel during the strangler window. mark-read is a self-scoped workflow action at
// `/v2/notifications/actions/mark-read`.
router.use("/notifications", notificationRouter);

// Utilities — the lookup/pick-list helper surface (legacy `/shared/utilities/*` behind the
// SHARED gate = all authed roles, plus `/utility/search` authed via verifyTokenUsingReq).
// Auth once at the aggregate; every route is gated by a UTILITY.* code granted to every
// authed role (preserving the broad legacy surface). The generic-model reads (`/` and
// `/ids`) ADD a model allow-list (mass-read hardening). Upload (`/utility/upload*`,
// FROZEN) is NOT here — it belongs to the already-migrated upload module and stays on
// legacy. Legacy routers stay mounted in parallel during the strangler window.
router.use("/utilities", utilityRouter);

// Dashboard — the read-only analytics surface (legacy `routes/shared/dashboard.js` behind
// the SHARED gate = all 9 authed roles). Auth once at the router; every route is gated by
// the single DASHBOARD.VIEW code (granted to every authed role). Legacy keyed each scoped
// aggregation off a CLIENT-SUPPLIED `staffId` (and recent-activities also off a client
// `userId`) → a scoped role could read another user's metrics/feed, and the un-scoped
// endpoints returned GLOBAL totals to everyone. v2 derives the scope from req.auth: the
// admin-tier union (ADMIN/SUPER_ADMIN/isSuperSales) may scope to any user or global
// (preserved 1:1), every other role is FORCED to req.auth.id (the IDOR-class fix). The
// role used for branching comes from the token, never from a `?role=` param. The legacy
// `/staff/dashboard/latest-calls` endpoint is NOT migrated here (STAFF call-reminder data,
// not a dashboard aggregation — stays on legacy). Legacy router stays mounted in parallel
// during the strangler window.
router.use("/dashboard", dashboardRouter);

// Leaf domains — three small SHARED-gated surfaces (legacy behind the SHARED router gate
// = all 9 authed roles), kept mounted in parallel during the strangler window.
//
// Questions — the SPIN session-questions/answers + VERSA objection-handling surface
// (legacy `routes/questions/questions.js` at `/shared/questions`). Auth once at the
// router; every route gated by a QUESTION.* code granted to every authed role. Global
// question-type config reads are gated by the code alone; the LEAD-SCOPED reads/writes
// (session questions, answers, custom questions, VERSA) resolve the parent clientLead and
// run the leads-module object-scope checker in the usecase (the IDOR fix the legacy routes
// were MISSING — any authed role could read/mutate ANY lead's questions/answers/VERSA).
// Mutating bodies are `.strict()` (mass-assignment hardening) and the acting user is
// derived from req.auth, never the body.
router.use("/questions", questionsRouter);

// Sales-stages — the per-lead sales-pipeline stage progression surface (legacy
// `routes/shared/sales-stages.js` at `/shared/sales-stages`). Auth once; gated by
// SALES_STAGE.* codes granted to every authed role. SalesStage rows are LEAD-SCOPED; the
// usecase resolves+checks the parent lead via the leads-module checker (the IDOR fix the
// legacy route was MISSING). The stage change is a workflow action — RENAMED from the
// legacy `POST /:clientLeadId` to `POST /:clientLeadId/actions/set-stage`. The acting user
// comes from req.auth, never the body.
router.use("/sales-stages", salesStagesRouter);

// Reviews — the thin Google Business Profile OAuth review integration (legacy
// `routes/shared/reviews.js` at `/shared/reviews`). Auth once; gated by REVIEW.* codes
// granted to every authed role. A studio-wide integration owned by the frozen
// `services/reviews.js` (single shared oauth2Client, no per-user state) → no object scope,
// the code is the gate. The OAuth token flow is behavior-frozen and tokens are NEVER
// returned or logged — the v2 callback CLOSES the legacy raw-token JSON exposure (returns
// only a connected flag).
router.use("/reviews", reviewsRouter);

// Contracts — TWO surfaces (legacy routers stay mounted in parallel during the strangler
// window).
//
// 1. Authed staff/admin contract CRUD (legacy `routes/contract/contracts.js` at
//    `/shared/contracts`, SHARED gate = all 9 authed roles). Auth once; every route gated
//    by a CONTRACT.* code granted to every authed role via SHARED_AUTHED. Contracts are
//    lead-scoped; the usecase resolves the parent clientLead (directly for :leadId, or via
//    contract→clientLeadId for :contractId / child ids) and runs the leads-module
//    object-scope checker (reads access-scope, writes mutate-scope) before any read/write —
//    the IDOR fix the legacy routes were MISSING (no object scope at all). Lifecycle status
//    changes are workflow actions (`/:id/actions/cancel`, `/:id/actions/generate-pdf-token`,
//    payment `/actions/change-status` + `/actions/update-amounts`). The grouped payments
//    list keeps its frozen-service internal role-scope. 🔒 PDF generation (cancel builds a
//    cancelled PDF) is wrapped via a lazy adapter, never modified.
router.use("/contracts", contractRouter);
// 2. PUBLIC client e-sign surface (legacy `routes/contract/client-contract.js` at
//    `/client/contracts`, token-based, NO auth). Mounted ungated, exactly like the booking
//    funnel and `/files/client/*` — gating it would break the public signing flow. The
//    session is derived FROM the per-session token, never a client-supplied id (the IDOR
//    close vs legacy). All Arabic/English prose replaced with language-neutral codes. 🔒
//    /generate-pdf wraps the FROZEN buildAndUploadContractPdf via a lazy adapter.
router.use("/client/contracts", clientContractRouter);

// Image-sessions — THREE surfaces (legacy routers stay mounted in parallel during the
// strangler window). The LARGEST + MOST DELICATE module: two frozen subsystems intersect
// here (🔒 the pdf-lib image-session PDF and 🔒 the upload-chunk mechanism). Both are only
// WRAPPED via lazy adapters — never modified. The public generate-pdf preserves the INLINE
// SYNC pdf path; the legacy commented `pdfQueue.add(...)` enqueue stays unused.
//
// 1. ADMIN reference-data CRUD (legacy `routes/image-session/admin-image-session.js` at
//    `/admin/image-session`, "ADMIN" gate = the `isAdmin` union). Global studio reference
//    data (spaces/templates/materials/styles/colors/design-images/page-info/pros-and-cons)
//    — NO per-lead scope; the admin code is the gate (admins see all). Gated by
//    IMAGE_SESSION.ADMIN_* granted to ADMIN/SUPER_ADMIN base + isSuperSales (matching the
//    legacy `isAdmin` union exactly, like courses/users — a plain STAFF/sales role is 403'd).
router.use("/image-sessions/admin", adminImageSessionRouter);
// 2. SHARED session-management (legacy `routes/image-session/image-session.js` at
//    `/shared/image-session`, SHARED gate = all 9 authed roles). Gated by IMAGE_SESSION.SESSION_*
//    granted to every authed role via SHARED_AUTHED. ClientImageSession rows are lead-scoped;
//    the usecase resolves the parent clientLead (directly for :clientLeadId, or via
//    session→clientLeadId for :sessionId) and runs the leads-module object-scope checker
//    (reads access-scope, writes mutate-scope) before any read/write — the IDOR fix the
//    legacy routes were MISSING. The `/ids` generic-model read adds a model allow-list +
//    guarded JSON.parse (mass-read hardening).
router.use("/image-session", imageSessionRouter);
// 3. PUBLIC client image-selection flow (legacy `routes/image-session/client-image-session.js`
//    + `routes/client/image-session.js`, BOTH mounted at `/client/image-session`, token-based,
//    NO auth). Combined cleanly here, preserving every reachable path. Mounted ungated, like
//    the booking funnel and `/files/client/*`. The session is derived FROM the per-session
//    token, never a client-supplied id (the IDOR close vs legacy). All prose replaced with
//    language-neutral codes. 🔒 /generate-pdf wraps the FROZEN PDF orchestrator; signatureUrl
//    is SSRF-locked to a safe relative upload path.
router.use("/client/image-session", clientImageSessionRouter);

export default router;
