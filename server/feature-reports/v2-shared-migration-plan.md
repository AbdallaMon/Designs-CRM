# V2 Migration Plan — Shared Routes to Modular Architecture

**Date:** April 13, 2026  
**Author:** GitHub Copilot  
**Scope:** Migrate all routes under `server/routes/shared/` to the v2 module system under `server/v2/modules/`  
**Status:** PLAN — No code changes yet

---

## Table of Contents

1. [Overview & Goals](#1-overview--goals)
2. [What Changes, What Stays](#2-what-changes-what-stays)
3. [Current Shared Routes Audit](#3-current-shared-routes-audit)
4. [New v2 Module Map](#4-new-v2-module-map)
5. [Module-by-Module Plan](#5-module-by-module-plan)
   - 5.1 [client-leads → `leads/staff`](#51-client-leads--leadsstaffinternal)
   - 5.2 [projects → `projects`](#52-projects--projects)
   - 5.3 [tasks → `tasks`](#53-tasks--tasks)
   - 5.4 [updates → `updates`](#54-updates--updates)
   - 5.5 [dashboard → `dashboard`](#55-dashboard--dashboard)
   - 5.6 [delivery → `delivery`](#56-delivery--delivery)
   - 5.7 [sales-stages → embedded in leads/staff](#57-sales-stages--embedded-in-leadsstaffinternal)
   - 5.8 [utilities → `notifications` + `user-logs` + `utilities`](#58-utilities--split-into-3-modules)
   - 5.9 [users → `users`](#59-users--users)
   - 5.10 [reviews → `reviews`](#510-reviews--reviews)
6. [File Structure After Migration](#6-file-structure-after-migration)
7. [Shared Infrastructure Changes](#7-shared-infrastructure-changes)
8. [v2 routes.js Updates](#8-v2-routesjs-updates)
9. [Middleware Strategy](#9-middleware-strategy)
10. [Enhancements vs Old Code](#10-enhancements-vs-old-code)
11. [Migration Execution Order](#11-migration-execution-order)
12. [Risk & Notes](#12-risk--notes)

---

## 1. Overview & Goals

The current `routes/shared/` folder is a monolith wired by `routes/shared/index.js`. It:

- Mixes business roles (admin checks, staff checks) directly in route files
- Has no input validation beyond manual `req.body`/`req.query` reads
- Has no consistent error handling (each route does its own `try/catch`)
- Uses old utility functions (`getTokenData`, `getCurrentUser`) instead of the v2 `req.auth` pattern
- Is not subdivided — `client-leads.js` alone handles reminders, payments, files, notes, status changes, and more

**Goals of this migration:**

1. Subdivide every conceptual domain into its own v2 module
2. Replace old try/catch in routes with `asyncHandler` + `AppError`
3. Replace `getTokenData/getCurrentUser` with `req.auth` (set by `AuthMiddleware.requireAuth`)
4. Add Zod validation schemas for all inputs
5. Thin controllers — no business logic
6. Usecases wrap old service calls (no rewrite of service logic — services stay the same)
7. Repositories wrap Prisma calls that are currently inlined in services (can be done progressively)
8. **Never touch old `routes/shared/` files**

---

## 2. What Changes, What Stays

| Layer            | Old                                             | New                                                  |
| ---------------- | ----------------------------------------------- | ---------------------------------------------------- |
| Route files      | Fat, per-module in `routes/shared/`             | Thin, per-module in `v2/modules/`                    |
| Auth check       | `verifyTokenAndHandleAuthorization()` in index  | `AuthMiddleware.requireAuth` in each module's routes |
| Token reading    | `getTokenData(req,res)` / `getCurrentUser(req)` | `req.auth` (set by middleware)                       |
| Input validation | None (raw `req.body`/`req.query`)               | Zod `validate()` middleware                          |
| Error handling   | Per-route `try/catch + res.status(500)`         | `asyncHandler` + `AppError` + global error handler   |
| Service layer    | `services/main/shared/*.js`                     | **NOT CHANGED** — usecases call them directly        |
| Database         | Prisma (unchanged)                              | Prisma (unchanged)                                   |
| Old routes       | Active in `routes/shared/`                      | **NOT TOUCHED** — kept running in parallel           |

---

## 3. Current Shared Routes Audit

### `client-leads.js` — endpoints inventory

| Method | Path                               | Description                        | Role Guard                                                  |
| ------ | ---------------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| GET    | `/`                                | List leads (paginated)             | SHARED                                                      |
| GET    | `/deals`                           | Leads by date range                | ADMIN/SUPER_ADMIN/ACCOUNTANT/SUPER_SALES see all, else self |
| GET    | `/columns`                         | Kanban column counts               | Same scoping                                                |
| GET    | `/calls`                           | Next call reminders (paginated)    | SHARED                                                      |
| GET    | `/meetings`                        | Next meeting reminders (paginated) | SHARED                                                      |
| GET    | `/meeting-reminders/:meetingId`    | Get a specific meeting             | SHARED                                                      |
| GET    | `/:clientLeadId/meeting-reminders` | All meetings for a lead            | SHARED                                                      |
| GET    | `/:id`                             | Lead details                       | Admin/isSuperSales sees admin view                          |
| PUT    | `/`                                | Assign lead to user                | Admin assigns to anyone, staff self-assigns                 |
| PUT    | `/bulk-convert`                    | Bulk assign (admin only)           | ADMIN                                                       |
| PUT    | `/convert`                         | Mark lead as ON_HOLD/converted     | SHARED                                                      |
| PUT    | `/update/:id`                      | Update lead fields                 | SHARED                                                      |
| PUT    | `/lead/update/:id`                 | Update lead fields (duplicate)     | SHARED                                                      |
| PUT    | `/:id/status`                      | Update lead status                 | isAdmin flag                                                |
| PUT    | `/call-reminders/:id`              | Update call reminder status        | SHARED                                                      |
| PUT    | `/meeting-reminders/:id`           | Update meeting reminder status     | SHARED                                                      |
| POST   | `/:userId/countries`               | Check if user can take lead        | SHARED                                                      |
| POST   | `/:id/call-reminders`              | Create call reminder               | SHARED                                                      |
| POST   | `/:id/meeting-reminders`           | Create meeting reminder            | SHARED                                                      |
| POST   | `/:id/meeting-reminders/token`     | Create meeting reminder with token | SHARED                                                      |
| POST   | `/:id/price-offers`                | Create price offer                 | SHARED                                                      |
| POST   | `/price-offers/change-status`      | Update price offer status          | SHARED                                                      |
| POST   | `/:id/payments`                    | Add payments (or extra-service)    | SHARED                                                      |
| POST   | `/:id/files`                       | Upload file to lead                | SHARED                                                      |
| POST   | `/:id/notes`                       | Add note to lead                   | SHARED                                                      |
| POST   | `/:clientLeadId/payment-reminder`  | Remind user to pay                 | SHARED                                                      |
| POST   | `/:clientLeadId/complete-register` | Remind user to register            | SHARED                                                      |

**Observation:** This is 26 endpoints. Splitting into sub-modules is essential.

### `projects.js` — endpoints inventory

| Method | Path                        | Description                       |
| ------ | --------------------------- | --------------------------------- |
| GET    | `/designers`                | Projects list (designer view)     |
| GET    | `/designers/columns`        | Project columns (designer kanban) |
| GET    | `/designers/:id`            | Designer lead project details     |
| GET    | `/`                         | Projects list (by clientLead)     |
| GET    | `/archived`                 | Archived projects (paginated)     |
| GET    | `/user-profile/:userId`     | Profile projects                  |
| GET    | `/:id`                      | Project details                   |
| PUT    | `/:id`                      | Update project                    |
| PUT    | `/:id/assign-designer`      | Assign designer                   |
| PUT    | `/designers/:leadId/status` | Update designer project status    |

### `tasks.js` — endpoints inventory

| Method | Path       | Description            |
| ------ | ---------- | ---------------------- |
| GET    | `/`        | List tasks             |
| POST   | `/`        | Create task            |
| GET    | `/:id`     | Task details           |
| PUT    | `/:taskId` | Update task            |
| GET    | `/notes`   | List notes (generic)   |
| POST   | `/notes`   | Create note (generic)  |
| DELETE | `/:id`     | Delete model (generic) |

### `updates.js` — endpoints inventory

| Method | Path                                      | Description                |
| ------ | ----------------------------------------- | -------------------------- |
| GET    | `/:clientLeadId`                          | List updates               |
| GET    | `/shared-settings/:updateId`              | Shared settings for update |
| POST   | `/:clientLeadId`                          | Create update              |
| POST   | `/:updateId/authorize`                    | Authorize department       |
| POST   | `/:updateId/authorize/shared`             | Unauthorize department     |
| PUT    | `/:updateId/archive`                      | Toggle archive             |
| PUT    | `/shared-updates/:sharedUpdateId/archive` | Toggle shared archive      |
| PUT    | `/:updateId/done`                         | Mark as done               |

### `dashboard.js` — endpoints inventory

| Method | Path                      | Description            |
| ------ | ------------------------- | ---------------------- |
| GET    | `/key-metrics`            | Key metrics            |
| GET    | `/leads-status`           | Lead status data       |
| GET    | `/monthly-performance`    | Monthly performance    |
| GET    | `/emirates-analytics`     | Emirates analytics     |
| GET    | `/leads-monthly-overview` | Monthly leads overview |
| GET    | `/week-performance`       | Week performance       |
| GET    | `/latest-leads`           | Latest leads           |
| GET    | `/recent-activities`      | Recent activities      |
| GET    | `/designer-metrics`       | Designer metrics       |

### `delivery.js` — endpoints inventory

| Method | Path                        | Description              |
| ------ | --------------------------- | ------------------------ |
| GET    | `/:projectId/schedules`     | Get delivery schedules   |
| POST   | `/`                         | Create delivery schedule |
| POST   | `/:deliveryId/link-meeting` | Link to meeting          |
| DELETE | `/:deliveryId`              | Delete schedule          |

### `sales-stages.js` — endpoints inventory

| Method | Path             | Description      |
| ------ | ---------------- | ---------------- |
| GET    | `/:clientLeadId` | Get sales stages |
| POST   | `/:clientLeadId` | Edit sales stage |

### `utilities.js` — endpoints inventory

| Method | Path                  | Description               |
| ------ | --------------------- | ------------------------- |
| GET    | `/notifications`      | Notifications (paginated) |
| GET    | `/fixed-data`         | Fixed app data            |
| GET    | `/user-logs`          | User logs by time range   |
| POST   | `/user-logs`          | Submit user log           |
| GET    | `/users/role/:userId` | Get user role             |
| GET    | `/users/admins`       | Get admin users           |
| GET    | `/roles`              | Get user roles            |
| GET    | `/images`             | Get images                |
| GET    | `/`                   | Image session model       |
| GET    | `/ids`                | Get model IDs             |

### `users.js` — endpoints inventory

| Method | Path               | Description         |
| ------ | ------------------ | ------------------- |
| GET    | `/:userId/profile` | Get user profile    |
| PUT    | `/:userId/profile` | Update user profile |

### `reviews.js` — endpoints inventory

| Method | Path              | Description    |
| ------ | ----------------- | -------------- |
| GET    | `/oauth2callback` | OAuth callback |
| GET    | `/locations`      | Get locations  |
| GET    | `/reviews`        | Get reviews    |

---

## 4. New v2 Module Map

The key insight: `client-leads` is not "one thing" — it has 4 conceptual domains inside it. Plus `utilities.js` has 3 unrelated things crammed together.

```
v2/modules/
├── auth/                          ← EXISTS ✅
├── chat/                          ← EXISTS ✅
├── leads/
│   ├── client/booking-lead/       ← EXISTS ✅
│   └── staff/                     ← NEW — internal staff lead management
│       ├── lead-list/             ← GET /, /deals, /columns
│       ├── lead-detail/           ← GET /:id, PUT /update, PUT /status
│       ├── lead-assignment/       ← PUT /, PUT /bulk-convert, PUT /convert
│       ├── call-reminders/        ← GET /calls, POST, PUT /call-reminders
│       ├── meeting-reminders/     ← GET /meetings, POST, PUT /meeting-reminders
│       ├── price-offers/          ← POST /price-offers, POST /price-offers/change-status
│       ├── payments/              ← POST /payments
│       ├── files-notes/           ← POST /files, POST /notes
│       └── sales-stages/         ← GET/:clientLeadId, POST/:clientLeadId
├── projects/                      ← NEW
├── tasks/                         ← NEW
├── updates/                       ← NEW
├── dashboard/                     ← NEW
├── delivery/                      ← NEW
├── notifications/                 ← NEW (split from utilities)
├── user-logs/                     ← NEW (split from utilities)
├── users/                         ← NEW
├── utilities/                     ← NEW (fixed-data, images, roles, model-ids)
└── reviews/                       ← NEW
```

---

## 5. Module-by-Module Plan

---

### 5.1 `client-leads` → `leads/staff/internal`

**Why subdivide?** The old `client-leads.js` has 26 endpoints across 6 domains. Each gets its own sub-module inside `v2/modules/leads/staff/`.

#### Sub-module: `lead-list`

**Path prefix:** `/v2/staff/leads`  
**Files:**

```
v2/modules/leads/staff/lead-list/
├── lead-list.routes.js
├── lead-list.controller.js
├── lead-list.usecase.js
├── lead-list.repository.js    (wraps getClientLeads, getClientLeadsByDateRange, getClientLeadsColumnStatus)
└── lead-list.validation.js    (Zod: query params, pagination)
```

**Endpoints:**

- `GET /` — list leads (pagination + filters)
- `GET /deals` — date-range deals
- `GET /columns` — kanban columns

**Role Logic to move to usecase:**

- Admin/SUPER_ADMIN/ACCOUNTANT/SUPER_SALES → see all
- Others → scoped to `userId = req.auth.id`

---

#### Sub-module: `lead-detail`

**Path prefix:** `/v2/staff/leads`  
**Files:**

```
v2/modules/leads/staff/lead-detail/
├── lead-detail.routes.js
├── lead-detail.controller.js
├── lead-detail.usecase.js
├── lead-detail.repository.js   (wraps getClientLeadDetails, getAdminClientLeadDetails, updateLeadField)
└── lead-detail.validation.js   (Zod: params.id, body for update)
```

**Endpoints:**

- `GET /:id` — lead details (admin vs staff view decided in usecase)
- `PUT /:id/status` — update status
- `PUT /:id/update` — update lead fields _(combines duplicate `/update/:id` and `/lead/update/:id`)_

---

#### Sub-module: `lead-assignment`

**Path prefix:** `/v2/staff/leads`  
**Files:**

```
v2/modules/leads/staff/lead-assignment/
├── lead-assignment.routes.js
├── lead-assignment.controller.js
├── lead-assignment.usecase.js
├── lead-assignment.repository.js  (wraps assignLeadToAUser, bulkAssignLeadTsoAUser, markClientLeadAsConverted, checkIfUserAllowedToTakeALead)
└── lead-assignment.validation.js  (Zod: body for assign/bulk, params for countries check)
```

**Endpoints:**

- `PUT /assign` — assign lead to user (self or admin assigns)
- `PUT /bulk-assign` — bulk convert (admin only) → `AuthMiddleware.requireRole(["ADMIN","SUPER_ADMIN","SUPER_SALES"])`
- `PUT /convert` — mark as ON_HOLD
- `POST /:userId/countries` — check country permission

---

#### Sub-module: `call-reminders`

**Path prefix:** `/v2/staff/leads`  
**Files:**

```
v2/modules/leads/staff/call-reminders/
├── call-reminders.routes.js
├── call-reminders.controller.js
├── call-reminders.usecase.js
├── call-reminders.repository.js   (wraps getNextCalls, createCallReminder, updateCallReminderStatus)
└── call-reminders.validation.js
```

**Endpoints:**

- `GET /calls` — list upcoming calls (paginated)
- `POST /:id/call-reminders` — create
- `PUT /call-reminders/:id` — update status

---

#### Sub-module: `meeting-reminders`

**Path prefix:** `/v2/staff/leads`  
**Files:**

```
v2/modules/leads/staff/meeting-reminders/
├── meeting-reminders.routes.js
├── meeting-reminders.controller.js
├── meeting-reminders.usecase.js
├── meeting-reminders.repository.js   (wraps getNextMeetings, getNextMeetings, getAllMeetingRemindersByClientLeadId, getMeetingById, createMeetingReminder, createMeetingReminderWithToken, updateMeetingReminderStatus)
└── meeting-reminders.validation.js
```

**Endpoints:**

- `GET /meetings` — list next meetings (paginated)
- `GET /:clientLeadId/meeting-reminders` — all for a lead
- `GET /meeting-reminders/:meetingId` — single meeting
- `POST /:id/meeting-reminders` — create
- `POST /:id/meeting-reminders/token` — create with token
- `PUT /meeting-reminders/:id` — update status

---

#### Sub-module: `price-offers`

**Path prefix:** `/v2/staff/leads`  
**Files:**

```
v2/modules/leads/staff/price-offers/
├── price-offers.routes.js
├── price-offers.controller.js
├── price-offers.usecase.js
├── price-offers.repository.js   (wraps createPriceOffer, editPriceOfferStatus)
└── price-offers.validation.js
```

**Endpoints:**

- `POST /:id/price-offers` — create
- `POST /price-offers/change-status` — accept/reject

---

#### Sub-module: `lead-payments`

**Path prefix:** `/v2/staff/leads`  
**Files:**

```
v2/modules/leads/staff/lead-payments/
├── lead-payments.routes.js
├── lead-payments.controller.js
├── lead-payments.usecase.js
├── lead-payments.repository.js   (wraps makePayments, makeExtraServicePayments)
└── lead-payments.validation.js
```

**Endpoints:**

- `POST /:id/payments` — add payments (type: regular or extra-service)

---

#### Sub-module: `lead-files-notes`

**Path prefix:** `/v2/staff/leads`  
**Files:**

```
v2/modules/leads/staff/lead-files-notes/
├── lead-files-notes.routes.js
├── lead-files-notes.controller.js
├── lead-files-notes.usecase.js
├── lead-files-notes.repository.js   (wraps createFile, createNote, remindUserToPay, remindUserToCompleteRegister)
└── lead-files-notes.validation.js
```

**Endpoints:**

- `POST /:id/files` — upload file
- `POST /:id/notes` — add note
- `POST /:clientLeadId/payment-reminder` — remind to pay
- `POST /:clientLeadId/complete-register` — remind to register

---

#### Sub-module: `sales-stages`

**Path prefix:** `/v2/staff/leads`  
**Files:**

```
v2/modules/leads/staff/sales-stages/
├── sales-stages.routes.js
├── sales-stages.controller.js
├── sales-stages.usecase.js
├── sales-stages.repository.js   (wraps getSalesStages, editSalesSage)
└── sales-stages.validation.js
```

**Endpoints:**

- `GET /:clientLeadId/sales-stages` — get stages
- `POST /:clientLeadId/sales-stages` — edit stage

---

#### Collector router: `leads/staff/staff-leads.routes.js`

This file is the entry point that mounts all sub-modules:

```js
// staff-leads.routes.js
router.use("/", leadListRouter);
router.use("/", leadDetailRouter);
router.use("/", leadAssignmentRouter);
router.use("/", callRemindersRouter);
router.use("/", meetingRemindersRouter);
router.use("/", priceOffersRouter);
router.use("/", leadPaymentsRouter);
router.use("/", leadFilesNotesRouter);
router.use("/", salesStagesRouter);
```

---

### 5.2 `projects` → `projects`

**Path prefix:** `/v2/projects`  
**Files:**

```
v2/modules/projects/
├── projects.routes.js
├── projects.controller.js
├── projects.usecase.js
├── projects.repository.js   (wraps all project service calls)
└── projects.validation.js
```

**Endpoints (same as current):**

- `GET /designers` — designer project list
- `GET /designers/columns` — designer kanban
- `GET /designers/:id` — designer lead details
- `GET /` — project list
- `GET /archived` — archived (paginated)
- `GET /user-profile/:userId` — user's projects
- `GET /:id` — project details
- `PUT /:id` — update project
- `PUT /:id/assign-designer` — assign designer
- `PUT /designers/:leadId/status` — update designer status

**Role Logic (moved to usecase):**

- Admin → `isAdmin: true`, scope all
- Designer roles → scoped to `userId = req.auth.id`

---

### 5.3 `tasks` → `tasks`

**Path prefix:** `/v2/tasks`  
**Files:**

```
v2/modules/tasks/
├── tasks.routes.js
├── tasks.controller.js
├── tasks.usecase.js
├── tasks.repository.js   (wraps all task + note service calls)
└── tasks.validation.js
```

**Endpoints:**

- `GET /` — list tasks
- `POST /` — create task
- `GET /:id` — task details
- `PUT /:taskId` — update task
- `GET /notes` — list notes
- `POST /notes` — create note
- `DELETE /:id` — delete model

**Note:** The generic `getNotes`, `addNote`, `deleteAModel` are also used in other modules. They stay in their service files and will be called by each module's usecase independently.

---

### 5.4 `updates` → `updates`

**Path prefix:** `/v2/updates`  
**Files:**

```
v2/modules/updates/
├── updates.routes.js
├── updates.controller.js
├── updates.usecase.js
├── updates.repository.js   (wraps all update service calls)
└── updates.validation.js
```

**Endpoints:**

- `GET /:clientLeadId` — list updates
- `GET /shared-settings/:updateId` — shared settings
- `POST /:clientLeadId` — create update
- `POST /:updateId/authorize` — authorize department
- `POST /:updateId/authorize/shared` — unauthorize
- `PUT /:updateId/archive` — toggle archive
- `PUT /shared-updates/:sharedUpdateId/archive` — toggle shared archive
- `PUT /:updateId/done` — mark done

---

### 5.5 `dashboard` → `dashboard`

**Path prefix:** `/v2/dashboard`  
**Files:**

```
v2/modules/dashboard/
├── dashboard.routes.js
├── dashboard.controller.js
├── dashboard.usecase.js
├── dashboard.repository.js   (wraps all dashboard service calls)
└── dashboard.validation.js   (Zod: query filters)
```

**Endpoints:**

- `GET /key-metrics`
- `GET /leads-status`
- `GET /monthly-performance`
- `GET /emirates-analytics`
- `GET /leads-monthly-overview`
- `GET /week-performance`
- `GET /latest-leads`
- `GET /recent-activities`
- `GET /designer-metrics`

**Enhancement:** All dashboard endpoints have the same pattern — query params + role check. The usecase can abstract the role scoping into a shared `buildDashboardScope(auth)` helper inside the usecase file.

---

### 5.6 `delivery` → `delivery`

**Path prefix:** `/v2/delivery`  
**Files:**

```
v2/modules/delivery/
├── delivery.routes.js
├── delivery.controller.js
├── delivery.usecase.js
├── delivery.repository.js   (wraps getDeliveryScheduleByProjectId, createNewDeliverySchedule, linkADeliveryToMeeting, deleteDeliverySchedule)
└── delivery.validation.js
```

**Endpoints:**

- `GET /:projectId/schedules`
- `POST /`
- `POST /:deliveryId/link-meeting`
- `DELETE /:deliveryId`

---

### 5.7 `sales-stages` → embedded in `leads/staff/`

Already covered in section 5.1. The old `sales-stages.js` (2 endpoints) is merged into the `leads/staff/sales-stages/` sub-module.

---

### 5.8 `utilities` → split into 3 modules

The old `utilities.js` has 3 completely unrelated domains crammed together. They split into:

#### Sub-module A: `notifications`

**Path prefix:** `/v2/notifications`  
**Files:**

```
v2/modules/notifications/
├── notifications.routes.js
├── notifications.controller.js
├── notifications.usecase.js
├── notifications.repository.js   (wraps getNotifications from utility service)
└── notifications.validation.js   (Zod: pagination query)
```

**Endpoints:**

- `GET /` — paginated notifications for req.auth.id

---

#### Sub-module B: `user-logs`

**Path prefix:** `/v2/user-logs`  
**Files:**

```
v2/modules/user-logs/
├── user-logs.routes.js
├── user-logs.controller.js
├── user-logs.usecase.js
├── user-logs.repository.js   (wraps checkUserLog, submitUserLog)
└── user-logs.validation.js   (Zod: userId, startTime, endTime, date, totalMinutes, description)
```

**Endpoints:**

- `GET /` — check logs by user+time range
- `POST /` — submit log entry

---

#### Sub-module C: `utilities`

**Path prefix:** `/v2/utilities`  
**Files:**

```
v2/modules/utilities/
├── utilities.routes.js
├── utilities.controller.js
├── utilities.usecase.js
├── utilities.repository.js   (wraps getAllFixedData, getUserRole, getAdmins, getOtherRoles, getImages, getImageSesssionModel, getModelIds)
└── utilities.validation.js
```

**Endpoints:**

- `GET /fixed-data`
- `GET /users/role/:userId`
- `GET /users/admins`
- `GET /roles`
- `GET /images`
- `GET /image-session`
- `GET /model-ids`

---

### 5.9 `users` → `users`

**Path prefix:** `/v2/users`  
**Files:**

```
v2/modules/users/
├── users.routes.js
├── users.controller.js
├── users.usecase.js
├── users.repository.js   (wraps getUserProfileById, updateUserProfileById, getAllUsers)
└── users.validation.js
```

**Endpoints:**

- `GET /:userId/profile`
- `PUT /:userId/profile`
- `GET /all-chat-users` _(from shared/index.js global route)_
- `GET /all-related-chat-users` _(from shared/index.js global route)_

---

### 5.10 `reviews` → `reviews`

**Path prefix:** `/v2/reviews`  
**Files:**

```
v2/modules/reviews/
├── reviews.routes.js
├── reviews.controller.js
├── reviews.usecase.js
├── reviews.repository.js   (wraps createAuthUrl, getLocations, getReviews, handleOAuthCallback)
└── reviews.validation.js
```

**Endpoints:**

- `GET /oauth2callback`
- `GET /locations`
- `GET /reviews`

---

## 6. File Structure After Migration

```
server/v2/modules/
├── auth/                              ← EXISTS
├── chat/                              ← EXISTS
├── leads/
│   ├── client/
│   │   └── booking-lead/             ← EXISTS
│   └── staff/
│       ├── staff-leads.routes.js     ← NEW Collector
│       ├── lead-list/                ← NEW
│       │   ├── lead-list.routes.js
│       │   ├── lead-list.controller.js
│       │   ├── lead-list.usecase.js
│       │   ├── lead-list.repository.js
│       │   └── lead-list.validation.js
│       ├── lead-detail/              ← NEW
│       │   └── (same 5 files)
│       ├── lead-assignment/          ← NEW
│       │   └── (same 5 files)
│       ├── call-reminders/           ← NEW
│       │   └── (same 5 files)
│       ├── meeting-reminders/        ← NEW
│       │   └── (same 5 files)
│       ├── price-offers/             ← NEW
│       │   └── (same 5 files)
│       ├── lead-payments/            ← NEW
│       │   └── (same 5 files)
│       ├── lead-files-notes/         ← NEW
│       │   └── (same 5 files)
│       └── sales-stages/             ← NEW
│           └── (same 5 files)
├── projects/                         ← NEW
│   ├── projects.routes.js
│   ├── projects.controller.js
│   ├── projects.usecase.js
│   ├── projects.repository.js
│   └── projects.validation.js
├── tasks/                            ← NEW
│   └── (same 5 files)
├── updates/                          ← NEW
│   └── (same 5 files)
├── dashboard/                        ← NEW
│   └── (same 5 files)
├── delivery/                         ← NEW
│   └── (same 5 files)
├── notifications/                    ← NEW
│   └── (same 5 files)
├── user-logs/                        ← NEW
│   └── (same 5 files)
├── utilities/                        ← NEW
│   └── (same 5 files)
├── users/                            ← NEW
│   └── (same 5 files)
├── reviews/                          ← NEW
│   └── (same 5 files)
└── telegram/                         ← EXISTS
```

**Total new files:** ~13 modules × 5 files + 9 sub-modules × 5 files = **~110 new files**

---

## 7. Shared Infrastructure Changes

No changes to existing infra files. The new modules will import from existing v2 infra:

| Need            | Import From                                       |
| --------------- | ------------------------------------------------- |
| Prisma client   | `../../infra/prisma.js`                           |
| Auth middleware | `../../shared/middlewares/auth.middleware.js`     |
| asyncHandler    | `../../shared/middlewares/async-handler.js`       |
| validate        | `../../shared/middlewares/validate.middleware.js` |
| AppError        | `../../shared/errors/AppError.js`                 |
| HTTP responses  | `../../shared/http/response.js`                   |

**No new infra files needed.**

---

## 8. v2 `routes.js` Updates

Current `v2/routes.js`:

```js
router.use("/auth", authRoutes);
router.use("/client/booking-leads", bookingLeadsRouter);
router.use("/chat", chatRouter);
router.use("/telegram", telegramRouter);
```

After migration, add:

```js
router.use("/staff/leads", requireAuth, staffLeadsRouter);
router.use("/projects", requireAuth, projectsRouter);
router.use("/tasks", requireAuth, tasksRouter);
router.use("/updates", requireAuth, updatesRouter);
router.use("/dashboard", requireAuth, dashboardRouter);
router.use("/delivery", requireAuth, deliveryRouter);
router.use("/notifications", requireAuth, notificationsRouter);
router.use("/user-logs", requireAuth, userLogsRouter);
router.use("/utilities", requireAuth, utilitiesRouter);
router.use("/users", requireAuth, usersRouter);
router.use("/reviews", requireAuth, reviewsRouter);
```

**All v2 routes are prefixed with `/v2/` by the app.js mount.**  
So final URLs: `/v2/staff/leads`, `/v2/projects`, etc.

**Frontend URL change note:** When the frontend migrates a feature to use v2, only the base URL prefix changes from `/shared/...` to `/v2/...`. All endpoint paths stay the same.

---

## 9. Middleware Strategy

### Auth — shared across all new modules

All routes in these new modules require authentication. Mount `AuthMiddleware.requireAuth` either:

- **Option A (recommended):** In `routes.js` at mount time — `router.use("/staff/leads", requireAuth, staffLeadsRouter)`. Cleaner.
- **Option B:** In each module's routes file at the top — `router.use(AuthMiddleware.requireAuth)`. More explicit per-module.

**Recommendation: Option A** — matches existing v2 pattern where auth is applied in the router, not repeated everywhere.

### Role Guards

For admin-only endpoints, use inline `AuthMiddleware.requireRole(["ADMIN","SUPER_ADMIN"])` as middleware on the specific route. Example:

```js
router.put(
  "/bulk-assign",
  AuthMiddleware.requireRole(["ADMIN", "SUPER_ADMIN", "SUPER_SALES"]),
  validate(bulkAssignSchema),
  asyncHandler(controller.bulkAssign),
);
```

### `req.auth` Shape

Available after `AuthMiddleware.requireAuth`:

```js
// req.auth = { id, role, isSuperSales, isPrimary, activeRole, ... }
```

This replaces `getTokenData(req, res)` and `getCurrentUser(req)` everywhere.

---

## 10. Enhancements vs Old Code

| Issue in Old Code                                          | Enhancement in v2                                                 |
| ---------------------------------------------------------- | ----------------------------------------------------------------- |
| Duplicate endpoints (`/update/:id` AND `/lead/update/:id`) | Merge into single `PUT /:id` in `lead-detail` module              |
| No input validation (raw req.body)                         | Zod schemas on all endpoints                                      |
| Every route has `try/catch + res.status(500)`              | `asyncHandler` + global `errorHandler`                            |
| `console.log` everywhere in routes                         | Removed — errors caught by global handler                         |
| Role checks inline in route (12+ lines per endpoint)       | Moved to usecase: a single `resolveScope(auth)` helper per domain |
| `getTokenData/getCurrentUser` called inconsistently        | Unified to `req.auth`                                             |
| `client-leads.js` = 700 lines one file                     | Split into 9 sub-modules, each ~50-100 lines                      |
| `utilities.js` = 3 unrelated domains in 1 file             | Properly split into `notifications`, `user-logs`, `utilities`     |
| Sales stages had no parent domain                          | Now lives logically under `leads/staff/sales-stages`              |
| No per-module README or documentation                      | Each module folder can have a short `README.md`                   |

---

## 11. Migration Execution Order

Recommended order (dependencies considered):

| Step | Module                          | Reason                                   |
| ---- | ------------------------------- | ---------------------------------------- |
| 1    | `notifications`                 | Standalone, no deps on other new modules |
| 2    | `user-logs`                     | Standalone                               |
| 3    | `utilities`                     | Standalone                               |
| 4    | `users`                         | Low deps                                 |
| 5    | `reviews`                       | Standalone, external API                 |
| 6    | `dashboard`                     | Read-only, low risk                      |
| 7    | `delivery`                      | Small module                             |
| 8    | `sales-stages` (in leads/staff) | Small, single purpose                    |
| 9    | `updates`                       | Medium complexity                        |
| 10   | `tasks`                         | Medium complexity                        |
| 11   | `projects`                      | Medium complexity, links to leads        |
| 12   | `lead-list`                     | Part of leads/staff                      |
| 13   | `lead-detail`                   | Part of leads/staff                      |
| 14   | `lead-assignment`               | Part of leads/staff                      |
| 15   | `call-reminders`                | Part of leads/staff                      |
| 16   | `meeting-reminders`             | Part of leads/staff                      |
| 17   | `price-offers`                  | Part of leads/staff                      |
| 18   | `lead-payments`                 | Part of leads/staff                      |
| 19   | `lead-files-notes`              | Part of leads/staff                      |
| 20   | Wire all into `routes.js`       | Mount all collected routers              |

---

## 12. Risk & Notes

| Risk                                                                                          | Mitigation                                                                                                                  |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Frontend currently calls `/shared/...` URLs                                                   | Keep old routes running in parallel. Frontend migrates per-feature when ready.                                              |
| Role logic is complex (9 roles, isSuperSales flag)                                            | Each usecase gets a `resolveScope(auth)` helper that encapsulates the logic                                                 |
| `deleteAModel` in tasks is generic — deletes any model                                        | Keep as-is in usecase layer; add validation to enforce allowed model types                                                  |
| `createFile` in `lead-files-notes` may require multipart/upload infrastructure                | Check if it's saving a URL (from Telegram/storage) or actual upload. If upload needed, add multer middleware in the module. |
| `getAdminClientLeadDetails` vs `getClientLeadDetails` — different services for admin vs staff | Encapsulate the branch logic cleanly in `lead-detail.usecase.js`                                                            |
| Duplicate endpoint `PUT /update/:id` and `PUT /lead/update/:id`                               | Plan to expose as single `PUT /:id/update` in v2. Old endpoints remain untouched.                                           |
| Sales stages sat in `routes/shared/sales-stages.js` as its own file                           | Merged into leads/staff in v2. No functional change.                                                                        |

---

## Summary

| Metric                  | Value                                                                 |
| ----------------------- | --------------------------------------------------------------------- |
| Old files to touch      | **0** — old routes unchanged                                          |
| New v2 modules          | **13** (including 9 sub-modules under leads/staff)                    |
| New files to create     | **~110**                                                              |
| Old endpoints preserved | **100%** — same results, same scoping logic                           |
| Improvements introduced | Validation, error handling, auth pattern, role guards, no duplication |
| Frontend changes needed | Zero initially — migrate per-feature when ready                       |
