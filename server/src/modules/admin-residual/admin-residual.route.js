// Administrative modules that share the /v2/admin namespace. Each sub-router declares
// action-specific permission codes; ADMIN/SUPER_ADMIN profiles receive every permission.
//
// Sub-surface mounts:
//   /reports/*               → /v2/admin/reports/*           (reportsRouter)
//   /commissions*            → /v2/admin/commissions*        (commissionsRouter)
//   /fixed-data*             → /v2/admin/fixed-data*         (fixedDataRouter — writes only)
//   /projects + create-group → /v2/admin/projects*           (adminProjectsRouter)
//   /model/archived/:id      → /v2/admin/model/archived/:id  (modelArchiveRouter)
//   /leads/* , /client/* , /client-leads/* , /new-lead → /v2/admin/* (adminLeadsRouter)
import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { reportsRouter } from "./reports/reports.route.js";
import { commissionsRouter } from "./commissions/commissions.route.js";
import { fixedDataRouter } from "./fixed-data/fixed-data.route.js";
import { adminProjectsRouter } from "./admin-projects/admin-projects.route.js";
import { modelArchiveRouter } from "./model-archive/model-archive.route.js";
import { adminLeadsRouter } from "./admin-leads/admin-leads.route.js";

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
