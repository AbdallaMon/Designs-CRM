import { COURSE_QUESTION_TYPES } from "@dms/shared";
import { z } from "zod";

const idParam = z.coerce.number().int().positive();
const nonNegativeInteger = z.coerce.number().int().min(0);
const positiveInteger = z.coerce.number().int().positive();
const nullableText = z.string().nullable().optional();
const questionType = z.enum(Object.values(COURSE_QUESTION_TYPES));
const testType = z.enum(["LESSON", "FINAL", "PRACTICE", "PLACEMENT"]);
const videoType = z.enum(["IFRAME", "URL"]);

const choiceFields = {
  text: z.string().trim().min(1),
  value: z.string().optional(),
  isCorrect: z.boolean().optional(),
  order: nonNegativeInteger.optional(),
};
const createChoice = z.object(choiceFields).strict();
const editChoice = z.union([
  z.object({ id: idParam, type: z.literal("DELETE") }).strict(),
  z.object({ type: z.literal("CREATE"), ...choiceFields }).strict(),
  z.object({ id: idParam, ...choiceFields }).strict(),
]);

const lessonFields = {
  title: z.string().trim().min(1),
  description: nullableText,
  duration: nonNegativeInteger,
  order: nonNegativeInteger,
  isPreviewable: z.boolean(),
  mustUploadHomework: z.boolean().optional(),
};

export class AdminCourseValidation {
  static listQuery = z
    .object({ page: positiveInteger.optional(), limit: positiveInteger.optional() })
    .strict();
  static testOwnerQuery = z
    .object({ key: z.enum(["courseId", "lessonId"]), id: idParam })
    .strict();
  static attemptsSummaryQuery = z
    .object({
      page: positiveInteger.optional(),
      limit: positiveInteger.optional(),
      userId: idParam.optional(),
    })
    .strict();
  static userIdQuery = z.object({ userId: idParam.optional() }).strict();
  static requiredUserIdQuery = z.object({ userId: idParam }).strict();

  static courseParams = z.object({ courseId: idParam }).strict();
  static lessonParams = z.object({ courseId: idParam, lessonId: idParam }).strict();
  static videoParams = z
    .object({ courseId: idParam, lessonId: idParam, videoId: idParam })
    .strict();
  static pdfParams = z
    .object({ courseId: idParam, lessonId: idParam, pdfId: idParam })
    .strict();
  static linkParams = z
    .object({ courseId: idParam, lessonId: idParam, linkId: idParam })
    .strict();
  static videoPdfParams = z
    .object({ courseId: idParam, lessonId: idParam, videoId: idParam })
    .strict();
  static videoPdfDeleteParams = z
    .object({
      courseId: idParam,
      lessonId: idParam,
      videoId: idParam,
      pdfId: idParam,
    })
    .strict();
  static accessParams = z.object({ courseId: idParam, lessonId: idParam }).strict();
  static accessDeleteParams = z
    .object({ courseId: idParam, lessonId: idParam, accessId: idParam })
    .strict();
  static testParams = z.object({ testId: idParam }).strict();
  static questionParams = z.object({ testId: idParam, questionId: idParam }).strict();
  static attemptApproveParams = z
    .object({ testId: idParam, attemptId: idParam, questionId: idParam })
    .strict();

  static createCourse = z
    .object({
      title: z.string().trim().min(1),
      description: nullableText,
      imageUrl: z.string().nullable().optional(),
      isPublished: z.boolean().optional(),
    })
    .strict();
  static editCourse = z
    .object({
      title: z.string().trim().min(1).optional(),
      description: nullableText,
      imageUrl: z.string().nullable().optional(),
      isPublished: z.boolean().optional(),
    })
    .strict();

  static createLessonBody = z.object(lessonFields).strict();
  static editLessonBody = z
    .object({
      title: lessonFields.title.optional(),
      description: lessonFields.description,
      duration: lessonFields.duration.optional(),
      order: lessonFields.order.optional(),
      isPreviewable: lessonFields.isPreviewable.optional(),
      mustUploadHomework: lessonFields.mustUploadHomework,
    })
    .strict();
  static toggleHomework = z.object({ mustUploadHomework: z.boolean() }).strict();

  static videoBody = z
    .object({ url: z.string().trim().min(1), videoType, order: nonNegativeInteger })
    .strict();
  static pdfBody = z
    .object({ url: z.string().trim().min(1), order: nonNegativeInteger })
    .strict();
  static linkBody = z
    .object({
      url: z.string().trim().min(1),
      title: z.string().trim().min(1),
      order: nonNegativeInteger,
    })
    .strict();
  static videoPdfBody = z
    .object({ title: z.string().trim().min(1), url: z.string().trim().min(1) })
    .strict();
  static grantAccessBody = z.object({ userId: idParam }).strict();

  static createTestBody = z
    .object({
      testType,
      attemptLimit: positiveInteger,
      timeLimit: nonNegativeInteger,
      title: z.string().optional(),
      published: z.literal(false).optional(),
    })
    .strict();
  static editTestBody = z
    .object({
      title: z.string().nullable().optional(),
      type: testType.optional(),
      attemptLimit: positiveInteger.optional(),
      timeLimit: nonNegativeInteger.optional(),
      published: z.boolean().optional(),
      certificateApprovedByAdmin: z.boolean().optional(),
    })
    .strict();

  static createQuestionBody = z
    .object({
      type: questionType,
      question: z.string().trim().min(1),
      choices: z.array(createChoice).default([]),
    })
    .strict();
  static editQuestionBody = z
    .object({
      question: z.string().trim().min(1),
      choices: z.array(editChoice).default([]),
    })
    .strict();
  static reorderQuestionsBody = z.array(z.object({ id: idParam }).strict());
  static approveAnswerBody = z.object({ isApproved: z.boolean() }).strict();
}
