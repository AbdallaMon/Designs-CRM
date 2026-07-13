// Admin (management) course routes. Endpoints + middleware chain ONLY.
//
// Mounted at `/v2/courses` (legacy `/admin/courses` internal sub-paths preserved).
// Legacy guard was `verifyTokenAndHandleAuthorization(..., "ADMIN")` (ADMIN /
// SUPER_ADMIN / ADMIN-SUPER_ADMIN sub-roles / `isSuperSales`). That exact set holds
// the four COURSE_* codes in @dms/shared role-permissions (ADMIN + SUPER_ADMIN base
// roles, plus `isSuperSales` via SUPER_SALES_EXTRA_PERMISSIONS), so gating on the
// codes preserves observable access. Reads use COURSE.VIEW; content/test writes use
// COURSE.MANAGE; access grants use COURSE.ACCESS_MANAGE; attempt admin + answer
// approval use COURSE.ATTEMPT_MANAGE.
//
// ROUTE ORDER MIRRORS LEGACY `routes/courses/adminCourses.js` exactly so the static
// `/tests`, `/tests/attempts` paths resolve before the `/:courseId` and
// `/tests/:testId` dynamic segments (path collisions otherwise).
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { adminCourseController } from "./admin-course.controller.js";
import { AdminCourseValidation } from "./admin-course.validation.js";

const P = PERMISSIONS.COURSE;
const ctrl = adminCourseController;
const adminCourseRouter = Router();

adminCourseRouter.use(AuthMiddleware.requireAuth);

// ── courses ──────────────────────────────────────────────────────────────────
adminCourseRouter.get(
  "/",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(AdminCourseValidation.listQuery, "query"),
  asyncHandler(ctrl.listCourses),
);
adminCourseRouter.post(
  "/",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.createCourse),
  asyncHandler(ctrl.createCourse),
);
adminCourseRouter.get(
  "/dashboard",
  AuthMiddleware.requirePermissions([P.VIEW]),
  asyncHandler(ctrl.getDashboard),
);

// ── tests (STATIC paths first — must precede `/:courseId`) ──────────────────────
adminCourseRouter.get(
  "/tests",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(AdminCourseValidation.testOwnerQuery, "query"),
  asyncHandler(ctrl.getTests),
);
adminCourseRouter.get(
  "/tests/attempts",
  AuthMiddleware.requirePermissions([P.ATTEMPT_MANAGE]),
  validate(AdminCourseValidation.attemptsSummaryQuery, "query"),
  asyncHandler(ctrl.getAttemptsSummary),
);
adminCourseRouter.post(
  "/tests",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.testOwnerQuery, "query"),
  validate(AdminCourseValidation.createTestBody),
  asyncHandler(ctrl.createTest),
);
adminCourseRouter.get(
  "/tests/:testId",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(AdminCourseValidation.testParams, "params"),
  asyncHandler(ctrl.getTestData),
);
adminCourseRouter.put(
  "/tests/:testId",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.testParams, "params"),
  validate(AdminCourseValidation.editTestBody),
  asyncHandler(ctrl.editTest),
);
adminCourseRouter.delete(
  "/tests/:testId",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.testParams, "params"),
  asyncHandler(ctrl.deleteTest),
);
adminCourseRouter.get(
  "/tests/:testId/attempts",
  AuthMiddleware.requirePermissions([P.ATTEMPT_MANAGE]),
  validate(AdminCourseValidation.testParams, "params"),
  validate(AdminCourseValidation.userIdQuery, "query"),
  asyncHandler(ctrl.getTestAttemptsSummary),
);
// Legacy `/tests/:testId/attampts/user?userId` (note legacy mis-spelling preserved)
// — full attempt records for one user, used by the admin attempt-review screen.
adminCourseRouter.get(
  "/tests/:testId/attampts/user",
  AuthMiddleware.requirePermissions([P.ATTEMPT_MANAGE]),
  validate(AdminCourseValidation.testParams, "params"),
  validate(AdminCourseValidation.requiredUserIdQuery, "query"),
  asyncHandler(ctrl.getUserAttemptsForAdmin),
);
adminCourseRouter.post(
  "/tests/:testId/attempts/increase",
  AuthMiddleware.requirePermissions([P.ATTEMPT_MANAGE]),
  validate(AdminCourseValidation.testParams, "params"),
  validate(AdminCourseValidation.requiredUserIdQuery, "query"),
  asyncHandler(ctrl.increaseAttempt),
);
adminCourseRouter.post(
  "/tests/:testId/attempts/decrease",
  AuthMiddleware.requirePermissions([P.ATTEMPT_MANAGE]),
  validate(AdminCourseValidation.testParams, "params"),
  validate(AdminCourseValidation.requiredUserIdQuery, "query"),
  asyncHandler(ctrl.decreaseAttempt),
);
adminCourseRouter.post(
  "/tests/:testId/attempts/:attemptId/questions/:questionId/approve",
  AuthMiddleware.requirePermissions([P.ATTEMPT_MANAGE]),
  validate(AdminCourseValidation.attemptApproveParams, "params"),
  validate(AdminCourseValidation.approveAnswerBody),
  asyncHandler(ctrl.approveAnswer),
);
adminCourseRouter.post(
  "/tests/:testId/test-questions",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.testParams, "params"),
  validate(AdminCourseValidation.createQuestionBody),
  asyncHandler(ctrl.createQuestion),
);
adminCourseRouter.post(
  "/tests/:testId/test-questions/re-order",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.testParams, "params"),
  validate(AdminCourseValidation.reorderQuestionsBody),
  asyncHandler(ctrl.reorderQuestions),
);
adminCourseRouter.get(
  "/tests/:testId/test-questions/:questionId",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(AdminCourseValidation.questionParams, "params"),
  asyncHandler(ctrl.getQuestionData),
);
adminCourseRouter.put(
  "/tests/:testId/test-questions/:questionId",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.questionParams, "params"),
  validate(AdminCourseValidation.editQuestionBody),
  asyncHandler(ctrl.editQuestion),
);
adminCourseRouter.delete(
  "/tests/:testId/test-questions/:questionId",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.questionParams, "params"),
  asyncHandler(ctrl.deleteQuestion),
);

