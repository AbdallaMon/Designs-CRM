import { HOMEWORK_TYPES } from "@dms/shared";
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

export class StaffCourseValidation {
  static listQuery = z
    .object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().optional(),
    })
    .strict();

  static courseParams = z.object({ courseId: idParam }).strict();
  static lessonParams = z.object({ courseId: idParam, lessonId: idParam }).strict();
  static testParams = z.object({ testId: idParam }).strict();
  static attemptParams = z
    .object({ testId: idParam, attamptId: idParam })
    .strict();
  static endAttemptParams = z
    .object({ testId: idParam, attemptId: idParam })
    .strict();
  static submitAnswerParams = z
    .object({ testId: idParam, attemptId: idParam, questionId: idParam })
    .strict();

  static emptyBody = z.object({}).strict();
  static homeworkBody = z
    .object({
      url: z.string().trim().min(1),
      type: z.enum(Object.values(HOMEWORK_TYPES)),
      title: z.string().trim().min(1).optional(),
    })
    .strict();
  static submitAnswerBody = z
    .object({
      answer: z
        .object({
          textAnswer: z.string().nullable().optional(),
          selectedAnswers: z.array(z.string()).optional(),
        })
        .strict(),
    })
    .strict();
}
