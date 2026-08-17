# Frontend ↔ backend endpoint and payload parity

**Audit date:** 2026-08-16

**Scope:** `web/src/**`, `courses-web/src/**`, the current mounted Express `/v2` API, and Socket.IO

**Authority:** current mount code, current `*.route.js` files, and current Zod validation schemas

## Result

Every current HTTP request that can be issued by `web` or `courses-web` now resolves to a mounted backend route with the correct HTTP method and `/v2` path. Prop-driven and computed request paths were checked separately from literal calls. Strict mutation payloads, query keys, uploads, direct envelope consumers, and Socket.IO handshakes/events were checked against the current backend implementation.

The audit found and fixed six frontend contract defects. No backend route or business-logic change was made, and no remaining backend-owner blocker was found for a current repository caller.

The checked backend graph contains 429 mounted route declarations (428 unique method/path declarations; the Stripe webhook is deliberately registered twice in source so the raw-body handler wins before `express.json()`). The graph is derived from `server/src/app.js` → `/v2` → `server/src/shared/routes.js` → every reachable nested router; comments and historical endpoint documents are not inputs.

## Courses validation follow-up — 2026-08-17

The URL graph remained green, but a deeper mutation audit found payload and success-semantics mismatches that a path-only scan could not detect. Courses forms now whitelist payload fields, normalize numeric input, accept all successful 2xx responses, and render Zod `details`. Link/PDF/video edits no longer echo read-only API fields into strict bodies; new tests are created as drafts; question/homework/test payloads parse through the real backend schemas in a cross-layer suite. The admin/staff Zod schemas now use the real enums and bounds and reject unknown fields before Prisma. See `2026-08-17-courses-validation-parity-and-reliability-design.md` for the full result.

## Fixes made

| Area | Before | Current contract |
|---|---|---|
| Deal Kanban status move | `POST /v2/client-leads/:id/actions/change-status` (not mounted) | `POST /v2/leads/:id/actions/change-status` |
| Chat errors | listened for `chat:error` | listens for server-emitted `error` |
| Courses notifications socket | unauthenticated `query.userId`; emitted unsupported `join-room` and `heartbeat` | cookie-authenticated `withCredentials: true`; the server joins `user:<id>` during the authenticated handshake |
| Image-session admin create/edit | prop defaults produced legacy `/v2/admin/image-session/*` | `POST/PUT /v2/image-sessions/admin/{space,material,style,colors,images,images/bulk,page-info}` |
| Accounting notes | default produced `/v2/accountant/notes` | `GET/POST /v2/accounting/notes`; legacy `accountant` is also normalized by `getNotesPath` |
| Admin color upload payload | read `fileUpload.url` from an undefined variable | sends `uploadResponse.url` as `imageUrl` |

Visible behavior is unchanged except that these previously failing actions now reach their intended backend handlers and update/refetch the same screen state.

## How the audit was performed

1. Parsed `server/src/app.js`, the `/v2` aggregate, and all reachable `*.route.js` files to build the full mount graph. Nested accounting, admin, calendar, client, course, image-session, and public routers are included. The `/calendar-management` alias is treated as a real mount.
2. Parsed JavaScript/JSX call sites for `getData`, `getDataAndSet`, `useDataFetcher`, `handleRequestSubmit`, `apiRequest`, direct `fetch`, uploads, and Socket.IO `io/on/emit/off` usage.
3. Normalized `/v2`, dynamic IDs, query strings, and conditional create/edit paths. There is no runtime legacy path mapper in the current `apiClient`; caller strings must already be canonical.
4. Compared method, segment order, params, query keys, body keys, multipart fields, and response consumption with the current routes/controllers/Zod schemas.
5. Checked prop-driven abstractions separately: `OpenItemDialog`, `NotesComponent`, `EditFieldButton`, `CreateModal`, `EditModal`, `DeleteModal`, `DeleteModelButton`, `AdminTable`, pick-list selectors, `LeadDetailsContext`, and calendar slot management.
6. Added `tests/contracts/frontend-backend-endpoint-parity.test.js`. It rebuilds the route graph, scans both frontends, fails on an unmatched/new unresolved caller, locks explicit dynamic contracts, and checks the socket/upload corrections.

