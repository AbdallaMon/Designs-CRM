// English mirror of the PRISMA-KNOWN message CODES (namespace "prismaKnowMessages").
// CODE → English. Mirrors keys 1:1 with ../prisma.js (the Arabic map). Bilingual Phase 1.
// Safety net: if a raw Prisma error code ever leaks through the envelope it still resolves
// to a human English string instead of the raw "P2002".

export const prismaKnowMessagesEn = {
  P2002: "This data already exists",
  P2003: "The operation can't be completed because this item is linked to other items",
  P2014: "The operation violates the relation between the data",
  P2025: "The requested item was not found",
  P2000: "One of the entered values is longer than allowed",
  P2011: "A required field is empty",
  // Generic prisma-known fallback used by the namespace lookup when the exact P-code
  // is not listed above.
  PRISMA_KNOWN_ERROR: "An error occurred while processing the data, please try again",
};
