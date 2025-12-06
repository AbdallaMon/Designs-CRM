# AI Coding Agent Instructions for Dream Studio CRM

**Dream Studio** is a comprehensive bilingual (Arabic/English) design management CRM for interior design services. Monorepo with Next.js 15 frontend (`ui/`) and Express.js + Prisma backend (`server/`). Features real-time notifications via Socket.IO, Telegram integration with BullMQ queues, role-based access, and complex project workflows.

---

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 (App Router, Turbopack) + React 19 + Material-UI v7 + Emotion
- **Backend**: Express.js + Prisma ORM (MySQL) + Socket.IO
- **Async Jobs**: BullMQ + Redis (5 queues: telegram upload/message/channel/user/cron)
- **External**: Telegram Bot API, Stripe, Google APIs, SFTP
- **Internationalization**: Bilingual via `useLanguage` hook + RTL support

### Database (Prisma)
9+ core models: `User`, `ClientLead`, `Project`, `Task`, `Note`, `Payment`, `TelegramChannel`, `Notification`, `Contract`. Key enums: `UserRole` (9 roles), `ClientLeadStatus` (11 statuses), `NotificationType` (20+ types), `LeadSource`, `PaymentStatus`.

---

## Critical Workflows

### 1. Role-Based Authorization Pattern
**Server**: `verifyTokenAndHandleAuthorization(req, res, next, role)` middleware validates JWT token + role. Three authorization levels:
- `"ADMIN"`: ADMIN/SUPER_ADMIN only
- `"STAFF"`: STAFF, DESIGNER roles (3D/2D), ACCOUNTANT, EXECUTOR
- `"SHARED"`: All authenticated users

Token stored in **httpOnly cookie** (`token`). Decoded to extract `id`, `role`, `isSuperSales`, `isPrimary`. Token auto-refreshes when < 2 hours remaining (see `handleTokenSession` in `utility.js`).

**Frontend**: `AuthProvider` validates `/auth/status` on mount. Falls back to localStorage (`role`, `userId`). Components check `user.role` and redirect if unauthorized.

### 2. Lead & Project Lifecycle
1. **New Lead** → Status: `NEW` → Assigned to staff
2. **Status Progression**: `IN_PROGRESS` → `INTERESTED` → `NEEDS_IDENTIFIED` → `NEGOTIATING` → `FINALIZED`
3. **On FINALIZED**: 
   - Telegram channel auto-created via `telegramChannelQueue`
   - Project(s) linked to channel
   - Notes/files queued for upload to Telegram
4. **Financial**: Payment tracking via `PaymentLevel` (1-7) with `PaymentStatus` (PENDING/PARTIALLY_PAID/FULLY_PAID/OVERDUE)

### 3. Real-Time Notifications
**Socket.IO**: Users emit/receive via `io.to(userId).emit("notification", data)`. Notifications trigger when:
- Lead assigned (`LEAD_ASSIGNED`)
- Status changed (`LEAD_STATUS_CHANGE`)
- Note/file added (`NEW_NOTE`, `NEW_FILE`)
- Work stage updated (`WORK_STAGE_UPDATED`)
- Payment processed (`PAYMENT_ADDED`, `PAYMENT_STATUS_UPDATED`)

**Stored in DB**: All notifications persist in `Notification` model with `userId`, `type`, `content`, `link`, `contentType` (TEXT/HTML).

---

## Key Developer Patterns

### Frontend Data Fetching

**Pattern 1 - Custom Hook** (`src/app/helpers/hooks/useDataFetcher.js`):
```javascript
const { data, loading, page, setPage, filters, setFilters, search, setSearch, totalPages } = 
  useDataFetcher('endpoint/path', defaultFilters);
```
Use for tables/lists. Manages pagination, filtering, sorting automatically.

**Pattern 2 - Direct Function** (`src/app/helpers/functions/getData.js`):
```javascript
const response = await getData({ url: 'path', limit: 10, page: 1, filters: {...}, search: '...' });
if (response.status === 200) { /* use response.data */ }
```
Use in modals, forms when hook overkill. Response: `{ status, data, totalPages, total, extraData, message }`.

**Pattern 3 - Form Submission** (`src/app/helpers/functions/handleSubmit.js`):
```javascript
await handleRequestSubmit(formData, setLoading, 'endpoint/path', isFileUpload = false);
```
Auto-wraps fetch + shows toast (Success/Failed). Supports FormData for file uploads.

### Backend Service Architecture

**Services** (`server/services/main/`): Business logic by domain (authServices, clientServices, adminServices, etc.). Import Prisma + utilities.

**Routes** (`server/routes/`): Express routers mounted on index.js. Pattern:
```javascript
router.use(async (req, res, next) => {
  await verifyTokenAndHandleAuthorization(req, res, next, "SHARED");
});
router.get('/endpoint', async (req, res) => {
  try {
    const token = getTokenData(req, res); // Get decoded JWT
    const data = await someService(token.id);
    res.status(200).json({ data }); // Standard response
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
```

**Response Standard**: `{ status: 200, data: [...], totalPages: 1, total: 5, message: "Success" }`

### Telegram Integration (BullMQ Queues)

**5 Queues**:
1. `telegramChannelQueue` - Create channel + initial user invite
2. `telegramUploadQueue` - Batch upload notes/files to Telegram
3. `telegramMessageQueue` - Send individual messages (notes/files)
4. `telegramAddUserQueue` - Add users to existing channel
5. `telegramCronQueue` - Poll messages from Telegram (10-min intervals)

**Queue Flow**:
```javascript
// Add job
await telegramChannelQueue.add('create-channel', { clientLeadId }, { 
  jobId: `create-${clientLeadId}`, removeOnComplete: true 
});

// Worker processes
export const telegramChannelWorker = new Worker('telegram-channel-queue', 
  async (job) => { await createChannelAndAddUsers({ clientLeadId: job.data.clientLeadId }); },
  { ...connection, concurrency: 1 }
);
```
Workers run async in separate processes. Retry logic via attempts + backoff.

