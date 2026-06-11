// Courses / LMS domain — API contract surface (BOTH surfaces). All paths are RELATIVE to
// the v2 API base (apiFetch is configured with config.apiUrl === /v2). One place to edit if
// a backend path changes (reconciliation point vs
// server/src/modules/courses/{admin-course,staff-course}/*.routes.js).
//
// ════════════════════════════════════════════════════════════════════════════════════════
// Backend contract (confirmed against the v2 route files 2026-06-08).
// Standard envelope everywhere: { success, message:CODE, data, translationKey }.
// Paginated lists return data:{ items, total, page, pageSize }.
// ════════════════════════════════════════════════════════════════════════════════════════
//
// ── ADMIN authoring surface — mounted at /v2/courses (admin-course.routes.js) ──────────────
//   Auth mounted once; each route declares its COURSE.* code (admin / super-admin / isSuperSales).
//
//   courses
//     GET    /                                      list courses (paginated)            [course.view]
//                                       query: page?, limit?  → data:{items,total,page,pageSize}
//     POST   /                                      create course                       [course.manage]
//                            body(.passthrough): { title, description?, imageUrl?, isPublished?, roles[] }
//     GET    /dashboard                             admin LMS dashboard                  [course.view]
//     PUT    /:courseId                             edit course                          [course.manage]
//                            body(.strict): { title?, description?, imageUrl?, isPublished?, roles? }
//
//   tests (STATIC paths precede /:courseId)
//     GET    /tests?key=&id=                        tests for a course/lesson owner      [course.view]
//                                       key ∈ {courseId,lessonId}, id=ownerId
//     GET    /tests/attempts?page=&limit=&userId?   attempts summary (paginated)         [course.attempt.manage]
//     POST   /tests?key=&id=                        create test (owner from query)       [course.manage]
//                            body(.passthrough): { testType?, attemptLimit?, timeLimit?, title?, published? }
//     GET    /tests/:testId                         test detail                          [course.view]
//     PUT    /tests/:testId                         edit test                            [course.manage]
//                            body(.strict): { title?, type?, attemptLimit?, timeLimit?, published?, certificateApprovedByAdmin? }
//     DELETE /tests/:testId                         delete test                          [course.manage]
//     GET    /tests/:testId/attempts?userId?        per-test attempts summary            [course.attempt.manage]
//     GET    /tests/:testId/attampts/user?userId    full attempt records for one user    [course.attempt.manage]
//                                       (legacy mis-spelling `attampts` preserved)
//     POST   /tests/:testId/attempts/increase?userId=   grant +1 attempt                 [course.attempt.manage]
//     POST   /tests/:testId/attempts/decrease?userId=   remove 1 attempt                 [course.attempt.manage]
//     POST   /tests/:testId/attempts/:attemptId/questions/:questionId/approve            [course.attempt.manage]
//                            body(.passthrough): { isApproved }
//     POST   /tests/:testId/test-questions          create question                      [course.manage]
//                            body(.passthrough): { type, question, choices[] }
//     POST   /tests/:testId/test-questions/re-order  reorder questions                   [course.manage]
//                            body: ARRAY of { id }
//     GET    /tests/:testId/test-questions/:questionId   question detail                 [course.view]
//     PUT    /tests/:testId/test-questions/:questionId   edit question                   [course.manage]
//                            body(.passthrough): { question, choices[] }
//     DELETE /tests/:testId/test-questions/:questionId   delete question                 [course.manage]
//
//   lessons
//     GET    /:courseId/lessons                     lessons for a course                 [course.view]
//     POST   /:courseId/lessons                     create lesson                        [course.manage]
//                            body(.strict): { title?, description?, duration?, order?, isPreviewable?, mustUploadHomework? }
//     GET    /:courseId/lessons/:lessonId           lesson detail                        [course.view]
//     PUT    /:courseId/lessons/:lessonId           edit lesson                          [course.manage]  (same body)
//     POST   /:courseId/lessons/:lessonId/home-works/toggle   toggle homework requirement [course.manage]
//                            body(.strict): { mustUploadHomework }
//     DELETE /:courseId/lessons/:lessonId           delete lesson                        [course.manage]
//
//   lesson videos
//     GET    /:courseId/lessons/:lessonId/videos                       list videos       [course.view]
//     POST   /:courseId/lessons/:lessonId/videos                       create video      [course.manage]
//                            body(.strict): { url?, videoType?, order? }
//     PUT    /:courseId/lessons/:lessonId/videos/:videoId              edit video        [course.manage]
//     DELETE /:courseId/lessons/:lessonId/videos/:videoId              delete video      [course.manage]
//
//   lesson video pdfs
//     GET    /:courseId/lessons/:lessonId/videos/:videoId/pdfs         list video pdfs   [course.view]
//     POST   /:courseId/lessons/:lessonId/videos/:videoId/pdfs         create video pdf  [course.manage]
//                            body(.passthrough): { title, url }
//     DELETE /:courseId/lessons/:lessonId/videos/:videoId/pdfs/:pdfId  delete video pdf  [course.manage]
//
//   lesson pdfs
//     GET    /:courseId/lessons/:lessonId/pdfs                         list pdfs         [course.view]
//     POST   /:courseId/lessons/:lessonId/pdfs                         create pdf        [course.manage]
//                            body(.strict): { url?, order? }
//     PUT    /:courseId/lessons/:lessonId/pdfs/:pdfId                  edit pdf          [course.manage]
//     DELETE /:courseId/lessons/:lessonId/pdfs/:pdfId                  delete pdf        [course.manage]
//
//   lesson links
//     GET    /:courseId/lessons/:lessonId/links                       list links        [course.view]
//     POST   /:courseId/lessons/:lessonId/links                       create link       [course.manage]
//                            body(.strict): { url?, title?, order? }
//     PUT    /:courseId/lessons/:lessonId/links/:linkId               edit link         [course.manage]
//     DELETE /:courseId/lessons/:lessonId/links/:linkId               delete link       [course.manage]
//
//   allowed roles / lesson access / homeworks
//     GET    /:courseId/allowed-roles                                 course allowed roles [course.access.manage]
//     GET    /:courseId/lessons/:lessonId/allowed-users               lesson allowed users [course.access.manage]
//     POST   /:courseId/lessons/:lessonId/allowed-users              grant lesson access   [course.access.manage]
//                            body(.passthrough): { userId }
//     DELETE /:courseId/lessons/:lessonId/allowed-users/:accessId    revoke lesson access  [course.access.manage]
//     GET    /:courseId/lessons/:lessonId/home-works                  lesson homework submissions [course.view]
//
// ── STAFF learner surface — mounted at /v2/staff-courses (staff-course.routes.js) ──────────
//   Auth mounted once; every authed role holds STAFF_COURSE.VIEW / .TAKE.
//   `role` query is a CLIENT-supplied CONTENT filter (CourseRole), NOT an authz decision.
//   Per-attempt reads/writes are OWNER-scoped server-side (checkIfUserCanAccess/MutateAttempt).
//
//   courses
//     GET    /?page?&limit?&role?                   list visible courses (paginated env) [staff_course.view]
//                                       (CONTRACT CHANGE #7: wrapped in items/total; total===items.length)
//     GET    /dashboard                             staff LMS dashboard                  [staff_course.view]
//
//   tests / attempts (STATIC paths precede /:courseId)
//     GET    /tests/:testId                         test detail                          [staff_course.view]
//     GET    /tests/:testId/test-questions          test questions                       [staff_course.view]
//     GET    /tests/:testId/attampts                caller's attempts for the test       [staff_course.view]
//     GET    /tests/:testId/attampts/:attamptId     one attempt (OWNER-scoped)           [staff_course.view]
//     POST   /tests/:testId/attampts                start an attempt                     [staff_course.take]
//     POST   /tests/:testId/attampts/:attemptId/questions/:questionId   submit answer (OWNER) [staff_course.take]
//                            body(.passthrough): { answer:{ textAnswer?, selectedAnswers[]? } }
//     PUT    /tests/:testId/attampts/:attemptId     end attempt (OWNER-scoped)           [staff_course.take]
//
//   course detail / lessons / homework
//     GET    /:courseId?role?                       course detail                        [staff_course.view]
//     GET    /:courseId/progress                    course progress                      [staff_course.view]
//     GET    /:courseId/lessons/:lessonId?role?     lesson detail                        [staff_course.view]
//     POST   /:courseId/lessons/:lessonId/actions/complete   mark lesson complete        [staff_course.take]
//                                       (CONTRACT CHANGE #4: was PATCH; never PATCH a status)
//     GET    /:courseId/lessons/:lessonId/home-work          lesson homework             [staff_course.view]
//     POST   /:courseId/lessons/:lessonId/home-work          submit homework             [staff_course.take]
//                            body: { url, type, title? }
// ════════════════════════════════════════════════════════════════════════════════════════

