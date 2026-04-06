# Frontend API Report: V2 Client Booking Leads

## Base Rules

- Base path: `/v2/client/booking-leads`
- Content type: `application/json`
- Credentials: `include`
- All responses are JSON.
- The backend returns a mapped form object, not the raw database row.
- If a field was not saved yet, the backend returns `null` for that field.

## Shared Response Shape

Every successful endpoint returns this shape:

```json
{
  "id": 123,
  "status": "IN_PROGRESS",
  "submittedAt": null,
  "location": "Dubai",
  "projectType": null,
  "projectStage": null,
  "previousWork": null,
  "hasArchitecturalPlan": null,
  "serviceType": null,
  "decisionMaker": null,
  "name": null,
  "phone": null,
  "email": null,
  "contactAgreement": null,
  "contactInitialPriceAgreement": null
}
```

Field meaning:

- `id`: the booking lead id. Frontend must store this for all next requests.
- `status`: `IN_PROGRESS` or `SUBMITTED`.
- `submittedAt`: ISO date string or `null`.
- All other fields map directly to the booking form values.

## 1. Create Lead

Endpoint:

```text
POST /v2/client/booking-leads
```

What frontend sends:

```json
{
  "location": "Dubai"
}
```

Frontend expectations:

- `location` is required.
- `location` must be a string.
- This is step 1.
- Frontend should await this request.
- Frontend must save the returned `id` and use it for get, patch, and submit.

What backend sends back on success:

- Status code: `201`
- Body:

```json
{
  "id": 123,
  "status": "IN_PROGRESS",
  "submittedAt": null,
  "location": "Dubai",
  "projectType": null,
  "projectStage": null,
  "previousWork": null,
  "hasArchitecturalPlan": null,
  "serviceType": null,
  "decisionMaker": null,
  "name": null,
  "phone": null,
  "email": null,
  "contactAgreement": null,
  "contactInitialPriceAgreement": null
}
```

What backend sends back on failure:

- Status code: `400` if `location` is missing or invalid.
- Body:

```json
{
  "message": "location is required"
}
```

## 2. Get Lead

Endpoint:

```text
GET /v2/client/booking-leads/:leadId
```

What frontend sends:

- Only the `leadId` in the URL.

Frontend expectations:

- Use this to refill the form from saved data.
- If some fields are not created in the database yet, they come back as `null` and should be ignored by the frontend comparison logic.
- If `status` is `SUBMITTED`, the frontend can reset the form or show the completed state.

What backend sends back on success:

- Status code: `200`
- Body: same shared response shape.

Example:

```json
{
  "id": 123,
  "status": "IN_PROGRESS",
  "submittedAt": null,
  "location": "Dubai",
  "projectType": "Villa",
  "projectStage": null,
  "previousWork": null,
  "hasArchitecturalPlan": "Yes",
  "serviceType": null,
  "decisionMaker": null,
  "name": null,
  "phone": null,
  "email": null,
  "contactAgreement": null,
  "contactInitialPriceAgreement": null
}
```

What backend sends back on failure:

- Status code: `404` if the lead does not exist.
- Body:

```json
{
  "message": "Booking lead not found"
}
```

## 3. Update One Step Field

Endpoint:

```text
PATCH /v2/client/booking-leads/:leadId
```

What frontend sends:

- Exactly one field only in the request body.
- One request per changed field.

Allowed fields:

- `location`
- `projectType`
- `projectStage`
- `previousWork`
- `hasArchitecturalPlan`
- `serviceType`
- `decisionMaker`
- `name`
- `phone`
- `email`
- `contactAgreement`
- `contactInitialPriceAgreement`

Example requests:

```json
{
  "projectType": "Apartment"
}
```

```json
{
  "email": "client@example.com"
}
```

```json
{
  "contactAgreement": true
}
```

Frontend expectations:

- Do not send more than one field in the same patch request.
- Text fields must be strings.
- Agreement fields must be booleans.
- This route is safe for fire-and-forget usage.
- If the lead is already submitted, patching should stop on the frontend because the backend rejects it.

What backend sends back on success:

- Status code: `200`
- Body: same shared response shape, with the updated field reflected.

What backend sends back on failure:

- Status code: `400` if more than one field is sent or the field is invalid.
- Status code: `400` if email format is invalid.
- Status code: `400` if phone format is invalid.
- Status code: `409` if the lead is already submitted.

Example error bodies:

```json
{
  "message": "PATCH requires exactly one supported field per request"
}
```

```json
{
  "message": "email must be a valid email address"
}
```

```json
{
  "message": "Booking lead is already submitted and cannot be updated"
}
```

## 4. Final Submit

Endpoint:

```text
PUT /v2/client/booking-leads/:leadId/submit
```

What frontend sends:

- Full final payload with all fields.

Required request body:

```json
{
  "location": "Dubai",
  "projectType": "Apartment",
  "projectStage": "Ready",
  "previousWork": "Instagram link",
  "hasArchitecturalPlan": "Yes",
  "serviceType": "Design",
  "decisionMaker": "Myself",
  "name": "John Doe",
  "phone": "+971500000000",
  "email": "john@example.com",
  "contactAgreement": true,
  "contactInitialPriceAgreement": true
}
```

Frontend expectations:

- All fields are required.
- All text values must be non-empty strings.
- `contactAgreement` must be `true`.
- `contactInitialPriceAgreement` must be `true`.
- Frontend should await this request.
- After success, frontend should treat the flow as finished.
- On submit, backend checks existing clients by email first, then phone.
- If a client already exists, backend links the lead to that existing client and removes the temporary draft client record when no lead references it.
- Backend generates a lead code at submit time (internal behavior, not currently included in API response).

What backend sends back on success:

- Status code: `200`
- Body:

```json
{
  "id": 123,
  "status": "SUBMITTED",
  "submittedAt": "2026-04-06T12:00:00.000Z",
  "location": "Dubai",
  "projectType": "Apartment",
  "projectStage": "Ready",
  "previousWork": "Instagram link",
  "hasArchitecturalPlan": "Yes",
  "serviceType": "Design",
  "decisionMaker": "Myself",
  "name": "John Doe",
  "phone": "+971500000000",
  "email": "john@example.com",
  "contactAgreement": true,
  "contactInitialPriceAgreement": true
}
```

What backend sends back on failure:

- Status code: `400` if any required field is missing.
- Status code: `400` if email is invalid.
- Status code: `400` if phone is invalid.
- Status code: `400` if either agreement value is not `true`.
- Status code: `409` if email and phone point to two different existing clients.

Example error bodies:

```json
{
  "message": "name is required"
}
```

```json
{
  "message": "contactAgreement must be accepted"
}
```

```json
{
  "message": "Cannot submit: email and phone are linked to different existing clients"
}
```

## Frontend Integration Notes

- The frontend should call `/v2/client/booking-leads`, not the old `/client/booking-leads` path.
- Create first, then store `id`.
- Use `PATCH` for step saves, one field at a time.
- Use `GET` to restore saved progress.
- If `GET` returns `status: "SUBMITTED"`, consider the form completed and clear local draft state.
- Use `PUT /submit` only for the final submission.
