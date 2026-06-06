// The ONE singleton Prisma client for the whole monorepo.
//
// IMPORTANT (Stage 1 / strangler constraint): this keeps the EXACT generation
// and instantiation behavior the legacy app already relies on —
//   - default `@prisma/client` output (no custom output dir),
//   - no driver adapter (the reference's mariadb adapter is intentionally NOT
//     adopted here),
//   - `new PrismaClient()` so every existing `import prisma from
//     ".../prisma/prisma.js"` resolves to the same instance.
//
// DATABASE_URL is provided by the process that boots the app (server loads its
// own `.env` before anything imports this). This module deliberately does NOT
// load its own env, to avoid changing behavior or env precedence.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

const prisma =
  process.env.NODE_ENV === "production"
    ? new PrismaClient()
    : globalForPrisma.__dmsPrisma || (globalForPrisma.__dmsPrisma = new PrismaClient());

export { prisma };
export default prisma;
