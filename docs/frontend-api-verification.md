# Frontend ↔ Backend API Verification

Generated 2026-07-11. Cross-check of **every** frontend endpoint (from [frontend-api-inventory.md](frontend-api-inventory.md)) against the real backend routes + Zod validation. Verified by 10 agents reading **both sides** (FE call site payload vs BE route + `validate()` schema + controller).

Legacy→`/v2` path remapping (`web/src/app/helpers/functions/apiPathMap.js`) and the dual mount (`app.js:50-51` mounts the router at **both** root and `/v2`) were accounted for.

## Result at a glance

| Area | Missing | Validation mismatch | OK |
|---|---|---|---|
| Auth / notifications / infra | 0 | 0 | 17 |
| Dashboard / reports / cc / audit | 0 | 0 | 20 |
| Leads / sales-stages | **1** | 0 | 37 |
| Projects / tasks / delivery | 0 | **1** | 22 |
| Accounting | 0 | **3** | 21 |
| Chat (staff + client) | **1** | **2** | 21 |
| Image sessions | 0 | **2** | 40 |
| Contracts / site-utility | 0 | **1** | 30 |
| Users / telegram | 0 | 0 | 20 |
| Calendar / questions / client-page | **1** | **1** | 24 |
| **Total** | **3** | **10** | **~252** |

The overwhelming majority (~252 endpoints) exist and validate correctly. Below are the **13 problems**, split as requested.

---

# ❌ A. Missing endpoints (no backend route → 404)

| # | Frontend call | Maps to | FE source | Why it's missing |
|---|---|---|---|---|
| A1 | `PUT shared/work-stages/${lead.id}/cost` | `/v2/work-stages/:id/cost` | features/leads/tabs/ExtraTabs.jsx:176 | **No `/work-stages` router is mounted** in `server/src/shared/routes.js`. `apiPathMap` only special-cases `shared/work-stages/calls`→`leads/calls`; everything else under `shared/work-stages/*` falls through to an unmounted `work-stages/*`. This surface was never migrated. |
| A2 | `POST shared/chat/rooms/${roomId}/leave` | `/v2/chat/rooms/:roomId/leave` | features/chat/hooks/useChatRooms.js:243 (wired ChatContainer.jsx:226) | `chat.route.js` has **no `/leave` HTTP route**. "Leave" exists only as a Socket.IO handler that unsubscribes the socket (does not change membership). FE HTTP call → 404. |
| A3 | `POST shared/calendar-management/add-custom/${dayId}` | `/v2/calendar-management/add-custom/:dayId` | features/meeting/calendar/TimeSlotManager.jsx:173 ("Add Custom" slot) | **No route + no controller method.** The logic exists only as an orphaned usecase `addCutsomDateImpl` (availability.usecase.js:300) + repo `createCustomSlot`, never wired into `availability.route.js`. (Also latent: that impl expects `{fromHour,toHour,dayId,timeZone}` while FE sends `{dayId,startTime,endTime}`.) |

---

# ⚠️ B. Validation mismatches (route exists, but FE payload is rejected)

All of these throw **422 VALIDATION_ERROR** (or silently drop data) because the request doesn't match the backend Zod schema. `validate()` uses `safeParse`, and `.strict()` schemas **reject** unknown keys (they don't strip them).

## 🔴 Critical / High

| # | Endpoint | Problem | FE sends | BE expects | FE source → BE source |
|---|---|---|---|---|---|
| B1 | **Client chat — entire read surface (6 endpoints)**: fetch-room, messages, message-page, pinned, members, files | Client backend is **token-based** (derives room from `token`, the IDOR fix), but the FE still sends **`clientId=` and no `token`**. Every client chat read → 422. The whole public client chat is non-functional. | `?clientId=…` | `?token=…` (required, non-empty) | features/chat/hooks/useChatMessages.js, useChatRoom.js, useChatMembers.js, useChatFiles.js, window/ChatWindow.jsx → server/src/modules/chat/client/client-chat.validation.js |
| B2 | **POST `client/contracts/generate-pdf`** | FE adds a top-level `sessionStatus` key; BE schema is `.strict()` and does **not** whitelist it → 422. **Breaks client contract e-signing entirely** (both draw + image-upload paths). | `{ ...contractData, sessionStatus }` | `.strict()` without `sessionStatus` | features/contracts/client/ContractSignature.jsx:327,406 → modules/contracts/client/client-contract.validation.js:52-60 |
| B3 | **POST `client/calendar/book`** | FE posts the **entire `sessionData`** (selectedDate, dayId, token, …); BE `.strict()` accepts only `selectedSlot` + `selectedTimezone` → 422. **Breaks public booking confirm.** | whole `sessionData` object | `{ selectedSlot, selectedTimezone }` | features/meeting/calendar/ClientBooking.jsx:192 → modules/calendar/client/client-calendar.validation.js:23-31 |
| B4 | **POST `accounting/payments/:id/actions/pay`** (money) | The pay form always registers a hidden `paymentId` field; BE `pay` schema is `.strict()` with only `{amount, issuedDate, file}` → 422 on **every** pay attempt. Hits both callers (OverduePayments **and** the Kanban card). | `{ amount, issuedDate, file, paymentId }` | `.strict() { amount, issuedDate, file }` | accountant/payments/config/overduePaymentsConfig.js:18-21 & Kanban card:96 → modules/accounting/payment/payment.validation.js:36-42 |

