import { Router } from "express";
import { bookingLeadsRouter } from "../modules/leads/client/booking-lead/booking-leads.routes.js";
import { leadRouter } from "../modules/leads/lead/lead.routes.js";
import { userRouter } from "../modules/users/user/user.routes.js";
import { telegramRouter } from "../modules/telegram/auth/telegram.routes.js";
import { chatRouter } from "../modules/chat/chat.routes.js";
import { uploadRouter } from "../modules/upload/upload.routes.js";
import { siteUtilityRouter } from "../modules/site-utility/site-utility.routes.js";
import { adminCourseRouter } from "../modules/courses/admin-course/admin-course.routes.js";
import { staffCourseRouter } from "../modules/courses/staff-course/staff-course.routes.js";
import { projectRouter } from "../modules/projects/project/project.routes.js";
import { taskRouter } from "../modules/projects/task/task.routes.js";
import { updateRouter } from "../modules/projects/update/update.routes.js";
import { deliveryRouter } from "../modules/projects/delivery/delivery.routes.js";
import { accountingRouter } from "../modules/accounting/accounting.routes.js";

import authRoutes from "../modules/auth/auth.routes.js";
const router = Router();

router.use("/auth", authRoutes);

router.use("/client/booking-leads", bookingLeadsRouter);
// Authenticated leads-management surface (legacy `/shared/client-leads`, kept mounted
// in parallel during the strangler window). Object scope enforced per `/:id` route.
router.use("/leads", leadRouter);
// Users — three merged legacy surfaces: the authed directory pick-lists (legacy
// `/shared/all-chat-users` etc. — the chat module consumes `/v2/users/directory`), the
// admin user-management endpoints (legacy `/admin/users*`), and self-profile (legacy
// `/shared/users/:userId/profile`, now object-scope checked — the IDOR fix). Legacy
// routers stay mounted in parallel during the strangler window.
router.use("/users", userRouter);
router.use("/telegram", telegramRouter);
router.use("/chat", chatRouter);
router.use("/files", uploadRouter);
router.use("/site-utilities", siteUtilityRouter);
// Courses / LMS — admin management surface (legacy `/admin/courses`) and staff
// consumption surface (legacy `/shared/courses`). Both mount under `/v2`; legacy
// routers stay mounted in parallel (strangler) until cutover.
router.use("/courses", adminCourseRouter);
router.use("/staff-courses", staffCourseRouter);

// Projects domain — four coupled surfaces centered on the Project/ClientLead entity
// (legacy `/shared/{projects,tasks,updates,delivery}`, kept mounted in parallel during
// the strangler window). A single shared project-scope checker enforces object access
// (the IDOR fix); legacy `/:id/...` sub-resources had no consistent scope check.
router.use("/projects", projectRouter);
router.use("/tasks", taskRouter);
router.use("/updates", updateRouter);
router.use("/delivery", deliveryRouter);

// Accounting — the MONEY-sensitive accountant surface (legacy `/accountant/*`, kept
// mounted in parallel during the strangler window). Auth once at the aggregate router;
// every route is gated by an ACCOUNTING.* code granted to the ACCOUNTANT role only —
// reproducing the legacy ACCOUNTANT-only gate exactly. Money workflow actions
// (pay / mark-overdue / change-level) use `/:id/actions/*` with strict money validation.
router.use("/accounting", accountingRouter);

export default router;
