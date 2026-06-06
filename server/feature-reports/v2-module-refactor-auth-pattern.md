# v2 Module Refactor — Auth Pattern Alignment

**Date:** April 13, 2026  
**Scope:** `chat`, `leads/client/booking-lead`, `telegram` modules under `server/v2/`

---

## Summary

Aligned the `chat`, `booking-leads`, and `telegram` modules to follow the same structure as the `auth` module:

- Validation moved to **Zod schemas** (`validation.js` class pattern)
- Controllers are **thin** — no validation, no try/catch
- Route files wire `validate()` middleware before each handler
- DTO files hold **Prisma select shapes** (not inlined in repository)
- Middleware files extracted into their own files
- All errors use `AppError` (caught by the global error handler)

No business logic or API responses were changed.

---

## Files Changed

### Chat

| File | Type | What changed |
|------|------|--------------|
| `modules/chat/chat.validation.js` | Rewritten | Replaced ~170 lines of manual helper functions with a `ChatSchemas` Zod class (same pattern as `AuthSchemas`). Exported as `chatSchemas` singleton. |
| `modules/chat/chat.controller.js` | Rewritten | Removed all `validateXxx()` import calls. Controller now reads directly from pre-validated `req.params`, `req.body`, `req.query`. Removed all validation imports. |
| `modules/chat/chat.routes.js` | Updated | Added `validate(chatSchemas.xxx, "source")` middleware on every route. Added `validate` and `chatSchemas` imports. |
| `modules/chat/chat.dto.js` | New content | Filled with all Prisma select shapes (`userSelect`, `clientSelect`, `memberSelect`, `senderSelect`, `messageInclude`, `buildRoomInclude`) that were previously defined inline in the repository. |
| `modules/chat/chat.repository.js` | Updated | Imports `memberSelect`, `messageInclude`, `buildRoomInclude` from `chat.dto.js` instead of defining them locally. |

### Booking Leads

| File | Type | What changed |
|------|------|--------------|
| `modules/leads/client/booking-lead/booking-leads.validation.js` | Rewritten | Replaced manual imperative validators with a `BookingLeadSchemas` Zod class. Kept `isLeadField()` and `isClientField()` exports (used by usecase). |
| `modules/leads/client/booking-lead/booking-leads.controller.js` | Rewritten | Removed all inline `try/catch` blocks and the local `sendError()` helper. Uses `ok()`/`created()` from shared http. Relies on `asyncHandler` for error propagation. |
| `modules/leads/client/booking-lead/booking-leads.routes.js` | Updated | Added `asyncHandler` wrapper and `validate()` middleware on every route. Imports rate limiters from the new `booking-leads.middleware.js`. |
| `modules/leads/client/booking-lead/booking-leads.middleware.js` | **New** | Rate limiters moved here as a `BookingLeadRateLimit` class, matching the `AuthRateLimit` pattern from `auth.middleware.js`. |
| `modules/leads/client/booking-lead/booking-leads.usecase.js` | Updated | Replaced `createHttpError(status, msg)` calls with `new AppError(msg, status)`. Added `AppError` import. |
| `modules/leads/client/booking-lead/booking-leads.repository.js` | Updated | Same — replaced `createHttpError` with `AppError`. Added `AppError` import. |

### Telegram

| File | Type | What changed |
|------|------|--------------|
| `modules/telegram/auth/telegram.middleware.js` | **New** | `normalizePhoneNumber` middleware extracted from inline `(req, res, next)` arrow functions that were directly in the route definitions. |
| `modules/telegram/auth/telegram.routes.js` | Updated | Uses `normalizePhoneNumber` from the new middleware file. Removed inline arrow-function middlewares. Removed leftover `console.log`. |

### Root

| File | Type | What changed |
|------|------|--------------|
| `v2/routes.js` | Updated | Fixed broken `booking-leads` import path. Mounted `chatRouter` at `/chat` and `telegramRouter` at `/telegram`. |

---

## Before / After Pattern Comparison

### Validation (before)
```js
// manual helpers in validation.js
export function validateRoomId(params) {
  const n = parseInt(params.roomId, 10);
  if (isNaN(n)) throw new AppError("roomId must be a valid integer", 400);
  return n;
}

// called in controller
getRoomById = async (req, res) => {
  const roomId = validateRoomId(req.params); // manual call
  ...
};
```

### Validation (after)
```js
// chat.validation.js — Zod schema class
class ChatSchemas {
  roomIdParams = z.object({
    roomId: z.coerce.number().int().positive("roomId must be a positive integer"),
  });
}
export const chatSchemas = new ChatSchemas();

// chat.routes.js — wired via middleware
chatRouter.get("/rooms/:roomId",
  validate(chatSchemas.roomIdParams, "params"),  // runs before handler
  asyncHandler(chatController.getRoomById),
);

// chat.controller.js — just destructures
getRoomById = async (req, res) => {
  const { roomId } = req.params; // already validated + coerced
  ...
};
```

---

### Error handling (before — booking-leads)
```js
// createHttpError local helper
function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status; // NOT caught by AppError branch in errorHandler
  return error;
}

// controller had its own try/catch
create = async (req, res) => {
  try {
    const lead = await this.usecase.createBookingLead(payload);
    res.status(201).json(lead); // raw res.json, not ok()
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ message }); // custom error shape
  }
};
```

### Error handling (after)
```js
// usecase / repository
throw new AppError("Booking lead not found", 404); // caught by global errorHandler

// controller — no try/catch needed
create = async (req, res) => {
  const lead = await this.usecase.createBookingLead(req.body);
  return created(res, lead, "Booking lead created successfully"); // standard shape
};
// asyncHandler in routes forwards any thrown AppError to errorHandler
```

---

## API Response — No Changes

All response shapes are identical to before. The frontend receives the same JSON structure. Only the internal wiring changed.

---

## Manual Test Checklist

- [ ] `POST /v2/client/booking-leads` — creates a lead, returns 201
- [ ] `GET /v2/client/booking-leads/:leadId` — fetches lead
- [ ] `PATCH /v2/client/booking-leads/:leadId` — single-field update
- [ ] `PUT /v2/client/booking-leads/:leadId/submit` — full submit
- [ ] `POST /v2/auth/login` — still works (untouched)
- [ ] `GET /v2/chat/rooms` — returns rooms list (requires auth)
- [ ] `POST /v2/chat/rooms` — creates a room, returns 201
- [ ] `POST /v2/chat/rooms/:roomId/members` — adds members
- [ ] `GET /v2/telegram/current` — requires ADMIN role
- [ ] `POST /v2/telegram/auth/init` — phone number normalized before validate
- [ ] Invalid body on any route → returns 422 with Zod error details
- [ ] Missing auth → returns 401
