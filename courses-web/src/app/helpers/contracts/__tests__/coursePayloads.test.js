import { describe, expect, it } from "vitest";
import { AdminCourseValidation } from "../../../../../../server/src/modules/courses/admin-course/admin-course.validation.js";
import { StaffCourseValidation } from "../../../../../../server/src/modules/courses/staff-course/staff-course.validation.js";
import { normalizeMutationResult } from "../../functions/apiClient.js";
import { describeApiError } from "../../functions/richError.js";
import {
  coursePayload,
  homeworkPayload,
  lessonPayload,
  linkPayload,
  pdfPayload,
  questionCreatePayload,
  questionEditPayload,
  questionOrderPayload,
  testCreatePayload,
  testEditPayload,
  validateQuestionDraft,
  videoPayload,
  videoPdfPayload,
} from "../coursePayloads.js";

describe("course frontend/backend payload parity", () => {
  it("builds strict course and lesson payloads", () => {
    expect(
      AdminCourseValidation.createCourse.parse(
        coursePayload({
          title: "Design Basics",
          description: "Intro",
          imageUrl: "https://example.com/course.jpg",
          isPublished: true,
          file: { ignored: true },
          id: 99,
        }),
      ),
    ).toEqual({
      title: "Design Basics",
      description: "Intro",
      imageUrl: "https://example.com/course.jpg",
      isPublished: true,
    });

    expect(
      AdminCourseValidation.createLessonBody.parse(
        lessonPayload({
          title: "Lesson 1",
          description: "Start here",
          duration: "30",
          order: "1",
          isPreviewable: false,
        }),
      ),
    ).toMatchObject({ duration: 30, order: 1 });
  });

  it("strips read-only fields from strict lesson-resource edits", () => {
    const apiRecord = {
      id: 14,
      lessonId: 3,
      createdAt: "2026-08-17T00:00:00.000Z",
      url: "https://example.com/resource",
      title: "Resource",
      videoType: "URL",
      order: "2",
    };

    expect(AdminCourseValidation.videoBody.parse(videoPayload(apiRecord))).toEqual({
      url: apiRecord.url,
      videoType: "URL",
      order: 2,
    });
    expect(AdminCourseValidation.pdfBody.parse(pdfPayload(apiRecord))).toEqual({
      url: apiRecord.url,
      order: 2,
    });
    expect(AdminCourseValidation.linkBody.parse(linkPayload(apiRecord))).toEqual({
      url: apiRecord.url,
      title: "Resource",
      order: 2,
    });
    expect(
      AdminCourseValidation.videoPdfBody.parse(videoPdfPayload(apiRecord)),
    ).toEqual({ url: apiRecord.url, title: "Resource" });
  });

  it("creates tests as drafts and uses the strict edit contract", () => {
    const create = testCreatePayload({
      attemptLimit: "2",
      testType: "FINAL",
      title: "Final test",
      timeLimit: "60",
      published: true,
    });
    expect(AdminCourseValidation.createTestBody.parse(create)).toMatchObject({
      attemptLimit: 2,
      timeLimit: 60,
      published: false,
    });
    expect(
      AdminCourseValidation.createTestBody.safeParse({ ...create, published: true })
        .success,
    ).toBe(false);

    expect(
      AdminCourseValidation.editTestBody.parse(
        testEditPayload({
          title: "Final test",
          attemptLimit: "3",
          timeLimit: "0",
          published: true,
          courseId: 10,
        }),
      ),
    ).toEqual({
      title: "Final test",
      attemptLimit: 3,
      timeLimit: 0,
      published: true,
    });
  });

  it("builds strict create, edit, and reorder question payloads", () => {
    const question = {
      type: "MULTIPLE_CHOICE",
      question: "Choose one",
      choices: [
        { id: 1000, type: "CREATE", text: "A", isCorrect: true },
        { id: 1001, type: "CREATE", text: "B", isCorrect: false },
      ],
    };
    expect(
      AdminCourseValidation.createQuestionBody.parse(
        questionCreatePayload(question),
      ).choices,
    ).toEqual([
      { text: "A", value: "A", isCorrect: true },
      { text: "B", value: "B", isCorrect: false },
    ]);

    const edit = questionEditPayload({
      ...question,
      choices: [
        { id: 1, text: "A", isCorrect: true },
        { id: 2, text: "B", isCorrect: false, type: "DELETE" },
        { id: 1002, text: "C", isCorrect: false, type: "CREATE" },
      ],
    });
    expect(AdminCourseValidation.editQuestionBody.parse(edit).choices).toEqual([
      { id: 1, text: "A", value: "A", isCorrect: true },
      { id: 2, type: "DELETE" },
      { type: "CREATE", text: "C", value: "C", isCorrect: false },
    ]);
    expect(
      AdminCourseValidation.reorderQuestionsBody.parse(
        questionOrderPayload([{ id: 8, title: "ignored" }, { id: 9 }]),
      ),
    ).toEqual([{ id: 8 }, { id: 9 }]);
  });

  it("keeps frontend question rules aligned with publishing rules", () => {
    expect(
      validateQuestionDraft({
        type: "SINGLE_CHOICE",
        question: "Pick",
        choices: [
          { text: "A", isCorrect: false },
          { text: "B", isCorrect: false },
        ],
      }),
    ).toBe("Select exactly one correct answer");
    expect(
      validateQuestionDraft({
        type: "ORDERING",
        question: "Order",
        choices: [
          { text: "A", order: 0 },
          { text: "B", order: 1 },
        ],
      }),
    ).toBeNull();
  });

  it("builds the strict learner homework payload", () => {
    expect(
      StaffCourseValidation.homeworkBody.parse(
        homeworkPayload({
          url: "https://example.com/homework.pdf",
          type: "SUMMARY",
          title: "Summary",
          testId: 9,
        }),
      ),
    ).toEqual({
      url: "https://example.com/homework.pdf",
      type: "SUMMARY",
      title: "Summary",
    });
  });
});

describe("courses API adapter", () => {
  it("treats 201 as legacy-compatible success without losing the HTTP status", () => {
    expect(
      normalizeMutationResult({ success: true, data: { id: 1 } }, 201),
    ).toMatchObject({ success: true, ok: true, status: 200, httpStatus: 201 });
  });

  it("shows structured validation details to the user", () => {
    const result = describeApiError({
      message: "VALIDATION_ERROR",
      details: [
        { path: "published", message: "Add valid questions before publishing." },
      ],
    });
    expect(result.message).toContain("published");
    expect(result.message).toContain("Add valid questions before publishing.");
  });
});
