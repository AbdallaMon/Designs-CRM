# Frontend → Backend API Inventory

Generated 2026-07-11. A per-feature / per-screen map of **every HTTP endpoint the `web/` frontend calls**, with method, path (as written in code), purpose, and `file:line`. Socket.IO realtime events are excluded (noted where relevant).

---

## How to read this

### Call mechanics
The frontend has one data layer (`web/src/app/helpers/functions/`):

| Call site | HTTP method |
|---|---|
| `getData({ url })`, `getDataAndSet({ url })`, `useDataFetcher(url)`, `apiRequest(path)` | **GET** |
| `handleRequestSubmit(data, setLoading, path, isFileUpload, toastMsg, setRedirect, method)` | **`method` = 7th arg, defaults to `POST`** |
| Shared `CreateModal href=` | POST `${href}` |
| Shared `EditModal href=` / `AdminTable editHref=` | PUT `${href}/${id}` |
| Shared `DeleteModal` | DELETE or PATCH `${href}/${id}` |
| Shared `SearchComponent apiEndpoint=` | GET `utility/${apiEndpoint}` |

### ⚠️ The paths below are LEGACY paths, rewritten to `/v2/…` at runtime
Every request flows through `apiRequest` → `mapLegacyPathToV2` (`web/src/app/helpers/functions/apiPathMap.js`), which rewrites the legacy prefix to its migrated `/v2` module mount, then prepends `API_BASE` (`NEXT_PUBLIC_API`). So the **actual wire path** is `/v2/<mapped>`. Key rewrites:

| Legacy path (in code) | Actual `/v2` path |
|---|---|
| `shared/client-leads…` | `/v2/leads…` |
| `shared/all-related-chat-users` | `/v2/users/related-chat-directory` |
| `shared/all-chat-users` | `/v2/users/chat-directory` |
| `shared/designers…` | `/v2/projects/designers…` |
| `shared/archived-projects` | `/v2/projects/archived` |
| `shared/work-stages/calls` | `/v2/leads/calls` |
| `shared/<anything-else>` | `/v2/<anything-else>` (1:1 — contracts, chat, calendar, projects, dashboard, questions, updates, image-session, tasks, delivery, work-stages, users, sales-stages, site-utilities, …) |
| `accountant/payments/overdue/:id` | `/v2/accounting/payments/:id/actions/mark-overdue` |
| `accountant/payments/pay/:id` | `/v2/accounting/payments/:id/actions/pay` |
| `accountant/payments/status/:id` | `/v2/accounting/payments/:id/actions/change-status` |
| `accountant/…` | `/v2/accounting/…` |
| `utility/…` | `/v2/utilities/…` |
| `admin/all-users` | `/v2/users/all-users` |
| `admin/users…` | `/v2/users…` |
| `admin/image-session…` | `/v2/image-sessions/admin…` |
| `admin/leads`, `admin/model`, `admin/commissions`, `admin/projects`, `admin/new-lead`, `admin/client…` | stay under `/v2/admin…` |
| `client/…`, `auth/…`, `files/…`, `notifications/…`, `command-center/…`, `audit-logs`, `v2/telegram/…` | unchanged (already correct) |

**Exception:** the report pages call `fetch(NEXT_PUBLIC_URL + '/admin/reports/…')` directly — bypassing the adapter (hit the origin path literally, no `/v2`).

### Route → feature map
| Dashboard route | Feature area |
|---|---|
| `/dashboard`, `/dashboard/report`, `/report/staff` | dashboard, reports |
| `/command-center` | command-center |
| `/audit-logs` | audit |
| `/leads`, `/deals`, `/deals/[id]`, `/all-deals`, `/on-hold-deals`, `/archived` | leads |
| `/projects`, `/projects/[id]`, `/projects/grouped/[leadId]`, `/work-stages/*`, `/study`, `/modification`, `/final-plan`, `/quantity` | work-stages, tasks |
| `/tasks/[id]` | tasks |
| `/payments*`, `/salaries`, `/rents`, `/outcome`, `/operational-expenses` | accountant |
| `/chat`, `/chats` | chat |
| `/image-sessions`, `/image-session` | image-session |
| `/contracts` | contracts |
| `/users`, `/users/[id]` | users |
| `/calendar` | meeting |
| `/website-utilities` | website-utilities |
| `/notifications` | shared (Logs) |
| `/booking`, `/` (public) | booking-lead, client-page |

---

# 1. Auth / Session / Shared infrastructure

## Auth / Login / Reset / Session
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| POST | auth/login | Log in (then refetchMe) | app/(auth)/(auth-group)/login/page.jsx:18 |
| POST | auth/logout | Log out, clear user | shared/components/buttons/Logout.jsx:17 |
| POST | auth/request-password-reset | Request password-reset email | app/(auth)/(auth-group)/reset/ResetPage.jsx:22 |
| POST | auth/reset-password | Set new password (with token) | app/(auth)/(auth-group)/reset/ResetPage.jsx:22 |
| GET | auth/me | Session: user + permissions + permissionsByModule + navigationTabs + profiles | app/providers/AuthProvider.jsx:28 |
| POST | auth/refresh | Silent token refresh on 401 (single in-flight, retries once) | app/helpers/functions/apiClient.js:27 |

> The dashboard sidebar (`app/(auth)/dashboard/(dashboard)/layout.jsx`) is built entirely from `user.navigationTabs` from `auth/me` — no separate nav call.

