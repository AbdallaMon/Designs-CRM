// Thin controller for the admin (management) course surface. Reads validated input
// (Zod has already coerced numeric params/query), delegates to the usecase, and
// responds through the shared envelope helpers. No business logic here.
import { ok, created, deleted } from "../../../shared/http/response.js";
import { coursesMessagesCodes, messagesNames } from "@dms/shared";
import { adminCourseUsecase } from "./admin-course.usecase.js";
import { decorateCourseList } from "./admin-course.dto.js";

const TK = messagesNames.coursesMessages;

// Legacy default pagination: page=1, limit=10 (services/main/utility getPagination).
function paginate(query) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

class AdminCourseController {
  // ── courses ──────────────────────────────────────────────────────────────────
  async listCourses(req, res) {
    const { page, limit, skip, take } = paginate(req.query);
    const { courses, total } = await adminCourseUsecase.listCourses({ skip, take });
    const items = decorateCourseList(courses, {
      permissions: req.auth.permissions,
    });
    return ok(res, { items, total, page, pageSize: limit }, coursesMessagesCodes.COURSES_FETCHED, TK);
  }

  async createCourse(req, res) {
    const data = await adminCourseUsecase.createCourse({ data: req.body });
    return created(res, data, coursesMessagesCodes.COURSE_CREATED, TK);
  }

  async getDashboard(req, res) {
    const data = await adminCourseUsecase.getDashboardData();
    return ok(res, data, coursesMessagesCodes.DASHBOARD_FETCHED, TK);
  }

  async editCourse(req, res) {
    const data = await adminCourseUsecase.editCourse({
      data: req.body,
      courseId: req.params.courseId,
    });
    return ok(res, data, coursesMessagesCodes.COURSE_UPDATED, TK);
  }

  // ── lessons ──────────────────────────────────────────────────────────────────
  async getLessons(req, res) {
    const data = await adminCourseUsecase.getLessonsByCourseId({
      courseId: req.params.courseId,
    });
    return ok(res, data, coursesMessagesCodes.LESSONS_FETCHED, TK);
  }

  async createLesson(req, res) {
    const data = await adminCourseUsecase.createLesson({
      courseId: req.params.courseId,
      data: req.body,
    });
    return created(res, data, coursesMessagesCodes.LESSON_CREATED, TK);
  }

  async getLessonById(req, res) {
    const data = await adminCourseUsecase.getLessonById({
      lessonId: req.params.lessonId,
    });
    return ok(res, data, coursesMessagesCodes.LESSON_FETCHED, TK);
  }

  async editLesson(req, res) {
    const data = await adminCourseUsecase.editLesson({
      data: req.body,
      lessonId: req.params.lessonId,
    });
    return ok(res, data, coursesMessagesCodes.LESSON_UPDATED, TK);
  }

  async toggleHomework(req, res) {
    const data = await adminCourseUsecase.toggleMustUploadHomework({
      lessonId: req.params.lessonId,
      mustUploadHomework: req.body.mustUploadHomework,
    });
    return ok(res, data, coursesMessagesCodes.LESSON_HOMEWORK_TOGGLED, TK);
  }

  async deleteLesson(req, res) {
    await adminCourseUsecase.deleteLesson({ lessonId: req.params.lessonId });
    return deleted(res, coursesMessagesCodes.LESSON_DELETED, TK);
  }

  // ── lesson videos ────────────────────────────────────────────────────────────
  async getVideos(req, res) {
    const data = await adminCourseUsecase.getVideosByLessonId({
      lessonId: req.params.lessonId,
    });
    return ok(res, data, coursesMessagesCodes.LESSON_VIDEOS_FETCHED, TK);
  }

  async createVideo(req, res) {
    const data = await adminCourseUsecase.createLessonVideo({
      lessonId: req.params.lessonId,
      data: req.body,
    });
    return created(res, data, coursesMessagesCodes.LESSON_VIDEO_CREATED, TK);
  }

  async editVideo(req, res) {
    const data = await adminCourseUsecase.editLessonVideo({
      data: req.body,
      videoId: req.params.videoId,
    });
    return ok(res, data, coursesMessagesCodes.LESSON_VIDEO_UPDATED, TK);
  }

  async deleteVideo(req, res) {
    const data = await adminCourseUsecase.deleteLessonVideo({
      videoId: req.params.videoId,
    });
    return ok(res, data, coursesMessagesCodes.LESSON_VIDEO_DELETED, TK);
  }