// ── ADMIN authoring surface base + builders (/v2/courses) ──────────────────────────────────
export const COURSES_BASE = "courses";

// courses
export const COURSES_URL = COURSES_BASE; // GET list / POST create
export const ADMIN_DASHBOARD_URL = `${COURSES_BASE}/dashboard`;
export const courseUrl = (courseId) => `${COURSES_BASE}/${courseId}`; // PUT edit

// tests (admin)
export const ADMIN_TESTS_URL = `${COURSES_BASE}/tests`; // GET ?key&id / POST ?key&id
export const ADMIN_ATTEMPTS_SUMMARY_URL = `${COURSES_BASE}/tests/attempts`; // GET ?page&limit&userId
export const adminTestUrl = (testId) => `${COURSES_BASE}/tests/${testId}`; // GET / PUT / DELETE
export const adminTestAttemptsSummaryUrl = (testId) =>
  `${COURSES_BASE}/tests/${testId}/attempts`; // GET ?userId
// NOTE: legacy mis-spelling `attampts` preserved on this admin read.
export const adminUserAttemptsUrl = (testId) =>
  `${COURSES_BASE}/tests/${testId}/attampts/user`; // GET ?userId
export const adminIncreaseAttemptUrl = (testId) =>
  `${COURSES_BASE}/tests/${testId}/attempts/increase`; // POST ?userId