## Notifications
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | notifications/unread | Unread notifications (bell badge) | shared/components/utility/NotificationIcon.jsx:42 |
| POST | notifications/actions/mark-read | Mark all read on menu open | shared/components/utility/NotificationIcon.jsx:77 |
| GET | notifications | Paginated notifications page (`staffId` filter) | shared/components/Logs.jsx:44 |

## Shared components (dynamic — path supplied by caller)
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | utility/${apiEndpoint}&query=&filters= | Autocomplete search (caller supplies `apiEndpoint`, e.g. `search?model=client`) | shared/components/formComponents/SearchComponent.jsx:34 |
| GET | ${slug}/notes?idKey=&id= | Fetch notes for an entity (`slug` default "accountant"; also `client/notes`) | shared/components/common/Notes.jsx:65 |
| POST | ${slug}/notes | Create a note (+ optional attachment) | shared/components/common/Notes.jsx:108 |
| POST | files/chunks | Upload 1 MB file chunk (staff/internal) | app/helpers/functions/uploadAsChunk.js:31 |
| POST | files/client/chunks | Upload 1 MB file chunk (client-facing) | app/helpers/functions/uploadAsChunk.js:31 |
| GET | admin/users/${userId}/last-seen?month=&year= | User last-seen + monthly logs (default) | shared/components/buttons/LastSeen.jsx:55 |
| GET | accountant/users/${userId}/last-seen?month=&year= | Same, accountant variant | shared/components/buttons/LastSeen.jsx:54 |
| GET | client/languages | Available languages | app/helpers/hooks/useLanguage.js:10 |
| POST | ${href} | Generic CreateModal | shared/components/models/CreateModal.jsx:40 |
| PUT | ${href}/${item.id} | Generic EditModal | shared/components/models/EditModal.jsx:43 |
| DELETE/PATCH | ${href}/${item.id} | Generic DeleteModal (delete / archive) | shared/components/models/DeleteModal.jsx:37 |
| DELETE | ${endpoint}/${item.id} (default `shared/delete`) | Generic soft-delete button | shared/components/common/DeleteModelButton.jsx:62 |
| PUT | ${path} | Inline single-field edit | shared/components/common/EditFieldButton.jsx:35 |
| Socket.IO | NEXT_PUBLIC_URL (userId/clientId) | Live socket; emits online status; feeds NotificationIcon | app/providers/SocketProvider.jsx:22 |

---

# 2. Dashboard / Reports

## Dashboard — shell & widgets (all GET / read-only)
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | shared/utilities/users/role/${staffId} | Resolve viewed staff's role (designer vs sales variant) | features/dashboard/Dashboard.jsx:27 |
| GET | shared/dashboard/key-metrics?${extra}&${profile} | Key financial + lead-status KPIs | features/dashboard/KeyMetricsCard.jsx:191 |
| GET | shared/dashboard/leads-monthly-overview?${params} | Monthly leads overview (in/out UAE, sources) | features/dashboard/LeadsMonthlyOverviewSingle.jsx:104 |
| GET | shared/dashboard/leads-status?${extra} | Lead-status distribution (bar chart) | features/dashboard/LeadStatusChart.jsx:58 |
| GET | shared/dashboard/recent-activities?${extra} | Recent activity feed | features/dashboard/RecentActivity.jsx:20 |
| GET | shared/dashboard/week-performance?${extra} | Weekly activity metrics | features/dashboard/PerformanceMetrics.jsx:29 |
| GET | shared/dashboard/latest-leads | "New Leads" widget | features/dashboard/NewLeadsList.jsx:13 |
| GET | shared/dashboard/monthly-performance?${extra} | Monthly performance bar chart | features/dashboard/IncomeOverTimeChart.jsx:26 |
| GET | shared/dashboard/emirates-analytics?${extra} | Regional performance analytics | features/dashboard/EmiratesAnalytics.jsx:83 |
| GET | staff/dashboard/latest-calls?staffId=${user.id} | Upcoming call reminders (staff card) | features/dashboard/CallRemindersList.jsx:15 |
| GET | shared/dashboard/designer-metrics?${extra}&${profile} | Designer KPIs + monthly charts | features/dashboard/designers/DesignerMatricsCard.jsx:113 |
| GET | shared/projects/user-profile/${userId} | A designer's projects (paginated) | features/dashboard/designers/ProjectList.jsx:44 |
| GET | search?model=clientLead | Lead search in designer project filters | features/dashboard/designers/ProjectList.jsx:199 |

## Reports (raw fetch — NOT path-adapted)
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| POST | ${NEXT_PUBLIC_URL}/admin/reports/lead-report | Lead report JSON | report/page.jsx:87 |
| POST | ${NEXT_PUBLIC_URL}/admin/reports/lead-report/excel | Lead report Excel | report/page.jsx:113 |
| POST | ${NEXT_PUBLIC_URL}/admin/reports/lead-report/pdf | Lead report PDF (button commented out) | report/page.jsx:136 |
| POST | ${NEXT_PUBLIC_URL}/admin/reports/staff-report | Staff report JSON | report/staff/page.jsx:62 |
| POST | ${NEXT_PUBLIC_URL}/admin/reports/staff-report/excel | Staff report Excel | report/staff/page.jsx:88 |
| POST | ${NEXT_PUBLIC_URL}/admin/reports/staff-report/pdf | Staff report PDF (button commented out) | report/staff/page.jsx:111 |

