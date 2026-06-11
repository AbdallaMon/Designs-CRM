// Staff-courses (STAFF learner) data-access service — the ONLY place that talks to the
// /v2/staff-courses API. Wraps the canonical apiFetch (config.apiUrl === /v2). Components/hooks
// call these helpers, never fetch/apiFetch directly. All responses share the
// { success, message:CODE, data, translationKey } envelope; helpers return the parsed envelope.
//
// Surface: AUTHED — ANY authenticated role (STAFF_COURSE.VIEW / .TAKE granted to every role).
// Object-level access is enforced SERVER-SIDE:
//   • course/lesson visibility = published flag + CourseRole match + lesson-access / previous-
//     lesson gates inside the usecase (the FE never makes that decision);
//   • per-attempt reads/writes are OWNER-scoped (checkIfUserCanAccess/MutateAttempt) — the FE
//     just calls; the server rejects another user's attempt with ATTEMPT_ACCESS_DENIED.
// So the FE gates buttons on the two STAFF_COURSE codes only.
//
// `role` is a CLIENT-supplied CONTENT filter (the CourseRole to match), NOT an authz input —
// preserved verbatim from legacy. The list returns a paginated envelope (CONTRACT CHANGE #7;
// total === items.length). Admin authoring lives in ./courses.service.js.

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import {
  STAFF_COURSES_URL,
  STAFF_DASHBOARD_URL,
  staffCourseUrl,
  staffCourseProgressUrl,
  staffLessonUrl,
  staffLessonCompleteUrl,
  staffLessonHomeworkUrl,
  staffTestUrl,
  staffTestQuestionsUrl,
  staffTestAttemptsUrl,
  staffTestAttemptUrl,
  staffSubmitAnswerUrl,
} from "./config/constant.js";

function buildQuery(base, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => {
    if (obj != null && obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}

export const staffCoursesService = {
  // ════════════════════════════════════════════════════════════════════════════
  //  courses (browse / detail / progress)
  // ════════════════════════════════════════════════════════════════════════════
  // GET /staff-courses?page&limit&role → data:{ items, total, page, pageSize }   [staff_course.view]
  list: ({ page = 1, limit = 10, role } = {}) =>
    apiFetch.get(buildQuery(STAFF_COURSES_URL, { page, limit, role })),

  // GET /staff-courses/dashboard → staff LMS dashboard object                    [staff_course.view]
  getDashboard: () => apiFetch.get(STAFF_DASHBOARD_URL),

  // GET /staff-courses/:courseId?role → course detail (role = CourseRole content filter) [staff_course.view]
  getCourse: (courseId, { role } = {}) =>
    apiFetch.get(buildQuery(staffCourseUrl(courseId), { role })),

  // GET /staff-courses/:courseId/progress → caller progress object               [staff_course.view]
  getProgress: (courseId) => apiFetch.get(staffCourseProgressUrl(courseId)),

  // ════════════════════════════════════════════════════════════════════════════
  //  lessons / homework
  // ════════════════════════════════════════════════════════════════════════════
  // GET /staff-courses/:courseId/lessons/:lessonId?role → lesson detail          [staff_course.view]
  getLesson: (courseId, lessonId, { role } = {}) =>
    apiFetch.get(buildQuery(staffLessonUrl(courseId, lessonId), { role })),

  // POST .../actions/complete → mark lesson complete (no body)                   [staff_course.take]
  markLessonComplete: (courseId, lessonId) =>
    apiFetch.post(staffLessonCompleteUrl(courseId, lessonId)),

  // GET .../home-work → caller's homework for the lesson                         [staff_course.view]
  getHomework: (courseId, lessonId) => apiFetch.get(staffLessonHomeworkUrl(courseId, lessonId)),
  // POST .../home-work — body: { url, type, title? }                            [staff_course.take]
  submitHomework: (courseId, lessonId, body) =>
    apiFetch.post(staffLessonHomeworkUrl(courseId, lessonId), pick(body, ["url", "type", "title"])),

  // ════════════════════════════════════════════════════════════════════════════
  //  tests / attempts (per-attempt reads & writes are OWNER-scoped server-side)
  // ════════════════════════════════════════════════════════════════════════════
  getTest: (testId) => apiFetch.get(staffTestUrl(testId)), //                          [staff_course.view]
  getTestQuestions: (testId) => apiFetch.get(staffTestQuestionsUrl(testId)), //        [staff_course.view]
  // GET caller's attempts for the test
  listAttempts: (testId) => apiFetch.get(staffTestAttemptsUrl(testId)), //             [staff_course.view]
  // GET one attempt (OWNER-scoped; server rejects another user's attempt)
  getAttempt: (testId, attemptId) => apiFetch.get(staffTestAttemptUrl(testId, attemptId)), // [staff_course.view]
  // POST start an attempt (no body)
  startAttempt: (testId) => apiFetch.post(staffTestAttemptsUrl(testId)), //            [staff_course.take]
  // POST submit one answer (OWNER-scoped) — body: { answer:{ textAnswer?, selectedAnswers[]? } }
  submitAnswer: (testId, attemptId, questionId, answer) =>
    apiFetch.post(staffSubmitAnswerUrl(testId, attemptId, questionId), { answer }), // [staff_course.take]
  // PUT end an attempt (OWNER-scoped; no body)
  endAttempt: (testId, attemptId) => apiFetch.put(staffTestAttemptUrl(testId, attemptId)), // [staff_course.take]
};

export default staffCoursesService;