## Checked HTTP caller manifest

IDs below are normalized as `:id`; query keys appear after `?`. A row can represent several files/screens using the same route family. All responses use `{ success, message, data, translationKey }`; the “response” column calls out additional nesting expected by the caller.

### Auth, notifications, uploads, and shared utilities

| Methods and mounted paths | Query/body/upload | Frontend response expectation |
|---|---|---|
| `GET /v2/auth/csrf`; `POST /v2/auth/refresh` | cookie + `x-csrf-token` on refresh | `data.csrfToken`; refresh uses HTTP success |
| `POST /v2/auth/login`, `/logout`, `/request-password-reset`, `/reset-password`, `/profile/switch`; `GET /auth/me` | current auth schemas; profile switch sends selected profile id | login/commands use normalized `data`; `auth/me` consumes `data.user` |
| `GET /v2/notifications`; `POST /v2/notifications/actions/mark-read` | `page`, `limit`; mark-read body `{}` | `data.items` for direct bell callers; normalized items elsewhere |
| `POST /v2/files/single` | multipart field `file` | `data.url` |
| `POST /v2/files/chunks` | multipart field `chunk`; `filename`, `chunkIndex`, `totalChunks`, `uploadSessionId` | `data.url` on final chunk |
| `POST /v2/files/client/capabilities` | JSON `{ purpose, funnelToken }` | `data.token` |
| `POST /v2/files/client/chunks` | multipart field `chunk`; same chunk metadata; `purpose` query; `x-upload-token` | `data.url` |
| `GET /v2/utilities/search` | strict `resource`, `query`, optional `profile` | direct callers consume array at `data` |
| `GET /v2/utilities/users/admins`, `/users/:id/current-profile`, `/ids` | `/ids` sends only allowed `model`; pick lists use dedicated image-admin routes for Template/Style/Space | array/object at normalized `data` |
| `GET /v2/users/:id/last-seen`, `/accounting/users/:id/last-seen` | `month`, `year` | normalized `data` |
| `GET/POST /v2/notes`; `GET/POST /v2/accounting/notes`; `GET/POST /v2/client/notes` | `idKey`, `id`, optional client `token`; create `{ idKey, id, content, attachment?, token? }` | note array / created note at `data` |

### Dashboard, reports, audit, Telegram, and My Day

| Methods and mounted paths | Query/body | Response |
|---|---|---|
| `GET /v2/dashboard/{key-metrics,emirates-analytics,latest-leads,leads-monthly-overview,leads-status,monthly-performance,recent-activities,week-performance,designer-metrics}` | current dashboard filters/profile/staff/date query keys | normalized widget data |
| `GET /v2/staff/dashboard/latest-calls` | `staffId` | array at normalized `data` |
| `POST /v2/admin/reports/{lead-report,lead-report/excel,lead-report/pdf,staff-report,staff-report/excel,staff-report/pdf}` | report filters in JSON | JSON endpoints consume `data`; export endpoints consume Blob |
| `GET /v2/audit-logs` | pagination plus configured actor/action/entity/status/date filters | paginated `data.items` normalized to table rows |
| `GET /v2/my-day`, `/team`, `/unclaimed`, `/users/:userId` | date/filter keys used by each view | normalized lists/summary |
| `GET /v2/telegram/current`; `POST /v2/telegram/auth/{init,verify-code,verify-password}` | current Telegram auth bodies | normalized auth/session state |

### Leads, sales stages, questions, projects, tasks, delivery, and updates

