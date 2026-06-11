# Client / Public Routes — Legacy → Current (v2) Map

This is the reference for every **client / public-facing** surface in Dream Studio, mapping the
legacy scheme to the current (v2) scheme — both the **backend API** and the **frontend public
pages**.

## How the move works

- **Backend.** In legacy, all client-facing sub-routers were aggregated **pathless** under
  `/client` by `server/routes/client/...` via `server/routes/clients/clients.js` (so e.g.
  `/client/new-lead`, `/client/pay`, `/client/upload-chunk`). The `clients` router had **no
  router-level auth** — each client endpoint authenticates by its own means (an email/phone in
  the body, or a per-resource **token**: booking-fee Stripe session, meeting token, contract
  e-sign token, image-session token, chat-room token).
- In the migrated app these become layered modules mounted under **`/v2/client/*`** (the v2
  aggregate router is mounted at `/v2` in `server/src/app.js` via `app.use("/v2", v2Routes)`;
  there is **no `/api/v1`** — decision #1 locked the API base permanently as `/v2`). **Paths are
  preserved 1:1** under the new prefix — e.g. legacy `/client/pay` → `/v2/client/pay`.
- **Public by design.** Every surface below stays **public (no `requireAuth` /
  `requirePermissions` / permission code)** — a prospective client has no session. Several v2
  modules add an **IDOR close**: the target resource is derived from the **verified token /
  session**, not from a client-supplied id (noted per-row).
- **Frontend.** The public client pages moved from legacy top-level routes (`/booking`,
  `/contracts`, `/image-session`, `/chats`) to the v2 feature routes under
  `/v2/...`. The old top-level paths are kept alive as **redirect shells** because **frozen
  services still emit legacy URLs** (contract PDFs bake `${OLDORIGIN}/contracts?token=...`;
  image-session emails send `${OLDORIGIN}/image-session?token=...`; chat share-links use
  `/chats?roomId=&token=`). The shells forward all query params, so in-the-wild links keep
  working indefinitely.

> Source of truth for the backend mounts: `server/src/shared/routes.js`. Each client module's
> route file documents its own legacy origin in a header comment.

---

## Backend client API

All current paths are relative to the API base + `/v2`. Method + path + purpose + the legacy path
it replaces.

### 1. Lead funnel — public website lead register / booking

Two **distinct** surfaces (different fields, different flow):

- **Public website lead funnel** (category / item / price submissions) — legacy
  `routes/client/leads.js`, mounted pathless under `/client`. → v2 module
  `leads/client/public-lead`, mounted pathless under `/v2/client`.
- **Step-based booking draft funnel** (`bookingRequestStatus` draft, one field per PATCH) — v2
  module `leads/client/booking-lead`, mounted under `/v2/client/booking-leads`.

| Method | Current path | Purpose | Legacy path |
|---|---|---|---|
| POST | `/v2/client/new-lead` | Create a website lead (category/item/price). | `/client/new-lead` |
| POST | `/v2/client/new-lead/register` | Register a draft lead by email; name/phone optional (draft placeholders). | `/client/new-lead/register` |
| POST | `/v2/client/new-lead/complete-register/:leadId` | Complete a draft lead with the rich form; also fixes up the client's real name/phone. | `/client/new-lead/complete-register/:leadId` |
| POST | `/v2/client/cooperation-requests` | Partner/cooperation contact form → email only (no DB write). | `/client/cooperation-requests` |
| POST | `/v2/client/booking-leads` | Start a booking draft (creates a placeholder client + IN_PROGRESS lead). | `/client/booking-leads` (booking funnel) |
| GET | `/v2/client/booking-leads/:leadId` | Read the current booking draft state. | `/client/booking-leads/:leadId` |
| PATCH | `/v2/client/booking-leads/:leadId` | Save one booking-funnel field (step). | `/client/booking-leads/:leadId` |
| PUT | `/v2/client/booking-leads/:leadId/submit` | Submit the booking draft. **Sends the client a "thanks" email** + notifies admins. | `/client/booking-leads/:leadId/submit` |

> **Recently changed (master `fdefbbf`, ported here):** the register step tolerates a missing
> name/phone (draft placeholders `"draft"` / `"+0123456789"`, phone space-stripped); the
> complete-register step writes back the real name/phone. **(master `03ca4d3`, ported here):** a
> booking-fee/booking submit now sends the client a thank-you email.

### 2. Payments — pay / check (status) / backfill

Legacy `routes/client/payments.js`, mounted pathless under `/client`. → v2 module
`client-portal/payments`, mounted pathless under `/v2/client`. 🔒 Stripe SDK calls relocated
verbatim (no webhook/signature logic in this flow).

| Method | Current path | Purpose | Legacy path |
|---|---|---|---|
| POST | `/v2/client/pay` | Create a $0 "book now" Stripe checkout session + email the payment reminder. Returns `{ url }`. | `/client/pay` |
| GET | `/v2/client/payment-status` | **The "check":** verify a checkout session; on `paid`, mark the lead `FULLY_PAID`, persist billing metadata, email success. | `/client/payment-status` |
| GET | `/v2/client/stripe/backfill` | Secret-gated maintenance no-op (legacy early-returned null). | `/client/stripe/backfill` |

> **IDOR close (v2 hardening, kept):** legacy `/payment-status` marked the **client-supplied**
> `clientLeadId` paid once any session came back `paid`. v2 derives the target lead from the
> **verified Stripe session `metadata.clientLeadId`** and rejects a mismatch (403).
> `/stripe/backfill` fails **closed** if its dedicated secret is unset.

### 3. Uploads (frozen chunk handlers)

Legacy `routes/client/uploads.js`, pathless under `/client`. → v2 module
`client-portal/uploads`, pathless under `/v2/client`. 🔒 The chunk mechanism + frozen
`uploadAsChunk`/`uploadAsHttp` handlers are unchanged (only the multer wiring relocated).

| Method | Current path | Purpose | Legacy path |
|---|---|---|---|
| POST | `/v2/client/upload-chunk` | Chunked file upload (lead attachments / signatures). | `/client/upload-chunk` |
| POST | `/v2/client/api/upload` | Single in-memory HTTP upload. | `/client/api/upload` |

> Distinct from `/v2/files/client/*` (a separately re-implemented storage provider). The legacy
> third endpoint `POST /upload` was dead (commented) and is not mapped.

### 4. Notes

Legacy `routes/client/notes.js`, pathless under `/client`. → v2 module `client-portal/notes` at
`/v2/client/notes`.

| Method | Current path | Purpose | Legacy path |
|---|---|---|---|
| GET | `/v2/client/notes` | List notes for a lead-related entity. | `/client/notes` |
| POST | `/v2/client/notes` | Create a note (author forced to ADMIN by the frozen service). | `/client/notes` |

> **Hardening:** `idKey` is constrained to a lead-related allow-list; bodies are `.strict()`.

### 5. Languages (lookup)

Legacy `routes/client/languages.js`, pathless under `/client`. → v2 module
`client-portal/languages` at `/v2/client/languages`.

| Method | Current path | Purpose | Legacy path |
|---|---|---|---|
| GET | `/v2/client/languages` | Read-only language lookup the website consumes before any client identity exists. | `/client/languages` |

### 6. Contracts — public e-sign

Legacy `routes/contract/client-contract.js`, mounted at `/client/contracts`. → v2 module
`contracts/client` at `/v2/client/contracts`. Authenticated by the per-session `Contract.arToken`
e-sign token.

| Method | Current path | Purpose | Legacy path |
|---|---|---|---|
| GET | `/v2/client/contracts/session` | Read the e-sign session for the token. | `/client/contracts/session` |
| PUT | `/v2/client/contracts/session/status` | Advance the signing status. | `/client/contracts/session/status` |
| POST | `/v2/client/contracts/generate-pdf` | 🔒 Build + upload the signed contract PDF (frozen `buildAndUploadContractPdf`). | `/client/contracts/generate-pdf` |

> **IDOR close:** the session is derived **from the token**, never a client-supplied `id`.

### 7. Image-session — public image selection

Legacy: **two** routers both mounted at `/client/image-session`
(`routes/image-session/client-image-session.js` + the extras `routes/client/image-session.js`).
→ combined in v2 module `image-sessions/client` at `/v2/client/image-session`. Authenticated by
the per-session `ClientImageSession.token`.

| Method | Current path | Purpose | Legacy path |
|---|---|---|---|
| GET | `/v2/client/image-session/page-info` | Session page info. | `/client/image-session/page-info` |
| GET | `/v2/client/image-session/pros-and-cons` | Pros & cons reference data. | `/client/image-session/pros-and-cons` |
| GET | `/v2/client/image-session/session` | Read the session for the token. | `/client/image-session/session` |
| PUT | `/v2/client/image-session/session/status` | Advance the session status. | `/client/image-session/session/status` |
| GET / POST | `/v2/client/image-session/colors` | Read / save selected colors. | `/client/image-session/colors` |
| GET / POST | `/v2/client/image-session/materials` | Read / save selected materials. | `/client/image-session/materials` |
| GET / POST | `/v2/client/image-session/styles` | Read / save selected styles. | `/client/image-session/styles` |
| GET / POST | `/v2/client/image-session/images` | Read / save selected images. | `/client/image-session/images` |
| DELETE | `/v2/client/image-session/images/:imageId` | Remove a selected image (token-scoped). | `/client/image-session/images/:imageId` |
| POST | `/v2/client/image-session/generate-pdf` | 🔒 Inline sync frozen image-session PDF. | `/client/image-session/generate-pdf` |
| GET | `/v2/client/image-session/data` | (extras) Model reference data. | `/client/image-session/data` |
| POST | `/v2/client/image-session/save-patterns` | (extras) Save chosen patterns. | `/client/image-session/save-patterns` |
| POST | `/v2/client/image-session/save-images` | (extras) Save the image selection. | `/client/image-session/save-images` |

> **IDOR close:** session derived from the token; the extras `GET /images` (shadowed/dead in
> legacy) and the duplicate `POST /save-images` are intentionally not mapped. `signatureUrl` is
> SSRF-locked to a safe relative upload path.

### 8. Calendar — public booking

Legacy `routes/calendar/client-calendar.js`, mounted at `/client/calendar`. → v2 module
`calendar/client` at `/v2/client/calendar`. Authenticated by the per-meeting `MeetingReminder.token`.

| Method | Current path | Purpose | Legacy path |
|---|---|---|---|
| GET | `/v2/client/calendar/meeting-data` | Meeting details for the token. | `/client/calendar/meeting-data` |
| GET | `/v2/client/calendar/available-days` | Bookable days. | `/client/calendar/available-days` |
| GET | `/v2/client/calendar/slots` | Available slots for a day. | `/client/calendar/slots` |
| GET | `/v2/client/calendar/slots/details` | Slot details. | `/client/calendar/slots/details` |
| GET | `/v2/client/calendar/timezones` | Supported timezones. | `/client/calendar/timezones` |
| POST | `/v2/client/calendar/book` | Book a slot. | `/client/calendar/book` |

> **IDOR close:** `reminderId` / `clientLeadId` / `adminId` are derived from the token, never the body.

### 9. Chat — public client chat

Legacy `routes/client/chat/{rooms,messages,members,files}.js`, mounted under `/client/chat`. →
v2 module `chat/client` at `/v2/client/chat`. Authenticated by the per-room
`ChatRoom.chatAccessToken`.

| Method | Current path | Purpose | Legacy path |
|---|---|---|---|
| GET | `/v2/client/chat/rooms/validate-token` | Validate a room access token. | `/client/chat/rooms/validate-token` |
| GET | `/v2/client/chat/rooms/:roomId` | Read room metadata. | `/client/chat/rooms/:roomId` |
| GET | `/v2/client/chat/rooms/:roomId/members` | List room members. | `/client/chat/rooms/:roomId/members` |
| GET | `/v2/client/chat/rooms/:roomId/files` | List room files. | `/client/chat/rooms/:roomId/files` |
| GET | `/v2/client/chat/:roomId/messages` | List messages. | `/client/chat/:roomId/messages` |
| GET | `/v2/client/chat/:roomId/messages/:messageId/page` | Paginate to a specific message. | `/client/chat/:roomId/messages/:messageId/page` |
| GET | `/v2/client/chat/:roomId/pinned-messages` | List pinned messages. | `/client/chat/:roomId/pinned-messages` |

> **IDOR close:** the room + client member are derived **from the token**; any `:roomId` that
> differs from the token's room is rejected.

---

## Frontend — public client pages

Legacy top-level public routes were replaced by v2 feature routes under `/v2/...`. The old paths
are kept as **redirect shells** (forwarding all query params) because frozen services / in-the-wild
links still point at them.

| Legacy URL | Current URL | Redirect shell | Notes |
|---|---|---|---|
| `/booking` | `/v2/booking` | `web/src/app/booking/page.jsx` | Public booking funnel. Forwards funnel deep-link query. |
| `/contracts?token=&lng=` | `/v2/contracts-sign?token=&lng=` | `web/src/app/contracts/page.jsx` | Public contract e-sign. Shell must resolve **indefinitely** — frozen contract PDFs bake `${OLDORIGIN}/contracts?token=...`. |
| `/image-session?token=&lng=` | `/v2/client-image-session?token=&lng=` | `web/src/app/image-session/page.jsx` | Public image-selection. Shell must resolve indefinitely — frozen emails send `${OLDORIGIN}/image-session?token=...`. |
| `/chats?roomId=&token=` | `/v2/client-chat?roomId=&token=` | `web/src/app/chats/page.jsx` | Public client chat. Shell kept for in-the-wild share-links. |

v2 page sources:

- `web/src/app/(v2-features)/v2/booking/page.jsx`
- `web/src/app/(v2-features)/v2/contracts-sign/page.jsx`
- `web/src/app/(v2-features)/v2/client-image-session/page.jsx`
- `web/src/app/(v2-features)/v2/client-chat/page.jsx`

### Stripe success / cancel

The frozen Stripe checkout (`/v2/client/pay`) sets `success_url` / `cancel_url` to
`${ORIGIN}/success?...` and `${ORIGIN}/cancel?...`. Those landing pages live on the **public
website project** (the funnel front-end), not in this `web/` app; they call back into
`/v2/client/payment-status` to verify. No redirect shell exists here for them.
