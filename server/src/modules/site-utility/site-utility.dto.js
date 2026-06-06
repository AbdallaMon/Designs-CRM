// Output shaping for the site-utility module. Pure (no Prisma). The underlying
// rows have no secrets/ciphertext, so shaping is light: we pass the row through
// and (for payment conditions) attach per-record `capabilities.*` hints so the
// admin UI can gate edit/delete without re-deriving the rules.

/**
 * Per-record action hints for a contract payment condition. The route already
 * gates by permission code; `inUse` reflects the server-side delete invariant
 * (a condition linked to existing ContractPayment rows cannot be deleted).
 *
 * @param {object} row     the ContractPaymentCondition row
 * @param {object} ctx
 * @param {boolean} ctx.canEdit    caller holds the edit code
 * @param {boolean} ctx.canDelete  caller holds the delete code
 * @param {boolean} [ctx.inUse]    condition is referenced by a ContractPayment
 */
export function computePaymentConditionCapabilities(
  row,
  { canEdit, canDelete, inUse = false },
) {
  return {
    canEdit: Boolean(canEdit),
    // Even with the delete permission, an in-use condition is not deletable.
    canDelete: Boolean(canDelete) && !inUse,
    inUse: Boolean(inUse),
  };
}

/**
 * Shape a single payment condition for the list/detail response.
 * @param {object} row
 * @param {object} [capabilities]
 */
export function toPaymentConditionDto(row, capabilities) {
  return capabilities ? { ...row, capabilities } : { ...row };
}
