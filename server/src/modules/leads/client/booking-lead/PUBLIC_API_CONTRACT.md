# Public funnel capability contract

Public draft IDs are identifiers, not credentials. All capability tokens below are opaque,
short-lived, purpose-scoped JWTs. Clients must keep them in memory or same-tab session storage,
must not put them in URLs, and send them only over HTTPS.

Public lead creation payloads may include `source`. Browser clients send
`window.location.origin`; the server normalizes it to an HTTP(S) origin. When omitted, the
database default is `https://booking.ahmadmobayed.com`.

## Booking draft

- `POST /v2/client/booking-leads` creates a draft. Its envelope `data` contains the required
  funnel fields plus `capabilityToken` and `capabilityExpiresIn`.
- `GET /v2/client/booking-leads/:leadId` requires
  `x-funnel-token: <capabilityToken>`.
- `PATCH /v2/client/booking-leads/:leadId` requires the same header and still accepts exactly
  one supported draft field.
- `POST /v2/client/booking-leads/:leadId/actions/submit` requires the same header. This replaces
  the former `PUT /v2/client/booking-leads/:leadId/submit` endpoint.

The token purpose is `BOOKING_LEAD`, and its subject is the created `leadId`. A missing,
expired, malformed, wrong-purpose, or differently bound token returns the standard `401`
`INVALID_TOKEN` envelope.

## Website register draft and attachment

1. `POST /v2/client/new-lead/register` returns only the draft funnel fields plus
   `capabilityToken` and `capabilityExpiresIn`. The token purpose is `PUBLIC_REGISTER`, bound
   to `data.id`.
2. If an attachment is needed, exchange that token with
   `POST /v2/files/client/capabilities` and body
   `{ "purpose": "PUBLIC_LEAD", "funnelToken": "<capabilityToken>" }`.
3. Upload with `POST /v2/files/client/single?purpose=PUBLIC_LEAD` or
   `POST /v2/files/client/chunks?purpose=PUBLIC_LEAD`, sending the returned upload token in
   `x-upload-token`.
4. Complete with `POST /v2/client/new-lead/complete-register/:leadId`, body containing the
   final form data, and `x-funnel-token: <capabilityToken>`.

Attachments are register-first only. `POST /v2/client/new-lead` no longer accepts a caller-
supplied `url`; the complete step accepts only the safe content URL returned by the upload
bound to that same draft lead.

Email alone can no longer mint an upload credential. Upload tokens are issued only while the
bound lead remains an incomplete registration draft. Public lead attachments allow validated
PNG, JPEG, WebP, and PDF content; contract and image-session signature uploads allow validated
PNG, JPEG, and WebP content. HTML, SVG, scripts, executables, extension/MIME mismatches, more
than 100 chunks, and files over the purpose-specific total-size limit are rejected with the
standard API error envelope.
