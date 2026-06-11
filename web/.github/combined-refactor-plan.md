# Combined Refactor Plan — Backend + Frontend

> **Purpose:** Module-by-module migration plan. Each phase covers one module — backend legacy, frontend legacy, what's broken, current vs target flow, prerequisites, and an execution checklist.
>
> Backend source of truth: `server/.github/refactor-plan.md`
> Frontend codebase: `ui/src/app/`
>
> **Principle:** When starting a module, only migrate what that module needs. Don't migrate all of socket — only the chat socket events when doing chat. Don't migrate all shared utils — only what leads needs when doing leads.

---

## Table of Contents

1. [Phase 0 — Shared Foundation](#phase-0--shared-foundation)
2. [Phase 1 — Auth (✅ Done)](#phase-1--auth--done)
3. [Phase 2 — Chat](#phase-2--chat)
4. [Phase 3 — Notifications](#phase-3--notifications)
5. [Phase 4 — Leads (CRM)](#phase-4--leads-crm)
6. [Phase 5 — Projects & Tasks](#phase-5--projects--tasks)
7. [Phase 6 — Calendar & Meetings](#phase-6--calendar--meetings)
8. [Phase 7 — Contracts](#phase-7--contracts)
9. [Phase 8 — Finance / Accountant](#phase-8--finance--accountant)
10. [Phase 9 — Users & Admin](#phase-9--users--admin)
11. [Phase 10 — Dashboard](#phase-10--dashboard)
12. [Phase 11 — Image Sessions](#phase-11--image-sessions)
13. [Phase 12 — Courses](#phase-12--courses)
14. [Phase 13 — Small Modules](#phase-13--small-modules)
15. [Phase 14 — Cleanup & Cutover](#phase-14--cleanup--cutover)
16. [Master Checklist](#master-checklist)

---

## Progress Dashboard

| Phase | Module               | Backend | Frontend | Status      |
| ----- | -------------------- | ------- | -------- | ----------- |
| 0     | Shared Foundation    | ⬜      | ⬜       | Not started |
| 1     | Auth                 | ✅      | ✅       | Done        |
| 2     | Chat                 | ⬜      | ⬜       | Not started |
| 3     | Notifications        | ⬜      | ⬜       | Not started |
| 4     | Leads (CRM)          | ⬜      | ⬜       | Not started |
| 5     | Projects & Tasks     | ⬜      | ⬜       | Not started |
| 6     | Calendar & Meetings  | ⬜      | ⬜       | Not started |
| 7     | Contracts            | ⬜      | ⬜       | Not started |
| 8     | Finance / Accountant | ⬜      | ⬜       | Not started |
| 9     | Users & Admin        | ⬜      | ⬜       | Not started |
| 10    | Dashboard            | ⬜      | ⬜       | Not started |
| 11    | Image Sessions       | ⬜      | ⬜       | Not started |
| 12    | Courses              | ⬜      | ⬜       | Not started |
| 13    | Small Modules        | ⬜      | ⬜       | Not started |
| 14    | Cleanup & Cutover    | ⬜      | ⬜       | Not started |

---

## Phase 0 — Shared Foundation

> Everything else depends on this. Build the shared infrastructure both backend and frontend need.

### What needs to exist before any module

**Backend shared infra:**

- `v2/shared/pagination.js` — extract `getPagination()` from `services/main/utility/utility.js`
- `v2/shared/enums.js` — move from `services/enums.js`
- `v2/shared/links.js` — move from `services/links.js`
- `v2/shared/constants.js` — move from `services/constants.js`
- `v2/infra/redis/redis.js` + `bullmq-connection.js` — move from `services/redis/`
- Extend `v2/shared/middlewares/auth.middleware.js` with `getCurrentUser()` + `getTokenData()`
- Route mounting strategy: v2 routes coexist with legacy in `index.js`

**Frontend shared infra (already partially exists in `v2/lib/`):**

- `v2/lib/api/ApiFetch.js` — ✅ exists (supports both v1 & v2 endpoints)
- `v2/lib/api/getData.js` — ✅ exists
- `v2/lib/api/handleRequestSubmit.js` — ✅ exists
- `v2/lib/config.js` — ✅ exists (`apiUrl`, `legacyApiUrl`)
- `v2/lib/toast/toastUtils.js` — ✅ exists

### Backend Checklist

- [ ] Create `v2/shared/pagination.js`
- [ ] Move `services/enums.js` → `v2/shared/enums.js`
- [ ] Move `services/links.js` → `v2/shared/links.js`
- [ ] Move `services/constants.js` → `v2/shared/constants.js`
- [ ] Create `v2/infra/redis/redis.js` and `bullmq-connection.js`
- [ ] Extend `v2/shared/middlewares/auth.middleware.js`
- [ ] Establish route mounting strategy in `v2/routes.js`
- [ ] Verify auth v1↔v2 cookie compatibility

### Frontend Checklist

- [ ] Verify `v2/lib/api/ApiFetch.js` handles both `/v2/` and legacy prefixes cleanly
- [ ] Ensure `v2/lib/api/getData.js` supports same pagination/filter/search/sort params as `helpers/hooks/useDataFetcher.js`
- [ ] Create shared `v2/shared/hooks/useDataFetcher.js` that wraps `v2/lib/api/getData.js` (replaces legacy `helpers/hooks/useDataFetcher.js`)
- [ ] Create shared `v2/shared/components/AdminTable.jsx` (replaces legacy `UiComponents/DataViewer/AdminTable.jsx`) or plan adapter
- [ ] Verify `v2/providers/AuthProvider.jsx` works with v2 auth endpoints
- [ ] Verify `v2/providers/ToastProvider.jsx` matches legacy toast behavior

---

## Phase 1 — Auth (✅ Done)

### Backend

- ✅ Fully refactored in `v2/modules/auth/` (8 files)
- ✅ Endpoints: login, refresh, logout, me, request-password-reset, reset-password
- ✅ Zod validation, rate limiting, timing-safe auth, refresh token rotation

### Frontend

- ✅ `v2/module/auth/` exists with LoginPage, ResetPage, services, validation
- ✅ `v2/shared/form/AuthForm.jsx`, `FormField.jsx`
- ✅ `v2/shared/components/AuthCard.jsx`, `AuthGuard.jsx`, `AuthLayout.jsx`
- ✅ `v2/providers/AuthProvider.jsx`

### Remaining cleanup

- [ ] Confirm all frontend pages switched from `/auth/*` to `/v2/auth/*`
- [ ] Remove legacy `services/main/auth/authServices.js` after confirming
- [ ] Remove legacy `routes/auth/auth.js` after confirming
- [ ] Remove legacy `src/app/(auth)/(auth-group)/login/` and `reset/` pages if fully replaced by v2

---

## Phase 2 — Chat

> Complex, standalone, already scaffolded in backend. Heavy socket usage. **This is the most complex module.**

### Prerequisites — do these BEFORE chat

**Socket infra (only chat-related parts):**

The current `services/socket.js` (~580 lines) is a monolith handling all 20+ events. For chat, we only need to extract chat-related socket events.

- [ ] Create `v2/infra/socket/socket.js` — Socket.IO init + namespaces (reuse existing `v2/infra/socket.js`)
- [ ] Create `v2/infra/socket/chat.events.js` — extract only chat events from `services/socket.js`:
  - `message:create`, `message:edit`, `message:delete`, `message:pin`, `message:unpin`
  - `messages:forward`, `messages:mark_read`, `message:mark_read`
  - `join_room`, `leave_room`, `user:typing`, `user:stop_typing`
  - `message:react`, read receipts
- [ ] Create `v2/infra/socket/presence.events.js` — extract: `online`, `offline`
- [ ] Leave call events (`call:initiated`, `call:answered`, `call:ended`) in legacy for now
- [ ] Add Zod validation for socket event payloads
- [ ] Add socket error handling wrapper

**Upload infra (only what chat needs):**

- [ ] Create `v2/infra/upload/chunk-upload.js` — move from `services/main/utility/uploadAsChunk.js`
- [ ] Create `v2/infra/upload/multer.js` — centralize multer config

---

### Backend Legacy — What exists and what's wrong

**Route files (8):**

- `routes/chat/rooms.js` — staff room CRUD
- `routes/chat/messages.js` — staff message CRUD
- `routes/chat/members.js` — staff member management
- `routes/chat/files.js` — staff file listing
- `routes/client/chat/rooms.js` — client room access (token-based)
- `routes/client/chat/messages.js` — client messages
- `routes/client/chat/members.js` — client members
- `routes/client/chat/files.js` — client files

**Service files (5, ~1,100 lines):**

- `services/main/chat/chatRoomServices.js` (~300 lines)
- `services/main/chat/chatMessageServices.js` (~400 lines)
- `services/main/chat/chatMemberServices.js` (~150 lines)
- `services/main/chat/chatFileServices.js` (~150 lines)
- `services/main/chat/utils.js` (~100 lines)

**Socket (in services/socket.js):** 20+ events, ~580 lines, all in one function.

**What's bad:**

1. Socket handlers have direct Prisma queries — business logic in socket layer
2. `chatMessageServices.sendMessage()` calls `emitToAllUsersRelatedToARoom()` — service layer directly emits socket events (coupling)
3. Message creation logic duplicated between socket handlers and chat services
4. Client chat has no real auth — relies on token in query params
5. Room permission checks scattered across `utils.js` + inline in services
6. Day grouping / date formatting mixed into message queries (should be DTO/presentation)

### Current Chat Flow (What's bad)

```
Client → Socket.IO "message:create"
  → services/socket.js handler
    → chatMessageServices.sendMessage()     ← Direct Prisma in service
      → emitToAllUsersRelatedToARoom()      ← Socket emit INSIDE service (bad!)
    → telegramMessageQueue.add()            ← Telegram sync inside socket handler
```

```
Client → GET /shared/chat/rooms/:roomId/messages
  → routes/chat/messages.js
    → chatMessageServices.getMessages()
      → Prisma query + addDayGrouping()     ← Presentation logic in service
```

### Target Chat Flow

```
Client → Socket.IO "message:create"
  → v2/infra/socket/chat.events.js
    → chat.usecase.sendMessage(payload)     ← Validated, no req/res, no Prisma
      → chat.repo.createMessage()           ← Prisma only in repo
      → returns created message
    → Socket emit (done in socket layer)    ← Clean separation
    → telegram queue (if needed)
```

```
Client → GET /v2/chat/rooms/:roomId/messages
  → chat.routes.js → chat.controller.js
    → chat.usecase.getMessages(roomId, pagination)
      → chat.repo.findMessages()
      → chat.dto applies day grouping       ← Presentation in DTO
```

**Key rule:** Socket handlers call usecase. Usecase returns data. Socket layer handles emit. Services never emit.

---

### Frontend Legacy — What exists

**Page routes (5):**

- `src/app/chats/page.jsx` — client chat access
- `src/app/(auth)/dashboard/(dashboard)/@2D/chat/page.jsx`
- `src/app/(auth)/dashboard/(dashboard)/@3D/chat/page.jsx`
- `src/app/(auth)/dashboard/(dashboard)/@super_admin/chat/page.jsx`
- `src/app/(auth)/dashboard/(dashboard)/@super_sales/chat/page.jsx`

**Components (30+) in `src/app/UiComponents/DataViewer/chat/`:**

- `ChatContainer.jsx` — main layout (page/widget/project modes)
- `components/chat/ChatPage.jsx` — route wrapper with SocketProvider
- `components/chat/ChatWidget.jsx` — floating widget
- `components/client/ClientChatPage.jsx` — external client access
- `components/window/ChatWindow.jsx` — main chat UI
- `components/messages/ChatInput.jsx` — text/file/voice input (chunks)
- `components/messages/ChatMessage.jsx` — message rendering + actions
- `components/messages/ChatFilesTab.jsx` — file browser
- `components/messages/MultiActions.jsx` — bulk message actions
- `components/rooms/ChatRoomsList.jsx` — room list + unread
- `components/dialogs/CreateGroupDialog.jsx` — create group
- `components/dialogs/StartNewChat.jsx` — start direct chat
- `components/dialogs/AddMembersDialog.jsx` — add/remove members
- `components/dialogs/ForwardMessagesDialog.jsx` — forward messages
- `components/window/ChatSettings.jsx` — room settings
- `components/window/PinnedMessages.jsx` — pinned messages
- - indicators, headers, utility components

**Hooks (6) in `src/app/UiComponents/DataViewer/chat/hooks/`:**

- `useChatRooms.js` — room listing, pagination, search
- `useChatMessages.js` — message pagination, reply-jump
- `useChatMembers.js` — member management
- `useChatFiles.js` — file listing with search
- `useChatRoom.js` — single room details
- `useSocket.js` — socket event subscription

**Utils in `src/app/UiComponents/DataViewer/chat/utils/`:**

- `socketIO.js` — socket wrapper (emitSocket, onSocket, joinChatRoom, etc.)
- `chatConstants.js` — room types, message types, member roles, limits

**Provider:** `src/app/providers/SocketProvider.jsx`

**Frontend endpoints consumed (staff prefix `shared/`, client prefix `client/`):**

- `shared/chat/rooms` — CRUD + lead-rooms
- `shared/chat/rooms/:roomId` — room detail
- `shared/chat/rooms/:roomId/messages` — messages
- `shared/chat/rooms/:roomId/members` — members
- `shared/chat/rooms/:roomId/files` — files
- `shared/chat/rooms/:roomId` PATCH — settings
- `shared/chat/rooms/:roomId/manageClient` — add/remove client
- `shared/chat/rooms/:roomId/regenerateToken` — access token
- `shared/all-related-chat-users` — user list for groups
- `shared/all-chat-users` — user list for DMs
- `shared/chat/rooms/create-chat` — start DM
- `client/chat/rooms/validate-token` — client access
- `client/chat/rooms/:roomId` — client room
- `client/chat/rooms/:roomId/messages` — client messages
- `utility/upload-chunk` / `client/upload-chunk` — file uploads

---

### Frontend Current Problems

1. Chat components are in `UiComponents/DataViewer/chat/` — deep nesting, not in `v2/module/chat/`
2. Hooks use legacy `getData()` from `helpers/functions/getData.js` — should use `v2/lib/api/`
3. `socketIO.js` has raw socket emit/listen wrappers — should align with v2 socket infra
4. Chat uses `SocketProvider` which does auth via credentials — fine, but socket events should call v2 backend
5. Endpoints will change: `shared/chat/*` → `v2/chat/*`
6. Client endpoints will change: `client/chat/*` → `v2/chat/client/*`
7. Upload endpoint may change: `utility/upload-chunk` → `v2/drive/upload-chunk`

---

### Backend Checklist

- [ ] Implement `v2/modules/chat/chat.repo.js` — extract Prisma queries from all 5 legacy chat services
- [ ] Implement `v2/modules/chat/chat.dto.js` — select fields for rooms/messages/members/files + day grouping
- [ ] Implement `v2/modules/chat/chat.usecase.js` — room access, message ops, member mgmt, permission checks
- [ ] Implement `v2/modules/chat/chat.validation.js` — Zod schemas for room creation, message send, member add
- [ ] Implement `v2/modules/chat/chat.controller.js` — thin HTTP handlers
- [ ] Implement `v2/modules/chat/chat.routes.js` — merge rooms/messages/members/files under `/chat`
- [ ] Implement `v2/modules/chat/chat.middleware.js` — room membership verification
- [ ] Implement `v2/modules/chat/client/client-chat.routes.js` — client endpoints with token auth
- [ ] Implement `v2/modules/chat/client/client-chat.controller.js`
- [ ] Wire `v2/infra/socket/chat.events.js` to call `chat.usecase` (not Prisma)
- [ ] Remove `emitToAllUsersRelatedToARoom()` from services — emit stays in socket layer
- [ ] Mount chat routes in `v2/routes.js`

### Frontend Checklist

- [ ] Create `v2/module/chat/` folder structure
- [ ] Move `UiComponents/DataViewer/chat/hooks/*.js` → `v2/module/chat/hooks/`
- [ ] Move `UiComponents/DataViewer/chat/utils/*.js` → `v2/module/chat/utils/`
- [ ] Move `UiComponents/DataViewer/chat/ChatContainer.jsx` → `v2/module/chat/components/`
- [ ] Move all chat components from `UiComponents/DataViewer/chat/components/` → `v2/module/chat/components/`
- [ ] Update all hooks to use `v2/lib/api/getData.js` instead of legacy `helpers/functions/getData.js`
- [ ] Update all hooks to use `v2/lib/api/handleRequestSubmit.js` instead of legacy `helpers/functions/handleSubmit.js`
- [ ] Update endpoint URLs: `shared/chat/*` → `v2/chat/*`
- [ ] Update client endpoint URLs: `client/chat/*` → `v2/chat/client/*`
- [ ] Update upload endpoint if changed: `utility/upload-chunk` → new path
- [ ] Update `socketIO.js` to align with `v2/infra/socket/chat.events.js` event names (event names stay same, just verify)
- [ ] Update `SocketProvider.jsx` if socket connection URL changes
- [ ] Update all dashboard chat page routes to import from `v2/module/chat/`
- [ ] Update `src/app/chats/page.jsx` to import from `v2/module/chat/client/`
- [ ] Test: room CRUD, message send/receive/edit/delete, file upload, typing indicator, member management, client access

### Dependencies

- Socket infra (prerequisite above)
- Upload infra (prerequisite above)
- Auth middleware (✅ done)

---

## Phase 3 — Notifications

> Most modules depend on notifications. Build this early so other modules can use `notifications.usecase.createNotification()`.

### Prerequisites

- [ ] Phase 0 shared foundation must be done

### Backend Legacy

**Scattered across 3 places:**

- `services/main/utility/utility.js` → `createNotification()`, `getNotifications()`, `markLatestNotificationsAsRead()` — in the god file
- `services/notification.js` → `convertALeadNotification()`, `assignLeadNotification()`, etc. — lead-specific
- `services/main/email/emailTemplates.js` → HTML email templates

**What's bad:**

1. `createNotification()` is in the utility god file — called from 10+ services
2. Notification types are inline strings, not centralized
3. Socket emit for notifications coupled to `createNotification()`
4. Email templates separate from triggering logic

### Current Flow

```
Any service → utility.createNotification()
  → Prisma create notification
  → io.to(`user:${userId}`).emit("notification")   ← Socket emit inside utility (bad!)
```

### Target Flow

```
Any module usecase → notifications.usecase.createNotification(payload)
  → notifications.repo.create()
  → returns notification
  → caller or event system handles socket emit
```

### Frontend Legacy

- `src/app/UiComponents/DataViewer/Logs.jsx` — notifications/logs page
  - Fetches: `shared/utilities/notifications?userId=...`
  - Filters by staff, date range, search
  - Uses `notificationIcons` from `helpers/constants.js`
  - Uses `NotificationColors` from `helpers/colors.js`

- Socket listener for `notification` event in `SocketProvider.jsx` and various components

### Backend Checklist

- [ ] Create `v2/modules/notifications/notifications.repo.js` — CRUD, unread count, mark-read
- [ ] Create `v2/modules/notifications/notifications.usecase.js` — centralized `createNotification()`
- [ ] Create `v2/modules/notifications/notifications.emails.js` — consolidate email templates
- [ ] Create `v2/modules/notifications/notifications.routes.js` — GET unread, POST mark-read
- [ ] Create `v2/modules/notifications/notifications.controller.js`
- [ ] Create `v2/modules/notifications/notifications.validation.js`
- [ ] Define notification type enum/constants
- [ ] Mount in `v2/routes.js`

### Frontend Checklist

- [ ] Create `v2/module/notifications/` folder
- [ ] Move `UiComponents/DataViewer/Logs.jsx` → `v2/module/notifications/components/NotificationLogs.jsx`
- [ ] Update endpoint: `shared/utilities/notifications` → `v2/notifications`
- [ ] Update notification constants/colors to use centralized v2 notification types
- [ ] Update socket notification listeners if event shape changes (event names stay same)
- [ ] Update dashboard pages that import Logs to use new path

### Dependencies

- Socket.IO infra (for real-time delivery)
- Mail infra (✅ exists in `v2/infra/mail/`)

---

## Phase 4 — Leads (CRM)

> Core business module. Most other modules depend on leads. ~55 frontend files.

### Prerequisites

- [ ] Phase 3 (Notifications) — leads create assignment/conversion notifications
- [ ] Shared upload infra (if not done in Phase 2)

### Backend Legacy

**Route files:**

- `routes/shared/client-leads.js` (~150 lines) — staff lead CRUD
- `routes/client/leads.js` (~200 lines, FAT) — public lead creation
- Part of `routes/admin/admin.js` — Excel lead import
- `routes/shared/utilities.js` — notifications for leads

**Service files:**

- `services/main/shared/leadServices.js` (~150 lines)
- `services/main/client/leads.js` (~80 lines) — code generation
- `services/main/shared/noteServices.js` (~100 lines)
- Part of `services/notification.js` — lead notifications

**What's bad:**

1. `routes/client/leads.js` has inline business logic: price range mapping, consultation pricing, code generation, date handling, direct Prisma
2. Lead details endpoint calls different service functions based on role
3. Notes, payments, reminders, price offers all mixed into leads route
4. Lead creation in admin uses different logic than client self-register
5. Country restrictions and role-based filtering embedded in lead queries

### Current Flow

```
Staff → GET /shared/client-leads?filters
  → routes/shared/client-leads.js
    → leadServices.getClientLeads()           ← Direct Prisma with role filters
    → Response with pagination

Client → POST /client/leads (register)
  → routes/client/leads.js
    → Inline price calc, code gen, date logic  ← Business logic in route handler!
    → Direct Prisma create
    → Notification + telegram channel creation
```

### Target Flow

```
Staff → GET /v2/leads?filters
  → leads.routes.js → leads.controller.js
    → leads.usecase.getLeads(filters, user)
      → leads.repo.findMany(filters)
      → leads.dto formats response

Client → POST /v2/leads/client/register
  → client-leads.routes.js → client-leads.controller.js
    → leads.usecase.createClientLead(validatedData)
      → leads.repo.create()
      → notifications.usecase.notify()
      → returns lead
```

### Frontend Legacy

**Pages (4) in `UiComponents/DataViewer/leads/pages/`:**

- `AllDealsPage.jsx` — all leads table
- `NewLeadsPage.jsx` — unassigned leads
- `NonConsultedLeads.jsx` — no initial consultation
- `OnHoldLeads.jsx` — overdue deals

**Features (2) in `leads/features/`:**

- `PreviewLead.jsx` — lead detail modal
- `AddNewLead.jsx` — create lead dialog

**Dialogs (7) in `leads/dialogs/`:**

- `PriceOffersDialog.jsx`, `NoteDialog.jsx`, `MeetingsDialog.jsx`, `CallsDialog.jsx`, `AddFilesDialog.jsx`, `PaymentScheduleDialog.jsx`, `BulkConvertDialog.jsx`

**Tabs (9) in `leads/tabs/`:**

- `SalesStage.jsx`, `PriceOffers.jsx`, `MeetingReminders.jsx`, `CallReminders.jsx`, `LeadsNotes.jsx`, `Files.jsx`, `SalesToolsTabs.jsx`, `ChatsTab.jsx`, `ExtraTabs.jsx`

**Widgets (6) in `leads/widgets/`:**

- Dashboard widgets for meetings, calls, metrics

**Panels (3) in `leads/panels/`:**

- Info panels for lead detail

**Core (8) in `leads/core/`:**

- Display utilities, column definitions

**Kanban (11) in `UiComponents/DataViewer/Kanban/`:**

- `staff/KanbanColumn.jsx`, `leads/KanbanLeadCard.jsx`, `shared/BulkConvertLeadsModal.jsx`, etc.

**Client page:**

- `src/app/UiComponents/client-page/ClientPage.jsx` — client lead form
- `src/app/UiComponents/client-page/FinalSelectionForm.jsx`

**All endpoints consumed (prefix `shared/client-leads`):**

- GET: list, deals, by-id, meetings, calls, columns
- POST: create, notes, meeting-reminders, call-reminders, files, payments, price-offers, payment-reminder, complete-register, bulk-convert
- PUT: update, status, price-offers, meeting-reminders, call-reminders, stages
- DELETE: lead, notes, meetings, calls, files, price-offers

### Backend Checklist

- [ ] Create `v2/modules/leads/leads.repo.js` — extract from `leadServices.js`
- [ ] Create `v2/modules/leads/leads.usecase.js` — lead creation, code gen, price calc, assignment, conversion
- [ ] Create `v2/modules/leads/leads.dto.js` — select fields for list/detail
- [ ] Create `v2/modules/leads/leads.validation.js` — Zod schemas
- [ ] Create `v2/modules/leads/leads.controller.js` + `leads.routes.js`
- [ ] Create `v2/modules/leads/leads.emails.js` — lead email templates
- [ ] Create `v2/modules/leads/client/client-leads.routes.js` — public lead creation
- [ ] Create `v2/modules/leads/client/client-leads.controller.js`
- [ ] Move `noteServices.js` → notes as sub-operations in `leads.repo.js`
- [ ] Move `generateCodeForNewLead()` → `leads.usecase.js`
- [ ] Extract admin lead import from `admin.js` → `leads.usecase.js`
- [ ] Move reminder refs to `calendar` module, payment refs to `finance` module
- [ ] Mount in `v2/routes.js`

### Frontend Checklist

- [ ] Create `v2/module/leads/` folder structure (pages, features, dialogs, tabs, widgets, panels, core, payments, leadUpdates, client)
- [ ] Move `UiComponents/DataViewer/leads/*` → `v2/module/leads/` (keep same subdirectory structure)
- [ ] Move `UiComponents/DataViewer/Kanban/` → `v2/module/leads/kanban/` (or keep as shared if other modules use it)
- [ ] Move `UiComponents/client-page/` → `v2/module/leads/client/`
- [ ] Update all `useDataFetcher('shared/client-leads...')` calls → use v2 API with `v2/leads` endpoint
- [ ] Update all `handleRequestSubmit()` calls to use v2 paths
- [ ] Update all `getData()` calls to use v2 lib version
- [ ] Update endpoint URLs: `shared/client-leads/*` → `v2/leads/*`
- [ ] Update client endpoints: route TBD based on backend convention
- [ ] Update all dashboard page routes to import from `v2/module/leads/`
- [ ] Update `src/app/booking/page.jsx` lead references if any
- [ ] Test: lead CRUD, assignment, conversion, kanban drag, notes, meetings, calls, files, price offers, bulk convert

### Dependencies

- Notifications module (Phase 3)
- Calendar module (Phase 6 — for meeting/call reminders, but can work via legacy temporarily)
- Finance module (Phase 8 — for payments, but can work via legacy temporarily)
- Telegram integration (can stay legacy for now)

---

## Phase 5 — Projects & Tasks

> Depend on leads and contracts. Projects are created from contracts.

### Prerequisites

- [ ] Phase 4 (Leads) — projects linked to leads
- [ ] Contracts don't need to be done yet — can reference legacy

### Backend Legacy

**Projects:**

- `routes/shared/projects.js` (~80 lines)
- `services/main/shared/projectServices.js` (~300 lines)

**Tasks:**

- `routes/shared/tasks.js` (~75 lines)
- `services/main/shared/taskServices.js` (~150 lines)

**What's bad:**

1. Project service calls `contractServices.js` for payment creation — cross-module coupling
2. Auto-assignment logic is complex designer assignment
3. Role-based filtering in route handler instead of usecase
4. Task finalization triggers notification — mixed concerns

### Frontend Legacy

**Projects in `UiComponents/DataViewer/work-stages/projects/`:**

- `ProjectsList.jsx` — list all projects (`admin/projects`, `search?model=clientLead`)
- `LeadProjects.jsx` — projects for lead (`shared/projects?clientLeadId=...`)
- `ProjectPage.jsx` — project detail (`shared/projects/{id}`)
- `ProjectDetails.jsx` — metadata viewer
- `AssignDesignerModal.jsx` — assign designer (`admin/all-users?role=...`)
- `ProjectGroupMultiSelector.jsx` — project groups
- `ArchivedProjects.jsx` — archived list
- `CreateNewProjectsGroup.jsx` — create group

**Tasks in `UiComponents/DataViewer/tasks/`:**

- `TasksList.jsx` — task list (`shared/tasks?projectId=...`)
- `TaskDetails.jsx` — task detail (`shared/tasks/{id}`)
- `TaskActions.jsx` — actions

**Work stages:**

- `UiComponents/DataViewer/work-stages/WorkStageKanban.jsx`
- `UiComponents/DataViewer/work-stages/PreviewWorkStage.jsx`

**Delivery:**

- `UiComponents/DataViewer/work-stages/utility/ProjectDeilverySchedule.jsx` — delivery timeline (`shared/delivery/{projectId}/schedules`)

### Backend Checklist

- [ ] Create `v2/modules/projects/` — repo, usecase, dto, validation, controller, routes
- [ ] Create `v2/modules/tasks/` — repo, usecase, validation, controller, routes
- [ ] Move role-based filtering from route → `projects.usecase.js`
- [ ] Decouple project creation from contract service
- [ ] Mount in `v2/routes.js`

### Frontend Checklist

- [ ] Create `v2/module/projects/` — move `work-stages/projects/*`
- [ ] Create `v2/module/tasks/` — move `DataViewer/tasks/*`
- [ ] Move `work-stages/WorkStageKanban.jsx`, `PreviewWorkStage.jsx` → `v2/module/projects/`
- [ ] Move `work-stages/utility/ProjectDeilverySchedule.jsx` → `v2/module/projects/` or `v2/module/delivery/`
- [ ] Update endpoints: `shared/projects/*` → `v2/projects/*`, `shared/tasks/*` → `v2/tasks/*`
- [ ] Update all imports across dashboard pages
- [ ] Test: project list, detail, assignment, tasks CRUD, kanban, delivery schedule

### Dependencies

- Leads module (Phase 4)
- Contracts module (Phase 7 — project creation from contract, can use legacy temporarily)
- Notifications (Phase 3)

---

## Phase 6 — Calendar & Meetings

> Public booking, staff calendar, Google Calendar integration.

### Prerequisites

- [ ] Phase 0 shared foundation

### Backend Legacy

**Routes (5 files — messy):**

- `routes/calendar/calendar.js` (~80 lines)
- `routes/calendar/new-calendar.js` (~250 lines) — **service file in routes folder!**
- `routes/calendar/client-calendar.js` (~90 lines) — public booking
- `routes/calendar/google.js` (~100 lines) — Google Calendar OAuth
- `routes/calendar/old-call.js` (~60 lines) — **legacy, likely unused**

**Services:**

- `services/main/calendar/calendarServices.js` (~250 lines)
- `services/main/calendar/googleCalendar.js` (~100 lines)

**What's bad:**

1. `new-calendar.js` is a SERVICE file placed in the ROUTES folder
2. `old-call.js` is dead code still mounted
3. Call/meeting reminders are in `staffServices.js`, not calendar
4. Heavy timezone handling with mixed date libs

### Frontend Legacy

**Public booking:**

- `src/app/booking/page.jsx` — wrapper
- `UiComponents/DataViewer/meeting/calendar/ClientBooking.jsx` — step-by-step wizard
  - `client/calendar/slots?date=&token=&timezone=`
  - `client/calendar/timezones`
  - `client/calendar/slots/details?slotId=&token=&timezone=`
  - `client/calendar/meeting-data?token=&timezone=`

**Admin calendar:**

- `meeting/calendar/AdminCalendar.jsx`
- `meeting/calendar/BigCalendar.jsx` — month/day view (`shared/calendar-management/dates/day`, `dates/month`)
- `meeting/calendar/Calendar.jsx` — slot management (`shared/calendar-management/slots`)
- `meeting/calendar/StaffCalendar.jsx`
- `meeting/calendar/Old-cal.jsx` — **legacy, likely unused**

**Questions (SPAIN/VERSA) — used during meetings:**

- `meeting/SPAIN/SPAINQuestionDialog.jsx` — questionnaire (`shared/questions/question-types/{leadId}`)
- `meeting/VERSA/VERSADialog.jsx` — VERSA questionnaire (`shared/questions/versa/{leadId}`)

### Backend Checklist

- [ ] Create `v2/modules/calendar/` — repo, usecase, validation, controller, routes
- [ ] Move `new-calendar.js` logic → `calendar.usecase.js`
- [ ] Create `calendar/google-calendar.js` — consolidate Google OAuth
- [ ] Create `calendar/client/` — public booking
- [ ] Move call/meeting reminder creation from `staffServices.js` → `calendar.usecase.js`
- [ ] Delete `old-call.js`
- [ ] Mount in `v2/routes.js`

### Frontend Checklist

- [ ] Create `v2/module/calendar/` — move `meeting/calendar/*`
- [ ] Create `v2/module/questions/` — move `meeting/SPAIN/*` and `meeting/VERSA/*`
- [ ] Update booking page to import from `v2/module/calendar/`
- [ ] Update endpoints: `client/calendar/*` → `v2/calendar/client/*`, `shared/calendar-management/*` → `v2/calendar/*`
- [ ] Delete `Old-cal.jsx` (legacy)
- [ ] Update all dashboard calendar page routes
- [ ] Test: public booking flow, admin calendar, slot management, SPAIN/VERSA questionnaires

### Dependencies

- Leads module (reminders linked to leads)
- Google OAuth credentials

---

## Phase 7 — Contracts

> Complex module with PDF generation. Depends on leads, creates projects.

### Prerequisites

- [ ] Phase 4 (Leads) — contracts linked to leads
- [ ] Backend: `v2/infra/pdf/pdf-utils.js` — move from `services/utilityServices.js`
- [ ] Backend: PDF queue must work with v2 (`v2/jobs/queues/pdf.queue.js`)

### Backend Legacy

**Routes:**

- `routes/contract/contracts.js` (~120 lines)
- `routes/contract/client-contract.js` (~40 lines)

**Services (7 files, ~1,200 lines):**

- `contractServices.js` (~300 lines)
- `generateContractPdf.js` (~500 lines) — PDF builder
- `clientContractServices.js` (~50 lines)
- `generateDefaultContractData.js`, `pdf-utilities.js`, `rules.js`, `wittenBlocksData.js`

**What's bad:**

1. PDF generation is 500+ lines with heavy RTL/Arabic text handling
2. Contract creation calls project creation AND telegram notification — mixed concerns
3. Payment condition logic tightly coupled to contract stage creation

### Frontend Legacy

**Components in `UiComponents/DataViewer/contracts/`:**

- `ContractsList.jsx` — contracts for lead (`shared/contracts/client-lead/{leadId}`)
- `ViewContract.jsx` — full view/edit (`shared/contracts/{id}`, payments, stages)
- `CreateContract.jsx` — multi-step creation
- `CloneContract.jsx` — clone template
- `ContractUtilityPage/ContractUtility.jsx` — admin config (`shared/site-utilities/contract-utility/*`)

**Payments in `contracts/payments/`:**

- `PaymentsPage.jsx` — all payments (`shared/contracts/payments/all`)
- `AddPaymentDialog.jsx`, `SelectPaymentCondition.jsx`

**Shared in `contracts/shared/`:**

- `PaymentsEditor.jsx`, `PaymentsRulesEditor.jsx`, `StagesSelector.jsx`, `SpecialItemsEditor.jsx`, `ContractDrawingsEditor.jsx`, `ProjectGroupSelect.jsx`, `contractHelpers.js`

**Client in `contracts/client/`:**

- `ClientContractPage.jsx` — signing interface (`client/contracts/session`)
- `ContractSession.jsx`, `ContractSignature.jsx`, `ContractSignedSuccessSection.jsx`
- `helpers.js`, `wittenBlocksData.js`

**Public page:**

- `src/app/contracts/page.jsx`

### Backend Checklist

- [ ] Create `v2/modules/contracts/` — repo, usecase, dto, validation, controller, routes
- [ ] Create `contracts.pdf.js` — move PDF generation (500+ lines)
- [ ] Merge `rules.js`, `wittenBlocksData.js`, `generateDefaultContractData.js` → `contracts.dto.js`
- [ ] Create `contracts/client/` — public signing
- [ ] Decouple contract creation from project creation and telegram
- [ ] Move PDF queue to `v2/jobs/queues/pdf.queue.js`
- [ ] Create `v2/infra/pdf/pdf-utils.js` — font/image/text utils
- [ ] Mount in `v2/routes.js`

### Frontend Checklist

- [ ] Create `v2/module/contracts/` — move `DataViewer/contracts/*` (keep subdirectory structure)
- [ ] Move `contracts/client/` → `v2/module/contracts/client/`
- [ ] Move `contracts/shared/` → `v2/module/contracts/shared/`
- [ ] Move `contracts/payments/` → `v2/module/contracts/payments/`
- [ ] Update endpoints: `shared/contracts/*` → `v2/contracts/*`
- [ ] Update client endpoints: `client/contracts/*` → `v2/contracts/client/*`
- [ ] Update site-utilities endpoints: `shared/site-utilities/contract-utility/*` → `v2/site-config/*`
- [ ] Update `src/app/contracts/page.jsx` to import from v2
- [ ] Test: contract CRUD, PDF generation, payment management, client signing, clone

### Dependencies

- Leads module (Phase 4)
- Projects module (Phase 5 — contract creates project)
- Site Config (for contract templates — can use legacy temporarily)
- PDF queue/worker

---

## Phase 8 — Finance / Accountant

> Payments, salaries, rents, expenses. Depends on leads and contracts.

### Prerequisites

- [ ] Phase 4 (Leads) — payments linked to leads
- [ ] Phase 7 (Contracts) — payment conditions from contracts

### Backend Legacy

**Routes:**

- `routes/accountant/accountant.js` (~200+ lines, FAT)
- `routes/client/payments.js` — Stripe checkout

**Services:**

- `services/main/accountant/accountantServices.js` (~150 lines)
- `services/main/shared/paymentServices.js` (~150 lines)
- `services/main/client/payments.js` (~120 lines) — Stripe

**What's bad:**

1. `accountant.js` is FAT — payments, salaries, rents, expenses, receipts
2. Stripe scattered across multiple files
3. Complex payment filtering in route handler

### Frontend Legacy

**Components in `UiComponents/DataViewer/accountant/`:**

- `Salaries.jsx` — salary management (`accountant/users`)
- `SalaryDialog.jsx` — salary detail (`accountant/salaries/data?userId=&startDate=`)
- `MonthlySalaryDialog.jsx` — monthly calc (`accountant/users/{userId}/last-seen`)
- `Rents.jsx` — rent tracking (`accountant/rents`)
- `OperationalExpenses.jsx` — expenses (`accountant/operational-expenses`)
- `Outcome.jsx` — expenses view (`accountant/outcome`)
- `IncomeOutComeSummary.jsx` — financial summary (`accountant/summary`)
- `Notes.jsx` — financial notes
- `payments/PaymentsCalendar.jsx` — payment tracking (`accountant/payments?`, invoices, status)
- `payments/OverduePayments.jsx` — overdue view

**Kanban:**

- `Kanban/accountant/AccountantKanbanBoard.jsx` — drag-drop payment status (`accountant/payments/status/{id}`)

**Dashboard pages (7):**

- `@accountant/page.jsx`, `payments/paid/page.jsx`, `payments/overdue/page.jsx`, `salaries/page.jsx`, `rents/page.jsx`, `operational-expenses/page.jsx`, `outcome/page.jsx`

### Backend Checklist

- [ ] Create `v2/modules/finance/` — repo, usecase, dto, validation, controller, routes
- [ ] Create `finance/stripe.js` — consolidate Stripe
- [ ] Create `finance/client/` — public Stripe checkout
- [ ] Extract admin commission from `admin.js` → `finance.usecase.js`
- [ ] Mount in `v2/routes.js`

### Frontend Checklist

- [ ] Create `v2/module/finance/` — move `DataViewer/accountant/*`
- [ ] Move `Kanban/accountant/` → `v2/module/finance/kanban/`
- [ ] Update endpoints: `accountant/*` → `v2/finance/*`
- [ ] Update all dashboard accountant pages to import from v2
- [ ] Test: payments CRUD, salary management, rents, expenses, kanban, overdue tracking

### Dependencies

- Leads (Phase 4)
- Contracts (Phase 7)
- Notifications (Phase 3)
- Stripe SDK

---

## Phase 9 — Users & Admin

> Admin user management. The admin route is a monolith that needs decomposition.

### Prerequisites

- [ ] Phases 4, 7, 8 — admin actions distribute to domain modules

### Backend Legacy

**Routes:**

- `routes/admin/admin.js` (~200+ lines, FAT monolith)
- `routes/staff/staff.js` (~25 lines — only 1 endpoint)

**Services:**

- `services/main/admin/adminServices.js` (~200 lines)
- `services/main/staff/staffServices.js` (~300 lines)

**What's bad:**

1. Admin route is a monolith: user CRUD, lead import, commissions, telegram, reports
2. Staff services contain logic that belongs to other modules (notes, reminders)

### Frontend Legacy

**Components in `UiComponents/DataViewer/users/`:**

- `UserProfile.jsx` — user profile (`admin/users/{id}/profile`)
- `UserRoles.jsx` — role management (`shared/utilities/roles`)
- `UserLogs.jsx`, `UserRestrictedCountries.jsx`, `ProjectAutoAssignmentDialog.jsx`, `RoleManagerDialog.jsx`, `UserAutoAssignments.jsx`
- `profile/ProfileDialog.jsx` — profile view (`shared/users/{userId}/profile`)

**Other:**

- `UiComponents/pages/UsersPage.jsx` — main users listing
- `UiComponents/DataViewer/utility/Commission.jsx` — commission management (`admin/commissions?userId=`)

### Backend Checklist

- [ ] Create `v2/modules/users/` — repo, usecase, dto, validation, controller, routes
- [ ] Create `v2/modules/profile/` — repo, usecase, controller, routes
- [ ] Distribute admin actions to domain modules (lead import → leads, commissions → finance, etc.)
- [ ] Move `staffServices.js` logic to calendar/leads modules
- [ ] Delete `routes/staff/staff.js` after redistribution
- [ ] Mount in `v2/routes.js`

### Frontend Checklist

- [ ] Create `v2/module/users/` — move `DataViewer/users/*`
- [ ] Move `pages/UsersPage.jsx` → `v2/module/users/`
- [ ] Move `utility/Commission.jsx` → `v2/module/finance/` (commission is finance)
- [ ] Update endpoints: `admin/users/*` → `v2/users/*`, `admin/commissions` → `v2/finance/commissions`
- [ ] Update all dashboard admin pages
- [ ] Test: user CRUD, role management, auto-assignments, restricted countries

### Dependencies

- Auth (✅ done)
- Domain modules for distributed admin actions

---

## Phase 10 — Dashboard

> Analytics and KPIs. Depends on data from most modules.

### Prerequisites

- [ ] Leads, Projects, Finance modules done (provides data)

### Backend Legacy

- `routes/shared/dashboard.js` (~85 lines, 6 endpoints)
- `services/main/shared/dashboardServices.js` (~200 lines)

### Frontend Legacy

**Components in `UiComponents/DataViewer/dashbaord/` (note typo in folder name):**

- `Dashboard.jsx` — main dashboard (`shared/utilities/users/role/{staffId}`)
- `KeyMetricsCard.jsx` — KPI cards (`shared/dashboard/key-metrics`)
- `LeadStatusChart.jsx` — charts (`shared/dashboard/leads-status`)
- `LeadsMonthlyOverviewSingle.jsx` — monthly overview
- `IncomeOverTimeChart.jsx` — income trends (`shared/dashboard/monthly-performance`)
- `PerformanceMetrics.jsx` — weekly metrics
- `EmiratesAnalytics.jsx` — UAE analytics
- `RecenteActivity.jsx` — recent activities
- `CallRemindersList.jsx` — call reminders (`staff/dashboard/latest-calls`)
- `NewLeadsList.jsx` — latest leads

**Designer dashboard:**

- `dashbaord/designers/DesignerDashboard.jsx`, `DesignerMatricsCard.jsx`, `ProjectList.jsx`

### Backend Checklist

- [ ] Create `v2/modules/dashboard/` — repo, usecase, controller, routes
- [ ] Move staff filtering from controller → usecase
- [ ] Mount in `v2/routes.js`

### Frontend Checklist

- [ ] Create `v2/module/dashboard/` — move `DataViewer/dashbaord/*` (fix typo in folder name!)
- [ ] Update endpoints: `shared/dashboard/*` → `v2/dashboard/*`
- [ ] Update `staff/dashboard/latest-calls` → `v2/dashboard/latest-calls` or `v2/calendar/latest-calls`
- [ ] Update all role-based dashboard pages to import from v2
- [ ] Test: all dashboard views per role (admin, staff, designer, accountant)

### Dependencies

- All CRM modules (provides data for KPIs)

---

## Phase 11 — Image Sessions

> Design image management. Client-facing gallery + admin management.

### Prerequisites

- [ ] Phase 4 (Leads) — sessions linked to leads
- [ ] Backend: PDF infrastructure for session PDFs

### Backend Legacy

- `routes/image-session/` — 3 files (staff, admin, client) + `routes/client/image-session.js`
- `services/main/image-session/imageSessionSevices.js` (typo!), `clientImageServices.js`
- `services/main/client/clientServices.js` (~400 lines — PDF gen)

### Frontend Legacy

**Admin in `DataViewer/image-session/admin/`:**

- `AdminGallery.jsx`, `shared/Templates.jsx`, `shared/ProsAndCons.jsx`, `shared/ImageItemViewer.jsx`
- Subdirs: `color/`, `image/`, `material/`, `page-info/`, `space/`, `style/`

**Client in `image-session/client-session/`:**

- `ClientImageSelection.jsx` — main interface (`client/image-session/session?token=`)
- `Images.jsx`, `Styles.jsx`, `ColorPalletes.jsx`, `Materials.jsx`, `PageInfo.jsx`, `SelectedImages.jsx`, `SignatureComponet.jsx`

**Users:**

- `image-session/users/ClientSessionImageManager.jsx` — manage sessions

**Page:**

- `src/app/image-session/page.jsx`

### Backend Checklist

- [ ] Create `v2/modules/image-sessions/` — repo, usecase, validation, controller, routes
- [ ] Create `image-sessions.pdf.js` — move PDF gen from `clientServices.js`
- [ ] Create `image-sessions/client/` — public session
- [ ] Mount in `v2/routes.js`

### Frontend Checklist

- [ ] Create `v2/module/image-sessions/` — move `DataViewer/image-session/*`
- [ ] Update endpoints: `admin/image-session/*` → `v2/image-sessions/*`, `client/image-session/*` → `v2/image-sessions/client/*`
- [ ] Update `src/app/image-session/page.jsx` to import from v2
- [ ] Test: admin gallery management, client selection flow, PDF generation

### Dependencies

- Leads (Phase 4)
- PDF queue/worker

---

## Phase 12 — Courses

> Course management with tests and homework.

### Prerequisites

- [ ] Phase 0 shared foundation

### Backend Legacy

- `routes/courses/adminCourses.js` (~200+ lines)
- `routes/courses/staffCourses.js` (~150 lines)
- `services/main/courses/adminCourseServices.js` (~250 lines)
- `services/main/courses/staffCoursesServices.js` (~200 lines)

### Frontend Legacy

- Dashboard pages under `@admin/courses/` and `@staff/courses/`
- Course components (to be identified during implementation)

### Backend Checklist

- [ ] Create `v2/modules/courses/` — repo, usecase, dto, validation, controller, routes
- [ ] Merge admin + staff logic with role-based middleware
- [ ] Mount in `v2/routes.js`

### Frontend Checklist

- [ ] Create `v2/module/courses/` — move course-related components
- [ ] Update endpoints
- [ ] Test: course CRUD, lessons, tests, homework

### Dependencies

- Auth middleware
- Notifications (Phase 3)

---

## Phase 13 — Small Modules

> Questions/VERSA, Sales Stages, Updates, Delivery, Profile, Google Reviews, Site Config, Drive/Uploads. Small and can be batched.

### Questions / VERSA

**Backend:** `routes/questions/questions.js`, `services/main/shared-questions/shared-questions.js`
**Frontend:** `meeting/SPAIN/`, `meeting/VERSA/` (already moved with Calendar in Phase 6)

- [ ] Backend: Create `v2/modules/questions/` — repo, usecase, validation, controller, routes
- [ ] Frontend: Verify `v2/module/questions/` from Phase 6 covers all

### Sales Stages

**Backend:** `routes/shared/sales-stages.js` (~35 lines), `services/main/shared/salesStageServices.js` (~45 lines)
**Frontend:** `leads/tabs/SalesStage.jsx` (part of leads module)

- [ ] Backend: Create `v2/modules/sales-stages/` — repo, usecase, routes
- [ ] Frontend: Update endpoint in leads SalesStage tab

### Updates

**Backend:** `routes/shared/updates.js` (~85 lines), `services/main/shared/updateServices.js` (~150 lines)
**Frontend:** `leads/leadUpdates/` (5 files, part of leads module)

- [ ] Backend: Create `v2/modules/updates/` — repo, usecase, routes
- [ ] Frontend: Update endpoint in leads update tabs

### Delivery

**Backend:** `routes/shared/delivery.js` (~55 lines), `services/main/shared/deliveryServices.js` (~100 lines)
**Frontend:** `work-stages/utility/ProjectDeilverySchedule.jsx` (moved with Projects in Phase 5)

- [ ] Backend: Create `v2/modules/delivery/` — repo, usecase, routes
- [ ] Frontend: Update endpoint in delivery schedule component

### Profile

**Backend:** `routes/shared/users.js` (~25 lines), `services/main/shared/userProfile.js` (~15 lines)
**Frontend:** `users/profile/ProfileDialog.jsx`

- [ ] Backend: Create `v2/modules/profile/` — repo, usecase, routes
- [ ] Frontend: Update endpoint in profile dialog

### Google Reviews

**Backend:** `routes/shared/reviews.js` (~30 lines), `services/reviews.js` (~50 lines)

- [ ] Backend: Move to `v2/infra/google/reviews.js` or thin `v2/modules/reviews/`
- [ ] Frontend: Update endpoint if consumed

### Site Config

**Backend:** `routes/site-utilities/siteUtility.js`, `contract-utilities.js`, `services/main/site-utilities/siteUtilityServices.js`
**Frontend:** `contracts/ContractUtilityPage/ContractUtility.jsx`

- [ ] Backend: Create `v2/modules/site-config/` — repo, usecase, routes
- [ ] Frontend: Update endpoints: `shared/site-utilities/*` → `v2/site-config/*`

### Drive / Uploads

**Backend:** Upload logic scattered across `routes/utility/utility.js`, `routes/client/uploads.js`, `services/drive.js`, `services/main/utility/uploadAsChunk.js`
**Frontend:** `helpers/functions/uploadAsChunk.js`, `formComponents/MulitFileInput.jsx`, `SimpleFileInput.jsx`, `UploadImageWithAvatarPreview.jsx`

- [ ] Backend: Create `v2/modules/drive/` — routes, controller, usecase
- [ ] Backend: Create `v2/infra/upload/` — multer, chunk-upload, ftp (if not done in Phase 2)
- [ ] Frontend: Update `uploadAsChunk.js` endpoint URLs
- [ ] Frontend: Move `uploadAsChunk.js` → `v2/lib/upload/uploadAsChunk.js`

---

## Phase 14 — Cleanup & Cutover

> Remove all legacy code. Switch entry points.

### Backend

- [ ] Update `index.js` or replace with `v2/server.js`
- [ ] Remove all legacy `routes/` files
- [ ] Remove all legacy `services/` files
- [ ] Remove root-level scheduler files (`tele-cron.js`, `reminderScheduler.js`, `projectDeliveryTimeReminder.js`)
- [ ] Remove `prisma/prisma.js` (use `v2/infra/prisma/prisma.js`)
- [ ] Final route URL audit
- [ ] Update deployment scripts

### Frontend

- [ ] Remove all legacy `UiComponents/DataViewer/` components (replaced by v2/module/)
- [ ] Remove legacy `helpers/functions/getData.js`, `handleSubmit.js`, `getDataAndSet.js` (replaced by v2/lib/api/)
- [ ] Remove legacy `helpers/hooks/useDataFetcher.js` (replaced by v2 version)
- [ ] Remove legacy `providers/` that have v2 replacements
- [ ] Remove legacy `UiComponents/client-page/` (moved to v2/module/leads/client/)
- [ ] Remove legacy `UiComponents/formComponents/` that have v2 replacements
- [ ] Verify all pages import from `v2/module/*`
- [ ] Final regression test across all roles
- [ ] Verify RTL/Arabic works in all migrated components

---

## Master Checklist

### Foundation

- [ ] Backend shared infra (Phase 0)
- [ ] Frontend shared infra (Phase 0)
- [ ] Auth verified (Phase 1 ✅)

### Modules (in dependency order)

- [ ] Chat — backend module + socket extraction + frontend migration (Phase 2)
- [ ] Notifications — backend module + frontend migration (Phase 3)
- [ ] Leads — backend module + frontend migration (Phase 4)
- [ ] Projects & Tasks — backend + frontend (Phase 5)
- [ ] Calendar & Meetings — backend + frontend (Phase 6)
- [ ] Contracts — backend + frontend (Phase 7)
- [ ] Finance / Accountant — backend + frontend (Phase 8)
- [ ] Users & Admin — backend + frontend (Phase 9)
- [ ] Dashboard — backend + frontend (Phase 10)
- [ ] Image Sessions — backend + frontend (Phase 11)
- [ ] Courses — backend + frontend (Phase 12)
- [ ] Small modules batch (Phase 13)

### Cleanup

- [ ] Remove all legacy backend code (Phase 14)
- [ ] Remove all legacy frontend code (Phase 14)
- [ ] Final regression test (Phase 14)
- [ ] Update deployment (Phase 14)

---

## Dependency Graph

```
Auth (✅ done)
  └── Everything depends on auth

Phase 0: Shared Foundation
  └── Everything depends on this

Phase 2: Chat (standalone, needs socket extraction for chat only)
Phase 3: Notifications (standalone, needed by most modules)

Phase 4: Leads ← depends on Notifications
Phase 5: Projects & Tasks ← depends on Leads
Phase 6: Calendar ← can be parallel with Phase 5

Phase 7: Contracts ← depends on Leads
Phase 8: Finance ← depends on Leads, Contracts

Phase 9: Users ← depends on domain modules being done
Phase 10: Dashboard ← depends on most modules

Phase 11-13: Can happen in any order after Phase 4
Phase 14: After everything else
```

---

## URL Migration Reference

| Old URL                           | New URL                       | Module         |
| --------------------------------- | ----------------------------- | -------------- |
| `/auth/*`                         | `/v2/auth/*`                  | ✅ Auth        |
| `/shared/chat/*`                  | `/v2/chat/*`                  | Chat           |
| `/client/chat/*`                  | `/v2/chat/client/*`           | Chat           |
| `/shared/client-leads/*`          | `/v2/leads/*`                 | Leads          |
| `/client/leads/*`                 | `/v2/leads/client/*`          | Leads          |
| `/shared/projects/*`              | `/v2/projects/*`              | Projects       |
| `/shared/tasks/*`                 | `/v2/tasks/*`                 | Tasks          |
| `/shared/calendar-management/*`   | `/v2/calendar/*`              | Calendar       |
| `/client/calendar/*`              | `/v2/calendar/client/*`       | Calendar       |
| `/shared/contracts/*`             | `/v2/contracts/*`             | Contracts      |
| `/client/contracts/*`             | `/v2/contracts/client/*`      | Contracts      |
| `/accountant/*`                   | `/v2/finance/*`               | Finance        |
| `/client/payments/*`              | `/v2/finance/client/*`        | Finance        |
| `/admin/users/*`                  | `/v2/users/*`                 | Users          |
| `/shared/dashboard/*`             | `/v2/dashboard/*`             | Dashboard      |
| `/shared/image-session/*`         | `/v2/image-sessions/*`        | Image Sessions |
| `/admin/image-session/*`          | `/v2/image-sessions/*`        | Image Sessions |
| `/client/image-session/*`         | `/v2/image-sessions/client/*` | Image Sessions |
| `/admin/courses/*`                | `/v2/courses/*`               | Courses        |
| `/shared/courses/*`               | `/v2/courses/*`               | Courses        |
| `/shared/questions/*`             | `/v2/questions/*`             | Questions      |
| `/shared/utilities/notifications` | `/v2/notifications`           | Notifications  |
| `/utility/upload-chunk`           | `/v2/drive/upload-chunk`      | Drive          |
| `/shared/delivery/*`              | `/v2/delivery/*`              | Delivery       |
| `/shared/sales-stages/*`          | `/v2/sales-stages/*`          | Sales Stages   |
| `/shared/site-utilities/*`        | `/v2/site-config/*`           | Site Config    |
| `/staff/dashboard/*`              | `/v2/dashboard/*`             | Dashboard      |

---

## Frontend Old → New File Index

| Old Location                                 | New Location                                    | Phase |
| -------------------------------------------- | ----------------------------------------------- | ----- |
| `UiComponents/DataViewer/chat/`              | `v2/module/chat/`                               | 2     |
| `providers/SocketProvider.jsx`               | `v2/providers/SocketProvider.jsx` (or keep)     | 2     |
| `UiComponents/DataViewer/Logs.jsx`           | `v2/module/notifications/`                      | 3     |
| `UiComponents/DataViewer/leads/`             | `v2/module/leads/`                              | 4     |
| `UiComponents/DataViewer/Kanban/`            | `v2/module/leads/kanban/` (or shared)           | 4     |
| `UiComponents/client-page/`                  | `v2/module/leads/client/`                       | 4     |
| `UiComponents/DataViewer/work-stages/`       | `v2/module/projects/`                           | 5     |
| `UiComponents/DataViewer/tasks/`             | `v2/module/tasks/`                              | 5     |
| `UiComponents/DataViewer/meeting/`           | `v2/module/calendar/` + `v2/module/questions/`  | 6     |
| `UiComponents/DataViewer/contracts/`         | `v2/module/contracts/`                          | 7     |
| `UiComponents/DataViewer/accountant/`        | `v2/module/finance/`                            | 8     |
| `UiComponents/DataViewer/Kanban/accountant/` | `v2/module/finance/kanban/`                     | 8     |
| `UiComponents/DataViewer/users/`             | `v2/module/users/`                              | 9     |
| `UiComponents/pages/UsersPage.jsx`           | `v2/module/users/`                              | 9     |
| `UiComponents/DataViewer/dashbaord/`         | `v2/module/dashboard/`                          | 10    |
| `UiComponents/DataViewer/image-session/`     | `v2/module/image-sessions/`                     | 11    |
| `helpers/functions/getData.js`               | `v2/lib/api/getData.js` (✅ exists)             | 0     |
| `helpers/functions/handleSubmit.js`          | `v2/lib/api/handleRequestSubmit.js` (✅ exists) | 0     |
| `helpers/functions/getDataAndSet.js`         | `v2/lib/api/getDataAndSet.js` (✅ exists)       | 0     |
| `helpers/functions/uploadAsChunk.js`         | `v2/lib/upload/uploadAsChunk.js`                | 2/13  |
| `helpers/hooks/useDataFetcher.js`            | `v2/shared/hooks/useDataFetcher.js`             | 0     |
