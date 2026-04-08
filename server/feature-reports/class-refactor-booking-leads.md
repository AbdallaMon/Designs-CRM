# Class Refactor — Booking Leads (Client)

## Summary

Refactored `v2/modules/leads/client` from standalone exported functions to a class-based architecture. Added `express-rate-limit` for all booking lead endpoints. Updated `leads.client.module.js` to wire classes together and export the router as a named export.

## Files Updated

| File                                                  | Change                                                                                       |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `v2/modules/leads/client/booking-leads.repository.js` | Exported functions → `BookingLeadsRepository` class                                          |
| `v2/modules/leads/client/booking-leads.usecase.js`    | Exported functions → `BookingLeadsUsecase` class (receives repository)                       |
| `v2/modules/leads/client/booking-leads.controller.js` | Exported functions → `BookingLeadsController` class (receives usecase, arrow method binding) |
| `v2/modules/leads/client/booking-leads.routes.js`     | Static router → `createBookingLeadsRouter(controller)` factory + rate limiters               |
| `v2/modules/leads/client/leads.client.module.js`      | Wires Repository → Usecase → Controller → Router; exports `bookingLeadsRouter` (named)       |
| `v2/shared/routes.js`                                 | Switched from default import to named `{ bookingLeadsRouter }`                               |

## API Changes

None — endpoints, methods, request/response shapes are identical.

## Rate Limiting Added

| Endpoint                         | Window | Max Requests |
| -------------------------------- | ------ | ------------ |
| `POST /` (create)                | 15 min | 10           |
| `PUT /:leadId/submit`            | 15 min | 5            |
| `GET /:leadId`, `PATCH /:leadId` | 15 min | 60           |

## Architecture Pattern

```
leads.client.module.js          ← wiring / composition root
  ├── BookingLeadsRepository    ← Prisma queries only
  ├── BookingLeadsUsecase       ← business rules, receives repository
  ├── BookingLeadsController    ← req/res handling, receives usecase
  └── createBookingLeadsRouter  ← route factory, receives controller
```

Each new sub-feature can add its own Repository/Usecase/Controller class and export an additional router from the module file without affecting existing code.

## Data/Model Changes

None.

## Validation/Security

- Input validation unchanged (same validation functions).
- Rate limiting protects create (10/15min) and submit (5/15min) against abuse.
- `standardHeaders: true` returns `RateLimit-*` headers per draft-6 spec.

## Manual Test Checklist

1. `POST /v2/client/booking-leads` — creates lead, returns 201
2. `GET /v2/client/booking-leads/:id` — returns lead data
3. `PATCH /v2/client/booking-leads/:id` — updates single field
4. `PUT /v2/client/booking-leads/:id/submit` — submits lead, returns success message
5. Exceed 10 POSTs in 15 min → 429 with rate limit message
6. Exceed 5 submits in 15 min → 429 with rate limit message

## Risks/Known Limitations

- Rate limiter uses in-memory store by default. For multi-instance deployments, swap to a Redis store (`rate-limit-redis`).
- `buildLeadUpdatedContent` helper from old usecase was unused and has been removed.
