// client-portal/payments dto — pure output-shaping helpers for the Stripe billing KV. Lifted
// VERBATIM from the legacy `services/main/client/payments.js` (`first`/`asKV`); no logic
// change. `first` returns the first non-empty stringy value (else ""); `asKV` flattens an
// object into the legacy `{ key, value }[]` shape persisted on `clientLead.stripieMetadata`.
export const first = (...vals) =>
  vals.find((v) => v !== undefined && v !== null && `${v}`.trim() !== "") ?? "";

export const asKV = (obj) =>
  Object.entries(obj).map(([key, value]) => ({ key, value: value ?? "" }));
