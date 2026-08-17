// Single-language (Arabic) resolution for backend message CODES emitted by the courses / LMS
// domain API ({ success, message: CODE, translationKey: "coursesMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/courses/courses.js); this is the FE
// lookup, covering BOTH surfaces (admin-course authoring + staff-course learner). Every code
// the courses surface can emit has an entry here; unknown codes fall back to a generic string.
// Mirrors features/calendar/config/calendarMessages.js.

export const coursesMessages = {
  // ── reads (admin) ──────────────────────────────────────────────────────────────
  COURSES_FETCHED: "Courses fetched",
  COURSE_FETCHED: "Course fetched",
  LESSONS_FETCHED: "Lessons fetched",
  LESSON_FETCHED: "Lesson fetched",
  LESSON_VIDEOS_FETCHED: "Lesson videos fetched",
  LESSON_PDFS_FETCHED: "Lesson files fetched",
  LESSON_LINKS_FETCHED: "Lesson links fetched",
  LESSON_VIDEO_PDFS_FETCHED: "Video files fetched",
  ALLOWED_USERS_FETCHED: "Allowed users fetched",
  HOMEWORKS_FETCHED: "Homework fetched",
  TESTS_FETCHED: "Tests fetched",
  TEST_FETCHED: "Test fetched",
  TEST_QUESTION_FETCHED: "Question fetched",
  ATTEMPTS_FETCHED: "Attempts fetched",
  ATTEMPT_FETCHED: "Attempt fetched",
  DASHBOARD_FETCHED: "Dashboard fetched",
  PROGRESS_FETCHED: "Progress fetched",

  // ── mutations (admin) ──────────────────────────────────────────────────────────
  COURSE_CREATED: "Course created",
  COURSE_UPDATED: "Course updated",
  LESSON_CREATED: "Lesson created",
  LESSON_UPDATED: "Lesson updated",
  LESSON_DELETED: "Lesson deleted",
  LESSON_HOMEWORK_TOGGLED: "Homework setting updated",
  LESSON_VIDEO_CREATED: "Video added",
  LESSON_VIDEO_UPDATED: "Video updated",
  LESSON_VIDEO_DELETED: "Video deleted",
  LESSON_PDF_CREATED: "File added",
  LESSON_PDF_UPDATED: "File updated",
  LESSON_PDF_DELETED: "File deleted",
  LESSON_LINK_CREATED: "Link added",
  LESSON_LINK_UPDATED: "Link updated",
  LESSON_LINK_DELETED: "Link deleted",
  LESSON_VIDEO_PDF_CREATED: "Video file added",
  LESSON_VIDEO_PDF_DELETED: "Video file deleted",
  LESSON_ACCESS_GRANTED: "Lesson access granted",
  LESSON_ACCESS_DELETED: "Lesson access revoked",
  TEST_CREATED: "Test created",
  TEST_UPDATED: "Test updated",
  TEST_DELETED: "Test deleted",
  TEST_QUESTION_CREATED: "Question added",
  TEST_QUESTION_UPDATED: "Question updated",
  TEST_QUESTION_DELETED: "Question deleted",
  TEST_QUESTIONS_REORDERED: "Questions reordered",
  ATTEMPT_INCREASED: "Attempt count increased",
  ATTEMPT_DECREASED: "Attempt count decreased",
  ANSWER_APPROVED: "Answer approved",

  // ── mutations (staff) ──────────────────────────────────────────────────────────
  LESSON_COMPLETED: "Lesson completed",
  HOMEWORK_SAVED: "Homework saved",
  ATTEMPT_CREATED: "Attempt started",
  ANSWER_SUBMITTED: "Answer submitted",
  ATTEMPT_ENDED: "Attempt ended",

  // ── errors ───────────────────────────────────────────────────────────────────
  COURSE_NOT_FOUND: "Course not found",
  LESSON_NOT_FOUND: "Lesson not found",
  TEST_NOT_FOUND: "Test not found",
  ATTEMPT_NOT_FOUND: "Attempt not found",
  ATTEMPT_ACCESS_DENIED: "You do not have access to this attempt",
  COURSE_ACCESS_DENIED: "You do not have access to this course",
  LESSON_ACCESS_DENIED: "You do not have access to this lesson",
  PREVIOUS_LESSONS_INCOMPLETE: "You must complete the previous lessons and pass their tests first",
  ATTEMPT_LIMIT_REACHED: "You have reached the maximum number of attempts",
  ATTEMPT_CANNOT_DECREASE: "Attempts cannot be decreased below the number already used",
  ATTEMPT_ALREADY_ENDED: "This attempt has already ended",
  QUESTION_TEST_MISMATCH: "This question does not belong to this test",
  TEST_MUST_START_AS_DRAFT: "Create the test as a draft, add valid questions, then publish it",
  TEST_VALID_QUESTION_REQUIRED: "Add at least one valid question before publishing this test",
  QUESTION_TYPE_REQUIRED: "Question type is required",
  QUESTION_CHOICES_MIN_TWO: "At least two answer choices are required",
  QUESTION_CHOICE_TEXT_REQUIRED: "Every answer choice must contain text",
  QUESTION_CHOICES_UNIQUE: "Answer choices must be unique",
  QUESTION_CORRECT_ANSWER_REQUIRED: "Select at least one correct answer",
  QUESTION_EXACTLY_ONE_CORRECT: "Select exactly one correct answer",
  ORDERING_POSITION_INVALID: "Every ordering choice must have a non-negative integer position",
  ORDERING_POSITION_UNIQUE: "Every ordering choice must have a unique position",
  QUESTION_TYPE_UNSUPPORTED: "Unsupported question type",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
  OK: "Operation completed successfully",
  CREATED: "Created successfully",
  UPDATED: "Updated successfully",
  DELETED: "Deleted successfully",
  FORBIDDEN: "You do not have permission to perform this action",
  ACCESS_DENIED: "You do not have access",
  VALIDATION_ERROR: "Invalid data",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveCoursesMessage(code, { fallback } = {}) {
  if (code && coursesMessages[code]) return coursesMessages[code];
  return fallback ?? "Operation completed";
}
