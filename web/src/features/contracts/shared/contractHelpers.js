/**
 * Helper functions for contract forms
 */

export const sum = (arr) => arr.reduce((a, b) => a + (Number(b) || 0), 0);

/**
 * The contract editors keep UI-only fields on their rows (`conditionItem` on
 * payments, `file` on drawings). The backend contract schema is `.strict()`
 * (mass-assignment hardening), so those keys must be dropped before submit —
 * otherwise the request fails with a 422 "invalid data". These map each row to
 * exactly the fields the backend whitelists.
 */
export const sanitizePaymentsForSubmit = (payments = []) =>
  payments.map((p) => ({
    amount: p.amount,
    note: p.note ?? "",
    condition: p.condition ?? "",
    conditionId: p.conditionId ?? null,
    type: p.type ?? "",
  }));

export const sanitizeDrawingsForSubmit = (drawings = []) =>
  drawings
    // the backend requires a non-empty url per drawing; drop blank rows the
    // user may have added but not filled in.
    .filter((d) => d.url && String(d.url).trim())
    .map((d) => ({
      url: d.url,
      fileName: d.fileName ?? "",
    }));