| Methods and mounted paths | Query/body | Response |
|---|---|---|
| `GET /v2/leads`, `/summary`, `/columns`, `/:id` | pagination, filters, `staffId`, `status`, `type`, `skip`, `take` | paginated/list metadata or lead object at normalized `data` |
| `PUT /v2/leads`, `/bulk-convert`, `/update/:id` | assignment/bulk/update payloads used by the current dialogs | updated lead(s) at `data` |
| `POST /v2/leads/:id/actions/change-status` | `{ status, oldStatus, averagePrice?, discount?, priceWithOutDiscount?, priceNote?, updatePrice? }` | updated lead; Kanban reconciles old/new columns |
| `GET/POST /v2/leads/:id/{notes,files,price-offers,call-reminders,meeting-reminders,payments}` | subresource-specific bodies; upload URL is a JSON field, not multipart | arrays/created rows at `data` |
| `GET /v2/leads/:id/meetings`, `/cockpit`; `GET /v2/leads/meeting-reminders/:meetingId` | normalized ids | arrays/object at `data` |
| `PUT /v2/leads/{call-reminders,meeting-reminders}/:id`; `POST /v2/leads/:id/meeting-reminders/token`; `POST /v2/leads/price-offers/change-status` | current reminder/token/status bodies | updated resource at `data` |
| `POST /v2/admin/leads/update/:id`, `/admin/new-lead`; `DELETE /v2/admin/client-leads/:id`; `POST /v2/admin/client-leads/:id/telegram/{new,assign-users}` | current admin lead bodies | normalized created/updated/deleted result |
| `GET /v2/sales-stages/:leadId`; `POST /v2/sales-stages/:leadId/actions/set-stage` | stage action payload | stage list/current stage |
| `GET /v2/questions/{question-types,session-questions,versa}/:leadId`; `GET/POST /v2/questions/versa/:leadId/category/:category`; `PUT /v2/questions/versa/steps/:id`; `POST /v2/questions/:sessionQuestionId/answer`, `/lead/:leadId/custom-question` | current answer/category/custom-question schemas | normalized questions/answers |
| `GET /v2/projects`, `/:id`, `/:leadId/groups`, `/designers/columns`, `/designers/:id` and designer tab subresources | project filters, designer status/type/staff paging | lists, totals, project/lead detail |
| `PUT /v2/projects/:id`; `POST /v2/projects/:id/actions/assign-designer`; `POST /v2/projects/designers/:leadId/actions/change-status` | designer status body includes `{ status, oldStatus, id: projectId }` | updated project/work-stage state |
| `GET/POST /v2/tasks`; `GET/PUT /v2/tasks/:id` | task list filters and current create/update body | paginated tasks or task object |
| `GET /v2/delivery/:projectId/schedules`; `POST /v2/delivery`; `POST /v2/delivery/:deliveryId/actions/link-meeting` | delivery schedule/link payloads | normalized schedule/action result |
| `GET/POST /v2/updates/:leadId`; `GET /v2/updates/shared-settings/:id`; `POST /v2/updates/:id/actions/{authorize,authorize-shared}`; `POST /v2/updates/shared-updates/:id/actions/archive` | update/action bodies | normalized update records |

### Contracts and website utilities