## Command Center
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | command-center/overview | Composite hub payload (KPIs, pipeline, capacity, delivery) | features/command-center/CommandCenter.jsx:20 |
| GET | audit-logs (limit=8) | Recent activity panel (reuses audit module) | features/command-center/CommandCenter.jsx:21 |

## Audit
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | audit-logs | Paginated/filterable audit-log table | features/audit/AuditLogTable.jsx:122 |

---

# 3. Leads / Deals

## Lead / Deal detail — core + per-tab reads (LeadDetailsContext)
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | shared/client-leads/${id} | Core lead detail (initial + refetch) | context/LeadDetailsContext.jsx:181 |
| GET | shared/client-leads/${id}/notes | Notes tab | context/LeadDetailsContext.jsx:95 |
| GET | shared/client-leads/${id}/call-reminders | Calls tab | context/LeadDetailsContext.jsx:95 |
| GET | shared/client-leads/${id}/meetings | Meetings tab | context/LeadDetailsContext.jsx:95 |
| GET | shared/client-leads/${id}/files | Files tab | context/LeadDetailsContext.jsx:95 |
| GET | shared/client-leads/${id}/price-offers | Price-offers tab | context/LeadDetailsContext.jsx:95 |
| GET | shared/sales-stages/${id} | Sales-stage tab | context/LeadDetailsContext.jsx:95 |
| GET | shared/client-leads/${id}/cockpit | Sales deal cockpit | context/LeadDetailsContext.jsx:95 |

## Lead list / assignment / status
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | shared/client-leads/summary?staffId= | Deals/leads summary counts | pages/useSummary.js:27 |
| GET | shared/client-leads?assignedOverdue=true | On-hold deals (admin/super) | on-hold-deals/page.jsx:71 |
| GET | shared/client-leads?staffId=${user.id}&assignedOverdue=true | On-hold deals (staff, self) | on-hold-deals/page.jsx:255 |
| GET | admin/all-users?role=STAFF | STAFF users for reassignment | AssignNewStaffModal.jsx:38 |
| PUT | shared/client-leads | Assign / claim lead (create a deal) — 4 call sites | AssignNewStaffModal.jsx:59; core/LeadSliderCard.jsx:50; PreviewLeadDialog.jsx:57; on-hold-deals/page.jsx:263 |
| POST | shared/client-leads/${id}/actions/change-status | Change status / ON_HOLD / finalize | PreviewLeadDialog.jsx:85; widgets/FinalizeModal.jsx:78 |
| POST | admin/leads/update/${id} | "Move to New Leads" (initialConsult) | shared/components/buttons/UpdateInitialConsultLead.jsx:28 |

## Lead detail actions (tabs & dialogs)
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | shared/contracts/${current} | Load contract for finalize flow | widgets/FinalizeModal.jsx:58 |
| PUT | shared/client-leads/update/${lead.id} | Update lead field (personality) | tabs/SalesToolsTabs.jsx:87 |
| POST | shared/sales-stages/${clientLeadId}/actions/set-stage | Advance / go back sales stage | tabs/SalesStage.jsx:61 |
| POST | files/chunks | Chunked upload (cost doc / files) | tabs/ExtraTabs.jsx:167; dialogs/AddFilesDialog.jsx:97 |
| PUT | shared/work-stages/${lead.id}/cost | Save cost-doc URL onto work stage | tabs/ExtraTabs.jsx:176 |
| POST | shared/client-leads/price-offers/change-status | Toggle price offer accepted | tabs/PriceOffers.jsx:211 |
| POST | shared/client-leads/${lead.id}/price-offers | Add price offer | dialogs/PriceOffersDialog.jsx:76 |
| POST | shared/client-leads/${lead.id}/files | Attach file to lead | dialogs/AddFilesDialog.jsx:109 |
| POST | shared/client-leads/${lead.id}/payments | Create payment plan | payments/AddPayments.jsx:118 |
| POST | shared/client-leads/${lead.id}/notes | Create a note | dialogs/NoteDialog.jsx:54 |
| PUT | shared/client-leads/meeting-reminders/${call.id} | Update meeting reminder | dialogs/CallsDialog.jsx:75 |
| PUT | shared/client-leads/call-reminders/${call.id} | Update call reminder | dialogs/CallsDialog.jsx:75 |
| POST | shared/client-leads/${lead.id}/meeting-reminders | Add meeting reminder | dialogs/CallsDialog.jsx:247; NewMeetingDialog.jsx:103 |
| POST | shared/client-leads/${lead.id}/call-reminders | Add call reminder | dialogs/CallsDialog.jsx:247 |
| GET | shared/utilities/users/admins | Admins to assign a meeting | dialogs/NewMeetingDialog.jsx:65; NewClientMeetingDialog.jsx:53 |
| POST | shared/client-leads/${lead.id}/meeting-reminders/token | Client (token) meeting reminder | dialogs/NewClientMeetingDialog.jsx:84 |

## Lead updates (department sharing)
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | shared/updates/${clientLeadId}?type=&department= | List updates (filtered) | leadUpdates/UpdatesList.jsx:34 |
| POST | shared/updates/${clientLeadId}?department= | Create an update | leadUpdates/CreateUpdate.jsx:80 |
| GET | shared/updates/shared-settings/${update.id} | Department-sharing settings | leadUpdates/components/DepartmentManagementModal.jsx:59 |
| POST | shared/updates/${update.id}/actions/authorize | Authorize a department | DepartmentManagementModal.jsx:149 |
| POST | shared/updates/${update.id}/actions/authorize-shared | Revoke a department | DepartmentManagementModal.jsx:149 |
| POST | shared/updates/shared-updates/${id}/actions/archive | Mark shared update done/undone | leadUpdates/components/MarkAsDoneModal.jsx:67 |