  // ── lesson pdfs ────────────────────────────────────────────────────────────────
  async getPdfs(req, res) {
    const data = await adminCourseUsecase.getPdfsByLessonId({
      lessonId: req.params.lessonId,
    });
    return ok(res, data, coursesMessagesCodes.LESSON_PDFS_FETCHED, TK);
  }

  async createPdf(req, res) {
    const data = await adminCourseUsecase.createLessonPdf({
      lessonId: req.params.lessonId,
      data: req.body,
    });
    return created(res, data, coursesMessagesCodes.LESSON_PDF_CREATED, TK);
  }

  async editPdf(req, res) {
    const data = await adminCourseUsecase.editLessonPdf({
      data: req.body,
      pdfId: req.params.pdfId,
    });
    return ok(res, data, coursesMessagesCodes.LESSON_PDF_UPDATED, TK);
  }

  async deletePdf(req, res) {
    const data = await adminCourseUsecase.deleteLessonPdf({ pdfId: req.params.pdfId });
    return ok(res, data, coursesMessagesCodes.LESSON_PDF_DELETED, TK);
  }

  // ── lesson links ───────────────────────────────────────────────────────────────
  async getLinks(req, res) {
    const data = await adminCourseUsecase.getLinksByLessonId({
      lessonId: req.params.lessonId,
    });
    return ok(res, data, coursesMessagesCodes.LESSON_LINKS_FETCHED, TK);
  }

  async createLink(req, res) {
    const data = await adminCourseUsecase.createLessonLink({
      lessonId: req.params.lessonId,
      data: req.body,
    });
    return created(res, data, coursesMessagesCodes.LESSON_LINK_CREATED, TK);
  }

  async editLink(req, res) {
    const data = await adminCourseUsecase.editLessonLink({
      data: req.body,
      linkId: req.params.linkId,
    });
    return ok(res, data, coursesMessagesCodes.LESSON_LINK_UPDATED, TK);
  }

  async deleteLink(req, res) {
    const data = await adminCourseUsecase.deleteLessonLink({
      linkId: req.params.linkId,
    });
    return ok(res, data, coursesMessagesCodes.LESSON_LINK_DELETED, TK);
  }

  // ── lesson video pdfs ──────────────────────────────────────────────────────────
  async getVideoPdfs(req, res) {
    const data = await adminCourseUsecase.getLessonVideoPdfs({
      videoId: req.params.videoId,
    });
    return ok(res, data, coursesMessagesCodes.LESSON_VIDEO_PDFS_FETCHED, TK);
  }

  async createVideoPdf(req, res) {
    const data = await adminCourseUsecase.createLessonVideoPdf({
      videoId: req.params.videoId,
      title: req.body.title,
      url: req.body.url,
    });
    return created(res, data, coursesMessagesCodes.LESSON_VIDEO_PDF_CREATED, TK);
  }

  async deleteVideoPdf(req, res) {
    const data = await adminCourseUsecase.deleteLessonVideoPdf({
      pdfId: req.params.pdfId,
    });
    return ok(res, data, coursesMessagesCodes.LESSON_VIDEO_PDF_DELETED, TK);
  }

  // ── lesson access / allowed roles ────────────────────────────────────────────────
  async getAllowedUsers(req, res) {
    const data = await adminCourseUsecase.getAllowedLessonUsers({
      lessonId: req.params.lessonId,
    });
    return ok(res, data, coursesMessagesCodes.ALLOWED_USERS_FETCHED, TK);
  }

  async grantAccess(req, res) {
    const data = await adminCourseUsecase.grantLessonAccess({
      lessonId: req.params.lessonId,
      userId: req.body.userId,
    });
    return created(res, data, coursesMessagesCodes.LESSON_ACCESS_GRANTED, TK);
  }

  async deleteAccess(req, res) {
    const data = await adminCourseUsecase.deleteLessonAccess({
      id: req.params.accessId,
    });
    return ok(res, data, coursesMessagesCodes.LESSON_ACCESS_DELETED, TK);
  }

  // ── homeworks ──────────────────────────────────────────────────────────────────
  async getHomeworks(req, res) {
    const data = await adminCourseUsecase.getListOfHomeworks({
      lessonId: req.params.lessonId,
    });
    return ok(res, data, coursesMessagesCodes.HOMEWORKS_FETCHED, TK);
  }

  // ── tests ──────────────────────────────────────────────────────────────────────
  async getTests(req, res) {
    const data = await adminCourseUsecase.getTests({
      key: req.query.key,
      id: req.query.id,
    });
    return ok(res, data, coursesMessagesCodes.TESTS_FETCHED, TK);
  }