// ── course detail / edit ────────────────────────────────────────────────────────
adminCourseRouter.put(
  "/:courseId",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.courseParams, "params"),
  validate(AdminCourseValidation.editCourse),
  asyncHandler(ctrl.editCourse),
);

// ── lessons ──────────────────────────────────────────────────────────────────
adminCourseRouter.get(
  "/:courseId/lessons",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(AdminCourseValidation.courseParams, "params"),
  asyncHandler(ctrl.getLessons),
);
adminCourseRouter.post(
  "/:courseId/lessons",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.courseParams, "params"),
  validate(AdminCourseValidation.lessonBody),
  asyncHandler(ctrl.createLesson),
);
adminCourseRouter.get(
  "/:courseId/lessons/:lessonId",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(AdminCourseValidation.lessonParams, "params"),
  asyncHandler(ctrl.getLessonById),
);
adminCourseRouter.put(
  "/:courseId/lessons/:lessonId",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.lessonParams, "params"),
  validate(AdminCourseValidation.lessonBody),
  asyncHandler(ctrl.editLesson),
);
adminCourseRouter.post(
  "/:courseId/lessons/:lessonId/home-works/toggle",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.lessonParams, "params"),
  validate(AdminCourseValidation.toggleHomework),
  asyncHandler(ctrl.toggleHomework),
);
adminCourseRouter.delete(
  "/:courseId/lessons/:lessonId",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.lessonParams, "params"),
  asyncHandler(ctrl.deleteLesson),
);

// ── lesson videos ────────────────────────────────────────────────────────────
adminCourseRouter.get(
  "/:courseId/lessons/:lessonId/videos",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(AdminCourseValidation.lessonParams, "params"),
  asyncHandler(ctrl.getVideos),
);
adminCourseRouter.post(
  "/:courseId/lessons/:lessonId/videos",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.lessonParams, "params"),
  validate(AdminCourseValidation.videoBody),
  asyncHandler(ctrl.createVideo),
);
adminCourseRouter.put(
  "/:courseId/lessons/:lessonId/videos/:videoId",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.videoParams, "params"),
  validate(AdminCourseValidation.videoBody),
  asyncHandler(ctrl.editVideo),
);
adminCourseRouter.delete(
  "/:courseId/lessons/:lessonId/videos/:videoId",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.videoParams, "params"),
  asyncHandler(ctrl.deleteVideo),
);

