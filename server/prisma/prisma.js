// SHIM (Stage 1): the canonical Prisma client now lives in `@dms/db`.
// This path is kept so every existing `import prisma from ".../prisma/prisma.js"`
// keeps working unchanged. Do not instantiate a client here.
export { prisma, default } from "@dms/db";
