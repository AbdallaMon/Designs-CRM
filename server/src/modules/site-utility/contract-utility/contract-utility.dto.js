// Output shaping for the contract-utility sub-module. Pure (no Prisma). The rows
// carry no secrets/ciphertext, so shaping is light — pass-through with `capabilities`
// hints on the aggregate read so the admin UI can gate edit without re-deriving rules.

/**
 * Shape the aggregate /details payload. The clause lists are passed through as-is
 * (already ordered by the repo); `capabilities.canEdit` reflects the caller's
 * edit permission so the FE can render the editor read-only when missing.
 *
 * @param {object|null} utility ContractUtility row with stage/special/level clauses
 * @param {object} ctx
 * @param {boolean} ctx.canEdit caller holds CONTRACT_UTILITY_EDIT
 */
export function toContractUtilityDetailsDto(utility, { canEdit = false } = {}) {
  if (!utility) {
    return {
      utility: null,
      stageClauses: [],
      specialClauses: [],
      levelClauses: [],
      capabilities: { canEdit: Boolean(canEdit) },
    };
  }
  const { stageClauses, specialClauses, levelClauses, ...rest } = utility;
  return {
    // Flatten the obligations onto the top-level object too, preserving the legacy
    // shape (the editor read `data.obligationsPartyOneAr` directly off /details).
    ...rest,
    utility: rest,
    stageClauses: stageClauses ?? [],
    specialClauses: specialClauses ?? [],
    levelClauses: levelClauses ?? [],
    capabilities: { canEdit: Boolean(canEdit) },
  };
}