**Key Telegram Functions** (`server/services/telegram/telegram-functions.js`):
- `createChannelAndAddUsers()` - Create private channel, invite team + client
- `uploadItemsToTele()` - Upload queued notes/files
- `getMeagsses()` - Fetch new messages from Telegram (cron)

---

## Frontend Component Patterns

### AdminTable (`src/app/UiComponents/DataViewer/AdminTable.jsx`)
Reusable data table with pagination, edit/delete modals, document rendering.
```javascript
<AdminTable
  data={leads}
  columns={[
    { accessor: 'id', label: 'ID' },
    { accessor: 'name', label: 'Name', render: (val) => <Link href={...}>{val}</Link> }
  ]}
  page={page}
  setPage={setPage}
  limit={limit}
  totalPages={totalPages}
  onEdit={(row) => { /* open edit modal */ }}
  onDelete={(id) => { /* delete logic */ }}
/>
```

### MainForm (`src/app/UiComponents/formComponents/forms/MainForm.jsx`)
Dynamic form auto-generates fields based on `inputs` array:
```javascript
const inputs = [
  { name: 'email', type: 'email', label: 'Email', validation: { required: true } },
  { name: 'status', type: 'select', label: 'Status', options: [...] },
  { name: 'file', type: 'file', label: 'Upload' },
  { name: 'date', type: 'date', label: 'Due Date' }
];
<MainForm inputs={inputs} onSubmit={handleSubmit} />
```

### EditModal & DeleteModal
Both accept `handleAfterEdit` callback + optional pre-delete validation.

---

## Constants & Utilities

### Important Files
- `src/app/helpers/colors.js` - Theme colors + Material-UI theme config
- `src/app/helpers/constants.js` - 1300+ lines: icon mappings, status labels, role configs
- `server/services/enums.js` - Mirrors Prisma enums + conversion helpers
- `server/services/links.js` - Base URLs for notifications (dealsLink, userLink, etc.)

### Bilingual Support
```javascript
const { language } = useLanguage(); // 'AR' or 'EN'
const label = arEngName[statusKey][language]; // Returns translated string
```

---

## Common Extensions

### Add New Admin Feature
1. Create feature folder: `src/app/UiComponents/DataViewer/{feature}/`
2. Build wrapper: `<AdminTable>` + `useDataFetcher('admin/{feature}')`
3. Define columns array with accessor/label/render
4. Create backend route: `server/routes/admin.js` - Mount handler
5. Add service: `server/services/main/{feature}Services.js`

### Add New Notification Type
1. Add enum: `server/prisma/schema.prisma` - `NotificationType`
2. Create notification function: `server/services/notification.js`
3. Call from service: `await newNotificationType(...)`
4. Frontend filters: `src/app/helpers/constants.js` - Add to `NotificationType`

### Integrate External Queue Job
1. Create queue: `server/services/queues/{jobName}Queue.js` - Import `Queue` from BullMQ
2. Create worker: `server/services/workers/{jobName}Worker.js` - Import `Worker`
3. Add job: Call `queue.add('job-name', { data }, options)`
4. Import worker in `server/start-telegram-system.js` to auto-start

---

## Error Handling & Edge Cases

- **Auth failures**: `getTokenData()` returns early with 401/403 status. Always check response status.
- **Prisma errors**: Use `handlePrismaError(res, error)` wrapper
- **File uploads**: Submitted as FormData, not JSON. Pass `isFileUpload: true` to `handleRequestSubmit`
- **Telegram timeouts**: Queues have retry logic (2 attempts, 10s backoff)
- **Pagination**: Default limit=10. Server validates via `getPagination(req)` from query params

---

## Build & Local Development

```bash
# Install
npm install                    # Root (coordinates both)
cd ui && npm install          # Frontend
cd server && npm install      # Backend

# Dev
npm run dev                    # Frontend (Next.js Turbopack on :3000)
cd server && node index.js     # Backend (Express on :4000, requires Redis running)

# Telegram workers (separate terminal)
cd server && node start-telegram-system.js

# Database
npx prisma migrate deploy     # Apply migrations
npx prisma studio            # GUI browser at :5555
```

**Environment variables** (`.env.local`):
- `NEXT_PUBLIC_URL` - Backend API (e.g., `http://localhost:4000`)
- `DATABASE_URL` - MySQL connection
- `TELEGRAM_API_ID/HASH` - Telegram bot credentials
- `STRIPE_SECRET_KEY` - Stripe integration
- Others in `.env.example`

---

## Debugging Tips

1. **Auth issues**: Check `AuthProvider.jsx` - verify `/auth/status` endpoint returns user
2. **API 401/403**: Token expired or role mismatch. Check `getTokenData()` extraction
3. **Telegram not syncing**: Verify `tele-cron.js` is running + Redis connected
4. **Socket notifications not arriving**: Check `Socket.IO` connection in `NotificationIcon.jsx` + server emission in services
5. **Form field not rendering**: Verify `type` matches supported types in `MainForm.jsx` + field definition syntax

---

## Architecture Decision Record

**Why BullMQ for Telegram?** Async nature (channel creation, bulk uploads can timeout). Retries handle transient failures. Concurrency=1 prevents channel conflicts.

**Why Socket.IO for notifications?** Real-time push to clients. Persistent `Notification` table as fallback if user offline.

**Why bilingual from start?** Core business requirement. RTL styling via Emotion plugin. Translation constants in single file for maintainability.

**Why service layer?** Separates route handlers (HTTP) from business logic (reusable across routes/queues).
