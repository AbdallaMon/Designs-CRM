# Public lead source and funnel compatibility design

Date: 2026-08-16

## Scope

- Add `ClientLead.source` as a required origin string with database default
  `https://booking.ahmadmobayed.com`.
- Public lead and booking clients send `window.location.origin`; paths, query strings, and
  hashes are never persisted.
- Preserve the current public capability model: draft IDs are identifiers, while
  `x-funnel-token` and `x-upload-token` authorize continuation and upload.
- Make completion/submission a single-winner workflow with conditional database claims.
- Classify only the explicitly cookie-independent public funnel mutations as CSRF-exempt;
  authenticated application mutations remain protected.
- Repair the external `C:\coding\eng-ahmed\eng-ahmed` register and booking clients to consume
  the canonical v2 envelope and capability contract.

## Data contract

`ClientLead.source String @default("https://booking.ahmadmobayed.com") @db.VarChar(255)` is
additive and non-null. MySQL backfills existing records through the column default. Public
validation accepts only HTTP(S) URLs and normalizes accepted values to their URL origin.

The field is written by:

- `POST /v2/client/new-lead`
- `POST /v2/client/new-lead/register`
- `POST /v2/client/new-lead/complete-register/:leadId`
- `POST /v2/client/booking-leads`

The CRM lead detail projection exposes it and the lead preview renders it as an external link.

## Capability lifecycle

The external register client stores short-lived capabilities in same-tab memory and
`sessionStorage`, keyed by purpose and lead ID. Tokens are never put in URLs. A lead ID without
the matching browser-local capability cannot resume and restarts safely. Uploads exchange the register capability at
`/v2/files/client/capabilities`, then call `/v2/files/client/chunks?purpose=PUBLIC_LEAD` with
`x-upload-token`. Completion and payment send `x-funnel-token`.

The booking client uses `/v2/client/booking-leads`, unwraps `envelope.data`, stores the returned
booking capability, sends it on GET/PATCH/submit, and submits through
`POST /:leadId/actions/submit`.

## Atomicity

Public completion performs `updateMany` against the draft description before any notification;
only `count === 1` wins. Booking submission similarly claims
`bookingRequestStatus != SUBMITTED` inside its existing transaction. Losing requests return the
existing coded conflict and do not send email or notifications.

## Security and compatibility

- CSRF exemption is path-specific and does not bypass capability, validation, rate limiting, or
  CORS.
- The integration credential master key remains environment-only and is never committed to an
  example file as a real value.
- PDF-generation code remains untouched because it is behavior-frozen.
- The old vulnerable `xlsx` parser is replaced by the already-used `exceljs`. The root override
  supplies patched `uuid@11.1.1`; a fail-closed postinstall metadata patch declares the compatible
  range that upstream ExcelJS has not yet released. Spreadsheet import tests, `npm ls`, and
  `npm audit` verify the result.