| Methods and mounted paths | Query/body | Response |
|---|---|---|
| `GET /v2/contracts/:id`, `/client-lead/:leadId`, `/payments/all`; `POST /v2/contracts`; `PUT /v2/contracts/:id/basics`; `POST /v2/contracts/:id/actions/{cancel,generate-pdf-token}` | strict create keys: `clientLeadId`, names/titles, `projectGroupId`, `payments`, `stages`, `drawings`, `specialItems`, optional old-contract fields; basics/action schemas checked | contract/token at normalized `data` |
| `POST/PUT/DELETE /v2/contracts/:contractId/stages/:stageId?`, `/payments/:paymentId?`, `/drawings/:drawingId?`, `/special-items/:itemId?` | row payloads match strict contract schemas; ID is in path, not duplicated unless schema permits | updated/created row or delete success |
| `POST /v2/contracts/:contractId/payments/:paymentId/actions/change-status`; `POST /v2/contracts/payments/:paymentId/actions/{change-status,update-amounts}` | current status/amount bodies | updated payment |
| `GET /v2/client/contracts/session`; `POST /v2/client/contracts/generate-pdf`; `PUT /v2/client/contracts/session/status` | PDF body `{ sessionData: { arToken }, signatureUrl, lng }`; status body contains token/session status | public session/PDF result at `data` |
| `GET/POST /v2/site-utilities/pdf-utility` | utility field update body | utility object |
| `GET/POST/PUT /v2/site-utilities/contract-payment-conditions/:id?` | `{ conditionType, condition, labelAr, labelEn }` | condition list/row |
| `GET /v2/site-utilities/contract-utility/details`; `GET/POST/PUT /obligations`; `GET/POST/PUT/DELETE /{stage-clauses,special-clauses,level-clauses}/:clauseId?` | each dialog payload matches its actual clause schema and create/edit method | utility details/lists/rows |

### Image sessions

| Methods and mounted paths | Query/body | Response |
|---|---|---|
| `GET/POST/PUT /v2/image-sessions/admin/{space,material,style,colors,images,page-info}/:id?`; `POST /images/bulk` | current reference payloads; image URLs come from chunk upload; `notArchived`, filters, `limit`, `page` are query keys | list/paginated list or row at normalized `data` |
| `GET/POST/PUT /v2/image-sessions/admin/templates/:templateId?`; `GET /templates/ids` | template body plus `customStyle`, `layout`; ids query includes supported `type` | templates/ids at normalized `data` |
| `GET/POST/PUT/DELETE /v2/image-sessions/admin/pros-and-cons/:id?`; `POST /pros-and-cons/order` | current item/order bodies | list/row/action result |
| `GET /v2/image-session/ids`, `/:leadId/sessions`; `POST /:leadId/sessions`; `PUT /:leadId/sessions/:sessionId`, `/:sessionId/re-generate`; `DELETE /:leadId/sessions/:sessionId` | admin/user session bodies | sessions/session result |
| `GET /v2/client/image-session/session`, `/pros-and-cons`; `POST /colors`, `/materials`, `/styles`, `/images`, `/generate-pdf`; `DELETE /images/:id`; `PUT /session/status` | strict client bodies checked; PDF body includes `{ sessionData, signatureUrl, sessionStatus: "PDF_GENERATED", lng }` | public session/selection/PDF data |

### Calendar and booking

| Methods and mounted paths | Query/body | Response |
|---|---|---|
| `GET /v2/calendar/available-days`; `GET /v2/calendar-management/{dates/day,dates/month,slots}` | date/month/timezone/admin filters | days/slots at normalized `data` |
| `POST /v2/calendar-management/available-days`, `/available-days/multiple` | single `{ date, fromHour, toHour, duration, breakMinutes }`; multiple uses `days`; query `timezone`, `isMobile` | saved days/slots |
| `POST /v2/calendar-management/add-custom/:dayId`; `DELETE /days/:dayId`, `/slots/:slotId` | custom slot body/current ids | action result |
| `GET /v2/calendar/google/status`; `POST /connect`, `/disconnect` | authenticated cookie/CSRF | connection status/action |
| `GET /v2/client/calendar/{available-days,meeting-data,slots,slots/details,timezones}`; `POST /book` | public booking query keys; booking body uses selected slot/date/timezone accepted by schema | booking data/result |

### Accounting

| Methods and mounted paths | Query/body | Response |
|---|---|---|
| `GET /v2/accounting/payments` and payment list variants; `GET /:id/invoices` | pagination/status/date/staff filters | paginated payments/invoices |
| `POST /v2/accounting/payments/:id/actions/pay` | strict `{ amount, issuedDate, file? }` | updated payment |
| `POST /v2/accounting/payments/:id/actions/change-status`, `/mark-overdue` | strict `{ newPaymentLevel }` for status; overdue action body accepted | updated payment |
| `GET/POST /v2/accounting/operational-expenses`; `GET/POST/PUT /rents/:id?`; `GET /outcome`, `/summary` | current list filters and form bodies | normalized lists/rows/summary |
| `GET /v2/accounting/salaries`, `/salaries/data`; `POST /salaries/:userId`, `/salaries/monthly/pay`; `PUT /salaries/:id` | current base/monthly salary bodies | salary data/result |
| `GET/POST/PUT /v2/admin/commissions/:id?` | commission filters/create/update bodies | commission rows |

