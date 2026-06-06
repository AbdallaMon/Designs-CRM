// Zod schemas for the admin (management) course surface. Failures auto-return 422
// + details via the shared `validate` middleware. Schemas mirror the LEGACY inputs
// from `routes/courses/adminCourses.js` exactly — the legacy handlers spread
// `req.body` straight into Prisma with only `Number(...)` coercion on a few fields,
// so the schemas are permissive (`.passthrough()` where the legacy spread the whole
// body) to preserve observable behavior. Numeric path params are validated +
// coerced here so controllers stay thin.
import { z } from "zod";

const idParam = z.coerce.number().int();

export class AdminCourseValidation {
  // ── pagination / query ─────────────────────────────────────────────────────────
  static listQuery = z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).optional(),
    })
    .passthrough();

  // GET /tests?key&id  and POST /tests?key&id (legacy reads test owner from query)
  static testOwnerQuery = z
    .object({
      key: z.enum(["courseId", "lessonId"]),
      id: z.coerce.number().int(),
    })
    .passthrough();

  // GET /tests/attempts?userId  and per-test summary ?userId
  static attemptsSummaryQuery = z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).optional(),
      userId: z.coerce.number().int().optional(),
    })
    .passthrough();

  static userIdQuery = z
    .object({ userId: z.coerce.number().int().optional() })
    .passthrough();

  static requiredUserIdQuery = z
    .object({ userId: z.coerce.number().int() })
    .passthrough();

  // ── params ─────────────────────────────────────────────────────────────────────
  static courseParams = z.object({ courseId: idParam });
  static lessonParams = z.object({ courseId: idParam, lessonId: idParam });
  static videoParams = z.object({
    courseId: idParam,
    lessonId: idParam,
    videoId: idParam,
  });
  static pdfParams = z.object({
    courseId: idParam,
    lessonId: idParam,
    pdfId: idParam,
  });
  static linkParams = z.object({
    courseId: idParam,
    lessonId: idParam,
    linkId: idParam,
  });
  static videoPdfParams = z.object({
    courseId: idParam,
    lessonId: idParam,
    videoId: idParam,
  });
  static videoPdfDeleteParams = z.object({
    courseId: idParam,
    lessonId: idParam,
    videoId: idParam,
    pdfId: idParam,
  });
  static accessParams = z.object({ courseId: idParam, lessonId: idParam });
  static accessDeleteParams = z.object({
    courseId: idParam,
    lessonId: idParam,
    accessId: idParam,
  });
  static testParams = z.object({ testId: idParam });
  static questionParams = z.object({ testId: idParam, questionId: idParam });
  static attemptApproveParams = z.object({
    testId: idParam,
    attemptId: idParam,
    questionId: idParam,
  });

  // ── bodies ───────────────────────────────────────────────────────────────────
  // Legacy `createNewCourse` reads title/description/imageUrl/isPublished + roles[].
  static createCourse = z
    .object({
      title: z.string().min(1),
      description: z.string().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
      isPublished: z.boolean().optional(),
      roles: z.array(z.string()).default([]),
    })
    .passthrough();

  // M2 — editCourse: explicit whitelist (was `.passthrough()`, a mass-assignment
  // vector that let a client write ANY Course scalar). Only the fields the course
  // form legitimately edits are accepted; FKs / id / timestamps are rejected.
  static editCourse = z
    .object({
      title: z.string().min(1).optional(),
      description: z.string().nullable().optional(),
      imageUrl: z.string().nullable().optional(),
      isPublished: z.boolean().optional(),
      roles: z.array(z.string()).optional(),
    })
    .strict();

  // M2 — lesson create/edit: whitelist the lesson form fields. order/duration may
  // arrive as string or number (legacy coerced with Number()); the usecase coerces.
  static lessonBody = z
    .object({
      title: z.string().min(1).optional(),
      description: z.string().nullable().optional(),
      duration: z.union([z.number(), z.string()]).nullable().optional(),
      order: z.union([z.number(), z.string()]).nullable().optional(),
      isPreviewable: z.boolean().optional(),
      mustUploadHomework: z.boolean().optional(),
    })
    .strict();

  static toggleHomework = z
    .object({ mustUploadHomework: z.boolean() })
    .strict();

  // M2 — content bodies: whitelist exactly the LessonVideo / LessonPDF / LessonLink
  // editable scalars (lessonId is set server-side from the route, never the body).
  static videoBody = z
    .object({
      url: z.string().min(1).optional(),
      videoType: z.string().optional(),
      order: z.union([z.number(), z.string()]).optional(),
    })
    .strict();
  static pdfBody = z
    .object({
      url: z.string().min(1).optional(),
      order: z.union([z.number(), z.string()]).optional(),
    })
    .strict();
  static linkBody = z
    .object({
      url: z.string().min(1).optional(),
      title: z.string().min(1).optional(),
      order: z.union([z.number(), z.string()]).optional(),
    })
    .strict();

  static videoPdfBody = z
    .object({ title: z.string().min(1), url: z.string().min(1) })
    .passthrough();

  static grantAccessBody = z.object({ userId: z.coerce.number().int() }).passthrough();

  // Legacy `createTest` reads testType/attemptLimit/timeLimit/title/published.
  static createTestBody = z
    .object({
      testType: z.string().optional(),
      attemptLimit: z.union([z.number(), z.string()]).optional(),
      timeLimit: z.union([z.number(), z.string()]).optional(),
      title: z.string().optional(),
      published: z.boolean().optional(),
    })
    .passthrough();

  // M2 — editTest: whitelist Test editable scalars. courseId/lessonId/id are FKs set
  // at creation and must NOT be reassignable via the edit body (mass-assignment).
  static editTestBody = z
    .object({
      title: z.string().nullable().optional(),
      type: z.string().optional(),
      attemptLimit: z.union([z.number(), z.string()]).optional(),
      timeLimit: z.union([z.number(), z.string()]).optional(),
      published: z.boolean().optional(),
      certificateApprovedByAdmin: z.boolean().optional(),
    })
    .strict();

  // Legacy `createTestQuestion` reads type/question/choices[].
  static createQuestionBody = z
    .object({
      type: z.string(),
      question: z.string(),
      choices: z
        .array(
          z
            .object({
              text: z.string(),
              value: z.string().optional(),
              isCorrect: z.boolean().optional(),
              order: z.number().optional(),
            })
            .passthrough(),
        )
        .default([]),
    })
    .passthrough();

  // Legacy `editQuestion` reads question + choices[] (each with a CREATE/DELETE/edit type).
  static editQuestionBody = z
    .object({
      question: z.string(),
      choices: z.array(z.object({}).passthrough()).default([]),
    })
    .passthrough();

  // Legacy `reOrderTestQuestions` posts an ARRAY of { id } in `req.body`.
  static reorderQuestionsBody = z.array(
    z.object({ id: z.union([z.number(), z.string()]) }).passthrough(),
  );

  static approveAnswerBody = z
    .object({ isApproved: z.boolean() })
    .passthrough();
}
