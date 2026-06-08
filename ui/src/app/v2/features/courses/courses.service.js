// Courses (ADMIN authoring) data-access service — the ONLY place that talks to the
// /v2/courses API. Wraps the canonical apiFetch (config.apiUrl === /v2). Components/hooks
// call these helpers, never fetch/apiFetch directly. All responses share the
// { success, message:CODE, data, translationKey } envelope; helpers return the parsed envelope.
//
// Surface: AUTHED admin/management authoring (cookie auth). Object scope (which course/lesson
// a manager may touch) is enforced SERVER-SIDE; the FE gates buttons on the COURSE.* codes
// (course.view / course.manage / course.access.manage / course.attempt.manage). The list dto
// does not currently emit capabilities.*, so admin gating is code-only.
//
// Paginated lists (GET / and GET /tests/attempts) return data:{ items, total, page, pageSize }.
// Mutating bodies mirror the BE Zod schemas (admin-course.validation.js); the staff learner
// surface lives in ./staffCourses.service.js.

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import {
  COURSES_URL,
  ADMIN_DASHBOARD_URL,
  courseUrl,
  ADMIN_TESTS_URL,
  ADMIN_ATTEMPTS_SUMMARY_URL,
  adminTestUrl,
  adminTestAttemptsSummaryUrl,
  adminUserAttemptsUrl,
  adminIncreaseAttemptUrl,
  adminDecreaseAttemptUrl,
  adminApproveAnswerUrl,
  adminTestQuestionsUrl,
  adminReorderQuestionsUrl,
  adminTestQuestionUrl,
  courseLessonsUrl,
  courseLessonUrl,
  lessonToggleHomeworkUrl,
  lessonVideosUrl,
  lessonVideoUrl,
  lessonVideoPdfsUrl,
  lessonVideoPdfUrl,
  lessonPdfsUrl,
  lessonPdfUrl,
  lessonLinksUrl,
  lessonLinkUrl,
  courseAllowedRolesUrl,
  lessonAllowedUsersUrl,
  lessonAllowedUserUrl,
  lessonHomeworksUrl,
} from "./config/constant.js";

