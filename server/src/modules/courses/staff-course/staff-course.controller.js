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

const C = coursesMessagesCodes;
const TK = messagesNames.coursesMessages;

function paginate(query) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export class StaffCourseController {
  /** @param {import("./staff-course.usecase.js").StaffCourseUsecase} usecase */
  constructor(usecase) {
    this.usecase = usecase;
  }

  // ── Object-scope checker (attempts are owner-scoped) — wired via requireSpecialChecker.
  // Throws AppError(403/404) on denial; returns the loaded (id,userId) row on success.
  checkIfUserCanAccessAttempt = (req) => {
    return this.usecase.checkIfUserCanAccessAttempt({
      attemptId: parseInt(req.params.attamptId, 10),
      authUserId: req.auth.id,
    });
  };

  // ── Object-scope checker for attempt MUTATIONS (C1 submit-answer / C2 end-attempt).
  // NOTE: these routes spell the param `attemptId` (not the read path's `attamptId`),
  // so this reads `req.params.attemptId`. Throws 403/404 on denial; returns the row.
  checkIfUserCanMutateAttempt = (req) => {
    return this.usecase.checkIfUserCanMutateAttempt({
      attemptId: parseInt(req.params.attemptId, 10),
      authUserId: req.auth.id,
    });
  };

  // ── courses ──────────────────────────────────────────────────────────────────
  listCourses = async (req, res) => {
    const { page, limit, skip, take } = paginate(req.query);
    const courses = await this.usecase.listCourses({
      role: req.query.role,
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
      C.COURSES_FETCHED,
      TK,
    );
  };

  getDashboard = async (req, res) => {
    const data = await this.usecase.getUserDashboardStats({
      userId: req.auth.id,
    });
    return ok(res, data, C.DASHBOARD_FETCHED, TK);
  };

  getCourse = async (req, res) => {
    const course = await this.usecase.getCourse({
      courseId: req.params.courseId,
      role: req.query.role,
      userId: req.auth.id,
    });
    const data = decorateStaffCourseDetail(course, {
      permissions: req.auth.permissions,
    });
    return ok(res, data, C.COURSE_FETCHED, TK);
  };

  getCourseProgress = async (req, res) => {
    const data = await this.usecase.getUserCourseProgress({
      courseId: req.params.courseId,
      userId: req.auth.id,
    });
    return ok(res, data, C.PROGRESS_FETCHED, TK);
  };

  // ── lessons ──────────────────────────────────────────────────────────────────
  getLesson = async (req, res) => {
    const data = await this.usecase.getLesson({
      lessonId: req.params.lessonId,
      role: req.query.role,
      userId: req.auth.id,
    });
    return ok(res, data, C.LESSON_FETCHED, TK);
  };

  // Mark-lesson-complete: legacy `PATCH /:courseId/lessons/:lessonId`. Converted to
  // the `/actions/complete` convention (CONTRACT CHANGE #4 — status change is never a
  // generic PATCH). Same effect: create a CompletedLesson row for the caller.
  markLessonComplete = async (req, res) => {
    const data = await this.usecase.markLessonAsCompleted({
      lessonId: req.params.lessonId,
      courseId: req.params.courseId,
      userId: req.auth.id,
    });
    return ok(res, data, C.LESSON_COMPLETED, TK);
  };

  // ── homework ──────────────────────────────────────────────────────────────────
  getHomeworks = async (req, res) => {
    const data = await this.usecase.getHomeworks({
      lessonId: req.params.lessonId,
      userId: req.auth.id,
    });
    return ok(res, data, C.HOMEWORKS_FETCHED, TK);
  };

  createHomework = async (req, res) => {
    const data = await this.usecase.createHomework({
      lessonId: req.params.lessonId,
      courseId: req.params.courseId,
      userId: req.auth.id,
      data: req.body,
    });
    return created(res, data ?? null, C.HOMEWORK_SAVED, TK);
  };

  // ── tests ──────────────────────────────────────────────────────────────────────
  getTest = async (req, res) => {
    // L1: the "admin bypass" (skip the lesson-access/previous-lessons gates) is keyed
    // on the COURSE.VIEW permission code, NOT a role string. A manager who can view
    // course management still gets the unrestricted read; everyone else is gated.
    const isAdmin = hasPermission(req.auth.permissions, PERMISSIONS.COURSE.VIEW);
    const data = await this.usecase.getUserTest({
      testId: req.params.testId,
      userId: isAdmin ? null : req.auth.id,
    });
    return ok(res, data, C.TEST_FETCHED, TK);
  };

  getTestQuestions = async (req, res) => {
    const data = await this.usecase.getUserTestQuestions({
      testId: req.params.testId,
    });
    return ok(res, data, C.TEST_QUESTION_FETCHED, TK);
  };

  // ── attempts (owner-scoped) ─────────────────────────────────────────────────────
  getUserAttempts = async (req, res) => {
    const data = await this.usecase.getUserAttempts({
      testId: req.params.testId,
      userId: req.auth.id,
    });
    return ok(res, data, C.ATTEMPTS_FETCHED, TK);
  };

  getUserAttempt = async (req, res) => {
    const data = await this.usecase.getUserAttempt({
      attemptId: req.params.attamptId,
      userId: req.auth.id,
    });
    return ok(res, data, C.ATTEMPT_FETCHED, TK);
  };

  createAttempt = async (req, res) => {
    const data = await this.usecase.createAttempt({
      userId: req.auth.id,
      testId: req.params.testId,
    });
    return created(res, data, C.ATTEMPT_CREATED, TK);
  };

  submitAnswer = async (req, res) => {
    const data = await this.usecase.submitAnswer({
      answer: req.body.answer,
      attemptId: req.params.attemptId,
      questionId: req.params.questionId,
      testId: req.params.testId,
      authUserId: req.auth.id,
    });
    return ok(res, data, C.ANSWER_SUBMITTED, TK);
  };

  // Staff end-attempt: never passes `reScore` (only the admin re-score path does),
  // so a PUT on an already-finalized attempt is rejected (H1).
  endAttempt = async (req, res) => {
    const data = await this.usecase.endAttempt({
      attemptId: req.params.attemptId,
    });
    return ok(res, data, C.ATTEMPT_ENDED, TK);
  };
}

export const staffCourseController = new StaffCourseController(
  staffCourseUsecase,
);
