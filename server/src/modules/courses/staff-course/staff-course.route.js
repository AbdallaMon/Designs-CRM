// Staff (course-consumption) routes. Endpoints + middleware chain ONLY.
//
// Mounted at `/v2/staff-courses` (legacy was `/shared/courses`; the contract index
// §12 renames the base to `/staff-courses`, internal sub-paths preserved). Legacy
// guard was `verifyTokenAndHandleAuthorization(..., "SHARED")` — ANY authenticated
// role. Encoded as STAFF_COURSE.VIEW / .TAKE, granted to every role via SHARED_AUTHED
// in @dms/shared role-permissions, so gating on the codes preserves observable access.
//
// Object-level access:
//   - course/lesson visibility is gated by the published flag + CourseRole match +
//     the lesson-access/previous-lesson gates inside the usecase (ported 1:1).
//   - per-attempt reads are OWNER-scoped via `checkIfUserCanAccessAttempt`
//     (requireSpecialChecker) — the IDOR gate for `/tests/:testId/attampts/:attamptId`.
//
// ROUTE ORDER MIRRORS LEGACY: static `/dashboard` and `/tests/...` precede the
// `/:courseId` dynamic segment.
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { staffCourseController } from "./staff-course.controller.js";
import { StaffCourseValidation as V } from "./staff-course.validation.js";

const P = PERMISSIONS.STAFF_COURSE;
const ctrl = staffCourseController;
const staffCourseRouter = Router();

staffCourseRouter.use(AuthMiddleware.requireAuth);

// ── courses ──────────────────────────────────────────────────────────────────
staffCourseRouter.get(
  "/",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(V.listQuery, "query"),
  asyncHandler(ctrl.listCourses),
);
staffCourseRouter.get(
  "/dashboard",
  AuthMiddleware.requirePermissions([P.VIEW]),
  asyncHandler(ctrl.getDashboard),
);

// ── tests (STATIC paths first — must precede `/:courseId`) ──────────────────────
staffCourseRouter.get(
  "/tests/:testId",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(V.testParams, "params"),
  asyncHandler(ctrl.getTest),
);
staffCourseRouter.get(
  "/tests/:testId/test-questions",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(V.testParams, "params"),
  asyncHandler(ctrl.getTestQuestions),
);
staffCourseRouter.get(
  "/tests/:testId/attampts",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(V.testParams, "params"),
  asyncHandler(ctrl.getUserAttempts),
);
staffCourseRouter.get(
  "/tests/:testId/attampts/:attamptId",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(V.attemptParams, "params"),
  AuthMiddleware.requireSpecialChecker(ctrl.checkIfUserCanAccessAttempt),
  asyncHandler(ctrl.getUserAttempt),
);
staffCourseRouter.post(
  "/tests/:testId/attampts",
  AuthMiddleware.requirePermissions([P.TAKE]),
  validate(V.testParams, "params"),
  asyncHandler(ctrl.createAttempt),
);
staffCourseRouter.post(
  "/tests/:testId/attampts/:attemptId/questions/:questionId",
  AuthMiddleware.requirePermissions([P.TAKE]),
  validate(V.submitAnswerParams, "params"),
  validate(V.submitAnswerBody),
  // C1: submit-answer is OWNER-scoped (param spelled `attemptId`). Blocks cross-user
  // answer injection (IDOR). Mounted after requirePermissions, before the handler.
  AuthMiddleware.requireSpecialChecker(ctrl.checkIfUserCanMutateAttempt),
  asyncHandler(ctrl.submitAnswer),
);
staffCourseRouter.put(
  "/tests/:testId/attampts/:attemptId",
  AuthMiddleware.requirePermissions([P.TAKE]),
  validate(V.endAttemptParams, "params"),
  // C2: end-attempt is OWNER-scoped (param spelled `attemptId`). Blocks ending /
  // re-scoring another user's attempt (IDOR).
  AuthMiddleware.requireSpecialChecker(ctrl.checkIfUserCanMutateAttempt),
  asyncHandler(ctrl.endAttempt),
);

// ── course detail / lessons / homework ────────────────────────────────────────────
staffCourseRouter.get(
  "/:courseId",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(V.courseParams, "params"),
  validate(V.roleQuery, "query"),
  asyncHandler(ctrl.getCourse),
);
staffCourseRouter.get(
  "/:courseId/progress",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(V.courseParams, "params"),
  asyncHandler(ctrl.getCourseProgress),
);
staffCourseRouter.get(
  "/:courseId/lessons/:lessonId",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(V.lessonParams, "params"),
  validate(V.roleQuery, "query"),
  asyncHandler(ctrl.getLesson),
);
// Mark lesson complete — legacy `PATCH /:courseId/lessons/:lessonId` converted to the
// `/actions/complete` convention (CONTRACT CHANGE #4; never PATCH a status).
staffCourseRouter.post(
  "/:courseId/lessons/:lessonId/actions/complete",
  AuthMiddleware.requirePermissions([P.TAKE]),
  validate(V.lessonParams, "params"),
  asyncHandler(ctrl.markLessonComplete),
);
staffCourseRouter.get(
  "/:courseId/lessons/:lessonId/home-work",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(V.lessonParams, "params"),
  asyncHandler(ctrl.getHomeworks),
);
staffCourseRouter.post(
  "/:courseId/lessons/:lessonId/home-work",
  AuthMiddleware.requirePermissions([P.TAKE]),
  validate(V.lessonParams, "params"),
  validate(V.homeworkBody),
  asyncHandler(ctrl.createHomework),
);

export { staffCourseRouter };