## 🟠 Medium

| # | Endpoint | Problem | FE sends | BE expects | FE source → BE source |
|---|---|---|---|---|---|
| B5 | **POST `admin/leads/update/:id`** (Save Telegram link) | Single-field-update contract is `{ field, [field]: value }`, but this caller omits `field` → 422. (The other two callers of this endpoint send the correct shape.) | `{ telegramLink }` | `{ field: "telegramLink", telegramLink }` | features/work-stages/utility/TelegramLink.jsx:33-41 → modules/admin-residual/admin-leads/admin-leads.validation.js:29-34 |
| B6 | **POST `admin/commissions`** | BE requires `commissionReason` (`.min(1)`); FE only guards `amount`+`leadId` and treats reason as optional → 422 on empty reason. | `{ amount, leadId, commissionReason? }` | `commissionReason` required | features/accountant/AdminCommissionForm.jsx:34,42 → modules/admin-residual/commissions/commissions.validation.js:14-21 |
| B7 | **Chat file search (staff + client)** | FE sends `q=<term>` but both schemas/usecase read `search`. Non-strict Zod strips `q` silently → the file-search box **never filters** (no error, just wrong results). | `?q=<term>` | `?search=<term>` | features/chat/hooks/useChatFiles.js:58,61 → modules/chat (files query schema) |
| B8 | **DELETE `client/image-session/images/:imageId`** | FE sends empty body `{}`; BE `deleteImage` is `.strict()` and **requires `token`** (session resolved from it) → 422. Removing a selected image in the client flow is broken. | `{}` | `{ token }` | features/image-session/client-session/ImageComponent.jsx:43-51 → modules/image-sessions/client/client-image-session.validation.js:79 |

## 🟡 Low / edge

| # | Endpoint | Problem | FE sends | BE expects | FE source → BE source |
|---|---|---|---|---|---|
| B9 | **POST `client/image-session/generate-pdf`** (admin "Regenerate PDF" shortcut only) | FE sends only `{ sessionData, signatureUrl }`; BE `.strict()` requires `sessionStatus` (+ `signatureUrl` must match the SSRF relative-path regex) → 422. The main client signature call sends all fields and is fine. | `{ sessionData, signatureUrl }` | `{ …, sessionStatus }` | features/image-session/users/ClientSessionImageManager.jsx:326-335 → modules/image-sessions/client/client-image-session.validation.js:121-128 |
| B10 | **POST `accounting/salaries/monthly/pay`** | `totalHoursWorked` must be `>0` (FE seeds from logged hours = 0 when none logged); `paymentDate` defaults to `null` with no client guard → 422 in those cases. | `{ totalHoursWorked: 0, paymentDate: null, … }` | `totalHoursWorked > 0`, `paymentDate` required | features/accountant/MonthlySalaryDialog.jsx:28-54 → modules/accounting/salary/salary.validation.js:47-58 |

---

# 📝 C. Related pure-frontend bug found during the sweep

Not an API contract issue, but it breaks the same flow:
- **`accountant/payments/OverduePayments.jsx`** — `handleBeforeSubmit` uses `handleRequestSubmit` and `setLoading` **without importing them**, and its config has no `file` input, so the §5 pay button throws client-side before any request is even sent (separate from B4).

---

# ✅ D. Verified OK (highlights)

~252 endpoints exist with matching validation. Notable ones that were double-checked and pass:
- **Reports** (`/admin/reports/*`) — the raw-origin `fetch` (bypassing `/v2`) works because `app.js` mounts the router at root too; schema is `.nullish().passthrough()` (permissive by design). **No 404.**
- **Telegram** `v2/telegram/auth/*` — the literal `v2/` prefix resolves to a **single** `/v2` (no double-prefix bug); hits the `/v2` mount correctly.
- **Contract payment change-status** — both the flat and nested route shapes exist and are both used.
- **Dashboard `staffId`** — accepted but ignored for non-admins (forced to `req.auth.id`); no observable break for self-view (documented IDOR tightening).
- Chat **staff** rooms/messages/members/files (post the `/rooms/` fix), leads core+tabs, projects/tasks/delivery, image-session admin CRUD, users/profiles/auto-assignments.

---

# Recommended fix order

1. **B1 (client chat token)** and **A2 (chat leave)** — the public client chat is fully broken; combine with the earlier `/rooms/` fix.
2. **B4 (payment pay)** — money endpoint broken for everyone; strip `paymentId` from the pay body (or relax the schema).
3. **B2 / B3 (client contract sign, client booking)** — public flows fully broken; drop the extra body keys the strict schemas reject.
4. **B8 / B9 (client image-session delete/regenerate)** — send `token` / `sessionStatus`.
5. **B5 / B6 / B7 / B10 / A1 / A3 / C** — smaller/edge; A1 & A3 need backend routes (decide: migrate the route or drop the FE feature).
