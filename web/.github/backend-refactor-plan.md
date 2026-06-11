# Backend Refactor Master Plan

> **Purpose:** This is the master backend refactoring roadmap for the Design Management System server. It documents the full current state, identifies architectural problems, defines a clean modular target structure, and provides an execution-ready migration plan with atomic TODOs.
>
> **Generated:** 2026-04-03 &nbsp;|&nbsp; **Stack:** Node 22+ ESM, Express, Prisma + MySQL, BullMQ + Redis, Socket.IO, Telegram TDLib

---

## Table of Contents

1. [Progress Dashboard](#1-progress-dashboard)
2. [Audit Summary](#2-audit-summary)
3. [Current Structure Overview](#3-current-structure-overview)
4. [Proposed Target Structure](#4-proposed-target-structure)
5. [Old → New Mapping Index](#5-old--new-mapping-index)
6. [Route and Handler Mapping](#6-route-and-handler-mapping)
7. [Shared Extraction Plan](#7-shared-extraction-plan)
8. [Module-by-Module Refactor](#8-module-by-module-refactor)
   - 8.1 [Auth](#81-auth-module)
   - 8.2 [Chat](#82-chat-module)
   - 8.3 [Client Leads (CRM)](#83-client-leads-crm-module)
   - 8.4 [Contracts](#84-contracts-module)
   - 8.5 [Projects & Tasks](#85-projects--tasks-module)
   - 8.6 [Calendar & Meetings](#86-calendar--meetings-module)
   - 8.7 [Accountant / Finance](#87-accountant--finance-module)
   - 8.8 [Admin Panel](#88-admin-panel-module)
   - 8.9 [Staff](#89-staff-module)
   - 8.10 [Courses](#810-courses-module)
   - 8.11 [Image Sessions](#811-image-sessions-module)
   - 8.12 [Questions / VERSA](#812-questions--versa-module)
   - 8.13 [Notifications](#813-notifications-module)
   - 8.14 [Site Utilities / Config](#814-site-utilities--config-module)
   - 8.15 [Drive / File Uploads](#815-drive--file-uploads-module)
   - 8.16 [Sales Stages](#816-sales-stages-module)
   - 8.17 [Dashboard](#817-dashboard-module)
   - 8.18 [User Profile](#818-user-profile-module)
   - 8.19 [Google Reviews](#819-google-reviews-module)
9. [Special Systems](#9-special-systems)
   - 9.1 [Socket.IO](#91-socketio)
   - 9.2 [Chat (Deep Dive)](#92-chat-deep-dive)
   - 9.3 [Queue System](#93-queue-system)
   - 9.4 [Worker System](#94-worker-system)
   - 9.5 [Telegram Integration](#95-telegram-integration)
   - 9.6 [Schedulers / Cron Jobs](#96-schedulers--cron-jobs)
10. [Phased Roadmap](#10-phased-roadmap)
11. [Dependency Graph](#11-dependency-graph)
12. [Breaking Changes & Coordination](#12-breaking-changes--coordination)
13. [Final Master Checklist](#13-final-master-checklist)

---

## 1. Progress Dashboard

### Audit Status

| Area                              | Status                                   |
| --------------------------------- | ---------------------------------------- |
| Folder/file structure audited     | ✅ Complete                              |
| All route files read and mapped   | ✅ Complete (47 files, 200+ endpoints)   |
| All service files read and mapped | ✅ Complete (68 files)                   |
| Socket.IO events mapped           | ✅ Complete (20+ events)                 |
| Queue/Worker system mapped        | ✅ Complete (6 queues, 6 workers)        |
| Telegram integration mapped       | ✅ Complete (33 functions)               |
| Scheduler/cron jobs mapped        | ✅ Complete (3 cron jobs)                |
| v2 refactored code reviewed       | ✅ Complete (auth done, chat scaffolded) |
| Target module structure defined   | ✅ Complete                              |
| Migration tasks defined           | ✅ Complete                              |
| Blockers identified               | ✅ Complete                              |

### Overall Refactor Progress

```
v2 Refactored:   ██░░░░░░░░░░░░░░░░░░  ~8%
```

| Category         | Total    | Done     | Scaffolded | Remaining |
| ---------------- | -------- | -------- | ---------- | --------- |
| Modules          | 19       | 1 (auth) | 1 (chat)   | 17        |
| Route files      | 47       | 1        | 0          | 46        |
| Service files    | 68       | 1        | 0          | 67        |
| Socket events    | 20+      | 0        | 0          | 20+       |
| Queue/Workers    | 12       | 0        | 0          | 12        |
| Schedulers       | 3        | 0        | 0          | 3         |
| Infra services   | 8 target | 5        | 1          | 2         |
| Shared utilities | 7 target | 5        | 0          | 2         |

---

## 2. Audit Summary

### Scope

| Metric                        | Count                     |
| ----------------------------- | ------------------------- |
| Route files (legacy)          | 47                        |
| Service files (legacy)        | 68                        |
| Prisma models                 | 109                       |
| Prisma enums                  | 40                        |
| API endpoints                 | 200+                      |
| Socket.IO events              | 20+                       |
| BullMQ queues                 | 6                         |
| BullMQ workers                | 6                         |
| Cron schedulers               | 3                         |
| v2 files (already refactored) | ~52 (mostly auth + infra) |

### Architecture Issues Found

#### Critical Issues

1. **`services/main/utility/utility.js` is a god-file (~300+ lines)**
   - Contains JWT generation/verification, Prisma error handling, pagination, authorization middleware, file uploads, FTP operations, notifications, search, and user data helpers — all in one file.
   - Every route file imports from this file. Changing anything here has blast radius across the entire app.

2. **Socket.IO handler is monolithic (`services/socket.js` ~580 lines)**
   - All 20+ events (chat messages, calls, typing, reactions, read receipts, presence) are in a single `initSocket()` function.
   - Direct Prisma queries mixed with event handling.
   - Chat business logic duplicated between socket handlers and chat services.
   - No event validation / schema enforcement.

3. **Telegram integration is deeply coupled (`services/telegram/telegram-functions.js` ~1000 lines)**
   - 33 exported functions mixing channel management, notifications, message fetching, file uploading, and DB operations.
   - Called from services, workers, and schedulers with no clear boundaries.
   - Direct Prisma queries for leads, notes, files, channels.

4. **Business logic in route handlers**
   - `routes/admin/admin.js (~200+ lines)`: Direct Prisma queries, file uploads, complex filtering.
   - `routes/client/leads.js (~200+ lines)`: Inline price calculations, code generation, date handling, Prisma queries.
   - `routes/accountant/accountant.js (~200+ lines)`: Complex payment filtering in controller.

5. **No input validation layer**
   - Legacy routes have zero Zod/Joi schemas. Only the v2 auth module has validation.
   - Request body/params/query are used directly without sanitization.

#### High-Priority Issues

6. **Role-based authorization is scattered**
   - `verifyTokenAndHandleAuthorization(req, res, next, "ADMIN")` is called individually per route file.
   - Role checks duplicated inline in controllers (checking `ADMIN` vs `SUPER_ADMIN` vs `STAFF`).
   - No centralized permission system.

7. **Shared services barrel (`services/main/shared/index.js`) re-exports 10 files**
   - `leadServices`, `paymentServices`, `projectServices`, `taskServices`, `noteServices`, `updateServices`, `dashboardServices`, `deliveryServices`, `salesStageServices`, `utilityServices`.
   - These are not "shared" helpers — they are domain services that belong in specific modules.

8. **Client-facing routes have no auth middleware**
   - `routes/client/chat/`, `routes/client/payments.js`, `routes/calendar/client-calendar.js` rely on token-in-query for access.
   - No rate limiting on public endpoints.
   - Token validation is inconsistent.

9. **Duplicate upload patterns**
   - `routes/utility/utility.js` has upload endpoints.
   - `routes/client/uploads.js` has separate upload endpoints.
   - `services/main/utility/utility.js` has `uploadFiles()` and `uploadAsHttp()`.
   - `services/main/utility/uploadAsChunk.js` has chunk handling.
   - `services/drive.js` has Google Drive uploads.

10. **Calendar logic split across 5 files**
    - `routes/calendar/calendar.js`, `new-calendar.js`, `client-calendar.js`, `google.js`, `old-call.js`.
    - `new-calendar.js` is a service file placed in the routes folder.
    - `old-call.js` is legacy code still mounted.

#### Medium-Priority Issues

11. **Naming inconsistencies**
    - Typos: `imageSessionSevices.js`, `editSalesSage()`, `getLeadByPorjects()`, `getUserAttampts()`.
    - Mixed naming: `chatRoomServices.js` vs just `utils.js`.
    - Plural inconsistency: `client/` (singular) vs `clients/` (plural).

12. **No error boundary per module**
    - Global error handler exists in v2 but legacy routes use ad-hoc `try/catch` with `handlePrismaError`.

13. **Email templates scattered**
    - `services/sendMail.js` — SMTP transport.
    - `services/main/email/emailTemplates.js` — HTML templates.
    - `v2/infra/mail/mail.js` — v2 transport.
    - `v2/infra/mail/email-shell.js` — v2 shell.
    - Templates are split between legacy and v2 with no shared template engine.

14. **Notification service is a utility function, not a module**
    - `createNotification()` in `services/main/utility/utility.js` is the main notification creator.
    - `services/notification.js` has lead-specific notifications.
    - Notification types and templates are embedded as inline strings.

15. **No test infrastructure**
    - Zero test files in the entire codebase.

---

## 3. Current Structure Overview

### Legacy Structure (`/` root)

```
server/
├── index.js                          ← Express app + server bootstrap (~120 lines)
├── package.json
├── prisma/
│   ├── prisma.js                     ← Prisma client singleton
│   ├── schema.prisma                 ← Main schema (109 models, 40 enums)
│   └── migrations/                   ← 3 migrations
│
├── routes/                           ← 47 route files
│   ├── auth/auth.js                  ← Login, register, logout, status, reset
│   ├── admin/admin.js                ← User mgmt, leads, commissions, telegram (FAT)
│   ├── accountant/accountant.js      ← Payments, salaries, rents, expenses (FAT)
│   ├── staff/staff.js                ← Dashboard calls only
│   ├── shared/                       ← 11 files: client-leads, projects, tasks, updates, etc.
│   │   └── index.js                  ← Aggregator mounting all shared sub-routes
│   ├── chat/                         ← 4 files: rooms, messages, members, files (staff)
│   ├── client/                       ← 7 files: leads, payments, uploads, notes, etc.
│   │   └── chat/                     ← 4 files: rooms, messages, members, files (client)
│   ├── clients/clients.js            ← Aggregator for all client-facing routes
│   ├── calendar/                     ← 5 files: calendar, new-calendar, client, google, old
│   ├── contract/                     ← 2 files: contracts, client-contract
│   ├── courses/                      ← 2 files: adminCourses, staffCourses
│   ├── image-session/                ← 3 files: image-session, client, admin
│   ├── questions/questions.js        ← VERSA questions
│   ├── site-utilities/               ← 2 files: siteUtility, contract-utilities
│   └── utility/utility.js            ← Upload, search, notifications
│
├── services/                         ← 68 service files
│   ├── constants.js                  ← Company name constants
│   ├── enums.js                      ← Lead status/stage enums
│   ├── links.js                      ← Frontend URL builders
│   ├── drive.js                      ← Google Drive integration
│   ├── notification.js               ← Lead notification templates
│   ├── reviews.js                    ← Google Reviews API
│   ├── sendMail.js                   ← SMTP email transport
│   ├── socket.js                     ← Socket.IO monolith (~580 lines)
│   ├── utilityServices.js            ← Font/image/text processing for PDF
│   ├── main/
│   │   ├── utility/utility.js        ← GOD FILE: JWT, auth, upload, search, notifications
│   │   ├── utility/uploadAsChunk.js  ← Chunked upload processing
│   │   ├── auth/authServices.js      ← Login, register, password reset
│   │   ├── admin/adminServices.js    ← User CRUD, staff management
│   │   ├── accountant/accountantServices.js ← Payment processing
│   │   ├── staff/staffServices.js    ← Notes, reminders, meetings
│   │   ├── chat/                     ← 5 files: rooms, messages, members, files, utils
│   │   ├── shared/                   ← 10 files: leads, projects, tasks, etc (barrel export)
│   │   ├── contract/                 ← 7 files: services, PDF gen, rules, data
│   │   ├── courses/                  ← 2 files: admin services, staff services
│   │   ├── calendar/                 ← 2 files: calendar services, google calendar
│   │   ├── image-session/            ← 2 files: admin services, client services
│   │   ├── client/                   ← 3 files: client services, leads, payments
│   │   ├── email/emailTemplates.js   ← HTML email templates
│   │   ├── shared-questions/         ← VERSA question services
│   │   └── site-utilities/           ← Site config services
│   ├── queues/                       ← 6 queue definitions
│   ├── workers/                      ← 6 worker processors
│   ├── redis/                        ← 2 files: Redis client, BullMQ connection
│   └── telegram/                     ← 2 files: connection, functions (~1000 lines)
│
├── tele.js                           ← Telegram standalone entry
├── tele-cron.js                      ← Telegram cron scheduler
├── start-telegram-system.js          ← Telegram + workers bootstrap
├── reminderScheduler.js              ← Meeting reminder cron
├── projectDeliveryTimeReminder.js    ← Delivery deadline cron
│
└── v2/                               ← PARTIALLY REFACTORED (~52 files)
    ├── app.js                        ← Express app config
    ├── routes.js                     ← Route aggregator (only auth mounted)
    ├── server.js                     ← HTTP server start
    ├── config/                       ← env.js, cors.js
    ├── infra/                        ← prisma, security (jwt/hash), mail, socket, telegram stub
    ├── shared/                       ← AppError, response helpers, middlewares, brand
    └── modules/
        ├── auth/                     ← ✅ FULLY REFACTORED (8 files)
        └── chat/                     ← 🚧 SCAFFOLDED (7 empty files)
```

### What Each Major Area Currently Does

| Legacy Folder                      | Responsibility                                      | Lines (est.) |
| ---------------------------------- | --------------------------------------------------- | ------------ |
| `routes/`                          | HTTP endpoint definitions + some inline logic       | ~3,500       |
| `services/main/utility/utility.js` | Auth, upload, search, notifications, error handling | ~300         |
| `services/main/shared/`            | Lead, project, task, note, update, sales services   | ~1,200       |
| `services/main/chat/`              | Chat room, message, member, file services           | ~1,100       |
| `services/main/contract/`          | Contract lifecycle, PDF generation                  | ~1,200       |
| `services/main/admin/`             | User management, staff CRUD                         | ~200         |
| `services/main/accountant/`        | Payment, salary, expense processing                 | ~150         |
| `services/main/calendar/`          | Calendar slots, Google Calendar OAuth               | ~350         |
| `services/main/courses/`           | Course, lesson, test, homework management           | ~450         |
| `services/main/image-session/`     | Design session, space/material management           | ~240         |
| `services/main/client/`            | Client-facing services (PDF, leads, payments)       | ~600         |
| `services/socket.js`               | Real-time events (chat, calls, presence)            | ~580         |
| `services/telegram/`               | Telegram channel mgmt, message sync                 | ~1,055       |
| `services/queues/ + workers/`      | Async job processing                                | ~200         |
| Root schedulers                    | Cron jobs for reminders, delivery, Telegram         | ~275         |

---

## 4. Proposed Target Structure

```
v2/
├── app.js                            ← Express app initialization
├── routes.js                         ← Master route aggregator
├── server.js                         ← HTTP server bootstrap
│
├── config/
│   ├── env.js                        ← Environment variables (all env access centralized)
│   └── cors.js                       ← CORS origin policy
│
├── infra/                            ← Infrastructure / External integrations
│   ├── prisma/
│   │   ├── prisma.js                 ← Prisma client singleton
│   │   └── schema files              ← Modular .prisma files
│   ├── security/
│   │   ├── jwt.js                    ← JwtService (sign/verify)
│   │   └── hash.js                   ← HashService (bcrypt)
│   ├── mail/
│   │   ├── mail.js                   ← SMTP transport
│   │   └── email-shell.js            ← Branded HTML wrapper
│   ├── redis/
│   │   ├── redis.js                  ← Redis client
│   │   └── bullmq-connection.js      ← BullMQ shared connection
│   ├── socket/
│   │   ├── socket.js                 ← Socket.IO init + namespace setup
│   │   ├── chat.events.js            ← Chat event handlers (PROPOSED)
│   │   ├── call.events.js            ← Call event handlers (PROPOSED)
│   │   └── presence.events.js        ← Online/typing events (PROPOSED)
│   ├── telegram/
│   │   ├── telegram-client.js        ← TDLib client connection
│   │   └── telegram-service.js       ← Channel/message operations (PROPOSED)
│   ├── upload/
│   │   ├── multer.js                 ← Multer config (PROPOSED)
│   │   ├── chunk-upload.js           ← Chunked upload logic (PROPOSED)
│   │   └── ftp.js                    ← FTP upload operations (PROPOSED)
│   └── google/
│       ├── drive.js                  ← Google Drive API (PROPOSED)
│       └── reviews.js                ← Google Reviews API (PROPOSED)
│
├── shared/
│   ├── errors/
│   │   ├── AppError.js               ← Custom error class
│   │   └── error-handler.js          ← Global error middleware
│   ├── http/
│   │   └── response.js              ← Standardized response builders
│   ├── middlewares/
│   │   ├── async-handler.js          ← Async wrapper
│   │   ├── auth.middleware.js        ← requireAuth, requireRole
│   │   └── validate.middleware.js    ← Zod validation factory
│   ├── brand.js                      ← Company branding constants
│   ├── constants.js                  ← App-wide constants (PROPOSED)
│   ├── enums.js                      ← Business enums (PROPOSED)
│   ├── links.js                      ← Frontend URL builders (PROPOSED)
│   └── pagination.js                 ← Pagination helper (PROPOSED)
│
├── jobs/                             ← Queue + Worker definitions (PROPOSED)
│   ├── queues/
│   │   ├── pdf.queue.js
│   │   ├── telegram-channel.queue.js
│   │   ├── telegram-message.queue.js
│   │   ├── telegram-upload.queue.js
│   │   ├── telegram-user.queue.js
│   │   └── telegram-cron.queue.js
│   ├── workers/
│   │   ├── pdf.worker.js
│   │   ├── telegram-channel.worker.js
│   │   ├── telegram-message.worker.js
│   │   ├── telegram-upload.worker.js
│   │   ├── telegram-user.worker.js
│   │   └── telegram-cron.worker.js
│   └── schedulers/
│       ├── reminder.scheduler.js
│       ├── delivery-reminder.scheduler.js
│       └── telegram-cron.scheduler.js
│
└── modules/
    ├── auth/                         ← ✅ DONE
    │   ├── auth.routes.js
    │   ├── auth.controller.js
    │   ├── auth.usecase.js
    │   ├── auth.repo.js
    │   ├── auth.dto.js
    │   ├── auth.validation.js
    │   ├── auth.middleware.js
    │   └── auth.emails.js
    │
    ├── chat/                         ← 🚧 SCAFFOLDED
    │   ├── chat.routes.js
    │   ├── chat.controller.js
    │   ├── chat.usecase.js
    │   ├── chat.repo.js
    │   ├── chat.dto.js
    │   ├── chat.validation.js
    │   └── chat.middleware.js
    │
    ├── leads/                        ← (PROPOSED) CRM / Client Leads
    │   ├── leads.routes.js
    │   ├── leads.controller.js
    │   ├── leads.usecase.js
    │   ├── leads.repo.js
    │   ├── leads.validation.js
    │   ├── leads.dto.js
    │   └── leads.emails.js
    │
    ├── contracts/                    ← (PROPOSED)
    │   ├── contracts.routes.js
    │   ├── contracts.controller.js
    │   ├── contracts.usecase.js
    │   ├── contracts.repo.js
    │   ├── contracts.validation.js
    │   ├── contracts.dto.js
    │   ├── contracts.pdf.js          ← PDF generation
    │   └── client/                   ← Public contract signing
    │       ├── client-contract.routes.js
    │       └── client-contract.controller.js
    │
    ├── projects/                     ← (PROPOSED)
    │   ├── projects.routes.js
    │   ├── projects.controller.js
    │   ├── projects.usecase.js
    │   ├── projects.repo.js
    │   ├── projects.validation.js
    │   └── projects.dto.js
    │
    ├── tasks/                        ← (PROPOSED)
    │   ├── tasks.routes.js
    │   ├── tasks.controller.js
    │   ├── tasks.usecase.js
    │   ├── tasks.repo.js
    │   └── tasks.validation.js
    │
    ├── calendar/                     ← (PROPOSED)
    │   ├── calendar.routes.js
    │   ├── calendar.controller.js
    │   ├── calendar.usecase.js
    │   ├── calendar.repo.js
    │   ├── calendar.validation.js
    │   ├── google-calendar.js        ← Google OAuth integration
    │   └── client/
    │       ├── client-calendar.routes.js
    │       └── client-calendar.controller.js
    │
    ├── finance/                      ← (PROPOSED) Accountant + Payments
    │   ├── finance.routes.js
    │   ├── finance.controller.js
    │   ├── finance.usecase.js
    │   ├── finance.repo.js
    │   ├── finance.validation.js
    │   ├── finance.dto.js
    │   └── stripe.js                 ← Stripe integration
    │
    ├── users/                        ← (PROPOSED) Staff/Admin user management
    │   ├── users.routes.js
    │   ├── users.controller.js
    │   ├── users.usecase.js
    │   ├── users.repo.js
    │   ├── users.validation.js
    │   └── users.dto.js
    │
    ├── courses/                      ← (PROPOSED)
    │   ├── courses.routes.js
    │   ├── courses.controller.js
    │   ├── courses.usecase.js
    │   ├── courses.repo.js
    │   ├── courses.validation.js
    │   └── courses.dto.js
    │
    ├── image-sessions/               ← (PROPOSED)
    │   ├── image-sessions.routes.js
    │   ├── image-sessions.controller.js
    │   ├── image-sessions.usecase.js
    │   ├── image-sessions.repo.js
    │   ├── image-sessions.validation.js
    │   └── client/
    │       ├── client-image-sessions.routes.js
    │       └── client-image-sessions.controller.js
    │
    ├── questions/                    ← (PROPOSED) VERSA Framework
    │   ├── questions.routes.js
    │   ├── questions.controller.js
    │   ├── questions.usecase.js
    │   ├── questions.repo.js
    │   └── questions.validation.js
    │
    ├── notifications/                ← (PROPOSED)
    │   ├── notifications.routes.js
    │   ├── notifications.controller.js
    │   ├── notifications.usecase.js
    │   ├── notifications.repo.js
    │   └── notifications.emails.js
    │
    ├── updates/                      ← (PROPOSED) Lead milestones/updates
    │   ├── updates.routes.js
    │   ├── updates.controller.js
    │   ├── updates.usecase.js
    │   └── updates.repo.js
    │
    ├── delivery/                     ← (PROPOSED)
    │   ├── delivery.routes.js
    │   ├── delivery.controller.js
    │   ├── delivery.usecase.js
    │   └── delivery.repo.js
    │
    ├── sales-stages/                 ← (PROPOSED)
    │   ├── sales-stages.routes.js
    │   ├── sales-stages.controller.js
    │   ├── sales-stages.usecase.js
    │   └── sales-stages.repo.js
    │
    ├── dashboard/                    ← (PROPOSED) Analytics/KPIs
    │   ├── dashboard.routes.js
    │   ├── dashboard.controller.js
    │   ├── dashboard.usecase.js
    │   └── dashboard.repo.js
    │
    ├── profile/                      ← (PROPOSED) User self-profile
    │   ├── profile.routes.js
    │   ├── profile.controller.js
    │   ├── profile.usecase.js
    │   └── profile.repo.js
    │
    ├── site-config/                  ← (PROPOSED) PDF utilities, contract templates
    │   ├── site-config.routes.js
    │   ├── site-config.controller.js
    │   ├── site-config.usecase.js
    │   └── site-config.repo.js
    │
    └── drive/                        ← (PROPOSED) File management
        ├── drive.routes.js
        ├── drive.controller.js
        ├── drive.usecase.js
        └── drive.repo.js
```

### Layer Responsibility Summary

| Layer                | Purpose                                                               | Rules                                                         |
| -------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------- |
| `config/`            | Environment variables, CORS                                           | No business logic. No DB.                                     |
| `infra/`             | External service clients (DB, Redis, SMTP, Socket, Telegram, uploads) | Setup/connection only. No business rules.                     |
| `shared/`            | Cross-cutting concerns (errors, responses, middleware, constants)     | No feature-specific logic.                                    |
| `jobs/`              | Queue definitions, worker processors, cron schedulers                 | Job dispatch/handling only. Business logic stays in usecases. |
| `modules/{feature}/` | Domain features                                                       | Own routes/controller/usecase/repo/validation.                |
| `*.routes.js`        | Endpoint declarations + middleware chain                              | No business logic. No DB.                                     |
| `*.controller.js`    | Parse req → call usecase → send response                              | No DB. No business rules.                                     |
| `*.usecase.js`       | Business rules + workflow orchestration                               | No req/res. No Express.                                       |
| `*.repo.js`          | Prisma queries only                                                   | No business decisions.                                        |
| `*.validation.js`    | Zod input schemas                                                     | No DB. No permissions.                                        |
| `*.dto.js`           | Select fields, response shapes, mappers                               | No logic.                                                     |

---

## 5. Old → New Mapping Index

### Route Files

| Old File                                       | Responsibility                          | New Target                                                   | Action                                                  | Notes                                                |
| ---------------------------------------------- | --------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------- |
| `routes/auth/auth.js`                          | Login, register, logout, status, reset  | `v2/modules/auth/`                                           | ✅ Migrated                                             | Already done in v2                                   |
| `routes/shared/index.js`                       | Aggregator for shared sub-routes        | `v2/routes.js`                                               | Move + Split                                            | Each sub-route becomes its own module mount          |
| `routes/shared/client-leads.js`                | Lead CRUD, assignments, reminders       | `v2/modules/leads/leads.routes.js`                           | Move                                                    | ~150 lines, calls many services                      |
| `routes/shared/projects.js`                    | Project listing, management             | `v2/modules/projects/projects.routes.js`                     | Move                                                    | Role-based filtering in controller → move to usecase |
| `routes/shared/tasks.js`                       | Task CRUD                               | `v2/modules/tasks/tasks.routes.js`                           | Move                                                    |                                                      |
| `routes/shared/updates.js`                     | Lead update milestones                  | `v2/modules/updates/updates.routes.js`                       | Move                                                    |                                                      |
| `routes/shared/delivery.js`                    | Delivery schedules                      | `v2/modules/delivery/delivery.routes.js`                     | Move                                                    |                                                      |
| `routes/shared/sales-stages.js`                | Sales pipeline                          | `v2/modules/sales-stages/sales-stages.routes.js`             | Move                                                    |                                                      |
| `routes/shared/reviews.js`                     | Google Reviews                          | `v2/modules/reviews/reviews.routes.js` or `v2/infra/google/` | Move                                                    | Small, may stay as infra                             |
| `routes/shared/users.js`                       | User profile                            | `v2/modules/profile/profile.routes.js`                       | Move                                                    |                                                      |
| `routes/shared/utilities.js`                   | Notifications, fixed data, logs         | Split                                                        | Split to `notifications/` + `site-config/`              |                                                      |
| `routes/shared/dashboard.js`                   | Dashboard KPIs                          | `v2/modules/dashboard/dashboard.routes.js`                   | Move                                                    |                                                      |
| `routes/chat/rooms.js`                         | Staff chat rooms                        | `v2/modules/chat/chat.routes.js`                             | Move                                                    |                                                      |
| `routes/chat/messages.js`                      | Staff chat messages                     | `v2/modules/chat/chat.routes.js`                             | Merge                                                   | Into chat routes                                     |
| `routes/chat/members.js`                       | Staff chat members                      | `v2/modules/chat/chat.routes.js`                             | Merge                                                   | Into chat routes                                     |
| `routes/chat/files.js`                         | Staff chat files                        | `v2/modules/chat/chat.routes.js`                             | Merge                                                   | Into chat routes                                     |
| `routes/client/chat/rooms.js`                  | Client chat access                      | `v2/modules/chat/client/client-chat.routes.js`               | Move                                                    | Token-based public                                   |
| `routes/client/chat/messages.js`               | Client chat messages                    | `v2/modules/chat/client/client-chat.routes.js`               | Merge                                                   |                                                      |
| `routes/client/chat/members.js`                | Client chat members                     | `v2/modules/chat/client/client-chat.routes.js`               | Merge                                                   |                                                      |
| `routes/client/chat/files.js`                  | Client chat files                       | `v2/modules/chat/client/client-chat.routes.js`               | Merge                                                   |                                                      |
| `routes/admin/admin.js`                        | User CRUD, leads, commissions, telegram | Split                                                        | Split to `users/`, `leads/`, `finance/`                 | FAT file, must decompose                             |
| `routes/accountant/accountant.js`              | Payments, salaries, rents, expenses     | `v2/modules/finance/finance.routes.js`                       | Move                                                    | FAT file                                             |
| `routes/staff/staff.js`                        | Staff dashboard calls                   | `v2/modules/leads/leads.routes.js` or merged                 | Merge                                                   | Only 1 endpoint                                      |
| `routes/calendar/calendar.js`                  | Staff calendar management               | `v2/modules/calendar/calendar.routes.js`                     | Move                                                    |                                                      |
| `routes/calendar/new-calendar.js`              | Calendar business logic (misplaced)     | `v2/modules/calendar/calendar.usecase.js`                    | Move                                                    | Service in route folder!                             |
| `routes/calendar/client-calendar.js`           | Public booking                          | `v2/modules/calendar/client/`                                | Move                                                    |                                                      |
| `routes/calendar/google.js`                    | Google Calendar OAuth                   | `v2/modules/calendar/google-calendar.js`                     | Move                                                    |                                                      |
| `routes/calendar/old-call.js`                  | Legacy calendar                         | DELETE                                                       | Delete after verifying no usage                         |                                                      |
| `routes/contract/contracts.js`                 | Contract lifecycle                      | `v2/modules/contracts/contracts.routes.js`                   | Move                                                    |                                                      |
| `routes/contract/client-contract.js`           | Public contract signing                 | `v2/modules/contracts/client/`                               | Move                                                    |                                                      |
| `routes/courses/adminCourses.js`               | Admin course management                 | `v2/modules/courses/courses.routes.js`                       | Merge                                                   | Role-based in middleware                             |
| `routes/courses/staffCourses.js`               | Staff course access                     | `v2/modules/courses/courses.routes.js`                       | Merge                                                   |                                                      |
| `routes/image-session/image-session.js`        | Staff session management                | `v2/modules/image-sessions/`                                 | Move                                                    |                                                      |
| `routes/image-session/admin-image-session.js`  | Admin design management                 | `v2/modules/image-sessions/`                                 | Merge                                                   |                                                      |
| `routes/image-session/client-image-session.js` | Client session access                   | `v2/modules/image-sessions/client/`                          | Move                                                    |                                                      |
| `routes/questions/questions.js`                | VERSA questions                         | `v2/modules/questions/`                                      | Move                                                    |                                                      |
| `routes/site-utilities/siteUtility.js`         | PDF utility, payment conditions         | `v2/modules/site-config/`                                    | Move                                                    |                                                      |
| `routes/site-utilities/contract-utilities.js`  | Contract template CRUD                  | `v2/modules/site-config/`                                    | Merge                                                   |                                                      |
| `routes/client/leads.js`                       | Public lead creation                    | `v2/modules/leads/client/`                                   | Move                                                    | FAT, needs extraction                                |
| `routes/client/payments.js`                    | Stripe checkout                         | `v2/modules/finance/client/` or `v2/modules/leads/client/`   | Move                                                    |                                                      |
| `routes/client/uploads.js`                     | File uploading                          | `v2/infra/upload/` + `v2/modules/drive/`                     | Split                                                   |                                                      |
| `routes/client/notes.js`                       | Note CRUD                               | `v2/modules/leads/`                                          | Merge                                                   | Part of lead operations                              |
| `routes/client/languages.js`                   | Language list                           | `v2/shared/` or `v2/modules/site-config/`                    | Move                                                    | Very small                                           |
| `routes/client/telegram.js`                    | Telegram placeholder                    | DELETE                                                       | Empty/deprecated                                        |                                                      |
| `routes/client/image-session.js`               | Client image session                    | `v2/modules/image-sessions/client/`                          | Merge                                                   |                                                      |
| `routes/clients/clients.js`                    | Client route aggregator                 | `v2/routes.js`                                               | Replace                                                 | v2 routes.js handles mounting                        |
| `routes/utility/utility.js`                    | Upload, search, notifications           | Split                                                        | Split to `drive/`, `notifications/`, search in `leads/` |                                                      |

### Service Files

| Old File                                                | Responsibility                                               | New Target                                                      | Action                                                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `services/main/utility/utility.js`                      | JWT, auth, upload, search, pagination, errors, notifications | Split                                                           | Split across `infra/security/`, `shared/pagination.js`, `shared/middlewares/`, `modules/notifications/`, `infra/upload/` |
| `services/main/utility/uploadAsChunk.js`                | Chunked file upload                                          | `v2/infra/upload/chunk-upload.js`                               | Move                                                                                                                     |
| `services/main/auth/authServices.js`                    | Auth business logic                                          | `v2/modules/auth/`                                              | ✅ Migrated                                                                                                              |
| `services/main/admin/adminServices.js`                  | User CRUD, filters                                           | `v2/modules/users/users.repo.js + users.usecase.js`             | Move + Split                                                                                                             |
| `services/main/accountant/accountantServices.js`        | Payment processing                                           | `v2/modules/finance/finance.repo.js + finance.usecase.js`       | Move + Split                                                                                                             |
| `services/main/staff/staffServices.js`                  | Notes, reminders, meetings                                   | Split                                                           | Split across `leads/`, `calendar/`, `notifications/`                                                                     |
| `services/main/chat/chatRoomServices.js`                | Chat room logic (~300 lines)                                 | `v2/modules/chat/chat.repo.js + chat.usecase.js`                | Move + Split                                                                                                             |
| `services/main/chat/chatMessageServices.js`             | Message operations (~400 lines)                              | `v2/modules/chat/chat.repo.js + chat.usecase.js`                | Move + Split                                                                                                             |
| `services/main/chat/chatMemberServices.js`              | Member management                                            | `v2/modules/chat/chat.repo.js + chat.usecase.js`                | Move + Split                                                                                                             |
| `services/main/chat/chatFileServices.js`                | File queries                                                 | `v2/modules/chat/chat.repo.js`                                  | Move                                                                                                                     |
| `services/main/chat/utils.js`                           | Date grouping, permission checks                             | `v2/modules/chat/chat.usecase.js`                               | Merge                                                                                                                    |
| `services/main/shared/leadServices.js`                  | Lead queries                                                 | `v2/modules/leads/leads.repo.js`                                | Move                                                                                                                     |
| `services/main/shared/paymentServices.js`               | Payment workflow                                             | `v2/modules/finance/finance.usecase.js`                         | Move                                                                                                                     |
| `services/main/shared/projectServices.js`               | Project management                                           | `v2/modules/projects/projects.repo.js + projects.usecase.js`    | Move + Split                                                                                                             |
| `services/main/shared/taskServices.js`                  | Task CRUD                                                    | `v2/modules/tasks/tasks.repo.js + tasks.usecase.js`             | Move + Split                                                                                                             |
| `services/main/shared/noteServices.js`                  | Note CRUD                                                    | `v2/modules/leads/leads.repo.js` (notes are lead sub-entity)    | Merge                                                                                                                    |
| `services/main/shared/updateServices.js`                | Lead updates/milestones                                      | `v2/modules/updates/updates.repo.js + updates.usecase.js`       | Move                                                                                                                     |
| `services/main/shared/dashboardServices.js`             | KPI aggregation                                              | `v2/modules/dashboard/dashboard.repo.js + dashboard.usecase.js` | Move                                                                                                                     |
| `services/main/shared/deliveryServices.js`              | Delivery schedules                                           | `v2/modules/delivery/delivery.repo.js + delivery.usecase.js`    | Move                                                                                                                     |
| `services/main/shared/salesStageServices.js`            | Sales pipeline                                               | `v2/modules/sales-stages/`                                      | Move                                                                                                                     |
| `services/main/shared/userProfile.js`                   | Self-profile CRUD                                            | `v2/modules/profile/profile.repo.js`                            | Move                                                                                                                     |
| `services/main/shared/utilityServices.js`               | Reminders, roles, logs                                       | Split                                                           | Split across `calendar/`, `users/`, `shared/`                                                                            |
| `services/main/contract/contractServices.js`            | Contract lifecycle                                           | `v2/modules/contracts/contracts.usecase.js + contracts.repo.js` | Move + Split                                                                                                             |
| `services/main/contract/generateContractPdf.js`         | PDF builder (~500 lines)                                     | `v2/modules/contracts/contracts.pdf.js`                         | Move                                                                                                                     |
| `services/main/contract/clientContractServices.js`      | Contract session                                             | `v2/modules/contracts/client/`                                  | Move                                                                                                                     |
| `services/main/contract/generateDefaultContractData.js` | Default data template                                        | `v2/modules/contracts/contracts.dto.js`                         | Merge                                                                                                                    |
| `services/main/contract/pdf-utilities.js`               | PDF helpers                                                  | `v2/modules/contracts/contracts.pdf.js`                         | Merge                                                                                                                    |
| `services/main/contract/rules.js`                       | Contract rules                                               | `v2/modules/contracts/contracts.usecase.js`                     | Merge                                                                                                                    |
| `services/main/contract/wittenBlocksData.js`            | Contract text blocks                                         | `v2/modules/contracts/contracts.dto.js`                         | Merge                                                                                                                    |
| `services/main/courses/adminCourseServices.js`          | Admin course CRUD                                            | `v2/modules/courses/courses.repo.js + courses.usecase.js`       | Move + Split                                                                                                             |
| `services/main/courses/staffCoursesServices.js`         | Staff course access                                          | `v2/modules/courses/courses.usecase.js`                         | Merge                                                                                                                    |
| `services/main/calendar/calendarServices.js`            | Slot management                                              | `v2/modules/calendar/calendar.repo.js + calendar.usecase.js`    | Move + Split                                                                                                             |
| `services/main/calendar/googleCalendar.js`              | Google Calendar OAuth                                        | `v2/modules/calendar/google-calendar.js`                        | Move                                                                                                                     |
| `services/main/image-session/imageSessionSevices.js`    | Design management                                            | `v2/modules/image-sessions/`                                    | Move                                                                                                                     |
| `services/main/image-session/clientImageServices.js`    | Client session                                               | `v2/modules/image-sessions/client/`                             | Move                                                                                                                     |
| `services/main/client/clientServices.js`                | Client PDF gen                                               | `v2/modules/image-sessions/` (PDF part)                         | Move                                                                                                                     |
| `services/main/client/leads.js`                         | Lead code generation                                         | `v2/modules/leads/leads.usecase.js`                             | Merge                                                                                                                    |
| `services/main/client/payments.js`                      | Stripe normalization                                         | `v2/modules/finance/stripe.js`                                  | Move                                                                                                                     |
| `services/main/email/emailTemplates.js`                 | Email templates                                              | Split per module                                                | Split into `*.emails.js` per module                                                                                      |
| `services/main/shared-questions/shared-questions.js`    | VERSA questions                                              | `v2/modules/questions/questions.repo.js + questions.usecase.js` | Move                                                                                                                     |
| `services/main/site-utilities/siteUtilityServices.js`   | Config CRUD                                                  | `v2/modules/site-config/`                                       | Move                                                                                                                     |
| `services/constants.js`                                 | Company branding                                             | `v2/shared/brand.js`                                            | ✅ Migrated                                                                                                              |
| `services/enums.js`                                     | Business enums                                               | `v2/shared/enums.js`                                            | Move                                                                                                                     |
| `services/links.js`                                     | Frontend URLs                                                | `v2/shared/links.js`                                            | Move                                                                                                                     |
| `services/drive.js`                                     | Google Drive                                                 | `v2/infra/google/drive.js`                                      | Move                                                                                                                     |
| `services/notification.js`                              | Lead notifications                                           | `v2/modules/notifications/notifications.usecase.js`             | Move                                                                                                                     |
| `services/reviews.js`                                   | Google Reviews                                               | `v2/infra/google/reviews.js`                                    | Move                                                                                                                     |
| `services/sendMail.js`                                  | SMTP transport                                               | `v2/infra/mail/mail.js`                                         | ✅ Migrated                                                                                                              |
| `services/socket.js`                                    | Socket.IO monolith                                           | Split                                                           | Split to `v2/infra/socket/` (init) + event files                                                                         |
| `services/utilityServices.js`                           | Font/image/text for PDF                                      | `v2/infra/pdf/pdf-utils.js` (PROPOSED)                          | Move                                                                                                                     |
| `services/queues/*.js`                                  | Queue definitions                                            | `v2/jobs/queues/`                                               | Move                                                                                                                     |
| `services/workers/*.js`                                 | Worker processors                                            | `v2/jobs/workers/`                                              | Move                                                                                                                     |
| `services/redis/*.js`                                   | Redis config                                                 | `v2/infra/redis/`                                               | Move                                                                                                                     |
| `services/telegram/*.js`                                | Telegram integration                                         | `v2/infra/telegram/`                                            | Move + Split                                                                                                             |

### Root Files

| Old File                         | Responsibility                 | New Target                                          | Action  |
| -------------------------------- | ------------------------------ | --------------------------------------------------- | ------- | ----------------------------------------- |
| `index.js`                       | App bootstrap + route mounting | `v2/app.js` + `v2/server.js`                        | Replace | Legacy entry, v2 already has replacements |
| `tele.js`                        | Telegram standalone            | `v2/infra/telegram/`                                | Merge   |
| `tele-cron.js`                   | Telegram cron scheduler        | `v2/jobs/schedulers/telegram-cron.scheduler.js`     | Move    |
| `start-telegram-system.js`       | Worker bootstrap               | `v2/jobs/bootstrap.js` (PROPOSED)                   | Move    |
| `reminderScheduler.js`           | Meeting reminder cron          | `v2/jobs/schedulers/reminder.scheduler.js`          | Move    |
| `projectDeliveryTimeReminder.js` | Delivery deadline cron         | `v2/jobs/schedulers/delivery-reminder.scheduler.js` | Move    |

---

## 6. Route and Handler Mapping

### Auth Routes

| Route            | Method | Current Handler                                               | Target Module                    | Validation | Auth | Socket | Queue |
| ---------------- | ------ | ------------------------------------------------------------- | -------------------------------- | ---------- | ---- | ------ | ----- |
| `/auth/login`    | POST   | `routes/auth/auth.js` → `authServices.loginUser()`            | ✅ `v2/modules/auth/`            | ✅ Zod     | ❌   | ❌     | ❌    |
| `/auth/register` | POST   | `routes/auth/auth.js` → `authServices.createClientWithLead()` | ✅ `v2/modules/auth/`            | ✅ Zod     | ❌   | ❌     | ❌    |
| `/auth/logout`   | POST   | `routes/auth/auth.js` → `authServices.logoutUser()`           | ✅ `v2/modules/auth/`            | ✅         | ✅   | ❌     | ❌    |
| `/auth/status`   | GET    | `routes/auth/auth.js` → `verifyToken()`                       | ✅ `v2/modules/auth/` (as `/me`) | ✅         | ✅   | ❌     | ❌    |
| `/auth/reset`    | POST   | `routes/auth/auth.js` → `resetPassword()`                     | ✅ `v2/modules/auth/`            | ✅ Zod     | ❌   | ❌     | ❌    |

### Shared / Lead Routes

| Route                     | Method | Current Handler                                                       | Target Module       | Validation | Auth | Socket    | Queue |
| ------------------------- | ------ | --------------------------------------------------------------------- | ------------------- | ---------- | ---- | --------- | ----- |
| `/shared/` (leads list)   | GET    | `shared/client-leads.js` → `leadServices.getClientLeads()`            | `v2/modules/leads/` | ❌ Needs   | ✅   | ❌        | ❌    |
| `/shared/deals`           | GET    | `shared/client-leads.js` → `leadServices.getClientLeadsByDateRange()` | `v2/modules/leads/` | ❌ Needs   | ✅   | ❌        | ❌    |
| `/shared/:leadId`         | GET    | `shared/client-leads.js` → lead detail services                       | `v2/modules/leads/` | ❌ Needs   | ✅   | ❌        | ❌    |
| `/shared/` (create)       | POST   | `shared/client-leads.js` → `assignLeadToAUser()`                      | `v2/modules/leads/` | ❌ Needs   | ✅   | ✅ notify | ❌    |
| `/shared/convert/:leadId` | POST   | `shared/client-leads.js` → convert lead                               | `v2/modules/leads/` | ❌ Needs   | ✅   | ❌        | ❌    |

### Chat Routes (Staff)

| Route                                 | Method       | Current Handler                                       | Target Module      | Validation | Auth | Socket | Queue |
| ------------------------------------- | ------------ | ----------------------------------------------------- | ------------------ | ---------- | ---- | ------ | ----- |
| `/shared/chat/rooms`                  | GET          | `chat/rooms.js` → `chatRoomServices.getChatRooms()`   | `v2/modules/chat/` | ❌ Needs   | ✅   | ❌     | ❌    |
| `/shared/chat/rooms`                  | POST         | `chat/rooms.js` → `chatRoomServices.createChatRoom()` | `v2/modules/chat/` | ❌ Needs   | ✅   | ✅     | ❌    |
| `/shared/chat/rooms/:roomId`          | GET          | `chat/rooms.js` → `getChatRoomById()`                 | `v2/modules/chat/` | ❌ Needs   | ✅   | ❌     | ❌    |
| `/shared/chat/rooms/:roomId/messages` | GET          | `chat/messages.js` → `getMessages()`                  | `v2/modules/chat/` | ❌ Needs   | ✅   | ❌     | ❌    |
| `/shared/chat/rooms/:roomId/messages` | POST         | `chat/messages.js` → `sendMessage()`                  | `v2/modules/chat/` | ❌ Needs   | ✅   | ✅     | ❌    |
| `/shared/chat/rooms/:roomId/members`  | GET/POST/DEL | `chat/members.js` → member services                   | `v2/modules/chat/` | ❌ Needs   | ✅   | ✅     | ❌    |
| `/shared/chat/rooms/:roomId/files`    | GET          | `chat/files.js` → file services                       | `v2/modules/chat/` | ❌ Needs   | ✅   | ❌     | ❌    |

### Chat Routes (Client — Public)

| Route                                 | Method | Current Handler                       | Target Module             | Validation | Auth  | Socket | Queue |
| ------------------------------------- | ------ | ------------------------------------- | ------------------------- | ---------- | ----- | ------ | ----- |
| `/client/chat/rooms/validate-token`   | GET    | `client/chat/rooms.js` → token verify | `v2/modules/chat/client/` | ❌ Needs   | Token | ❌     | ❌    |
| `/client/chat/rooms/:roomId`          | GET    | `client/chat/rooms.js` → room detail  | `v2/modules/chat/client/` | ❌ Needs   | Token | ❌     | ❌    |
| `/client/chat/rooms/:roomId/messages` | GET    | `client/chat/messages.js` → messages  | `v2/modules/chat/client/` | ❌ Needs   | Token | ❌     | ❌    |

### Project Routes

| Route                                | Method | Current Handler                                    | Target Module          | Validation | Auth | Socket | Queue |
| ------------------------------------ | ------ | -------------------------------------------------- | ---------------------- | ---------- | ---- | ------ | ----- |
| `/shared/projects/designers`         | GET    | `shared/projects.js` → `getLeadByPorjects()`       | `v2/modules/projects/` | ❌ Needs   | ✅   | ❌     | ❌    |
| `/shared/projects/designers/columns` | GET    | `shared/projects.js` → `getLeadByPorjectsColumn()` | `v2/modules/projects/` | ❌ Needs   | ✅   | ❌     | ❌    |
| `/shared/projects/designers/:id`     | GET    | `shared/projects.js` → `getProjectDetailsById()`   | `v2/modules/projects/` | ❌ Needs   | ✅   | ❌     | ❌    |

### Calendar Routes

| Route                             | Method   | Current Handler                                      | Target Module                 | Validation | Auth  | Socket | Queue |
| --------------------------------- | -------- | ---------------------------------------------------- | ----------------------------- | ---------- | ----- | ------ | ----- |
| `/shared/calendar/available-days` | GET      | `calendar/calendar.js` → `getAvailableDays()`        | `v2/modules/calendar/`        | ❌ Needs   | ✅    | ❌     | ❌    |
| `/shared/calendar/slots`          | GET      | `calendar/calendar.js` → `getAvailableSlotsForDay()` | `v2/modules/calendar/`        | ❌ Needs   | ✅    | ❌     | ❌    |
| `/shared/calendar/google/*`       | GET/POST | `calendar/google.js` → Google OAuth                  | `v2/modules/calendar/`        | ❌ Needs   | ✅    | ❌     | ❌    |
| `/client/calendar/*`              | GET/POST | `calendar/client-calendar.js` → public booking       | `v2/modules/calendar/client/` | ❌ Needs   | Token | ❌     | ❌    |

### Contract Routes

| Route                 | Method  | Current Handler                                 | Target Module                  | Validation | Auth  | Socket | Queue  |
| --------------------- | ------- | ----------------------------------------------- | ------------------------------ | ---------- | ----- | ------ | ------ |
| `/shared/contracts/*` | Various | `contract/contracts.js` → contract services     | `v2/modules/contracts/`        | ❌ Needs   | ✅    | ❌     | ✅ PDF |
| `/client/contracts/*` | Various | `contract/client-contract.js` → client services | `v2/modules/contracts/client/` | ❌ Needs   | Token | ❌     | ✅ PDF |

### Finance / Accountant Routes

| Route                          | Method | Current Handler                                 | Target Module                | Validation | Auth          | Socket | Queue |
| ------------------------------ | ------ | ----------------------------------------------- | ---------------------------- | ---------- | ------------- | ------ | ----- |
| `/accountant/payments`         | GET    | `accountant/accountant.js` → `getPayments()`    | `v2/modules/finance/`        | ❌ Needs   | ✅ ACCOUNTANT | ❌     | ❌    |
| `/accountant/payments/pay/:id` | POST   | `accountant/accountant.js` → `processPayment()` | `v2/modules/finance/`        | ❌ Needs   | ✅ ACCOUNTANT | ❌     | ❌    |
| `/accountant/salaries`         | GET    | `accountant/accountant.js` → `getSalaryData()`  | `v2/modules/finance/`        | ❌ Needs   | ✅ ACCOUNTANT | ❌     | ❌    |
| `/client/payments/pay`         | POST   | `client/payments.js` → Stripe checkout          | `v2/modules/finance/client/` | ❌ Needs   | Token         | ❌     | ❌    |

### Admin Routes

| Route                     | Method | Current Handler                              | Target Module         | Validation | Auth     | Socket | Queue |
| ------------------------- | ------ | -------------------------------------------- | --------------------- | ---------- | -------- | ------ | ----- |
| `/admin/users`            | GET    | `admin/admin.js` → `adminServices.getUser()` | `v2/modules/users/`   | ❌ Needs   | ✅ ADMIN | ❌     | ❌    |
| `/admin/users/:id/status` | POST   | `admin/admin.js` → status change             | `v2/modules/users/`   | ❌ Needs   | ✅ ADMIN | ❌     | ❌    |
| `/admin/leads`            | POST   | `admin/admin.js` → Excel lead import         | `v2/modules/leads/`   | ❌ Needs   | ✅ ADMIN | ❌     | ❌    |
| `/admin/commission`       | POST   | `admin/admin.js` → create commission         | `v2/modules/finance/` | ❌ Needs   | ✅ ADMIN | ❌     | ❌    |

### Courses Routes

| Route               | Method  | Current Handler                                   | Target Module         | Validation | Auth      | Socket | Queue |
| ------------------- | ------- | ------------------------------------------------- | --------------------- | ---------- | --------- | ------ | ----- |
| `/admin/courses/*`  | Various | `courses/adminCourses.js` → admin course services | `v2/modules/courses/` | ❌ Needs   | ✅ ADMIN  | ❌     | ❌    |
| `/shared/courses/*` | Various | `courses/staffCourses.js` → staff course services | `v2/modules/courses/` | ❌ Needs   | ✅ SHARED | ❌     | ❌    |

### Utility / Other Routes

| Route                          | Method | Current Handler                             | Target Module                 | Validation | Auth | Socket | Queue |
| ------------------------------ | ------ | ------------------------------------------- | ----------------------------- | ---------- | ---- | ------ | ----- |
| `/utility/upload-chunk`        | POST   | `utility/utility.js` → `uploadAsChunk()`    | `v2/modules/drive/`           | ❌ Needs   | ✅   | ❌     | ❌    |
| `/utility/search`              | GET    | `utility/utility.js` → `searchData()`       | `v2/modules/leads/` or shared | ❌ Needs   | ✅   | ❌     | ❌    |
| `/utility/notification/unread` | GET    | `utility/utility.js` → `getNotifications()` | `v2/modules/notifications/`   | ❌ Needs   | ✅   | ❌     | ❌    |
| `/shared/dashboard/*`          | GET    | `shared/dashboard.js` → dashboard services  | `v2/modules/dashboard/`       | ❌ Needs   | ✅   | ❌     | ❌    |

---

## 7. Shared Extraction Plan

### From `services/main/utility/utility.js` (God File Decomposition)

| Function                              | Current Location | New Location                                              | Why Shared              | Used By                      |
| ------------------------------------- | ---------------- | --------------------------------------------------------- | ----------------------- | ---------------------------- |
| `generateToken()`                     | `utility.js`     | ✅ Already in `v2/infra/security/jwt.js`                  | JWT signing             | Auth only → infra            |
| `verifyToken()`                       | `utility.js`     | ✅ Already in `v2/infra/security/jwt.js`                  | JWT verification        | Auth middleware              |
| `verifyTokenAndHandleAuthorization()` | `utility.js`     | ✅ Already in `v2/shared/middlewares/auth.middleware.js`  | Authorization           | All protected routes         |
| `getCurrentUser()`                    | `utility.js`     | `v2/shared/middlewares/auth.middleware.js` (extend)       | Request user extraction | All controllers              |
| `getTokenData()`                      | `utility.js`     | `v2/shared/middlewares/auth.middleware.js` (extend)       | Token decode            | Multiple controllers         |
| `handlePrismaError()`                 | `utility.js`     | DELETE — replaced by `AppError` + global error handler    | Error mapping           | Was everywhere, now AppError |
| `getPagination()`                     | `utility.js`     | `v2/shared/pagination.js` (PROPOSED)                      | Pagination extraction   | All list endpoints           |
| `getAndThrowError()`                  | `utility.js`     | DELETE — replaced by `AppError`                           | Error helper            | Multiple routes              |
| `searchData()`                        | `utility.js`     | `v2/modules/leads/leads.usecase.js` (or dedicated search) | Multi-model search      | Utility route                |
| `uploadFiles()`                       | `utility.js`     | `v2/infra/upload/multer.js`                               | File upload             | Admin, utility               |
| `uploadAsHttp()`                      | `utility.js`     | `v2/infra/upload/`                                        | HTTP upload             | Client upload                |
| `uploadToFTP*()`                      | `utility.js`     | `v2/infra/upload/ftp.js`                                  | FTP operations          | Contract PDF, uploads        |
| `getNotifications()`                  | `utility.js`     | `v2/modules/notifications/notifications.repo.js`          | Notification queries    | Utility route                |
| `markLatestNotificationsAsRead()`     | `utility.js`     | `v2/modules/notifications/notifications.repo.js`          | Notification ops        | Utility route                |
| `createNotification()`                | `utility.js`     | `v2/modules/notifications/notifications.usecase.js`       | Notification + emit     | 10+ services                 |
| `getUserDetailsWithSpecificFields()`  | `utility.js`     | `v2/modules/users/users.repo.js`                          | User queries            | Notifications                |

### From `services/main/shared/utilityServices.js`

| Function                             | New Location                                 | Used By                     |
| ------------------------------------ | -------------------------------------------- | --------------------------- |
| `getNextCalls()`                     | `v2/modules/calendar/calendar.repo.js`       | Dashboard, shared utilities |
| `getNextMeetings()`                  | `v2/modules/calendar/calendar.repo.js`       | Dashboard, shared utilities |
| `getAllFixedData()`                  | `v2/modules/site-config/site-config.repo.js` | Shared utilities route      |
| `getOtherRoles()`                    | `v2/modules/users/users.repo.js`             | Admin                       |
| `checkUserLog()` / `submitUserLog()` | `v2/modules/profile/profile.usecase.js`      | Shared utilities route      |

### From `services/notification.js`

| Function                            | New Location                                        | Used By              |
| ----------------------------------- | --------------------------------------------------- | -------------------- |
| `convertALeadNotification()`        | `v2/modules/notifications/notifications.usecase.js` | Lead conversion flow |
| `overdueALeadNotification()`        | `v2/modules/notifications/notifications.usecase.js` | Overdue checks       |
| `assignLeadNotification()`          | `v2/modules/notifications/notifications.usecase.js` | Lead assignment      |
| `assignMultipleLeadsNotification()` | `v2/modules/notifications/notifications.usecase.js` | Bulk assignment      |
| `assignWorkStageNotification()`     | `v2/modules/notifications/notifications.usecase.js` | Work stage changes   |

### From `services/utilityServices.js` (PDF utilities)

| Function                                        | New Location                           | Used By                         |
| ----------------------------------------------- | -------------------------------------- | ------------------------------- |
| `compressImageBuffer()`                         | `v2/infra/pdf/pdf-utils.js` (PROPOSED) | Contract PDF, image session PDF |
| `fetchImageBuffer()`                            | `v2/infra/pdf/pdf-utils.js`            | PDF generation                  |
| `isArabicText()` / `reText()` / `getRTLTextX()` | `v2/infra/pdf/pdf-utils.js`            | Arabic PDF rendering            |
| Font loading                                    | `v2/infra/pdf/pdf-utils.js`            | PDF generation                  |

---

## 8. Module-by-Module Refactor

### 8.1 Auth Module

**Status: ✅ FULLY REFACTORED**

#### Current State (v2)

- Files: 8 (`auth.routes.js`, `auth.controller.js`, `auth.usecase.js`, `auth.repo.js`, `auth.dto.js`, `auth.validation.js`, `auth.middleware.js`, `auth.emails.js`)
- Endpoints: 6 (`login`, `refresh`, `logout`, `me`, `request-password-reset`, `reset-password`)
- Features: Rate limiting, Zod validation, timing-safe auth, refresh token rotation, branded emails
- Pattern adherence: ✅ Full

#### Legacy Remnant

- `routes/auth/auth.js` — still mounted at `/auth` in `index.js`
- `services/main/auth/authServices.js` — still exists

#### TODO Checklist

- [ ] Confirm all frontend apps have switched from `/auth/*` to `/v2/auth/*`
- [ ] Remove `routes/auth/auth.js` after frontend migration
- [ ] Remove `services/main/auth/authServices.js` after frontend migration
- [ ] Remove legacy auth route mounting from `index.js`

#### Dependencies

- `v2/infra/security/jwt.js`, `v2/infra/security/hash.js`
- `v2/infra/mail/`
- `v2/infra/prisma/`

---

### 8.2 Chat Module

**Status: 🚧 SCAFFOLDED (empty files exist)**

#### Current State (Legacy)

- **Route files**: 8 total
  - Staff: `routes/chat/rooms.js`, `messages.js`, `members.js`, `files.js`
  - Client: `routes/client/chat/rooms.js`, `messages.js`, `members.js`, `files.js`
- **Service files**: 5
  - `services/main/chat/chatRoomServices.js` (~300 lines)
  - `services/main/chat/chatMessageServices.js` (~400 lines)
  - `services/main/chat/chatMemberServices.js` (~150 lines)
  - `services/main/chat/chatFileServices.js` (~150 lines)
  - `services/main/chat/utils.js` (~100 lines)
- **Socket events**: 20+ events in `services/socket.js` (~580 lines)
- **Total legacy lines**: ~1,700+

#### Pain Points

1. Socket.IO handlers contain business logic (message creation, reactions, read receipts)
2. Chat message services call `io.to().emit()` directly — coupling service layer to socket
3. Client chat has no auth middleware — relies on token in query
4. `chatMessageServices.js` and socket handlers duplicate message creation logic
5. Room permission checks are scattered (utils.js + inline in services)
6. Day grouping / date formatting mixed into message queries

#### Target Structure

```
v2/modules/chat/
├── chat.routes.js           ← Staff endpoints (rooms, messages, members, files)
├── chat.controller.js       ← HTTP handlers
├── chat.usecase.js          ← Business logic (room access, message ops, member mgmt)
├── chat.repo.js             ← Prisma queries (rooms, messages, members, files)
├── chat.dto.js              ← Select projections, response shapes
├── chat.validation.js       ← Zod schemas for room creation, message sending, etc.
├── chat.middleware.js        ← Room membership verification middleware
└── client/
    ├── client-chat.routes.js     ← Client-facing endpoints
    └── client-chat.controller.js ← Client HTTP handlers (token-based auth)
```

Socket event handlers → `v2/infra/socket/chat.events.js` (calls `chat.usecase.js`)

#### TODO Checklist

- [ ] Implement `chat.repo.js` — extract all Prisma queries from `chatRoomServices.js`, `chatMessageServices.js`, `chatMemberServices.js`, `chatFileServices.js`
- [ ] Implement `chat.dto.js` — define select fields for rooms, messages, members, files
- [ ] Implement `chat.usecase.js` — extract business logic from chat services (room access checks, message operations, member permission logic, day grouping)
- [ ] Implement `chat.validation.js` — Zod schemas for: room creation, message send, member add, file query params
- [ ] Implement `chat.controller.js` — thin HTTP handlers calling usecase methods
- [ ] Implement `chat.routes.js` — combine rooms/messages/members/files endpoints under `/chat`
- [ ] Implement `chat.middleware.js` — room membership check middleware (extract from `utils.js` `checkIfUserIsRoomMember()`)
- [ ] Implement `client/client-chat.routes.js` — client-facing chat endpoints with token auth
- [ ] Implement `client/client-chat.controller.js` — client HTTP handlers
- [ ] Create `v2/infra/socket/chat.events.js` — extract chat socket events from `services/socket.js`
- [ ] Refactor socket handlers to call `chat.usecase.js` instead of direct Prisma queries
- [ ] Remove `emitToAllUsersRelatedToARoom()` from services — move emit logic to socket event layer
- [ ] Add Zod validation for socket event payloads
- [ ] Remove legacy `routes/chat/` files after migration
- [ ] Remove legacy `routes/client/chat/` files after migration
- [ ] Remove legacy `services/main/chat/` files after migration

#### Dependencies / Blockers

- **Blocks**: None (standalone module)
- **Depends on**: Auth middleware, Socket.IO infra, Prisma
- **Socket migration**: Must coordinate with socket refactor (Phase 3)

---

### 8.3 Client Leads (CRM) Module

**Status: ❌ Not started**

#### Current State

- **Route files**: `routes/shared/client-leads.js` (~150 lines), `routes/client/leads.js` (~200 lines, FAT)
- **Service files**: `services/main/shared/leadServices.js` (~150 lines), `services/main/client/leads.js` (~80 lines)
- **Related**: `routes/shared/utilities.js` (notifications), `services/main/shared/noteServices.js` (~100 lines)

#### Pain Points

1. `routes/client/leads.js` has heavy inline business logic: price range mapping, consultation pricing, code generation, date handling, direct Prisma queries
2. Lead details endpoint calls different service functions based on role (admin vs staff)
3. Notes, payments, reminders, price offers are all mixed into the leads route
4. Lead creation in admin (`routes/admin/admin.js`) uses different logic than client self-register
5. Country restrictions and role-based filtering embedded in lead queries

#### Target Structure

```
v2/modules/leads/
├── leads.routes.js          ← Staff/admin lead endpoints
├── leads.controller.js
├── leads.usecase.js         ← Lead CRUD, assignment, conversion, code generation
├── leads.repo.js            ← Lead queries with filters, includes
├── leads.validation.js      ← Zod schemas for lead creation, assignment, filters
├── leads.dto.js             ← Lead response shapes, select projections
├── leads.emails.js          ← Lead-related email templates
└── client/
    ├── client-leads.routes.js    ← Public lead creation endpoint
    └── client-leads.controller.js
```

#### TODO Checklist

- [ ] Create `leads.repo.js` — extract Prisma queries from `leadServices.js` (getClientLeads, getClientLeadsByDateRange, getClientLeadDetails)
- [ ] Create `leads.usecase.js` — extract business logic: lead creation workflow, code generation, price calculation, assignment logic, conversion logic
- [ ] Move `noteServices.js` → notes as sub-operations in `leads.repo.js` (notes are lead sub-entities)
- [ ] Create `leads.dto.js` — define select fields for lead list, lead detail, lead with notes
- [ ] Create `leads.validation.js` — Zod schemas for: create lead, assign lead, convert lead, filter params
- [ ] Create `leads.controller.js` — thin handlers for all lead operations
- [ ] Create `leads.routes.js` — combine lead listing, detail, creation, assignment, conversion, notes
- [ ] Create `client/client-leads.routes.js` — public lead creation (extract from `routes/client/leads.js`)
- [ ] Create `client/client-leads.controller.js` — handle public lead form submission
- [ ] Move inline price calculations from `routes/client/leads.js` → `leads.usecase.js`
- [ ] Move `generateCodeForNewLead()` from `services/main/client/leads.js` → `leads.usecase.js`
- [ ] Extract admin lead import (Excel) from `routes/admin/admin.js` → `leads.usecase.js`
- [ ] Create `leads.emails.js` — lead notification/reminder emails (from `emailTemplates.js`)
- [ ] Move reminder creation (call/meeting) references to `calendar` module
- [ ] Move payment/price-offer references to `finance` module

#### Dependencies

- Auth middleware
- `calendar` module (reminders)
- `finance` module (payments, price offers)
- `notifications` module (lead assignment notifications)
- Telegram integration (channel creation on lead finalization)

---

### 8.4 Contracts Module

**Status: ❌ Not started**

#### Current State

- **Route files**: `routes/contract/contracts.js` (~120 lines), `routes/contract/client-contract.js` (~40 lines)
- **Service files** (7 files, ~1,200 lines total):
  - `contractServices.js` (~300 lines) — lifecycle management
  - `generateContractPdf.js` (~500 lines) — PDF builder
  - `clientContractServices.js` (~50 lines) — client session
  - `generateDefaultContractData.js` — default templates
  - `pdf-utilities.js` — PDF helpers
  - `rules.js` — contract rules
  - `wittenBlocksData.js` — text blocks

#### Pain Points

1. PDF generation is ~500 lines with heavy RTL/Arabic text handling
2. Contract creation uses Prisma transactions but service also calls project creation and telegram notification
3. Payment condition logic is tightly coupled to contract stage creation
4. Multiple helper files (`rules.js`, `wittenBlocksData.js`, `pdf-utilities.js`) are contract-specific

#### Target Structure

```
v2/modules/contracts/
├── contracts.routes.js
├── contracts.controller.js
├── contracts.usecase.js      ← Contract lifecycle, stage/payment creation
├── contracts.repo.js         ← Prisma queries
├── contracts.validation.js   ← Zod schemas
├── contracts.dto.js          ← Includes default data, text blocks, rules
├── contracts.pdf.js          ← PDF generation (500+ lines, isolated)
└── client/
    ├── client-contract.routes.js
    └── client-contract.controller.js
```

#### TODO Checklist

- [ ] Create `contracts.repo.js` — extract Prisma queries from `contractServices.js`
- [ ] Create `contracts.usecase.js` — contract creation workflow, payment setup, stage management, cancellation
- [ ] Create `contracts.pdf.js` — move `generateContractPdf.js` + `pdf-utilities.js` content
- [ ] Create `contracts.dto.js` — merge `generateDefaultContractData.js`, `rules.js`, `wittenBlocksData.js`
- [ ] Create `contracts.validation.js` — Zod schemas for contract creation, stage addition, payment conditions
- [ ] Create `contracts.controller.js` and `contracts.routes.js`
- [ ] Create `client/client-contract.routes.js` and controller for public contract signing
- [ ] Decouple contract creation from project creation — contract usecase should emit event or call project usecase
- [ ] Decouple contract creation from telegram notification — use notification module
- [ ] Ensure PDF queue integration works with new structure (`jobs/queues/pdf.queue.js`)

#### Dependencies

- `projects` module (contract → project creation)
- `finance` module (payment conditions)
- PDF queue/worker
- `site-config` module (contract utilities/templates)
- Telegram integration (contract-signed notification)

---

### 8.5 Projects & Tasks Module

**Status: ❌ Not started**

#### Current State

- **Projects**: `routes/shared/projects.js` (~80 lines), `services/main/shared/projectServices.js` (~300 lines)
- **Tasks**: `routes/shared/tasks.js` (~75 lines), `services/main/shared/taskServices.js` (~150 lines)

#### Pain Points

1. Project service calls `contractServices.js` for payment creation — cross-module coupling
2. Auto-assignment logic in project services — complex designer assignment rules
3. Role-based project filtering in route handler instead of usecase
4. Task finalization triggers notification — mixed concerns

#### Target Structure

```
v2/modules/projects/
├── projects.routes.js
├── projects.controller.js
├── projects.usecase.js       ← Project lifecycle, assignment, auto-assignment
├── projects.repo.js
├── projects.validation.js
└── projects.dto.js

v2/modules/tasks/
├── tasks.routes.js
├── tasks.controller.js
├── tasks.usecase.js          ← Task CRUD, status transitions
├── tasks.repo.js
└── tasks.validation.js
```

#### TODO Checklist

- [ ] Create `projects.repo.js` — extract project queries from `projectServices.js`
- [ ] Create `projects.usecase.js` — project creation, assignment, auto-assignment logic, status updates
- [ ] Create `projects.dto.js` — project list/detail select fields
- [ ] Create `projects.validation.js` — Zod schemas for project creation, assignment, status update
- [ ] Create `projects.controller.js` and `projects.routes.js`
- [ ] Move role-based project filtering from route handler to `projects.usecase.js`
- [ ] Create `tasks.repo.js` — extract task queries from `taskServices.js`
- [ ] Create `tasks.usecase.js` — task CRUD, status transitions, finalization logic
- [ ] Create `tasks.validation.js` — Zod schemas for task creation, status update
- [ ] Create `tasks.controller.js` and `tasks.routes.js`
- [ ] Decouple project creation from contract service — use contracts module API

#### Dependencies

- `contracts` module (project linked to contract)
- `leads` module (project linked to lead)
- `notifications` module (task completion notifications)
- Telegram (project status notifications)

---

### 8.6 Calendar & Meetings Module

**Status: ❌ Not started**

#### Current State

- **Route files** (5 files):
  - `calendar/calendar.js` (~80 lines)
  - `calendar/new-calendar.js` (~250 lines) — **service file in route folder!**
  - `calendar/client-calendar.js` (~90 lines)
  - `calendar/google.js` (~100 lines)
  - `calendar/old-call.js` (~60 lines) — **legacy, likely unused**
- **Service files**: `services/main/calendar/calendarServices.js` (~250 lines), `googleCalendar.js` (~100 lines)

#### Pain Points

1. `new-calendar.js` is a service file placed in the routes folder — file misplacement
2. `old-call.js` is legacy code still mounted
3. Heavy timezone handling with both `date-fns` and `dayjs`
4. Google Calendar OAuth is mixed between route and service file
5. Call/meeting reminders are in `staffServices.js`, not calendar

#### Target Structure

```
v2/modules/calendar/
├── calendar.routes.js
├── calendar.controller.js
├── calendar.usecase.js         ← Slot management, booking, timezone logic
├── calendar.repo.js
├── calendar.validation.js
├── google-calendar.js          ← Google Calendar OAuth + sync
└── client/
    ├── client-calendar.routes.js     ← Public booking endpoints
    └── client-calendar.controller.js
```

#### TODO Checklist

- [ ] Create `calendar.repo.js` — extract DB queries from `calendarServices.js` and `new-calendar.js`
- [ ] Create `calendar.usecase.js` — slot management, availability calculation, booking validation, timezone handling
- [ ] Create `calendar.validation.js` — Zod schemas for day creation, slot query, booking
- [ ] Create `calendar.controller.js` and `calendar.routes.js`
- [ ] Move `new-calendar.js` logic into `calendar.usecase.js` (it's misplaced in routes folder)
- [ ] Create `google-calendar.js` — consolidate Google Calendar OAuth flow from `google.js` route + `googleCalendar.js` service
- [ ] Create `client/client-calendar.routes.js` and controller for public booking
- [ ] Move call/meeting reminder creation from `staffServices.js` → `calendar.usecase.js`
- [ ] Delete `calendar/old-call.js` after verifying no frontend usage
- [ ] Standardize on one date library (prefer `dayjs` over `date-fns`)

#### Dependencies

- Auth middleware
- Google OAuth (`googleapis`)
- `notifications` module (reminder emails)
- `leads` module (reminders linked to leads)

---

### 8.7 Accountant / Finance Module

**Status: ❌ Not started**

#### Current State

- **Route files**: `routes/accountant/accountant.js` (~200+ lines, FAT)
- **Service files**: `services/main/accountant/accountantServices.js` (~150 lines), `services/main/shared/paymentServices.js` (~150 lines), `services/main/client/payments.js` (~120 lines)

#### Pain Points

1. `accountant.js` route is FAT — payments, salaries, rents, expenses, receipts all in one file
2. Stripe integration scattered: `client/payments.js` service + `shared/paymentServices.js`
3. Complex payment filtering logic in the route handler
4. Payment processing (Stripe sessions, overdue handling) mixed with salary/rent operations

#### Target Structure

```
v2/modules/finance/
├── finance.routes.js
├── finance.controller.js
├── finance.usecase.js          ← Payment processing, salary, rent, expense logic
├── finance.repo.js
├── finance.validation.js
├── finance.dto.js
├── stripe.js                   ← Stripe integration (checkout, webhooks)
└── client/
    ├── client-payment.routes.js
    └── client-payment.controller.js
```

#### TODO Checklist

- [ ] Create `finance.repo.js` — extract payment, salary, rent, expense, invoice queries
- [ ] Create `finance.usecase.js` — payment processing, overdue logic, salary calculation, commission creation
- [ ] Create `stripe.js` — consolidate Stripe checkout session creation, payment verification, session normalization
- [ ] Create `finance.validation.js` — Zod schemas for payment processing, salary creation, filter params
- [ ] Create `finance.dto.js` — payment list/detail shapes, salary shapes
- [ ] Create `finance.controller.js` and `finance.routes.js`
- [ ] Create `client/client-payment.routes.js` — public Stripe checkout endpoint
- [ ] Extract admin commission creation from `admin/admin.js` → `finance.usecase.js`
- [ ] Move payment reminder email logic from `paymentServices.js` → `finance.usecase.js` + `notifications` module

#### Dependencies

- Stripe SDK
- `leads` module (payments linked to leads)
- `contracts` module (payment conditions)
- `notifications` module (payment reminders, overdue alerts)

---

### 8.8 Admin Panel Module

**Status: ❌ Not started**

#### Current State

- **Route file**: `routes/admin/admin.js` (~200+ lines, FAT)
- **Service file**: `services/main/admin/adminServices.js` (~200 lines)

#### Pain Points

1. Admin route is a monolith: user management, lead import, commissions, telegram, reports
2. Should be decomposed — admin actions belong to their respective domain modules
3. Direct Prisma queries in route handler
4. User CRUD mixed with everything else

#### Target Structure

```
v2/modules/users/
├── users.routes.js           ← User listing, creation, status management
├── users.controller.js
├── users.usecase.js          ← User CRUD, role management
├── users.repo.js
├── users.validation.js
└── users.dto.js
```

Admin-specific operations should be distributed to their domain modules with admin role middleware:

- Lead import → `leads` module with `requireRole('ADMIN')`
- Commission → `finance` module with `requireRole('ADMIN')`
- Course management → `courses` module with `requireRole('ADMIN')`
- Telegram management → `infra/telegram/` or admin-specific route

#### TODO Checklist

- [ ] Create `users.repo.js` — extract user queries from `adminServices.js`
- [ ] Create `users.usecase.js` — user CRUD, status changes, role management
- [ ] Create `users.validation.js` — Zod schemas for user creation, edit, filter
- [ ] Create `users.dto.js` — user list/detail select fields
- [ ] Create `users.controller.js` and `users.routes.js`
- [ ] Extract lead import logic from `admin.js` → `leads.usecase.js` with admin guard
- [ ] Extract commission creation from `admin.js` → `finance.usecase.js` with admin guard
- [ ] Extract course management routing from `admin.js` → `courses` module with admin guard
- [ ] Extract telegram management from `admin.js` → dedicated admin route or telegram infra

#### Dependencies

- Auth middleware (admin role)
- `leads` module (lead import endpoint)
- `finance` module (commission endpoint)
- `courses` module (sub-mount)

---

### 8.9 Staff Module

**Status: ❌ Not started**

#### Current State

- **Route file**: `routes/staff/staff.js` (~25 lines) — only 1 endpoint
- **Service file**: `services/main/staff/staffServices.js` (~300 lines) — notes, reminders, meetings

#### Pain Points

1. Route file has only `GET /staff/dashboard/latest-calls` — barely a module
2. Service file has logic that belongs to other modules: note creation, call reminders, meeting reminders

#### Target Structure

- The single staff dashboard endpoint → `v2/modules/dashboard/` or `v2/modules/calendar/` (it's fetching recent calls)
- Staff services should be distributed:
  - Note operations → `leads` module
  - Call reminders → `calendar` module
  - Meeting reminders → `calendar` module

#### TODO Checklist

- [ ] Move `getCallReminders()` from `staffServices.js` → `v2/modules/calendar/calendar.repo.js`
- [ ] Move latest calls endpoint to `dashboard` or `calendar` module
- [ ] Move note creation logic from `staffServices.js` → `v2/modules/leads/leads.usecase.js`
- [ ] Move call reminder creation from `staffServices.js` → `v2/modules/calendar/calendar.usecase.js`
- [ ] Move meeting reminder creation from `staffServices.js` → `v2/modules/calendar/calendar.usecase.js`
- [ ] Delete `routes/staff/staff.js` after all logic redistributed
- [ ] Delete `services/main/staff/staffServices.js` after logic redistributed

#### Dependencies

- `calendar` module (must exist first)
- `leads` module (must exist first)

---

### 8.10 Courses Module

**Status: ❌ Not started**

#### Current State

- **Route files**: `routes/courses/adminCourses.js` (~200+ lines), `routes/courses/staffCourses.js` (~150 lines)
- **Service files**: `services/main/courses/adminCourseServices.js` (~250 lines), `services/main/courses/staffCoursesServices.js` (~200 lines)

#### Pain Points

1. Admin and staff course logic in separate files — should be one module with role-based access
2. Test attempt management logic is complex with cascading deletions
3. Homework submission and grading mixed with course browsing

#### Target Structure

```
v2/modules/courses/
├── courses.routes.js         ← All course endpoints (admin + staff differentiated by middleware)
├── courses.controller.js
├── courses.usecase.js        ← Course CRUD, enrollment, progress, test management
├── courses.repo.js
├── courses.validation.js
└── courses.dto.js
```

#### TODO Checklist

- [ ] Create `courses.repo.js` — extract all course/lesson/test/homework Prisma queries
- [ ] Create `courses.usecase.js` — merge admin and staff course logic with role checks
- [ ] Create `courses.validation.js` — Zod schemas for course creation, lesson creation, test submission
- [ ] Create `courses.dto.js` — course list/detail/progress select fields
- [ ] Create `courses.controller.js` — thin handlers differentiated by role
- [ ] Create `courses.routes.js` — admin routes use `requireRole('ADMIN')`, staff routes use `requireAuth()`
- [ ] Remove admin sub-mount from `admin/admin.js`

#### Dependencies

- Auth middleware
- `notifications` module (course completion, homework submission)

---

### 8.11 Image Sessions Module

**Status: ❌ Not started**

#### Current State

- **Route files**: `routes/image-session/image-session.js` (~90 lines), `admin-image-session.js` (~150 lines), `client-image-session.js` (~80 lines), `routes/client/image-session.js` (~65 lines)
- **Service files**: `services/main/image-session/imageSessionSevices.js` (~200 lines, typo in name), `clientImageServices.js` (~40 lines), `services/main/client/clientServices.js` (~400 lines, PDF gen)

#### Pain Points

1. Filename typo: `imageSessionSevices.js`
2. Two separate route files for client session (`client-image-session.js` AND `client/image-session.js`)
3. Client PDF generation (~400 lines) is in `clientServices.js`, not in image-session services
4. Admin space/material/template CRUD is heavy

#### Target Structure

```
v2/modules/image-sessions/
├── image-sessions.routes.js
├── image-sessions.controller.js
├── image-sessions.usecase.js      ← Session CRUD, space/material/template management
├── image-sessions.repo.js
├── image-sessions.validation.js
├── image-sessions.pdf.js          ← PDF generation for image session (~400 lines)
└── client/
    ├── client-image-sessions.routes.js
    └── client-image-sessions.controller.js
```

#### TODO Checklist

- [ ] Create `image-sessions.repo.js` — extract space/template/material/style queries
- [ ] Create `image-sessions.usecase.js` — session lifecycle, pattern/image selection
- [ ] Create `image-sessions.pdf.js` — move PDF generation from `clientServices.js`
- [ ] Create `image-sessions.validation.js` — Zod schemas
- [ ] Create `image-sessions.controller.js` and `image-sessions.routes.js`
- [ ] Merge admin endpoints (spaces, colors, materials, templates) into image-sessions routes with admin guard
- [ ] Create `client/` sub-routes for public session access
- [ ] Remove admin sub-mount from `admin/admin.js`

#### Dependencies

- PDF queue/worker
- `leads` module (sessions linked to leads)
- Telegram (PDF submission notification)

---

### 8.12 Questions / VERSA Module

**Status: ❌ Not started**

#### Current State

- **Route file**: `routes/questions/questions.js` (~80 lines)
- **Service file**: `services/main/shared-questions/shared-questions.js` (~100 lines)

#### Pain Points

1. Service is in `shared-questions/` — should be module-specific
2. Default question seeding logic mixed with CRUD

#### Target Structure

```
v2/modules/questions/
├── questions.routes.js
├── questions.controller.js
├── questions.usecase.js          ← Question CRUD, default seeding, VERSA logic
├── questions.repo.js
└── questions.validation.js
```

#### TODO Checklist

- [ ] Create `questions.repo.js` — question type, session question, answer queries
- [ ] Create `questions.usecase.js` — default seeding, answer submission, VERSA model management
- [ ] Create `questions.validation.js` — Zod schemas for answer submission, question creation
- [ ] Create `questions.controller.js` and `questions.routes.js`

#### Dependencies

- `leads` module (questions linked to leads)

---

### 8.13 Notifications Module

**Status: ❌ Not started (critical shared infrastructure)**

#### Current State

- **Scattered across**:
  - `services/main/utility/utility.js`: `createNotification()`, `getNotifications()`, `markLatestNotificationsAsRead()`
  - `services/notification.js`: `convertALeadNotification()`, `assignLeadNotification()`, etc.
  - `services/main/email/emailTemplates.js`: HTML email templates
  - Socket.IO: Notification emit via `io.to(user:${userId}).emit()`

#### Pain Points

1. `createNotification()` is in the utility god-file — called from 10+ services
2. Notification types are inline strings, not centralized
3. Email templates are separate from their triggering logic
4. Socket emit for notifications is coupled to `createNotification()`

#### Target Structure

```
v2/modules/notifications/
├── notifications.routes.js     ← GET unread, mark as read
├── notifications.controller.js
├── notifications.usecase.js    ← Create notification, email dispatch, socket emit
├── notifications.repo.js      ← Notification CRUD queries
└── notifications.emails.js    ← All notification email templates in one place
```

#### TODO Checklist

- [ ] Create `notifications.repo.js` — notification CRUD, unread count, mark-as-read
- [ ] Create `notifications.usecase.js` — centralize `createNotification()` with socket emit
- [ ] Create `notifications.emails.js` — consolidate all notification email templates
- [ ] Create `notifications.routes.js` — GET unread notifications, POST mark-as-read
- [ ] Create `notifications.controller.js`
- [ ] Create `notifications.validation.js` — schema for query params
- [ ] Define notification type enum/constants
- [ ] Refactor all services to call `notifications.usecase.createNotification()` instead of utility function

#### Dependencies

- Socket.IO infra (real-time notification delivery)
- Mail infra (email notifications)
- **This is a dependency for almost every other module**

---

### 8.14 Site Utilities / Config Module

**Status: ❌ Not started**

#### Current State

- **Route files**: `routes/site-utilities/siteUtility.js` (~60 lines), `contract-utilities.js` (~150 lines)
- **Service file**: `services/main/site-utilities/siteUtilityServices.js` (~150 lines)

#### Target Structure

```
v2/modules/site-config/
├── site-config.routes.js
├── site-config.controller.js
├── site-config.usecase.js
└── site-config.repo.js
```

#### TODO Checklist

- [ ] Create `site-config.repo.js` — PDF utilities, contract payment conditions, obligations, clauses CRUD
- [ ] Create `site-config.usecase.js` — config management logic
- [ ] Create `site-config.routes.js` and controller with admin guard
- [ ] Move fixed data, language data from shared utilities here

#### Dependencies

- `contracts` module (contract templates used by contracts)

---

### 8.15 Drive / File Uploads Module

**Status: ❌ Not started**

#### Current State

- **Route file**: `routes/utility/utility.js` (upload endpoints), `routes/client/uploads.js`
- **Service files**: `services/drive.js`, `services/main/utility/uploadAsChunk.js`, `services/main/utility/utility.js` (upload functions)

#### Target Structure

```
v2/infra/upload/
├── multer.js               ← Multer configuration (PROPOSED)
├── chunk-upload.js          ← Chunked upload logic (PROPOSED)
└── ftp.js                   ← FTP operations (PROPOSED)

v2/infra/google/
├── drive.js                 ← Google Drive API (PROPOSED)

v2/modules/drive/
├── drive.routes.js          ← Upload endpoints
├── drive.controller.js
├── drive.usecase.js
└── drive.repo.js            ← DriveNode CRUD (if using DB-tracked files)
```

#### TODO Checklist

- [ ] Create `v2/infra/upload/multer.js` — centralize multer config (memory + disk storage)
- [ ] Create `v2/infra/upload/chunk-upload.js` — move `uploadAsChunk.js`
- [ ] Create `v2/infra/upload/ftp.js` — move FTP upload functions
- [ ] Create `v2/infra/google/drive.js` — move Google Drive integration
- [ ] Create `drive.routes.js` — file upload, chunk upload endpoints
- [ ] Create `drive.controller.js` and `drive.usecase.js`

#### Dependencies

- Auth middleware
- FTP server access
- Google Drive API credentials

---

### 8.16 Sales Stages Module

**Status: ❌ Not started**

#### Current State

- **Route file**: `routes/shared/sales-stages.js` (~35 lines)
- **Service file**: `services/main/shared/salesStageServices.js` (~45 lines)

#### Target Structure

```
v2/modules/sales-stages/
├── sales-stages.routes.js
├── sales-stages.controller.js
├── sales-stages.usecase.js
└── sales-stages.repo.js
```

Small module. Can be done quickly.

#### TODO Checklist

- [ ] Create `sales-stages.repo.js` — stage queries
- [ ] Create `sales-stages.usecase.js` — stage progression/regression
- [ ] Create `sales-stages.routes.js` and controller
- [ ] Create `sales-stages.validation.js` — Zod schemas

#### Dependencies

- `leads` module (stages linked to leads)

---

### 8.17 Dashboard Module

**Status: ❌ Not started**

#### Current State

- **Route file**: `routes/shared/dashboard.js` (~85 lines, 6 endpoints)
- **Service file**: `services/main/shared/dashboardServices.js` (~200 lines)

#### Target Structure

```
v2/modules/dashboard/
├── dashboard.routes.js
├── dashboard.controller.js
├── dashboard.usecase.js        ← KPI aggregation, staff filtering
└── dashboard.repo.js           ← Aggregate queries
```

#### TODO Checklist

- [ ] Create `dashboard.repo.js` — aggregate queries (count, sum, avg)
- [ ] Create `dashboard.usecase.js` — metrics calculation, staff filtering
- [ ] Create `dashboard.routes.js` and controller
- [ ] Move staff-filtering logic from controller → usecase

#### Dependencies

- `leads` module (lead metrics)
- `users` module (staff filtering)
- `finance` module (revenue metrics)

---

### 8.18 User Profile Module

**Status: ❌ Not started**

#### Current State

- **Route file**: `routes/shared/users.js` (~25 lines)
- **Service file**: `services/main/shared/userProfile.js` (~15 lines)

Very small. Can be the simplest module.

#### Target Structure

```
v2/modules/profile/
├── profile.routes.js
├── profile.controller.js
├── profile.usecase.js
└── profile.repo.js
```

#### TODO Checklist

- [ ] Create `profile.repo.js` — user profile queries
- [ ] Create `profile.usecase.js` — profile update logic, user log handling
- [ ] Create `profile.routes.js` and controller
- [ ] Move `checkUserLog()` / `submitUserLog()` from shared utilities → `profile.usecase.js`

#### Dependencies

- Auth middleware

---

### 8.19 Google Reviews Module

**Status: ❌ Not started**

#### Current State

- **Route file**: `routes/shared/reviews.js` (~30 lines)
- **Service file**: `services/reviews.js` (~50 lines)

Very small external integration. Can stay as infra or become a tiny module.

#### TODO Checklist

- [ ] Move `services/reviews.js` → `v2/infra/google/reviews.js`
- [ ] Create a thin route in the `dashboard` module or a standalone `reviews` module
- [ ] Add OAuth credential management

#### Dependencies

- Google APIs

---

### 8.20 Updates Module

**Status: ❌ Not started**

#### Current State

- **Route file**: `routes/shared/updates.js` (~85 lines)
- **Service file**: `services/main/shared/updateServices.js` (~150 lines)

#### Target Structure

```
v2/modules/updates/
├── updates.routes.js
├── updates.controller.js
├── updates.usecase.js        ← Update creation, department authorization, archival
└── updates.repo.js
```

#### TODO Checklist

- [ ] Create `updates.repo.js` — update CRUD, shared settings queries
- [ ] Create `updates.usecase.js` — department authorization, archive logic
- [ ] Create `updates.routes.js` and controller
- [ ] Create `updates.validation.js` — Zod schemas for update creation, authorization

#### Dependencies

- `leads` module (updates linked to leads)

---

### 8.21 Delivery Module

**Status: ❌ Not started**

#### Current State

- **Route file**: `routes/shared/delivery.js` (~55 lines)
- **Service file**: `services/main/shared/deliveryServices.js` (~100 lines)

#### Target Structure

```
v2/modules/delivery/
├── delivery.routes.js
├── delivery.controller.js
├── delivery.usecase.js
└── delivery.repo.js
```

#### TODO Checklist

- [ ] Create `delivery.repo.js` — delivery schedule queries
- [ ] Create `delivery.usecase.js` — schedule creation, meeting linking
- [ ] Create `delivery.routes.js` and controller
- [ ] Create `delivery.validation.js`

#### Dependencies

- `projects` module (delivery linked to projects)
- `calendar` module (delivery linked to meetings)
- Telegram (delivery reminders)

---

## 9. Special Systems

### 9.1 Socket.IO

#### Current State

- **File**: `services/socket.js` (~580 lines) — monolithic
- **Events**: 20+ events (chat, calls, typing, reactions, read receipts, presence)
- **Problems**:
  - All events in one function
  - Direct Prisma queries in event handlers
  - Business logic duplicated between socket handlers and chat services
  - No event payload validation
  - User sessions tracked via in-memory Map (not scalable)

#### Target Structure

```
v2/infra/socket/
├── socket.js                  ← Socket.IO init, namespace setup, connection handling
├── chat.events.js             ← message:create, message:edit, message:delete, messages:forward, messages:mark_read, etc.
├── call.events.js             ← call:initiated, call:answered, call:ended
└── presence.events.js         ← online, offline, user:typing, user:stop_typing, join_room, leave_room
```

#### Migration Steps

- [ ] Create `v2/infra/socket/socket.js` — Socket.IO initialization (reuse what's in `v2/infra/socket.js`)
- [ ] Create `v2/infra/socket/presence.events.js` — extract online/offline, join/leave room, typing events
- [ ] Create `v2/infra/socket/chat.events.js` — extract message CRUD, reactions, read receipts, pinning events
- [ ] Create `v2/infra/socket/call.events.js` — extract call:initiated, call:answered, call:ended
- [ ] Refactor chat event handlers to call `chat.usecase` methods instead of direct Prisma
- [ ] Add Zod validation for all socket event payloads
- [ ] Add error handling wrapper for socket events (like asyncHandler for routes)
- [ ] Consider moving user sessions to Redis for horizontal scaling
- [ ] Remove legacy `services/socket.js` after migration

#### Dependencies

- Chat module (chat events call chat usecase)
- Auth middleware (socket handshake authentication)
- Redis (if migrating user sessions)

---

### 9.2 Chat (Deep Dive)

#### Current Message Flow

```
Client (browser) → Socket.IO "message:create" event
  → services/socket.js handler
    → chatMessageServices.sendMessage()
      → Prisma create message
      → emitToAllUsersRelatedToARoom() (broadcasts to all room members)
    → If lead has Telegram channel:
      → telegramMessageQueue.add() (async upload to Telegram)
```

#### REST Flow

```
Client → GET /shared/chat/rooms/:roomId/messages
  → routes/chat/messages.js
    → chatMessageServices.getMessages()
      → Prisma query with pagination, includes
      → addDayGrouping() (adds date labels)
      → Return formatted messages
```

#### Target Message Flow

```
Client (browser) → Socket.IO "message:create" event
  → v2/infra/socket/chat.events.js
    → chat.usecase.sendMessage(payload)
      ← validates payload
      ← calls chat.repo.createMessage()
      ← returns created message
    → Socket emit to room (done by socket layer, not usecase)
    → If Telegram: queue job via jobs/queues/

Client → GET /v2/chat/rooms/:roomId/messages
  → chat.routes.js → chat.controller.js
    → chat.usecase.getMessages(roomId, pagination)
      ← calls chat.repo.findMessages()
      ← applies day grouping
      ← returns formatted messages
```

#### Key Changes

1. Socket handlers must NOT call Prisma directly — go through usecase
2. Socket emission must happen in the socket layer, not in services
3. Day grouping is a DTO concern — move to `chat.dto.js`
4. Room membership check → `chat.middleware.js` (for routes) + `chat.usecase.verifyMembership()` (for socket)

---

### 9.3 Queue System

#### Current State

```
services/queues/
├── pdfQueue.js                   ← pdf-approval-queue
├── telegram-cron-queue.js        ← telegram-cron-queue (limiter: 1/5s)
├── telegram-message-queue.js     ← telegram-message-queue (limiter: 1/10s)
├── telegramAddUserQueue.js       ← telegram-user-queue (limiter: 1/5s)
├── telegramChannelQueue.js       ← telegram-channel-queue (limiter: 1/10s)
└── telegramUploadQueue.js        ← telegram-upload-queue (limiter: 1/10s)
```

All are ~5-10 lines each. Simple BullMQ Queue instantiation.

#### Target Structure

```
v2/jobs/queues/
├── pdf.queue.js
├── telegram-channel.queue.js
├── telegram-message.queue.js
├── telegram-upload.queue.js
├── telegram-user.queue.js
└── telegram-cron.queue.js
```

#### TODO Checklist

- [ ] Move `services/queues/pdfQueue.js` → `v2/jobs/queues/pdf.queue.js`
- [ ] Move `services/queues/telegram-cron-queue.js` → `v2/jobs/queues/telegram-cron.queue.js`
- [ ] Move `services/queues/telegram-message-queue.js` → `v2/jobs/queues/telegram-message.queue.js`
- [ ] Move `services/queues/telegramAddUserQueue.js` → `v2/jobs/queues/telegram-user.queue.js`
- [ ] Move `services/queues/telegramChannelQueue.js` → `v2/jobs/queues/telegram-channel.queue.js`
- [ ] Move `services/queues/telegramUploadQueue.js` → `v2/jobs/queues/telegram-upload.queue.js`
- [ ] Update all import paths across services and workers
- [ ] Ensure BullMQ connection uses `v2/infra/redis/bullmq-connection.js`

---

### 9.4 Worker System

#### Current State

```
services/workers/
├── pdfWorker.js                  ← Processes pdf-approval-queue
├── telegramCronWorker.js         ← Fetches messages for leads (concurrency: 1)
├── telegramMessageWorker.js      ← Sends note/file to Telegram (concurrency: 1)
├── telegramChannelWorker.js      ← Creates Telegram channels (concurrency: 1)
├── telegramAddUserWorker.js      ← Adds users to channels (concurrency: 1)
└── telegramUploadWorker.js       ← Bulk uploads notes/files (concurrency: 1)
```

Each worker is 18-35 lines. Retry: 2-10 attempts, fixed backoff 10-30s.

#### Target Structure

```
v2/jobs/workers/
├── pdf.worker.js
├── telegram-channel.worker.js
├── telegram-message.worker.js
├── telegram-upload.worker.js
├── telegram-user.worker.js
└── telegram-cron.worker.js
```

#### TODO Checklist

- [ ] Move `services/workers/pdfWorker.js` → `v2/jobs/workers/pdf.worker.js`
- [ ] Move all telegram workers → `v2/jobs/workers/`
- [ ] Update queue name references to match new queue files
- [ ] Add structured logging (replace `console.error` with logger)
- [ ] Consider error reporting integration (Sentry/similar)

---

### 9.5 Telegram Integration

#### Current State

- **Client**: `services/telegram/connectToTelegram.js` (~55 lines) — TDLib session
- **Functions**: `services/telegram/telegram-functions.js` (~1000 lines) — 33 functions
- **Bootstrap**: `start-telegram-system.js` (~10 lines)

#### Target Structure

```
v2/infra/telegram/
├── telegram-client.js            ← TDLib client connection (from connectToTelegram.js)
└── telegram-service.js           ← Channel mgmt, message ops, user invitations (from telegram-functions.js)
```

The ~1000 line file should be split logically:

- Channel management (create, add users, get entity)
- Message operations (upload notes, files, fetch messages)
- Notification helpers (notify users about events)

#### TODO Checklist

- [ ] Move `connectToTelegram.js` → `v2/infra/telegram/telegram-client.js`
- [ ] Split `telegram-functions.js` into logical groups:
  - [ ] Channel management functions → `v2/infra/telegram/telegram-channels.js` (PROPOSED)
  - [ ] Message operations → `v2/infra/telegram/telegram-messages.js` (PROPOSED)
  - [ ] Notification helpers → module-level emails/notifications (distributed to modules)
- [ ] Update all queue/worker imports to reference new paths
- [ ] Move Telegram-specific DB queries (leads, notes, files) to appropriate module repos
- [ ] Remove direct Prisma usage from telegram functions — call module repos instead

---

### 9.6 Schedulers / Cron Jobs

#### Current State

```
Root files:
├── tele-cron.js                     ← Every 10min: enqueue Telegram fetch jobs
├── reminderScheduler.js             ← Every 1min: send meeting reminder emails (12h/4h/15min)
└── projectDeliveryTimeReminder.js   ← Every 2h: Telegram delivery deadline reminders
```

#### Target Structure

```
v2/jobs/schedulers/
├── telegram-cron.scheduler.js     ← From tele-cron.js
├── reminder.scheduler.js          ← From reminderScheduler.js
└── delivery-reminder.scheduler.js ← From projectDeliveryTimeReminder.js
```

#### TODO Checklist

- [ ] Move `tele-cron.js` → `v2/jobs/schedulers/telegram-cron.scheduler.js`
- [ ] Move `reminderScheduler.js` → `v2/jobs/schedulers/reminder.scheduler.js`
- [ ] Move `projectDeliveryTimeReminder.js` → `v2/jobs/schedulers/delivery-reminder.scheduler.js`
- [ ] Create `v2/jobs/bootstrap.js` — initializes all workers + schedulers (from `start-telegram-system.js`)
- [ ] Update imports to use v2 module paths
- [ ] Add structured logging to all schedulers

---

## 10. Phased Roadmap

### Phase 0: Foundation & Preparation

**Priority: 🔴 CRITICAL — All other phases depend on this**
**Estimated files: ~15**

| #    | Task                                                    | Details                                              | Blocker For                    |
| ---- | ------------------------------------------------------- | ---------------------------------------------------- | ------------------------------ |
| 0.1  | Finalize `v2/shared/pagination.js`                      | Extract `getPagination()` from utility.js            | All list endpoints             |
| 0.2  | Move `services/enums.js` → `v2/shared/enums.js`         | Business enum constants                              | Lead, finance, project modules |
| 0.3  | Move `services/links.js` → `v2/shared/links.js`         | Frontend URL builders                                | Notification module            |
| 0.4  | Move `services/constants.js` → `v2/shared/constants.js` | Company branding                                     | Email templates                |
| 0.5  | Create `v2/infra/redis/redis.js`                        | Move Redis client                                    | Queue system                   |
| 0.6  | Create `v2/infra/redis/bullmq-connection.js`            | Move BullMQ connection                               | Queue system                   |
| 0.7  | Extend `v2/shared/middlewares/auth.middleware.js`       | Add `getCurrentUser()` + `getTokenData()` extraction | All controllers                |
| 0.8  | Create `v2/infra/upload/multer.js`                      | Centralize multer config                             | Upload endpoints               |
| 0.9  | Create `v2/infra/upload/chunk-upload.js`                | Move chunked upload logic                            | Upload endpoints               |
| 0.10 | Create `v2/infra/upload/ftp.js`                         | Move FTP operations                                  | File operations                |
| 0.11 | Create `v2/infra/pdf/pdf-utils.js`                      | Move font/image/text utils for PDF                   | Contract + image session PDFs  |
| 0.12 | Verify auth module v1↔v2 cookie compatibility           | Ensure v2 auth works alongside legacy routes         | Everything                     |
| 0.13 | Create route mounting strategy in `v2/routes.js`        | Plan how v2 routes coexist with legacy in `index.js` | All module routes              |

**Outcome**: Shared infrastructure is in place. Modules can be built independently.

---

### Phase 1: Notifications Module

**Priority: 🔴 CRITICAL — Most modules depend on notifications**
**Estimated files: 6**

| #   | Task                                         | Details                                                                                |
| --- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1.1 | Create `notifications.repo.js`               | Notification CRUD, unread count, mark-read                                             |
| 1.2 | Create `notifications.usecase.js`            | Centralized `createNotification()` with socket emit, absorb `services/notification.js` |
| 1.3 | Create `notifications.emails.js`             | Consolidate notification email templates from `emailTemplates.js`                      |
| 1.4 | Create `notifications.routes.js`             | GET unread, POST mark-as-read                                                          |
| 1.5 | Create `notifications.controller.js`         | Thin handlers                                                                          |
| 1.6 | Mount notifications routes in `v2/routes.js` | Register `/v2/notifications`                                                           |

**Outcome**: All modules can use `notifications.usecase.createNotification()` instead of calling utility.js.

---

### Phase 2: Chat Module (Full Implementation)

**Priority: 🟡 HIGH — Complex, standalone, already scaffolded**
**Estimated files: 12+**

| #    | Task                                      | Details                                                       |
| ---- | ----------------------------------------- | ------------------------------------------------------------- |
| 2.1  | Implement `chat.repo.js`                  | Extract all chat Prisma queries (~1,100 lines across 5 files) |
| 2.2  | Implement `chat.dto.js`                   | Room/message/member/file select projections, day grouping     |
| 2.3  | Implement `chat.usecase.js`               | Room access, message ops, member mgmt, permission checks      |
| 2.4  | Implement `chat.validation.js`            | Zod schemas for all chat operations                           |
| 2.5  | Implement `chat.controller.js`            | HTTP handlers for all chat endpoints                          |
| 2.6  | Implement `chat.routes.js`                | Staff chat endpoints                                          |
| 2.7  | Implement `chat.middleware.js`            | Room membership verification                                  |
| 2.8  | Create `client/client-chat.routes.js`     | Client-facing chat endpoints                                  |
| 2.9  | Create `client/client-chat.controller.js` | Client HTTP handlers                                          |
| 2.10 | Uncomment chat routes in `v2/routes.js`   | Enable `/v2/chat`                                             |

**Outcome**: Chat module is fully functional via REST API. Socket migration happens in Phase 3.

---

### Phase 3: Socket.IO Refactor

**Priority: 🟡 HIGH — Depends on Chat module**
**Estimated files: 4**

| #   | Task                                         | Details                                                            |
| --- | -------------------------------------------- | ------------------------------------------------------------------ |
| 3.1 | Create `v2/infra/socket/chat.events.js`      | Extract chat events from `services/socket.js`, call `chat.usecase` |
| 3.2 | Create `v2/infra/socket/call.events.js`      | Extract call events                                                |
| 3.3 | Create `v2/infra/socket/presence.events.js`  | Extract presence events                                            |
| 3.4 | Update `v2/infra/socket/socket.js`           | Register event handlers from separate files                        |
| 3.5 | Add Zod validation for socket event payloads | Prevent malformed events                                           |
| 3.6 | Add socket error handling wrapper            | Catch errors in event handlers                                     |
| 3.7 | Test Socket.IO events with new chat module   | Verify message flow works end-to-end                               |

**Outcome**: Socket.IO is modular. Chat events use chat usecase. No more direct Prisma in socket handlers.

---

### Phase 4: CRM Core — Leads, Projects, Tasks

**Priority: 🟡 HIGH — Core business workflow**
**Estimated files: 20+**

| #   | Task                                   | Details                                                    |
| --- | -------------------------------------- | ---------------------------------------------------------- |
| 4.1 | Build `leads` module                   | repo, usecase, controller, routes, validation, dto, emails |
| 4.2 | Build `projects` module                | repo, usecase, controller, routes, validation, dto         |
| 4.3 | Build `tasks` module                   | repo, usecase, controller, routes, validation              |
| 4.4 | Build `updates` module                 | repo, usecase, controller, routes                          |
| 4.5 | Build `delivery` module                | repo, usecase, controller, routes                          |
| 4.6 | Build `sales-stages` module            | repo, usecase, controller, routes                          |
| 4.7 | Extract lead client-facing routes      | `leads/client/` for public lead creation                   |
| 4.8 | Mount all CRM routes in `v2/routes.js` | Register `/v2/leads`, `/v2/projects`, etc.                 |

**Outcome**: All CRM operations work through v2 modules.

---

### Phase 5: Calendar & Meetings

**Priority: 🟢 MEDIUM**
**Estimated files: 8**

| #   | Task                                                  | Details                                       |
| --- | ----------------------------------------------------- | --------------------------------------------- |
| 5.1 | Build `calendar` module                               | repo, usecase, controller, routes, validation |
| 5.2 | Move `new-calendar.js` logic to `calendar.usecase.js` | Fix misplaced service file                    |
| 5.3 | Create `google-calendar.js` in calendar module        | Consolidate Google OAuth                      |
| 5.4 | Create `client/` sub-routes                           | Public booking endpoints                      |
| 5.5 | Absorb call/meeting reminders from `staffServices.js` | Move to calendar module                       |
| 5.6 | Delete `calendar/old-call.js`                         | Remove legacy after verification              |

**Outcome**: Calendar is a clean module. No more service files in route folders.

---

### Phase 6: Contracts & Finance

**Priority: 🟢 MEDIUM**
**Estimated files: 15+**

| #   | Task                                                           | Details                                                 |
| --- | -------------------------------------------------------------- | ------------------------------------------------------- |
| 6.1 | Build `contracts` module                                       | repo, usecase, controller, routes, validation, dto, pdf |
| 6.2 | Move PDF generation (~500 lines) to `contracts.pdf.js`         | Isolated PDF logic                                      |
| 6.3 | Merge contract helper files (rules, blocks, defaults) into dto | Consolidate                                             |
| 6.4 | Build `finance` module                                         | repo, usecase, controller, routes, validation, stripe   |
| 6.5 | Consolidate Stripe integration into `finance/stripe.js`        | Single Stripe entry point                               |
| 6.6 | Create client sub-routes for both modules                      | Public contract signing + payment                       |
| 6.7 | Build `site-config` module                                     | Contract template management                            |

**Outcome**: Contract lifecycle and financial operations are clean modules.

---

### Phase 7: Users & Admin

**Priority: 🟢 MEDIUM**
**Estimated files: 8**

| #   | Task                                      | Details                                            |
| --- | ----------------------------------------- | -------------------------------------------------- |
| 7.1 | Build `users` module                      | repo, usecase, controller, routes, validation, dto |
| 7.2 | Build `profile` module                    | repo, usecase, controller, routes                  |
| 7.3 | Decompose `admin/admin.js`                | Distribute admin actions to domain modules         |
| 7.4 | Decompose `staff/staff.js`                | Redistribute to calendar/dashboard                 |
| 7.5 | Build `dashboard` module                  | repo, usecase, controller, routes                  |
| 7.6 | Move Google Reviews to infra or dashboard | Small integration                                  |

**Outcome**: Admin monolith is broken up. Each domain owns its admin endpoints.

---

### Phase 8: Secondary Modules

**Priority: 🔵 LOW**
**Estimated files: 15+**

| #   | Task                          | Details                                          |
| --- | ----------------------------- | ------------------------------------------------ |
| 8.1 | Build `courses` module        | Merge admin + staff course logic                 |
| 8.2 | Build `image-sessions` module | Merge admin + client + staff logic, move PDF gen |
| 8.3 | Build `questions` module      | VERSA framework                                  |
| 8.4 | Build `drive` module          | File management endpoints                        |

**Outcome**: All remaining domain modules are refactored.

---

### Phase 9: Jobs & Scheduling

**Priority: 🔵 LOW — Can happen alongside other phases**
**Estimated files: 15**

| #   | Task                                             | Details                           |
| --- | ------------------------------------------------ | --------------------------------- |
| 9.1 | Move all queues to `v2/jobs/queues/`             | 6 queue files                     |
| 9.2 | Move all workers to `v2/jobs/workers/`           | 6 worker files                    |
| 9.3 | Move schedulers to `v2/jobs/schedulers/`         | 3 scheduler files                 |
| 9.4 | Create `v2/jobs/bootstrap.js`                    | Worker + scheduler initialization |
| 9.5 | Move Telegram functions to `v2/infra/telegram/`  | Split 1000-line file              |
| 9.6 | Add structured logging to all workers/schedulers | Replace console.error             |

**Outcome**: All background processing lives in `v2/jobs/`.

---

### Phase 10: Cleanup & Cutover

**Priority: 🔵 LOW — Final phase**
**Estimated files: 0 (deletion only)**

| #    | Task                                                        | Details                                    |
| ---- | ----------------------------------------------------------- | ------------------------------------------ |
| 10.1 | Update `index.js` or replace with `v2/server.js`            | Switch entry point                         |
| 10.2 | Remove all legacy route files                               | `routes/` directory                        |
| 10.3 | Remove all legacy service files                             | `services/` directory                      |
| 10.4 | Remove root-level scheduler files                           | `tele-cron.js`, etc.                       |
| 10.5 | Remove `prisma/prisma.js` (use `v2/infra/prisma/prisma.js`) | Single Prisma client                       |
| 10.6 | Final route URL audit                                       | Verify all frontend apps use `/v2/` prefix |
| 10.7 | Run full regression test                                    | Manual test all endpoints                  |
| 10.8 | Update deployment scripts                                   | Point to v2 entry                          |

**Outcome**: Legacy code is removed. Only v2 structure remains.

---

## 11. Dependency Graph

```
auth ← (used by everything, ✅ DONE)
├── All modules (requireAuth / requireRole middleware)
│
notifications ← (dependency for most modules)
├── leads (lead assignment, conversion notifications)
├── projects (task completion)
├── contracts (contract signed)
├── finance (payment processed, overdue)
├── calendar (meeting reminders)
├── courses (course completion)
│
leads ←
├── projects (project linked to lead)
├── contracts (contract linked to lead)
├── tasks (tasks linked to lead projects)
├── sales-stages (stages linked to lead)
├── updates (milestones linked to lead)
├── questions (questions linked to lead)
├── image-sessions (sessions linked to lead)
├── delivery (delivery linked to lead projects)
├── calendar (reminders linked to leads)
│
contracts ←
├── projects (project created from contract)
├── finance (payment conditions from contract)
│
Socket.IO ←
├── chat (real-time messaging)
├── notifications (real-time alerts)
├── presence (online/offline)
│
Telegram ←
├── leads (channel creation on finalization)
├── contracts (contract signed notification)
├── projects (project status notification)
├── delivery (deadline reminders)
│
shared/pagination ← All list endpoints
shared/enums ← leads, projects, finance
shared/links ← notifications
infra/upload ← drive, contracts (PDF), image-sessions (PDF)
infra/pdf ← contracts, image-sessions
infra/redis ← all queues/workers
```

---

## 12. Breaking Changes & Coordination

### Route URL Changes

| Old URL               | New URL                               | Impact               |
| --------------------- | ------------------------------------- | -------------------- |
| `/auth/*`             | `/v2/auth/*`                          | ✅ Already migrated  |
| `/shared/chat/*`      | `/v2/chat/*`                          | Frontend must update |
| `/shared/` (leads)    | `/v2/leads/*`                         | Frontend must update |
| `/shared/projects/*`  | `/v2/projects/*`                      | Frontend must update |
| `/shared/tasks/*`     | `/v2/tasks/*`                         | Frontend must update |
| `/shared/calendar/*`  | `/v2/calendar/*`                      | Frontend must update |
| `/shared/contracts/*` | `/v2/contracts/*`                     | Frontend must update |
| `/shared/dashboard/*` | `/v2/dashboard/*`                     | Frontend must update |
| `/admin/*`            | `/v2/users/*` (+ domain modules)      | Frontend must update |
| `/accountant/*`       | `/v2/finance/*`                       | Frontend must update |
| `/client/*`           | `/v2/{module}/client/*`               | Frontend must update |
| `/utility/*`          | `/v2/drive/*` + `/v2/notifications/*` | Frontend must update |

### Migration Strategy

- **Dual-mount period**: Both legacy and v2 routes active simultaneously
- **Frontend teams** must coordinate per phase to switch endpoints
- Use `v2/routes.js` to mount new modules at `/v2/{module}`
- Legacy routes remain in `index.js` until frontend switches

### Service Signature Changes

- `createNotification()` — new module-based API replacing utility function
- `handlePrismaError()` — removed, replaced by AppError + global handler
- `getAndThrowError()` — removed, replaced by AppError
- `getCurrentUser()` — now part of auth middleware, attached to `req.user`

### Socket Contract Changes

- Event handlers restructured but **event names stay the same**
- Payload shapes stay the same — add validation, don't break
- Socket authentication unchanged (query param userId/clientId)

### Queue Payload Changes

- No payload changes planned — only file location changes
- Queue names stay the same for backward compatibility

---

## 13. Final Master Checklist

### Foundation

- [ ] Create `v2/shared/pagination.js`
- [ ] Move `services/enums.js` → `v2/shared/enums.js`
- [ ] Move `services/links.js` → `v2/shared/links.js`
- [ ] Move `services/constants.js` → `v2/shared/constants.js`
- [ ] Create `v2/infra/redis/redis.js` and `bullmq-connection.js`
- [ ] Extend `v2/shared/middlewares/auth.middleware.js` with `getCurrentUser()` + `getTokenData()`
- [ ] Create `v2/infra/upload/multer.js`, `chunk-upload.js`, `ftp.js`
- [ ] Create `v2/infra/pdf/pdf-utils.js`
- [ ] Verify auth v1↔v2 cookie compatibility
- [ ] Establish route mounting strategy

### Modules (in dependency order)

- [ ] **Notifications module** — repo, usecase, emails, routes, controller
- [ ] **Chat module** — repo, dto, usecase, validation, controller, routes, middleware, client sub-routes
- [ ] **Socket.IO refactor** — split into event files, wire to chat usecase
- [ ] **Leads module** — repo, usecase, dto, validation, controller, routes, emails, client sub-routes
- [ ] **Projects module** — repo, usecase, dto, validation, controller, routes
- [ ] **Tasks module** — repo, usecase, validation, controller, routes
- [ ] **Updates module** — repo, usecase, controller, routes
- [ ] **Delivery module** — repo, usecase, controller, routes
- [ ] **Sales Stages module** — repo, usecase, controller, routes
- [ ] **Calendar module** — repo, usecase, validation, controller, routes, google-calendar, client sub-routes
- [ ] **Contracts module** — repo, usecase, dto, validation, controller, routes, pdf, client sub-routes
- [ ] **Finance module** — repo, usecase, dto, validation, controller, routes, stripe, client sub-routes
- [ ] **Users module** — repo, usecase, dto, validation, controller, routes
- [ ] **Profile module** — repo, usecase, controller, routes
- [ ] **Dashboard module** — repo, usecase, controller, routes
- [ ] **Courses module** — repo, usecase, dto, validation, controller, routes
- [ ] **Image Sessions module** — repo, usecase, validation, controller, routes, pdf, client sub-routes
- [ ] **Questions module** — repo, usecase, validation, controller, routes
- [ ] **Site Config module** — repo, usecase, controller, routes
- [ ] **Drive module** — repo, usecase, controller, routes

### Jobs & Background

- [ ] Move all queues to `v2/jobs/queues/`
- [ ] Move all workers to `v2/jobs/workers/`
- [ ] Move schedulers to `v2/jobs/schedulers/`
- [ ] Create `v2/jobs/bootstrap.js`
- [ ] Split Telegram functions → `v2/infra/telegram/`
- [ ] Add structured logging

### Cleanup

- [ ] Remove all legacy `routes/` files
- [ ] Remove all legacy `services/` files
- [ ] Remove root-level scheduler files
- [ ] Remove `prisma/prisma.js` (use v2 infra)
- [ ] Update entry point (`index.js` → `v2/server.js`)
- [ ] Final frontend URL audit
- [ ] Full regression test
- [ ] Update deployment scripts
