// admin-residual — aggregate router for the residual `/admin` (ADMIN gate) surface NOT
// owned by an earlier migrated module (legacy `routes/admin/admin.js`, kept mounted in
// parallel during the strangler window). Mounted under `/v2/admin`. Authentication is
// mounted ONCE here; each sub-router declares its per-route ADMIN_RESIDUAL.* permission
// codes, granted to ADMIN/SUPER_ADMIN base + isSuperSales (via SUPER_SALES_EXTRA_PERMISSIONS)
// so the effective set matches the legacy "ADMIN" gate's `isAdmin` union EXACTLY (ADMIN/
// SUPER_ADMIN base + isSuperSales + ADMIN/SUPER_ADMIN sub-roles) — without widening any other
// base role. A plain STAFF/sales/designer/accountant is 403'd on every route here.
//
// NOTE: the legacy `/admin` router ALSO mounted user-management (→ migrated users module),
// `/admin/image-session` (→ image-sessions module) and `/admin/courses` (→ courses module).
// Those are NOT re-mounted here — they stay on legacy under the strangler and are already on
// `/v2` via their own modules. This aggregate carries ONLY the genuine residual.
//
// Sub-surface → mount (legacy `/admin/*` → v2 `/v2/admin/*`, paths 1:1):
//   /reports/*               → /v2/admin/reports/*           (reportsRouter)
//   /commissions*            → /v2/admin/commissions*        (commissionsRouter)
//   /fixed-data*             → /v2/admin/fixed-data*         (fixedDataRouter — writes only)
//   /projects + create-group → /v2/admin/projects*           (adminProjectsRouter)
//   /model/archived/:id      → /v2/admin/model/archived/:id  (modelArchiveRouter)
//   /leads/* , /client/* , /client-leads/* , /new-lead → /v2/admin/* (adminLeadsRouter)
import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { reportsRouter } from "./reports/reports.routes.js";
import { commissionsRouter } from "./commissions/commissions.routes.js";
import { fixedDataRouter } from "./fixed-data/fixed-data.routes.js";
import { adminProjectsRouter } from "./admin-projects/admin-projects.routes.js";
import { modelArchiveRouter } from "./model-archive/model-archive.routes.js";
import { adminLeadsRouter } from "./admin-leads/admin-leads.routes.js";

const router = Router();

// Authentication mounted once for the whole admin-residual surface.
router.use(AuthMiddleware.requireAuth);

router.use("/reports", reportsRouter);
router.use("/commissions", commissionsRouter);
router.use("/fixed-data", fixedDataRouter);
router.use("/projects", adminProjectsRouter);
router.use("/model", modelArchiveRouter);
// adminLeadsRouter owns several top-level admin paths (/leads/*, /client/*, /client-leads/*,
// /new-lead) so it mounts at the aggregate root.
router.use("/", adminLeadsRouter);

export { router as adminResidualRouter };