---

# 4. Work Stages / Projects / Tasks / Kanban

## Work Stages — dialog, telegram, delivery
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | shared/projects/designers/${id}?type= | Load work-stage lead | work-stages/PreviewWorkStage.jsx:390 |
| POST | shared/designers/${lead.id}/actions/change-status | Change project status (dialog) | work-stages/PreviewWorkStage.jsx:85 |
| POST | admin/leads/update/${lead.id} | Save Telegram link | work-stages/utility/TelegramLink.jsx:38 |
| POST | admin/client-leads/${lead.id}/telegram/new | Create Telegram group | work-stages/utility/TelegramLink.jsx:268 |
| POST | admin/client-leads/${lead.id}/telegram/assign-users | Add users to Telegram channel | work-stages/utility/TelegramLink.jsx:309 |
| GET | shared/delivery/${projectId}/schedules | List delivery schedules | work-stages/utility/ProjectDeliverySchedule.jsx:82 |
| POST | shared/delivery/${deliveryId}/actions/link-meeting | Link meeting to delivery (wired to commented dialog) | ProjectDeliverySchedule.jsx:96 |
| POST | shared/delivery/ | Create delivery time | work-stages/utility/CreateDeliveryDialog.jsx:53 |

## Projects
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | shared/projects/${id} | Fetch a project | work-stages/projects/ProjectPage.jsx:16 |
| POST | shared/designers/${clientLeadId}/actions/change-status | Change project status (details) | work-stages/projects/ProjectDetails.jsx:177 |
| PUT | shared/projects/${project.id} | Save project fields | work-stages/projects/ProjectDetails.jsx:206 |
| GET | shared/projects?clientLeadId= | Grouped projects for a lead | work-stages/projects/LeadProjects.jsx:107 |
| GET | admin/all-users?role=${project.role} | Candidate designers | work-stages/projects/AssignDesignerModal.jsx:44 |
| POST | shared/projects/${project.id}/actions/assign-designer | Assign / remove designer | AssignDesignerModal.jsx:91 |
| POST | admin/projects/create-group | Create project group | work-stages/projects/CreateNewProjectsGroup.jsx:48 |

## Tasks
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | shared/tasks?projectId=&type=&userId=&clientLeadId= | List tasks/modifications | tasks/TasksList.jsx:39 |
| GET | shared/tasks/${id} | Fetch a task | tasks/TaskDetails.jsx:40 |
| POST | shared/tasks | Create task | tasks/CreateTaskModal.jsx:93 |
| PUT | shared/tasks/${task.id} | Update task status/priority | tasks/TaskActions.jsx:65 |

## Kanban
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | shared/projects/designers/columns?skip=&take=&type=&status=&staffId= | Work-stage column page | staff/KanbanColumn.jsx:108 |
| GET | shared/client-leads/columns?status=&skip=&take=&staffId=&type= | Deals/leads column page | staff/KanbanColumn.jsx:111 |
| POST | shared/projects/designers/${l.id}/actions/change-status | Commit drag (work-stage card) | staff/KanbanColumn.jsx:171 |
| POST | shared/client-leads/${l.id}/actions/change-status | Commit drag (deal card) | staff/KanbanColumn.jsx:171 |
| POST | accountant/payments/overdue/${id} | Mark payment overdue | accountant/AccountantKanbanLeadCard.jsx:153 |
| POST | files/single | Upload payment attachment | accountant/AccountantKanbanLeadCard.jsx:181 |
| POST | accountant/payments/pay/${payment.id} | Submit a payment | accountant/AccountantKanbanLeadCard.jsx:293 |
| POST | accountant/payments/status/${payment.id} | Change payment level (accountant landing drag) | _role-landings/AccountantLanding.jsx:17 |
| GET | admin/all-users?role=STAFF | STAFF members (bulk convert) | shared/BulkConvertLeadsModal.jsx:35 |
| PUT | shared/client-leads/bulk-convert | Bulk-reassign leads | shared/BulkConvertLeadsModal.jsx:58 |

---

# 5. Accountant

## Payments
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | accountant/payments?paymentId=&status= | Payments calendar list | payments/PaymentsCalendar.jsx:85 |
| GET | accountant/payments?type=OVERDUE&status=OVERDUE | Overdue payments list | payments/OverduePayments.jsx:27 |
| GET | accountant/payments/${payment.id}/invoices | Payment history / invoices | payments/PaymentsCalendar.jsx:237 |
| POST | accountant/payments/overdue/${id} | Mark overdue | payments/PaymentsCalendar.jsx:118 |
| POST | accountant/payments/pay/${item.id} | Record a payment | payments/OverduePayments.jsx:84 |
| POST | files/single | Upload payment attachment | payments/OverduePayments.jsx:91 |
| GET | search?model=client | Client search filter | payments/PaymentsCalendar.jsx:148 |

## Summary / Outcome / Expenses / Rents
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | accountant/summary | Income/outcome summary cards | IncomeOutComeSummary.jsx:14 |
| GET | accountant/outcome | Outcome/expense rows | Outcome.jsx:32 |
| GET | accountant/operational-expenses | List operational expenses | OperationalExpenses.jsx:22 |
| POST | accountant/operational-expenses | Add operational expense | OperationalExpenses.jsx:33 |
| GET | accountant/rents | List rents | Rents.jsx:22 |
| POST | accountant/rents | Add rent | Rents.jsx:43 |
| PUT | accountant/rents/${item.id} | Renew rent | Rents.jsx:69 |