  async getAttemptsSummary(req, res) {
    const { page, limit, skip, take } = paginate(req.query);
    const { attempts, total } = await adminCourseUsecase.getAttemptsSummary({
      skip,
      take,
      userId: req.query.userId,
    });
    return ok(
      res,
      { items: attempts, total, page, pageSize: limit },
      coursesMessagesCodes.ATTEMPTS_FETCHED,
      TK,
    );
  }

  async createTest(req, res) {
    const data = await adminCourseUsecase.createTest({
      key: req.query.key,
      id: req.query.id,
      attemptLimit: req.body.attemptLimit,
      type: req.body.testType,
      timeLimit: req.body.timeLimit,
      title: req.body.title,
      published: req.body.published,
    });
    return created(res, data, coursesMessagesCodes.TEST_CREATED, TK);
  }

  async getTestData(req, res) {
    const data = await adminCourseUsecase.getTestData({ testId: req.params.testId });
    return ok(res, data, coursesMessagesCodes.TEST_FETCHED, TK);
  }

  async editTest(req, res) {
    const data = await adminCourseUsecase.editTest({
      testId: req.params.testId,
      data: req.body,
    });
    return ok(res, data, coursesMessagesCodes.TEST_UPDATED, TK);
  }

  async deleteTest(req, res) {
    await adminCourseUsecase.deleteTest({ testId: req.params.testId });
    return deleted(res, coursesMessagesCodes.TEST_DELETED, TK);
  }

  async getUserAttemptsForAdmin(req, res) {
    const data = await adminCourseUsecase.getUserAttempts({
      testId: req.params.testId,
      userId: req.query.userId,
    });
    return ok(res, data, coursesMessagesCodes.ATTEMPTS_FETCHED, TK);
  }

  async getTestAttemptsSummary(req, res) {
    const data = await adminCourseUsecase.getTestAttemptsSummary({
      testId: req.params.testId,
      userId: req.query.userId,
    });
    return ok(res, data, coursesMessagesCodes.ATTEMPTS_FETCHED, TK);
  }

  async increaseAttempt(req, res) {
    const data = await adminCourseUsecase.increaseAttemptToUser({
      testId: req.params.testId,
      userId: req.query.userId,
    });
    return ok(res, data, coursesMessagesCodes.ATTEMPT_INCREASED, TK);
  }

  async decreaseAttempt(req, res) {
    const data = await adminCourseUsecase.decreaseAttemptToUser({
      testId: req.params.testId,
      userId: req.query.userId,
    });
    return ok(res, data, coursesMessagesCodes.ATTEMPT_DECREASED, TK);
  }

  async approveAnswer(req, res) {
    const data = await adminCourseUsecase.approveUserAnswer({
      questionId: req.params.questionId,
      attemptId: req.params.attemptId,
      isApproved: req.body.isApproved,
    });
    return ok(res, data, coursesMessagesCodes.ANSWER_APPROVED, TK);
  }

  // ── test questions ────────────────────────────────────────────────────────────────
  async createQuestion(req, res) {
    const data = await adminCourseUsecase.createTestQuestion({
      data: req.body,
      id: req.params.testId,
    });
    return created(res, data, coursesMessagesCodes.TEST_QUESTION_CREATED, TK);
  }

  async reorderQuestions(req, res) {
    const data = await adminCourseUsecase.reorderTestQuestions({ data: req.body });
    return ok(res, data, coursesMessagesCodes.TEST_QUESTIONS_REORDERED, TK);
  }

  async getQuestionData(req, res) {
    const data = await adminCourseUsecase.getTestQuestionData({
      id: req.params.questionId,
    });
    return ok(res, data, coursesMessagesCodes.TEST_QUESTION_FETCHED, TK);
  }

  async editQuestion(req, res) {
    const data = await adminCourseUsecase.editQuestion({
      data: req.body,
      questionId: req.params.questionId,
    });
    return ok(res, data, coursesMessagesCodes.TEST_QUESTION_UPDATED, TK);
  }

  async deleteQuestion(req, res) {
    const data = await adminCourseUsecase.deleteQuestion({
      questionId: req.params.questionId,
    });
    return ok(res, data, coursesMessagesCodes.TEST_QUESTION_DELETED, TK);
  }
}

export const adminCourseController = new AdminCourseController();
export { AdminCourseController };