export const adminDecreaseAttemptUrl = (testId) =>
  `${COURSES_BASE}/tests/${testId}/attempts/decrease`; // POST ?userId
export const adminApproveAnswerUrl = (testId, attemptId, questionId) =>
  `${COURSES_BASE}/tests/${testId}/attempts/${attemptId}/questions/${questionId}/approve`;

// test questions (admin)
export const adminTestQuestionsUrl = (testId) =>
  `${COURSES_BASE}/tests/${testId}/test-questions`; // POST create
export const adminReorderQuestionsUrl = (testId) =>
  `${COURSES_BASE}/tests/${testId}/test-questions/re-order`; // POST
export const adminTestQuestionUrl = (testId, questionId) =>
  `${COURSES_BASE}/tests/${testId}/test-questions/${questionId}`; // GET / PUT / DELETE

// lessons (admin)
export const courseLessonsUrl = (courseId) => `${COURSES_BASE}/${courseId}/lessons`; // GET / POST
export const courseLessonUrl = (courseId, lessonId) =>
  `${COURSES_BASE}/${courseId}/lessons/${lessonId}`; // GET / PUT / DELETE
export const lessonToggleHomeworkUrl = (courseId, lessonId) =>
  `${COURSES_BASE}/${courseId}/lessons/${lessonId}/home-works/toggle`; // POST

// lesson videos (admin)
export const lessonVideosUrl = (courseId, lessonId) =>
  `${COURSES_BASE}/${courseId}/lessons/${lessonId}/videos`; // GET / POST
export const lessonVideoUrl = (courseId, lessonId, videoId) =>
  `${COURSES_BASE}/${courseId}/lessons/${lessonId}/videos/${videoId}`; // PUT / DELETE

