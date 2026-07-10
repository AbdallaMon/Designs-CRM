// audit module data seam. The action-audit Prisma queries physically live in the shared
// infra repository (`server/src/infra/audit/action-audit.repo.js`) because the SAME table
// is written by the non-blocking `recordAction` service — keeping one Prisma seam avoids
// duplicating the model access. This module re-exports that repository as the module's
// repo (the usecase depends on it, injectable for tests). No Prisma is added here; the
// layering rule (Prisma only in `*.repo.js`) holds — the infra file is itself a repo.
export { actionAuditRepository as auditRepo } from "../../infra/audit/action-audit.repo.js";