### Chat and users

| Methods and mounted paths | Query/body | Response |
|---|---|---|
| `GET/POST /v2/chat/rooms`; `GET/PUT/DELETE /rooms/:roomId`; `POST /rooms/create-chat`, `/lead-rooms` | room/create bodies match current chat validation | room/list at `data` |
| `GET /v2/chat/rooms/:roomId/{messages,members,files,pinned-messages}`; `GET /messages/:messageId/page` | message pagination/search keys | arrays/page data |
| `POST /v2/chat/rooms/:roomId/{members,leave,manageClient,regenerateToken}`; `PUT/DELETE /members/:memberId` | current member/client action bodies | updated room/member/token |
| Client-token equivalents under `/v2/client/chat`: validate-token, room, messages/page, pinned, members, files | chat token query/header as required | public client chat data |
| `GET /v2/users`, `/all-users`, `/assignable-profiles`, `/chat-directory`, `/related-chat-directory`, `/:id/profile`, `/:id/auto-assignments`, `/:id/restricted-countries` | pagination/profile/role/search keys | list/profile/config at normalized `data` |
| `POST /v2/users`; `PUT /users/:id`, `/:id/profile`, `/:id/profiles`, `/:id/auto-assignments`; `POST /:id/restricted-countries`, `/:id/actions/change-status`; `PUT /max-leads/:id`, `/max-leads-per-day/:id` | user/profile/config bodies checked against current schemas | created/updated user/config |

### `courses-web` admin and staff course callers

| Methods and mounted paths | Query/body | Response |
|---|---|---|
| `GET/POST /v2/courses`; `PUT /courses/:courseId` | page/limit; current course form including uploaded image URL | paginated courses/course |
| `GET/POST /v2/courses/:courseId/lessons`; `GET/PUT/DELETE /lessons/:lessonId` | lesson form and pagination | lesson lists/object |
| `GET/POST /v2/courses/:courseId/lessons/:lessonId/{links,pdfs,videos}`; `PUT/DELETE /{links,pdfs,videos}/:id` | current title/url/type bodies | resource lists/rows |
| `GET/POST/DELETE /v2/courses/:courseId/lessons/:lessonId/videos/:videoId/pdfs/:id?` | uploaded URL/title body | PDF rows |
| `GET/POST/DELETE /v2/courses/:courseId/lessons/:lessonId/allowed-users/:accessId?`; `GET /home-works`; `POST /home-works/toggle` | allow body `{ userId }`; toggle body used by lesson card | access/homework data |
| `GET/POST/PUT/DELETE /v2/courses/tests/:testId?`; `GET /attempts`, `/attampts/user`; `POST /attempts/{increase,decrease}` | current test/attempt bodies | tests/attempts |
| `GET/POST/PUT/DELETE /v2/courses/tests/:testId/test-questions/:questionId?`; `POST /test-questions/re-order`; `POST /attempts/:attemptId/questions/:questionId/approve` | question/order/approval bodies | questions/action result |
| `GET /v2/courses/dashboard` | no unsupported query keys | dashboard data |
| `GET /v2/staff-courses`, `/:courseId`, `/:courseId/progress`, `/:courseId/lessons/:lessonId`, `/home-work`; `POST /home-work` | staff course/lesson/homework bodies | staff course/progress data |
| `GET /v2/staff-courses/dashboard`; `GET /tests/:testId`, `/test-questions`, `/attampts`; `POST /attampts`, `/attampts/:attemptId/questions/:questionId`; `PUT /attampts/:attemptId` | the backend’s intentional `attampts` spelling is preserved; answer body `{ answer }` | test, attempts, saved answer/result |
| `POST /v2/files/chunks`; auth, notifications, and utilities search routes listed above | multipart field remains `chunk`; cookie auth/CSRF | same envelope normalization as `web` |

