// Thin controller for the admin (management) course surface. Reads validated input
// (Zod has already coerced numeric params/query), delegates to the usecase, and
// responds through the shared envelope helpers. No business logic here.
import { ok, created, deleted } from "../../../shared/http/response.js";
import { coursesMessagesCodes, messagesNames } from "@dms/shared";
import { adminCourseUsecase } from "./admin-course.usecase.js";
import { decorateCourseList } from "./admin-course.dto.js";

const C = coursesMessagesCodes;
const TK = messagesNames.coursesMessages;

// Legacy default pagination: page=1, limit=10 (services/main/utility getPagination).
function paginate(query) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export class AdminCourseController {
  /** @param {import("./admin-course.usecase.js").AdminCourseUsecase} usecase */
  constructor(usecase) {
    this.usecase = usecase;
  }

  // ── courses ──────────────────────────────────────────────────────────────────
  listCourses = async (req, res) => {
    const { page, limit, skip, take } = paginate(req.query);
    const { courses, total } = await this.usecase.listCourses({ skip, take });
    const items = decorateCourseList(courses, {
      permissions: req.auth.permissions,
    });
    return ok(res, { items, total, page, pageSize: limit }, C.COURSES_FETCHED, TK);
  };

  createCourse = async (req, res) => {
    const data = await this.usecase.createCourse({ data: req.body });
    return created(res, data, C.COURSE_CREATED, TK);
  };

  getDashboard = async (req, res) => {
    const data = await this.usecase.getDashboardData();
    return ok(res, data, C.DASHBOARD_FETCHED, TK);
  };

  editCourse = async (req, res) => {
    const data = await this.usecase.editCourse({
      data: req.body,
      courseId: req.params.courseId,
    });
    return ok(res, data, C.COURSE_UPDATED, TK);
  };

  // ── lessons ──────────────────────────────────────────────────────────────────
  getLessons = async (req, res) => {
    const data = await this.usecase.getLessonsByCourseId({
      courseId: req.params.courseId,
    });
    return ok(res, data, C.LESSONS_FETCHED, TK);
  };

  createLesson = async (req, res) => {
    const data = await this.usecase.createLesson({
      courseId: req.params.courseId,
      data: req.body,
    });
    return created(res, data, C.LESSON_CREATED, TK);
  };

  getLessonById = async (req, res) => {
    const data = await this.usecase.getLessonById({
      lessonId: req.params.lessonId,
    });
    return ok(res, data, C.LESSON_FETCHED, TK);
  };

  editLesson = async (req, res) => {
    const data = await this.usecase.editLesson({
      data: req.body,
      lessonId: req.params.lessonId,
    });
    return ok(res, data, C.LESSON_UPDATED, TK);
  };

  toggleHomework = async (req, res) => {
    const data = await this.usecase.toggleMustUploadHomework({
      lessonId: req.params.lessonId,
      mustUploadHomework: req.body.mustUploadHomework,
    });
    return ok(res, data, C.LESSON_HOMEWORK_TOGGLED, TK);
  };

  deleteLesson = async (req, res) => {
    await this.usecase.deleteLesson({ lessonId: req.params.lessonId });
    return deleted(res, C.LESSON_DELETED, TK);
  };

  // ── lesson videos ────────────────────────────────────────────────────────────
  getVideos = async (req, res) => {
    const data = await this.usecase.getVideosByLessonId({
      lessonId: req.params.lessonId,
    });
    return ok(res, data, C.LESSON_VIDEOS_FETCHED, TK);
  };

  createVideo = async (req, res) => {
    const data = await this.usecase.createLessonVideo({
      lessonId: req.params.lessonId,
      data: req.body,
    });
    return created(res, data, C.LESSON_VIDEO_CREATED, TK);
  };

  editVideo = async (req, res) => {
    const data = await this.usecase.editLessonVideo({
      data: req.body,
      videoId: req.params.videoId,
    });
    return ok(res, data, C.LESSON_VIDEO_UPDATED, TK);
  };

  deleteVideo = async (req, res) => {
    const data = await this.usecase.deleteLessonVideo({
      videoId: req.params.videoId,
    });
    return ok(res, data, C.LESSON_VIDEO_DELETED, TK);
  };

  // ── lesson pdfs ────────────────────────────────────────────────────────────────
  getPdfs = async (req, res) => {
    const data = await this.usecase.getPdfsByLessonId({
      lessonId: req.params.lessonId,
    });
    return ok(res, data, C.LESSON_PDFS_FETCHED, TK);
  };

  createPdf = async (req, res) => {
    const data = await this.usecase.createLessonPdf({
      lessonId: req.params.lessonId,
      data: req.body,
    });
    return created(res, data, C.LESSON_PDF_CREATED, TK);
  };

  editPdf = async (req, res) => {
    const data = await this.usecase.editLessonPdf({
      data: req.body,
      pdfId: req.params.pdfId,
    });
    return ok(res, data, C.LESSON_PDF_UPDATED, TK);
  };

  deletePdf = async (req, res) => {
    const data = await this.usecase.deleteLessonPdf({ pdfId: req.params.pdfId });
    return ok(res, data, C.LESSON_PDF_DELETED, TK);
  };

  // ── lesson links ───────────────────────────────────────────────────────────────
  getLinks = async (req, res) => {
    const data = await this.usecase.getLinksByLessonId({
      lessonId: req.params.lessonId,
    });
    return ok(res, data, C.LESSON_LINKS_FETCHED, TK);
  };

  createLink = async (req, res) => {
    const data = await this.usecase.createLessonLink({
      lessonId: req.params.lessonId,
      data: req.body,
    });
    return created(res, data, C.LESSON_LINK_CREATED, TK);
  };

  editLink = async (req, res) => {
    const data = await this.usecase.editLessonLink({
      data: req.body,
      linkId: req.params.linkId,
    });
    return ok(res, data, C.LESSON_LINK_UPDATED, TK);
  };

  deleteLink = async (req, res) => {
    const data = await this.usecase.deleteLessonLink({
      linkId: req.params.linkId,
    });
    return ok(res, data, C.LESSON_LINK_DELETED, TK);
  };

  // ── lesson video pdfs ──────────────────────────────────────────────────────────
  getVideoPdfs = async (req, res) => {
    const data = await this.usecase.getLessonVideoPdfs({
      videoId: req.params.videoId,
    });
    return ok(res, data, C.LESSON_VIDEO_PDFS_FETCHED, TK);
  };

  createVideoPdf = async (req, res) => {
    const data = await this.usecase.createLessonVideoPdf({
      videoId: req.params.videoId,
      title: req.body.title,
      url: req.body.url,
    });
    return created(res, data, C.LESSON_VIDEO_PDF_CREATED, TK);
  };

  deleteVideoPdf = async (req, res) => {
    const data = await this.usecase.deleteLessonVideoPdf({
      pdfId: req.params.pdfId,
    });
    return ok(res, data, C.LESSON_VIDEO_PDF_DELETED, TK);
  };

  // ── lesson access / allowed roles ────────────────────────────────────────────────
  getAllowedRoles = async (req, res) => {
    const data = await this.usecase.getAllowedRoles({
      courseId: req.params.courseId,
    });
    return ok(res, data, C.ALLOWED_ROLES_FETCHED, TK);
  };

  getAllowedUsers = async (req, res) => {
    const data = await this.usecase.getAllowedLessonUsers({
      lessonId: req.params.lessonId,
    });
    return ok(res, data, C.ALLOWED_USERS_FETCHED, TK);
  };

  grantAccess = async (req, res) => {
    const data = await this.usecase.grantLessonAccess({
      lessonId: req.params.lessonId,
      userId: req.body.userId,
    });
    return created(res, data, C.LESSON_ACCESS_GRANTED, TK);
  };

  deleteAccess = async (req, res) => {
    const data = await this.usecase.deleteLessonAccess({
      id: req.params.accessId,
    });
    return ok(res, data, C.LESSON_ACCESS_DELETED, TK);
  };

  // ── homeworks ──────────────────────────────────────────────────────────────────
  getHomeworks = async (req, res) => {
    const data = await this.usecase.getListOfHomeworks({
      lessonId: req.params.lessonId,
    });
    return ok(res, data, C.HOMEWORKS_FETCHED, TK);
  };

  // ── tests ──────────────────────────────────────────────────────────────────────
  getTests = async (req, res) => {
    const data = await this.usecase.getTests({
      key: req.query.key,
      id: req.query.id,
    });
    return ok(res, data, C.TESTS_FETCHED, TK);
  };

  getAttemptsSummary = async (req, res) => {
    const { page, limit, skip, take } = paginate(req.query);
    const { attempts, total } = await this.usecase.getAttemptsSummary({
      skip,
      take,
      userId: req.query.userId,
    });
    return ok(
      res,
      { items: attempts, total, page, pageSize: limit },
      C.ATTEMPTS_FETCHED,
      TK,
    );
  };

  createTest = async (req, res) => {
    const data = await this.usecase.createTest({
      key: req.query.key,
      id: req.query.id,
      attemptLimit: req.body.attemptLimit,
      type: req.body.testType,
      timeLimit: req.body.timeLimit,
      title: req.body.title,
      published: req.body.published,
    });
    return created(res, data, C.TEST_CREATED, TK);
  };

  getTestData = async (req, res) => {
    const data = await this.usecase.getTestData({ testId: req.params.testId });
    return ok(res, data, C.TEST_FETCHED, TK);
  };

  editTest = async (req, res) => {
    const data = await this.usecase.editTest({
      testId: req.params.testId,
      data: req.body,
    });
    return ok(res, data, C.TEST_UPDATED, TK);
  };

  deleteTest = async (req, res) => {
    await this.usecase.deleteTest({ testId: req.params.testId });
    return deleted(res, C.TEST_DELETED, TK);
  };

  getUserAttemptsForAdmin = async (req, res) => {
    const data = await this.usecase.getUserAttempts({
      testId: req.params.testId,
      userId: req.query.userId,
    });
    return ok(res, data, C.ATTEMPTS_FETCHED, TK);
  };

  getTestAttemptsSummary = async (req, res) => {
    const data = await this.usecase.getTestAttemptsSummary({
      testId: req.params.testId,
      userId: req.query.userId,
    });
    return ok(res, data, C.ATTEMPTS_FETCHED, TK);
  };

  increaseAttempt = async (req, res) => {
    const data = await this.usecase.increaseAttemptToUser({
      testId: req.params.testId,
      userId: req.query.userId,
    });
    return ok(res, data, C.ATTEMPT_INCREASED, TK);
  };

  decreaseAttempt = async (req, res) => {
    const data = await this.usecase.decreaseAttemptToUser({
      testId: req.params.testId,
      userId: req.query.userId,
    });
    return ok(res, data, C.ATTEMPT_DECREASED, TK);
  };

  approveAnswer = async (req, res) => {
    const data = await this.usecase.approveUserAnswer({
      questionId: req.params.questionId,
      attemptId: req.params.attemptId,
      isApproved: req.body.isApproved,
    });
    return ok(res, data, C.ANSWER_APPROVED, TK);
  };

  // ── test questions ────────────────────────────────────────────────────────────────
  createQuestion = async (req, res) => {
    const data = await this.usecase.createTestQuestion({
      data: req.body,
      id: req.params.testId,
    });
    return created(res, data, C.TEST_QUESTION_CREATED, TK);
  };

  reorderQuestions = async (req, res) => {
    const data = await this.usecase.reorderTestQuestions({ data: req.body });
    return ok(res, data, C.TEST_QUESTIONS_REORDERED, TK);
  };

  getQuestionData = async (req, res) => {
    const data = await this.usecase.getTestQuestionData({
      id: req.params.questionId,
    });
    return ok(res, data, C.TEST_QUESTION_FETCHED, TK);
  };

  editQuestion = async (req, res) => {
    const data = await this.usecase.editQuestion({
      data: req.body,
      questionId: req.params.questionId,
    });
    return ok(res, data, C.TEST_QUESTION_UPDATED, TK);
  };

  deleteQuestion = async (req, res) => {
    const data = await this.usecase.deleteQuestion({
      questionId: req.params.questionId,
    });
    return ok(res, data, C.TEST_QUESTION_DELETED, TK);
  };
}

export const adminCourseController = new AdminCourseController(
  adminCourseUsecase,
);