## Salaries & Commissions
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | accountant/users | Employees for salaries | Salaries.jsx:28 |
| GET | search?model=user | User search filter | Salaries.jsx:97 |
| POST | accountant/salaries/${item.id} | Create base salary | Salaries.jsx:62 |
| GET | accountant/salaries/data?userId=&startDate=&endDate= | Salary data for range | SalaryDialog.jsx:54 |
| PUT | accountant/salaries/${salaryData.id} | Edit base salary | SalaryDialog.jsx:159 |
| GET | accountant/users/${userId}/last-seen | Worked hours for month | MonthlySalaryDialog.jsx:42 |
| POST | accountant/salaries/monthly/pay | Pay monthly salary | MonthlySalaryDialog.jsx:113 |
| GET | admin/commissions?userId= | List staff commissions | Commission.jsx:56 |
| PUT | admin/commissions/${id} | Record commission payment | Commission.jsx:101 |
| POST | admin/commissions | Create extra commission | AdminCommissionForm.jsx:43 |

---

# 6. Chat

> Staff calls use `shared/chat/…`; client-facing calls use `client/chat/…`. Message send/edit/delete/pin are over **Socket.IO**, not HTTP.

## Rooms
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | shared/chat/rooms?category=&clientLeadId=&searchKey=&chatType= | Rooms list + unread | hooks/useChatRooms.js:57 |
| POST | shared/chat/rooms | Create room | hooks/useChatRooms.js:160 |
| POST | shared/chat/rooms/lead-rooms | Create lead-scoped room | hooks/useChatRooms.js:180 |
| POST | shared/chat/rooms/create-chat | Start 1:1 chat | dialogs/StartNewChat.jsx:52 |
| GET | shared/chat/rooms/${roomId} | Fetch room (staff) | hooks/useChatRoom.js:17 |
| GET | client/chat/rooms/${roomId}?clientId= | Fetch room (client) | hooks/useChatRoom.js:16 |
| PUT | shared/chat/rooms/${roomId} | Update room / settings | hooks/useChatRooms.js:202; window/ChatSettings.jsx:136 |
| DELETE | shared/chat/rooms/${roomId} | Delete room | hooks/useChatRooms.js:223 |
| POST | shared/chat/rooms/${roomId}/leave | Leave room | hooks/useChatRooms.js:243 |

## Messages / Pinned / Members / Files
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | shared/chat/rooms/${roomId}/messages?page=&limit= | Messages (staff) | hooks/useChatMessages.js:69 |
| GET | client/chat/${roomId}/messages?page=&limit=&clientId= | Messages (client) | hooks/useChatMessages.js:66 |
| GET | shared/chat/rooms/${roomId}/messages/${messageId}/page | Jump-to-message page (staff) | hooks/useChatMessages.js:176 |
| GET | client/chat/${roomId}/messages/${messageId}/page?clientId= | Jump-to-message page (client) | hooks/useChatMessages.js:175 |
| GET | shared/chat/rooms/${roomId}/pinned-messages | Pinned messages (staff) | window/ChatWindow.jsx:105 |
| GET | client/chat/${roomId}/pinned-messages?clientId= | Pinned messages (client) | window/ChatWindow.jsx:104 |
| GET | shared/chat/rooms/${roomId}/members | Members (staff) | hooks/useChatMembers.js:12 |
| GET | client/chat/rooms/${roomId}/members?clientId= | Members (client) | hooks/useChatMembers.js:11 |
| POST | shared/chat/rooms/${roomId}/members | Add members | window/ChatWindow.jsx:343 |
| DELETE | shared/chat/rooms/${roomId}/members/${memberId} | Remove member | window/ChatWindow.jsx:361 |
| PUT | shared/chat/rooms/${roomId}/members/${member.id} | Update member role | dialogs/AddMembersDialog.jsx:328 |
| POST | shared/chat/rooms/${roomId}/manageClient | Add/remove client on room | chat/utility/AddOrRemoveClient.jsx:31 |
| POST | shared/chat/rooms/${roomId}/regenerateToken | Regenerate client access token | chat/utility/ChatAccessLinkBox.jsx:66 |
| GET | shared/chat/rooms/${roomId}/files?q=&type=&uniqueMonths= | Room files (staff) | hooks/useChatFiles.js:61 |
| GET | client/chat/rooms/${roomId}/files?clientId=&q=&type= | Room files (client) | hooks/useChatFiles.js:58 |

## User pickers / client entry
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | admin/all-users?projectId= | All users (admin add-members) | window/ChatWindow.jsx:466; dialogs/CreateGroupDialog.jsx:74 |
| GET | shared/all-related-chat-users?projectId= | Related users (non-admin) | window/ChatWindow.jsx:467; CreateGroupDialog.jsx:74 |
| GET | shared/all-chat-users | Users for Start-New-Chat | dialogs/StartNewChat.jsx:38 |
| GET | client/chat/rooms/validate-token?token= | Validate client access token | client/ClientChatPage.jsx:16 |

---

# 7. Image Session