// ── lesson video pdfs (more specific than /videos/:videoId — register after) ──────
adminCourseRouter.get(
  "/:courseId/lessons/:lessonId/videos/:videoId/pdfs",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(AdminCourseValidation.videoPdfParams, "params"),
  asyncHandler(ctrl.getVideoPdfs),
);
adminCourseRouter.post(
  "/:courseId/lessons/:lessonId/videos/:videoId/pdfs",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.videoPdfParams, "params"),
  validate(AdminCourseValidation.videoPdfBody),
  asyncHandler(ctrl.createVideoPdf),
);
adminCourseRouter.delete(
  "/:courseId/lessons/:lessonId/videos/:videoId/pdfs/:pdfId",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.videoPdfDeleteParams, "params"),
  asyncHandler(ctrl.deleteVideoPdf),
);

// ── lesson pdfs ────────────────────────────────────────────────────────────────
adminCourseRouter.get(
  "/:courseId/lessons/:lessonId/pdfs",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(AdminCourseValidation.lessonParams, "params"),
  asyncHandler(ctrl.getPdfs),
);
adminCourseRouter.post(
  "/:courseId/lessons/:lessonId/pdfs",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.lessonParams, "params"),
  validate(AdminCourseValidation.pdfBody),
  asyncHandler(ctrl.createPdf),
);
adminCourseRouter.put(
  "/:courseId/lessons/:lessonId/pdfs/:pdfId",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.pdfParams, "params"),
  validate(AdminCourseValidation.pdfBody),
  asyncHandler(ctrl.editPdf),
);
adminCourseRouter.delete(
  "/:courseId/lessons/:lessonId/pdfs/:pdfId",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.pdfParams, "params"),
  asyncHandler(ctrl.deletePdf),
);

// ── lesson links ───────────────────────────────────────────────────────────────
adminCourseRouter.get(
  "/:courseId/lessons/:lessonId/links",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(AdminCourseValidation.lessonParams, "params"),
  asyncHandler(ctrl.getLinks),
);
adminCourseRouter.post(
  "/:courseId/lessons/:lessonId/links",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.lessonParams, "params"),
  validate(AdminCourseValidation.linkBody),
  asyncHandler(ctrl.createLink),
);
adminCourseRouter.put(
  "/:courseId/lessons/:lessonId/links/:linkId",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.linkParams, "params"),
  validate(AdminCourseValidation.linkBody),
  asyncHandler(ctrl.editLink),
);
adminCourseRouter.delete(
  "/:courseId/lessons/:lessonId/links/:linkId",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AdminCourseValidation.linkParams, "params"),
  asyncHandler(ctrl.deleteLink),
);

// ── allowed roles / lesson access / homeworks ─────────────────────────────────────
adminCourseRouter.get(
  "/:courseId/allowed-roles",
  AuthMiddleware.requirePermissions([P.ACCESS_MANAGE]),
  validate(AdminCourseValidation.courseParams, "params"),
  asyncHandler(ctrl.getAllowedRoles),
);
adminCourseRouter.get(
  "/:courseId/lessons/:lessonId/allowed-users",
  AuthMiddleware.requirePermissions([P.ACCESS_MANAGE]),
  validate(AdminCourseValidation.accessParams, "params"),
  asyncHandler(ctrl.getAllowedUsers),
);
adminCourseRouter.post(
  "/:courseId/lessons/:lessonId/allowed-users",
  AuthMiddleware.requirePermissions([P.ACCESS_MANAGE]),
  validate(AdminCourseValidation.accessParams, "params"),
  validate(AdminCourseValidation.grantAccessBody),
  asyncHandler(ctrl.grantAccess),
);
adminCourseRouter.delete(
  "/:courseId/lessons/:lessonId/allowed-users/:accessId",
  AuthMiddleware.requirePermissions([P.ACCESS_MANAGE]),
  validate(AdminCourseValidation.accessDeleteParams, "params"),
  asyncHandler(ctrl.deleteAccess),
);
adminCourseRouter.get(
  "/:courseId/lessons/:lessonId/home-works",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(AdminCourseValidation.lessonParams, "params"),
  asyncHandler(ctrl.getHomeworks),
);

export { adminCourseRouter };