// lesson video pdfs (admin)
export const lessonVideoPdfsUrl = (courseId, lessonId, videoId) =>
  `${COURSES_BASE}/${courseId}/lessons/${lessonId}/videos/${videoId}/pdfs`; // GET / POST
export const lessonVideoPdfUrl = (courseId, lessonId, videoId, pdfId) =>
  `${COURSES_BASE}/${courseId}/lessons/${lessonId}/videos/${videoId}/pdfs/${pdfId}`; // DELETE

// lesson pdfs (admin)
export const lessonPdfsUrl = (courseId, lessonId) =>
  `${COURSES_BASE}/${courseId}/lessons/${lessonId}/pdfs`; // GET / POST
export const lessonPdfUrl = (courseId, lessonId, pdfId) =>
  `${COURSES_BASE}/${courseId}/lessons/${lessonId}/pdfs/${pdfId}`; // PUT / DELETE

// lesson links (admin)
export const lessonLinksUrl = (courseId, lessonId) =>
  `${COURSES_BASE}/${courseId}/lessons/${lessonId}/links`; // GET / POST
export const lessonLinkUrl = (courseId, lessonId, linkId) =>
  `${COURSES_BASE}/${courseId}/lessons/${lessonId}/links/${linkId}`; // PUT / DELETE

// allowed roles / lesson access / homeworks (admin)
export const courseAllowedRolesUrl = (courseId) =>
  `${COURSES_BASE}/${courseId}/allowed-roles`; // GET
export const lessonAllowedUsersUrl = (courseId, lessonId) =>
  `${COURSES_BASE}/${courseId}/lessons/${lessonId}/allowed-users`; // GET / POST
export const lessonAllowedUserUrl = (courseId, lessonId, accessId) =>
  `${COURSES_BASE}/${courseId}/lessons/${lessonId}/allowed-users/${accessId}`; // DELETE
export const lessonHomeworksUrl = (courseId, lessonId) =>
  `${COURSES_BASE}/${courseId}/lessons/${lessonId}/home-works`; // GET

// ── STAFF learner surface base + builders (/v2/staff-courses) ───────────────────────────────
export const STAFF_COURSES_BASE = "staff-courses";

// courses
export const STAFF_COURSES_URL = STAFF_COURSES_BASE; // GET list ?page&limit&role
export const STAFF_DASHBOARD_URL = `${STAFF_COURSES_BASE}/dashboard`;
export const staffCourseUrl = (courseId) => `${STAFF_COURSES_BASE}/${courseId}`; // GET ?role
export const staffCourseProgressUrl = (courseId) =>
  `${STAFF_COURSES_BASE}/${courseId}/progress`; // GET

// lessons / homework (staff)
export const staffLessonUrl = (courseId, lessonId) =>
  `${STAFF_COURSES_BASE}/${courseId}/lessons/${lessonId}`; // GET ?role
export const staffLessonCompleteUrl = (courseId, lessonId) =>
  `${STAFF_COURSES_BASE}/${courseId}/lessons/${lessonId}/actions/complete`; // POST
export const staffLessonHomeworkUrl = (courseId, lessonId) =>
  `${STAFF_COURSES_BASE}/${courseId}/lessons/${lessonId}/home-work`; // GET / POST

// tests / attempts (staff) — legacy mis-spelling `attampts` preserved on this surface.
export const staffTestUrl = (testId) => `${STAFF_COURSES_BASE}/tests/${testId}`; // GET
export const staffTestQuestionsUrl = (testId) =>
  `${STAFF_COURSES_BASE}/tests/${testId}/test-questions`; // GET
export const staffTestAttemptsUrl = (testId) =>
  `${STAFF_COURSES_BASE}/tests/${testId}/attampts`; // GET (caller's) / POST (start)
export const staffTestAttemptUrl = (testId, attemptId) =>
  `${STAFF_COURSES_BASE}/tests/${testId}/attampts/${attemptId}`; // GET (owner) / PUT (end)
export const staffSubmitAnswerUrl = (testId, attemptId, questionId) =>
  `${STAFF_COURSES_BASE}/tests/${testId}/attampts/${attemptId}/questions/${questionId}`; // POST