## Admin — session manager, gallery, items
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | shared/image-session/${clientLeadId}/sessions | List a lead's sessions | users/ClientSessionImageManager.jsx:191 |
| GET | shared/image-session/ids?where=&model=space&select=id,title | Space ids | ClientSessionImageManager.jsx:196 |
| PUT | shared/image-session/${clientLeadId}/sessions/${sessionId}/re-generate | Regenerate client link | ClientSessionImageManager.jsx:219 |
| POST | shared/image-session/${clientLeadId}/sessions | Create session | ClientSessionImageManager.jsx:255 |
| POST | client/image-session/generate-pdf | Regenerate session PDF | ClientSessionImageManager.jsx:332 |
| PUT | shared/image-session/${clientLeadId}/sessions/${sessionId} | Rename session | users/ClientImageSessionName.jsx:57 |
| PATCH | admin/model/archived/${item.id}?model=style | Archive/unarchive style | admin/style/StyleItem.jsx:30 |
| PATCH | admin/model/archived/${item.id}?model=material | Archive/unarchive material | admin/material/MaterialItem.jsx:30 |
| PATCH | admin/model/archived/${item.id}?model=space | Archive/unarchive space | admin/space/SpaceItem.jsx:26 |
| PATCH | admin/model/archived/${item.id}?model=ColorPattern | Archive/unarchive color | admin/color/ColorItem.jsx:30 |
| PATCH | admin/model/archived/${item.id}?model=designImage | Archive/unarchive image | admin/image/DesignImageItem.jsx:27 |
| GET | admin/image-session/${slug}?limit=&page= | Paginated admin items | admin/shared/ImageItemViewer.jsx:28 |
| GET | admin/image-session/templates?type= | List templates | admin/shared/Templates.jsx:12 |
| POST | admin/image-session/templates | Create template | admin/shared/Template.jsx:334 |
| PUT | admin/image-session/templates/${template.id} | Update template | admin/shared/Template.jsx:334 |
| GET | shared/utilities/ids?where=&model=&select=&isLanguage= | Autocomplete options | admin/shared/session-item/AutoCompleteSelector.jsx:27 |

## Admin — create/edit dialogs (via OpenItemDialog: POST create / PUT `/${id}` edit)
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| POST/PUT | admin/image-session/space[/${id}] | Space create/edit | admin/space/CreateSpace.jsx:25; EditSpace.jsx:25 |
| POST | admin/image-session/images | Create design image | admin/image/CreateDesginImage.jsx:93 |
| POST | admin/image-session/images/bulk | Bulk-create images | admin/image/CreateDesginImage.jsx:104 |
| PUT | admin/image-session/images/${id} | Edit image | admin/image/EditDesignImage.jsx:51 |
| POST/PUT | admin/image-session/colors[/${id}] | Color create/edit | admin/color/CreateColor.jsx:61; EditColor.jsx:55 |
| POST/PUT | admin/image-session/page-info[/${id}] | Page-info create/edit | admin/page-info/CreatePageInfo.jsx:41; EditPageInfo.jsx:34 |
| POST/PUT | admin/image-session/${slug}[/${id}] (style/material) | Session item create/edit | admin/shared/session-item/CreateSessionItem.jsx:59; EditSessionItem.jsx:57 |
| GET | client/image-session/pros-and-cons?type=&id=&lng= | Load pros/cons | admin/shared/ProsConsDialog.jsx:50 |
| POST | admin/image-session/pros-and-cons | Add pro/con | ProsConsDialog.jsx:63 |
| DELETE | admin/image-session/pros-and-cons/${id} | Delete pro/con | ProsConsDialog.jsx:76 |
| PUT | admin/image-session/pros-and-cons/${id} | Update pro/con | ProsConsDialog.jsx:91 |
| POST | admin/image-session/pros-and-cons/order/ | Save reorder | ProsConsDialog.jsx:161 |

## Client flow
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | client/image-session/session?token= | Load session by token | client-session/ClientImageSelection.jsx:56 |
| PUT | client/image-session/session/status | Advance / go back session | ClientImageSelection.jsx:78 |
| GET | client/image-session/page-info?type=&lng= | Intro/step page info | client-session/PageInfo.jsx:35 |
| GET | client/image-session/styles?lng= | List styles | client-session/styles/Styles.jsx:39 |
| POST | client/image-session/styles | Submit style | Styles.jsx:91 |
| GET | client/image-session/colors?lng= | List colors | client-session/colors/ColorPalletes.jsx:36 |
| POST | client/image-session/colors | Submit colors | ColorPalletes.jsx:314 |
| GET | client/image-session/materials?lng= | List materials | client-session/material/Materials.jsx:46 |
| POST | client/image-session/materials | Submit materials | Materials.jsx:97 |
| GET | client/image-session/images?styleId=&spaceIds= | List images | client-session/Images.jsx:52 |
| POST | client/image-session/images | Submit images | Images.jsx:68 |
| DELETE | client/image-session/images/${image.id} | Remove selected image | client-session/ImageComponent.jsx:46 |
| POST | client/image-session/generate-pdf | Approve signature / generate PDF | client-session/SignatureComponent.jsx:68 |

---

# 8. Contracts