// Build a query string with top-level params (skips empty/null/undefined).
function buildQuery(base, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

// Pick ONLY whitelisted keys (BE schemas reject extras on .strict bodies). Drops undefined;
// KEEPS null/0/"" so explicit clears still pass through.
function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => {
    if (obj != null && obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}

export const coursesService = {
  // ════════════════════════════════════════════════════════════════════════════
  //  courses
  // ════════════════════════════════════════════════════════════════════════════
  // GET /courses?page&limit → data:{ items, total, page, pageSize }            [course.view]
  list: ({ page = 1, limit = 10, ...rest } = {}) =>
    apiFetch.get(buildQuery(COURSES_URL, { page, limit, ...rest })),

  // GET /courses/dashboard → admin LMS dashboard object                        [course.view]
  getDashboard: () => apiFetch.get(ADMIN_DASHBOARD_URL),

  // POST /courses — body: { title, description?, imageUrl?, isPublished?, roles[] } [course.manage]
  create: (payload) =>
    apiFetch.post(COURSES_URL, {
      ...pick(payload, ["title", "description", "imageUrl", "isPublished"]),
      roles: payload?.roles ?? [],
    }),

  // PUT /courses/:courseId — body(.strict): { title?, description?, imageUrl?, isPublished?, roles? } [course.manage]
  update: (courseId, payload) =>
    apiFetch.put(
      courseUrl(courseId),
      pick(payload, ["title", "description", "imageUrl", "isPublished", "roles"]),
    ),

  // ════════════════════════════════════════════════════════════════════════════
  //  lessons
  // ════════════════════════════════════════════════════════════════════════════
  listLessons: (courseId) => apiFetch.get(courseLessonsUrl(courseId)), //              [course.view]
  getLesson: (courseId, lessonId) => apiFetch.get(courseLessonUrl(courseId, lessonId)), // [course.view]
  // POST/PUT body(.strict): { title?, description?, duration?, order?, isPreviewable?, mustUploadHomework? }
  createLesson: (courseId, body) =>
    apiFetch.post(
      courseLessonsUrl(courseId),
      pick(body, ["title", "description", "duration", "order", "isPreviewable", "mustUploadHomework"]),
    ), //                                                                            [course.manage]
  updateLesson: (courseId, lessonId, body) =>
    apiFetch.put(
      courseLessonUrl(courseId, lessonId),
      pick(body, ["title", "description", "duration", "order", "isPreviewable", "mustUploadHomework"]),
    ), //                                                                            [course.manage]
  deleteLesson: (courseId, lessonId) =>
    apiFetch.delete(courseLessonUrl(courseId, lessonId)), //                          [course.manage]
  // POST .../home-works/toggle — body(.strict): { mustUploadHomework }
  toggleLessonHomework: (courseId, lessonId, mustUploadHomework) =>
    apiFetch.post(lessonToggleHomeworkUrl(courseId, lessonId), { mustUploadHomework }), // [course.manage]
  // GET .../home-works → submissions for a lesson
  listLessonHomeworks: (courseId, lessonId) =>
    apiFetch.get(lessonHomeworksUrl(courseId, lessonId)), //                          [course.view]

  // ════════════════════════════════════════════════════════════════════════════
  //  lesson videos (+ video pdfs)
  // ════════════════════════════════════════════════════════════════════════════
  listVideos: (courseId, lessonId) => apiFetch.get(lessonVideosUrl(courseId, lessonId)), // [course.view]
  createVideo: (courseId, lessonId, body) =>
    apiFetch.post(lessonVideosUrl(courseId, lessonId), pick(body, ["url", "videoType", "order"])), // [course.manage]
  updateVideo: (courseId, lessonId, videoId, body) =>
    apiFetch.put(lessonVideoUrl(courseId, lessonId, videoId), pick(body, ["url", "videoType", "order"])), // [course.manage]
  deleteVideo: (courseId, lessonId, videoId) =>
    apiFetch.delete(lessonVideoUrl(courseId, lessonId, videoId)), //                  [course.manage]

  listVideoPdfs: (courseId, lessonId, videoId) =>
    apiFetch.get(lessonVideoPdfsUrl(courseId, lessonId, videoId)), //                 [course.view]
  // POST — body: { title, url }
  createVideoPdf: (courseId, lessonId, videoId, body) =>
    apiFetch.post(lessonVideoPdfsUrl(courseId, lessonId, videoId), pick(body, ["title", "url"])), // [course.manage]
  deleteVideoPdf: (courseId, lessonId, videoId, pdfId) =>
    apiFetch.delete(lessonVideoPdfUrl(courseId, lessonId, videoId, pdfId)), //         [course.manage]

  // ════════════════════════════════════════════════════════════════════════════
  //  lesson pdfs
  // ════════════════════════════════════════════════════════════════════════════
  listPdfs: (courseId, lessonId) => apiFetch.get(lessonPdfsUrl(courseId, lessonId)), // [course.view]
  // POST/PUT body(.strict): { url?, order? }
  createPdf: (courseId, lessonId, body) =>
    apiFetch.post(lessonPdfsUrl(courseId, lessonId), pick(body, ["url", "order"])), // [course.manage]
  updatePdf: (courseId, lessonId, pdfId, body) =>
    apiFetch.put(lessonPdfUrl(courseId, lessonId, pdfId), pick(body, ["url", "order"])), // [course.manage]
  deletePdf: (courseId, lessonId, pdfId) =>
    apiFetch.delete(lessonPdfUrl(courseId, lessonId, pdfId)), //                       [course.manage]

  // ════════════════════════════════════════════════════════════════════════════
  //  lesson links
  // ════════════════════════════════════════════════════════════════════════════
  listLinks: (courseId, lessonId) => apiFetch.get(lessonLinksUrl(courseId, lessonId)), // [course.view]
  // POST/PUT body(.strict): { url?, title?, order? }
  createLink: (courseId, lessonId, body) =>
    apiFetch.post(lessonLinksUrl(courseId, lessonId), pick(body, ["url", "title", "order"])), // [course.manage]
  updateLink: (courseId, lessonId, linkId, body) =>
    apiFetch.put(lessonLinkUrl(courseId, lessonId, linkId), pick(body, ["url", "title", "order"])), // [course.manage]
  deleteLink: (courseId, lessonId, linkId) =>
    apiFetch.delete(lessonLinkUrl(courseId, lessonId, linkId)), //                     [course.manage]

  // ════════════════════════════════════════════════════════════════════════════
  //  allowed roles / lesson access (course.access.manage)
  // ════════════════════════════════════════════════════════════════════════════
  getAllowedRoles: (courseId) => apiFetch.get(courseAllowedRolesUrl(courseId)), //     [course.access.manage]
  listAllowedUsers: (courseId, lessonId) =>
    apiFetch.get(lessonAllowedUsersUrl(courseId, lessonId)), //                        [course.access.manage]
  // POST — body: { userId }
  grantAccess: (courseId, lessonId, userId) =>
    apiFetch.post(lessonAllowedUsersUrl(courseId, lessonId), { userId }), //           [course.access.manage]
  revokeAccess: (courseId, lessonId, accessId) =>
    apiFetch.delete(lessonAllowedUserUrl(courseId, lessonId, accessId)), //            [course.access.manage]

  // ════════════════════════════════════════════════════════════════════════════
  //  tests (course.view to read, course.manage to write)
  // ════════════════════════════════════════════════════════════════════════════
  // GET /courses/tests?key&id — key ∈ {courseId,lessonId}, id=ownerId
  listTests: ({ key, id }) => apiFetch.get(buildQuery(ADMIN_TESTS_URL, { key, id })), // [course.view]
  // POST /courses/tests?key&id — body: { testType?, attemptLimit?, timeLimit?, title?, published? }
  createTest: ({ key, id }, body) =>
    apiFetch.post(
      buildQuery(ADMIN_TESTS_URL, { key, id }),
      pick(body, ["testType", "attemptLimit", "timeLimit", "title", "published"]),
    ), //                                                                            [course.manage]
  getTest: (testId) => apiFetch.get(adminTestUrl(testId)), //                          [course.view]
  // PUT body(.strict): { title?, type?, attemptLimit?, timeLimit?, published?, certificateApprovedByAdmin? }
  updateTest: (testId, body) =>
    apiFetch.put(
      adminTestUrl(testId),
      pick(body, ["title", "type", "attemptLimit", "timeLimit", "published", "certificateApprovedByAdmin"]),
    ), //                                                                            [course.manage]
  deleteTest: (testId) => apiFetch.delete(adminTestUrl(testId)), //                    [course.manage]

  // ── test questions ──────────────────────────────────────────────────────────────
  // POST — body: { type, question, choices[] }
  createQuestion: (testId, body) =>
    apiFetch.post(adminTestQuestionsUrl(testId), pick(body, ["type", "question", "choices"])), // [course.manage]
  // POST — body: ARRAY of { id }
  reorderQuestions: (testId, orderedIds) =>
    apiFetch.post(adminReorderQuestionsUrl(testId), orderedIds), //                    [course.manage]
  getQuestion: (testId, questionId) => apiFetch.get(adminTestQuestionUrl(testId, questionId)), // [course.view]
  // PUT — body: { question, choices[] }
  updateQuestion: (testId, questionId, body) =>
    apiFetch.put(adminTestQuestionUrl(testId, questionId), pick(body, ["question", "choices"])), // [course.manage]
  deleteQuestion: (testId, questionId) =>
    apiFetch.delete(adminTestQuestionUrl(testId, questionId)), //                      [course.manage]

  // ════════════════════════════════════════════════════════════════════════════
  //  attempts administration (course.attempt.manage)
  // ════════════════════════════════════════════════════════════════════════════
  // GET /courses/tests/attempts?page&limit&userId → data:{ items, total, page, pageSize }
  listAttemptsSummary: ({ page = 1, limit = 10, userId } = {}) =>
    apiFetch.get(buildQuery(ADMIN_ATTEMPTS_SUMMARY_URL, { page, limit, userId })), //  [course.attempt.manage]
  // GET /courses/tests/:testId/attempts?userId → per-test summary
  listTestAttemptsSummary: (testId, { userId } = {}) =>
    apiFetch.get(buildQuery(adminTestAttemptsSummaryUrl(testId), { userId })), //      [course.attempt.manage]
  // GET /courses/tests/:testId/attampts/user?userId → full attempt records for one user
  listUserAttempts: (testId, userId) =>
    apiFetch.get(buildQuery(adminUserAttemptsUrl(testId), { userId })), //             [course.attempt.manage]
  // POST .../attempts/increase?userId
  increaseAttempt: (testId, userId) =>
    apiFetch.post(buildQuery(adminIncreaseAttemptUrl(testId), { userId })), //         [course.attempt.manage]
  // POST .../attempts/decrease?userId
  decreaseAttempt: (testId, userId) =>
    apiFetch.post(buildQuery(adminDecreaseAttemptUrl(testId), { userId })), //         [course.attempt.manage]
  // POST .../attempts/:attemptId/questions/:questionId/approve — body: { isApproved }
  approveAnswer: (testId, attemptId, questionId, isApproved) =>
    apiFetch.post(adminApproveAnswerUrl(testId, attemptId, questionId), { isApproved }), // [course.attempt.manage]
};

export default coursesService;