## Socket.IO parity

- Both apps connect to the backend origin, not `/v2`; the server authenticates the handshake from cookies (or the supported chat token) and automatically joins the identity room.
- `web` outbound chat events match registered handlers: `online`, `user:online`, `client:online`, `join_room`, `join_room_client`, `leave_room`, typing events, message create/edit/delete/pin/unpin/read/forward, and call events.
- `web` listeners match emitted events, including `message:*`, member/room/call events, notification variants, and the corrected `error` event.
- `courses-web` uses the authenticated handshake and listens only for `notification`; unsupported `join-room` and `heartbeat` emissions were removed.

## Response nesting

- `getData`, `getDataAndSet`, `useDataFetcher`, and `handleRequestSubmit` normalize the envelope so legacy screens receive `status`, `data`, pagination totals, message code, and success state.
- Direct `apiRequest` callers were checked individually: auth uses `body.data.user`; notification/search/profile/lesson-access callers use `body.data` or `body.data.items`; lead tab context uses `normalizeEnvelope`; reports use JSON `data` or response Blob as appropriate.
- Paginated backend payloads remain `data: { items, total, page, pageSize }`; the adapters expose `items` as the screen’s row array while retaining totals.
- No frontend message map was changed.

## Intentional non-repository/external callers

These routes are not expected to have a `web` or `courses-web` caller and must remain available to their external clients:

| Contract | External requirement |
|---|---|
| `POST /v2/client/pay` | Public checkout client sends strict `{ clientLeadId, clientId?, lng? }` plus `x-funnel-token` bound to `PUBLIC_REGISTER`; redirect URL is `data.url`. There is currently no repository caller. |
| `GET /v2/client/payment-status` | Checkout return client sends `sessionId`, `clientLeadId`, optional `lng`; paid response is `data.paymentStatus === "PAID"`; unpaid remains HTTP 402. No repository caller. |
| `GET /v2/client/stripe/backfill` | Preserved maintenance/no-op contract with optional `pass`; no browser caller. |
| `POST /v2/client/stripe/webhook` | Stripe sends the raw body and `stripe-signature`. It must stay before JSON parsing; never call it from a browser. |
| `GET /v2/calendar/google/callback` | Google OAuth redirect; session cookie and the server-issued state/nonce rules still apply. |
| `GET /v2/reviews/oauth2callback` | External OAuth redirect contract; no current frontend caller. The backend’s existing review-integration configuration remains backend-owned. |
| `GET https://geolocation-db.com/json/` | Intentional third-party request from the public lead form; it is the sole external HTTP URL found in either frontend. |

Public repository callers that **were** checked include the lead registration/capability/upload flow, client calendar booking, client contract signing, client image-session selection/signing, and token-scoped client chat/notes.

## Automated and manual verification

- Contract test: `npx vitest run tests/contracts/frontend-backend-endpoint-parity.test.js`
- Focused notes path test: `npx vitest run web/src/shared/components/common/__tests__/notesPath.test.js`
- Production builds: `npm run build:web` and `npm run build:courses`
- Representative flow review: list/detail normalization; lead and designer status actions; create/edit/delete prop-driven dialogs; contract row mutations/signing; image admin create/edit and chunk upload; calendar create/delete; public lead capability/upload/complete-register; accounting pay/status/notes; chat HTTP + Socket.IO; user profile mutation; course/lesson/test/homework flows.

The older `docs/frontend-api-inventory.md` describes a removed `apiPathMap.js` runtime rewrite and historical legacy caller strings. It is not authoritative for the current branch; this document and the executable contract test reflect the current wire paths.