## List / view / sub-rows
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | shared/contracts/client-lead/${leadId} | List contracts for lead | ContractsList.jsx:65 |
| GET | shared/contracts/${id} | Contract details | ViewContract.jsx:811 |
| GET | shared/projects/${clientLeadId}/groups | Project groups for contract | ViewContract.jsx:90 |
| PUT | shared/contracts/${id}/basics | Update contract basics | ViewContract.jsx:217 |
| POST | shared/contracts/${id}/actions/generate-pdf-token | Generate signing/PDF token | ViewContract.jsx:260 |
| POST | shared/contracts/${id}/stages | Add stage | ViewContract.jsx:587 |
| POST | shared/contracts/${id}/special-items | Add special item | ViewContract.jsx:695 |
| POST | shared/contracts/${id}/drawings | Add drawing | ViewContract.jsx:753 |
| POST | shared/contracts/ | Create contract / clone | CreateContract.jsx:139; CloneContract.jsx:213 |
| GET | shared/contracts/${sourceId} | Load source contract to clone | CloneContract.jsx:80 |
| POST | shared/contracts/${id}/actions/cancel | Cancel contract | ContractMenu.jsx:33 |
| PUT/DELETE | shared/contracts/${contractId}/stages/${stage.id} | Update/delete stage | view/StageRow.jsx:59,76 |
| POST | shared/contracts/${contractId}/stages/${stage.id}/actions/override-status | Audited admin stage-chain repair | view/StageRow.jsx |
| PUT/DELETE | shared/contracts/${contractId}/special-items/${item.id} | Update/delete special item | view/SpecialItemRow.jsx:45,62 |
| PUT/DELETE | shared/contracts/${contractId}/drawings/${row.id} | Update/delete drawing | view/DrawingRow.jsx:48,65 |

## Payments
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | shared/contracts/payments/all | All payments | payments/PaymentsPage.jsx:433 |
| POST | shared/contracts/payments/${id}/actions/update-amounts | Update amount lost/transferred | payments/PaymentsPage.jsx:246 |
| POST | shared/contracts/payments/${id}/actions/change-status | Change payment status (flat) | payments/PaymentsPage.jsx:468 |
| POST | shared/contracts/${contractId}/payments/${id}/actions/change-status | Change payment status (nested) | view/PaymentRow.jsx:73 |
| PUT/DELETE | shared/contracts/${contractId}/payments/${id} | Update/delete payment | view/PaymentRow.jsx:112,129 |
| POST | shared/contracts/${contractId}/payments | Add payment | payments/AddPaymentDialog.jsx:68 |
| GET | shared/contracts/client-lead/${clientLeadId}/payment-conditions | Lead-scoped payment-condition presets during contract create/clone | payments/SelectPaymentCondition.jsx:19 |
| GET | shared/site-utilities/contract-payment-conditions | Admin site-utility payment-condition presets | payments/SelectPaymentCondition.jsx:20 |

## Contract-utility (clauses/obligations)
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | shared/site-utilities/contract-utility/details | Config | ContractUtility.jsx:42 |
| GET/PUT | shared/site-utilities/contract-utility/obligations | List/save obligations | dialogs/ObligationsDialog.jsx:35,62 |
| GET/POST | shared/site-utilities/contract-utility/stage-clauses | List/create stage clauses | dialogs/StageClausesDialog.jsx:328,398 |
| PUT/DELETE | shared/site-utilities/contract-utility/stage-clauses/${id} | Update/delete stage clause | StageClausesDialog.jsx:399,367 |
| GET/PUT | shared/site-utilities/contract-utility/level-clauses[/${id}] | List/update level clauses | dialogs/LevelClausesDialog.jsx:37,82 |
| GET/POST | shared/site-utilities/contract-utility/special-clauses | List/create special clauses | dialogs/SpecialClausesDialog.jsx:197,264 |
| PUT/DELETE | shared/site-utilities/contract-utility/special-clauses/${id} | Update/delete special clause | SpecialClausesDialog.jsx:265,236 |

## Client flow
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | client/contracts/session?token=&lng= | Load client contract session | client/ClientContractPage.jsx:39 |
| PUT | client/contracts/session/status | Advance / go back session | ClientContractPage.jsx:61 |
| POST | client/contracts/generate-pdf | Sign & generate PDF | client/ContractSignature.jsx:324 |

---

# 9. Users

## List / detail / logs
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | admin/users | Paginated users list / single row | pages/UsersPage.jsx:32; UserDetails.jsx:103 |
| POST | admin/users/${id}/actions/change-status | Ban / toggle active | pages/UsersPage.jsx:36 |
| GET | admin/users/${userId}/profile | User profile header | UserDetails.jsx:113; UserProfile.jsx:27 |
| GET | shared/dashboard/key-metrics?staffId=&profile=true | Sales metrics for user | UserPerformance.jsx:251 |
| GET | shared/dashboard/designer-metrics?staffId=&profile=true | Designer metrics for user | UserPerformance.jsx:261 |
| GET | admin/users/${staffId}/logs/ | User activity logs | UserLogs.jsx:115 |

## Roles / profiles / auto-assignment / restricted countries
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| POST | auth/profile/switch | Switch acting role/profile | UserRoles.jsx:52 |
| GET | admin/users/assignable-profiles | List assignable profiles | ProfileManagerDialog.jsx:65; UserProfilesPanel.jsx:61 |
| PUT | admin/users/${userId}/profiles | Save assigned profiles | ProfileManagerDialog.jsx:97; UserProfilesPanel.jsx:95 |
| GET/PUT | admin/users/${userId}/auto-assignments | Load/update auto-assignment | ProjectAutoAssignmentDialog.jsx:60,97 |
| GET | admin/users/${userId}/restricted-countries | Load restricted countries | UserRestrictedCountries.jsx:52 |
| POST | admin/users/${userId}/restricted-countries | Update restricted countries | UserRestrictedCountries.jsx:87 |

