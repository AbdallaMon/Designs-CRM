// Thin controller for the staff (course-consumption) surface. Reads validated input
// (Zod coerced numeric params), delegates to the usecase, responds via envelope
// helpers. No business logic here.
//
// Object-scope: `/attempts/:attamptId` is gated by `checkIfUserCanAccessAttempt`
// (wired in the routes) — the controller method below is the thin entry point.
import { ok, created } from "../../../shared/http/response.js";
import {
  coursesMessagesCodes,
  messagesNames,
  hasPermission,
  PERMISSIONS,
} from "@dms/shared";
import { staffCourseUsecase } from "./staff-course.usecase.js";
import {
  decorateStaffCourseList,
  decorateStaffCourseDetail,
} from "./staff-course.dto.js";

const TK = messagesNames.coursesMessages;

function paginate(query) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

class StaffCourseController {
  // ── Object-scope checker (attempts are owner-scoped) — wired via requireSpecialChecker.
  // Throws AppError(403/404) on denial; returns the loaded (id,userId) row on success.
  checkIfUserCanAccessAttempt(req) {
    return staffCourseUsecase.checkIfUserCanAccessAttempt({
      attemptId: parseInt(req.params.attamptId, 10),
      authUserId: req.auth.id,
    });
  }

  // ── Object-scope checker for attempt MUTATIONS (C1 submit-answer / C2 end-attempt).
  // NOTE: these routes spell the param `attemptId` (not the read path's `attamptId`),
  // so this reads `req.params.attemptId`. Throws 403/404 on denial; returns the row.
  checkIfUserCanMutateAttempt(req) {
    return staffCourseUsecase.checkIfUserCanMutateAttempt({
      attemptId: parseInt(req.params.attemptId, 10),
      authUserId: req.auth.id,
    });
  }

  // ── courses ──────────────────────────────────────────────────────────────────
  async listCourses(req, res) {
    const { page, limit, skip, take } = paginate(req.query);
    const courses = await staffCourseUsecase.listCourses({
      skip,
      take,
    });
    const items = decorateStaffCourseList(courses, {
      permissions: req.auth.permissions,
    });
    // Legacy `getCourses` did NOT return a total; preserve the array but normalize to
    // the paginated envelope (CONTRACT CHANGE #7). total === items.length for parity.
    return ok(
      res,
      { items, total: items.length, page, pageSize: limit },
      coursesMessagesCodes.COURSES_FETCHED,
      TK,
    );
  }

  async getDashboard(req, res) {
    const data = await staffCourseUsecase.getUserDashboardStats({
      userId: req.auth.id,
    });
    return ok(res, data, coursesMessagesCodes.DASHBOARD_FETCHED, TK);
  }

  async getCourse(req, res) {
    const course = await staffCourseUsecase.getCourse({
      courseId: req.params.courseId,
      userId: req.auth.id,
    });
    const data = decorateStaffCourseDetail(course, {
      permissions: req.auth.permissions,
    });
    return ok(res, data, coursesMessagesCodes.COURSE_FETCHED, TK);
  }

  async getCourseProgress(req, res) {
    const data = await staffCourseUsecase.getUserCourseProgress({
      courseId: req.params.courseId,
      userId: req.auth.id,
    });
    return ok(res, data, coursesMessagesCodes.PROGRESS_FETCHED, TK);
  }

  // ── lessons ──────────────────────────────────────────────────────────────────
  async getLesson(req, res) {
    const data = await staffCourseUsecase.getLesson({
      lessonId: req.params.lessonId,
      userId: req.auth.id,
    });
    return ok(res, data, coursesMessagesCodes.LESSON_FETCHED, TK);
  }

  // Mark-lesson-complete: legacy `PATCH /:courseId/lessons/:lessonId`. Converted to
  // the `/actions/complete` convention (CONTRACT CHANGE #4 — status change is never a
  // generic PATCH). Same effect: create a CompletedLesson row for the caller.
  async markLessonComplete(req, res) {
    const data = await staffCourseUsecase.markLessonAsCompleted({
      lessonId: req.params.lessonId,
      courseId: req.params.courseId,
      userId: req.auth.id,
    });
    return ok(res, data, coursesMessagesCodes.LESSON_COMPLETED, TK);
  }

  // ── homework ──────────────────────────────────────────────────────────────────
  async getHomeworks(req, res) {
    const data = await staffCourseUsecase.getHomeworks({
      lessonId: req.params.lessonId,
      userId: req.auth.id,
    });
    return ok(res, data, coursesMessagesCodes.HOMEWORKS_FETCHED, TK);
  }

  async createHomework(req, res) {
    const data = await staffCourseUsecase.createHomework({
      lessonId: req.params.lessonId,
      courseId: req.params.courseId,
      userId: req.auth.id,
      data: req.body,
    });
    return created(res, data ?? null, coursesMessagesCodes.HOMEWORK_SAVED, TK);
  }

  // ── tests ──────────────────────────────────────────────────────────────────────
  async getTest(req, res) {
    // L1: the "admin bypass" (skip the lesson-access/previous-lessons gates) is keyed
    // on the COURSE.VIEW permission code, NOT a role string. A manager who can view
    // course management still gets the unrestricted read; everyone else is gated.
    const isAdmin = hasPermission(req.auth.permissions, PERMISSIONS.COURSE.VIEW);
    const data = await staffCourseUsecase.getUserTest({
      testId: req.params.testId,
      userId: isAdmin ? null : req.auth.id,
    });
    return ok(res, data, coursesMessagesCodes.TEST_FETCHED, TK);
  }

  async getTestQuestions(req, res) {
    const data = await staffCourseUsecase.getUserTestQuestions({
      testId: req.params.testId,
    });
    return ok(res, data, coursesMessagesCodes.TEST_QUESTION_FETCHED, TK);
  }

  // ── attempts (owner-scoped) ─────────────────────────────────────────────────────
  async getUserAttempts(req, res) {
    const data = await staffCourseUsecase.getUserAttempts({
      testId: req.params.testId,
      userId: req.auth.id,
    });
    return ok(res, data, coursesMessagesCodes.ATTEMPTS_FETCHED, TK);
  }

  async getUserAttempt(req, res) {
    const data = await staffCourseUsecase.getUserAttempt({
      attemptId: req.params.attamptId,
      userId: req.auth.id,
    });
    return ok(res, data, coursesMessagesCodes.ATTEMPT_FETCHED, TK);
  }

  async createAttempt(req, res) {
    const data = await staffCourseUsecase.createAttempt({
      userId: req.auth.id,
      testId: req.params.testId,
    });
    return created(res, data, coursesMessagesCodes.ATTEMPT_CREATED, TK);
  }

  async submitAnswer(req, res) {
    const data = await staffCourseUsecase.submitAnswer({
      answer: req.body.answer,
      attemptId: req.params.attemptId,
      questionId: req.params.questionId,
      testId: req.params.testId,
      authUserId: req.auth.id,
    });
    return ok(res, data, coursesMessagesCodes.ANSWER_SUBMITTED, TK);
  }

  // Staff end-attempt: never passes `reScore` (only the admin re-score path does),
  // so a PUT on an already-finalized attempt is rejected (H1).
  async endAttempt(req, res) {
    const data = await staffCourseUsecase.endAttempt({
      attemptId: req.params.attemptId,
    });
    return ok(res, data, coursesMessagesCodes.ATTEMPT_ENDED, TK);
  }
}

export const staffCourseController = new StaffCourseController();
export { StaffCourseController };
