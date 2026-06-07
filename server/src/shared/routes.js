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

export default router;
