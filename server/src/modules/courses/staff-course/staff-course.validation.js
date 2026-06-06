// Zod schemas for the staff (course-consumption) surface. Failures auto-return 422
// + details. Mirrors LEGACY inputs from `routes/courses/staffCourses.js`.
//
// NOTE on `role` (observable-behavior preservation): the legacy staff routes filter
// courses/lessons by a CLIENT-SUPPLIED `req.query.role` (the CourseRole to match),
// NOT the caller's actual role. This is preserved verbatim — it is a content filter,
// not an authorization decision (authorization is the STAFF_COURSE code + published
// flag + the lesson-access/attempt scope gates). `role` is optional, as in legacy
// (an absent role simply matches no CourseRole rows).
import { z } from "zod";

const idParam = z.coerce.number().int();

export class StaffCourseValidation {
  // ── query ────────────────────────────────────────────────────────────────────
  static listQuery = z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).optional(),
      role: z.string().optional(),
    })
    .passthrough();

  static roleQuery = z.object({ role: z.string().optional() }).passthrough();

  // ── params ─────────────────────────────────────────────────────────────────────
  static courseParams = z.object({ courseId: idParam });
  static lessonParams = z.object({ courseId: idParam, lessonId: idParam });
  static testParams = z.object({ testId: idParam });
  static attemptParams = z.object({ testId: idParam, attamptId: idParam });
  static endAttemptParams = z.object({ testId: idParam, attemptId: idParam });
  static submitAnswerParams = z.object({
    testId: idParam,
    attemptId: idParam,
    questionId: idParam,
  });

  // ── bodies ───────────────────────────────────────────────────────────────────
  // Legacy `createAHomeWork` reads url/type/title.
  static homeworkBody = z
    .object({
      url: z.string().min(1),
      type: z.string().min(1),
      title: z.string().optional(),
    })
    .passthrough();

  // Legacy `submitAnswer` reads `answer` ({ textAnswer?, selectedAnswers? }).
  static submitAnswerBody = z
    .object({
      answer: z
        .object({
          textAnswer: z.string().nullable().optional(),
          selectedAnswers: z.array(z.string()).optional(),
        })
        .passthrough(),
    })
    .passthrough();
}
