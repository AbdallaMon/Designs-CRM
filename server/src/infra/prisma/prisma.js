// Canonical in-server Prisma module (Stage 2a): the single infra prisma export.
// Re-exports the canonical singleton (server/prisma/prisma.js -> @dms/db) so there
// is exactly one client process-wide. The previous duplicate `infra/prisma.js`
// re-export was removed and its importers repointed here.
// (The sibling abandoned multi-file `*.prisma` WIP in this folder is NOT the live
// schema source and is left untouched.)
export { prisma, default } from "../../../prisma/prisma.js";