## Self profile (Google / Telegram)
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET/PUT | shared/users/${userId}/profile | Load/save own profile | profile/ProfileDialog.jsx:83,147 |
| POST | shared/calendar/google/connect | Connect Google Calendar | profile/ProfileDialog.jsx:187 |
| POST | shared/calendar/google/disconnect | Disconnect Google Calendar | profile/ProfileDialog.jsx:218 |
| POST | v2/telegram/auth/init | Telegram — send phone | profile/TelegramAuth.jsx:107 |
| POST | v2/telegram/auth/verify-code | Telegram — verify code | profile/TelegramAuth.jsx:107 |
| POST | v2/telegram/auth/verify-password | Telegram — verify 2FA | profile/TelegramAuth.jsx:107 |

---

# 10. Meeting / Calendar

## VERSA / SPAIN questionnaires
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | shared/questions/versa/${clientLeadId} | List VERSA categories | VERSA/CategoriesDialog.jsx:40 |
| GET/POST | shared/questions/versa/${clientLeadId}/category/${id} | Load/create VERSA category data | VERSA/VERSADialog.jsx:38,48 |
| PUT | shared/questions/versa/steps/${step.id} | Save VERSA step answers | VERSA/VersaStep.jsx:68 |
| GET | shared/questions/question-types/${clientLeadId} | List question types | SPAIN/SPAINQuestionDialog.jsx:30 |
| GET | shared/questions/session-questions/${clientLeadId}?questionTypeId= | List session questions | SPAIN/CategorySection.jsx:34 |
| POST | shared/questions/${sessionQuestionId}/answer | Submit answer | SPAIN/CategorySection.jsx:57 |
| POST | shared/questions/lead/${clientLeadId}/custom-question | Add custom question | SPAIN/CategorySection.jsx:75 |

## Calendar — staff/admin slot management
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| POST | shared/calendar-management/available-days/multiple?timezone= | Availability for multiple days | calendar/TimeSlotManager.jsx:122 |
| POST | shared/calendar-management/available-days?timezone= | Availability for single day | TimeSlotManager.jsx:122 |
| POST | shared/calendar-management/add-custom/${dayId}?timezone= | Add custom slot | TimeSlotManager.jsx:173 |
| DELETE | shared/calendar-management/slots/${slotId} | Delete a slot | TimeSlotManager.jsx:149 |
| GET | shared/calendar-management/slots?date=&adminId=&timezone= | List slots for date | TimeSlotManager.jsx:201 |
| DELETE | shared/calendar-management/days/${dayId} | Delete an availability day | TimeSlotManager.jsx:223 |
| GET | shared/utilities/users/admins | Admin selector | calendar/StaffCalendar.jsx:26 |
| GET | shared/calendar-management/dates/day?date=&isAdmin= | Single day detail | calendar/DayDetailDialog.jsx:34 |
| GET | shared/calendar-management/dates/month?year=&month=&isAdmin= | Month grid | calendar/BigCalendar.jsx:70 |
| GET | shared/calendar/available-days?month=&adminId= | Available days (staff/admin) | calendar/Calendar.jsx:129 |

## Calendar — client booking flow
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| GET | client/calendar/slots?date=&token=&timezone= | Bookable slots | calendar/ClientBooking.jsx:90 |
| GET | client/calendar/timezones | Timezone options | ClientBooking.jsx:106 |
| GET | client/calendar/slots/details?slotId=&token= | Slot details | ClientBooking.jsx:164 |
| POST | client/calendar/book?token=&timezone= | Book selected slot | ClientBooking.jsx:192 |
| GET | client/calendar/meeting-data?token=&timezone= | Meeting/token context | calendar/Calendar.jsx:96 |
| GET | client/calendar/available-days?month=&token= | Available days (client) | calendar/Calendar.jsx:129 |

---

# 11. Website Utilities / Booking / Client Page

## Website Utilities
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| POST | shared/site-utilities/pdf-utility | Save PDF-utility field | PdfUtilityFieldCard.jsx:121 |
| POST | shared/site-utilities/contract-payment-conditions | Create payment condition | ContractPaymentConditions.jsx:116 |
| PUT | shared/site-utilities/contract-payment-conditions/${id} | Update payment condition | ContractPaymentConditions.jsx:116 |

## Client Page (public landing / lead capture)
| Method | Endpoint | Purpose | Source |
|---|---|---|---|
| POST | admin/new-lead (staff) / client/new-lead (public) | Submit design lead | client-page/FinalSelectionForm.jsx:170 |
| GET | https://geolocation-db.com/json/ (EXTERNAL) | Detect visitor country | FinalSelectionForm.jsx:115 |

## Booking-Lead
No direct API calls — the tree renders lead data passed via props from the parent lead-detail screen.

---

## Known inconsistencies flagged during the sweep
1. **Chat client-path shape:** client message + pinned endpoints use `client/chat/${roomId}/…` (no `/rooms/`), while client room/members/files use `client/chat/rooms/${roomId}/…`. This mirrors the backend's client-route mounts (the staff `/rooms/` bug in the shared routes was fixed 2026-07-11).
2. **Contract payment change-status has two route shapes** — flat `shared/contracts/payments/:id/actions/change-status` and nested `shared/contracts/:contractId/payments/:id/actions/change-status`.
3. **Report pages bypass the `/v2` path adapter** (raw `fetch` to `/admin/reports/…`) — confirm those routes exist on the migrated backend.
