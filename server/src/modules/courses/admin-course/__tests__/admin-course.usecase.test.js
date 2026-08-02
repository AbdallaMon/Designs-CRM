import { describe, it, expect, vi, beforeEach } from "vitest";

// DI-removal: the usecase now calls the directly-imported repo singleton, and delegates
// re-scoring to the staff usecase singleton. Mock both seams.
vi.mock("../admin-course.repo.js", () => ({
  adminCourseRepository: {
    createCourse: vi.fn(),
    updateCourse: vi.fn(),
    updateUserAnswerApproval: vi.fn(),
    getLastUserAttempt: vi.fn(),
    updateAttemptLimit: vi.fn(),
    reorderQuestion: vi.fn(),
  },
}));

vi.mock("../../staff-course/staff-course.usecase.js", () => ({
  staffCourseUsecase: {
    endAttempt: vi.fn(),
  },
}));

import { adminCourseUsecase } from "../admin-course.usecase.js";
import { adminCourseRepository } from "../admin-course.repo.js";
import { staffCourseUsecase } from "../../staff-course/staff-course.usecase.js";
import { coursesMessagesCodes } from "@dms/shared";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminCourseUsecase.createCourse", () => {
  it("creates a course without role-based access rows", async () => {
    adminCourseRepository.createCourse.mockResolvedValue({ id: 1 });

    await adminCourseUsecase.createCourse({
      data: {
        title: "T",
        description: "D",
        imageUrl: null,
        isPublished: true,
        roles: ["STAFF", "ACCOUNTANT"],
      },
    });

    expect(adminCourseRepository.createCourse).toHaveBeenCalledWith({
      data: {
        title: "T",
        description: "D",
        imageUrl: null,
        isPublished: true,
      },
    });
  });
});

describe("AdminCourseUsecase.editCourse", () => {
  it("updates only explicit course fields", async () => {
    adminCourseRepository.updateCourse.mockResolvedValue({ id: 1 });

    await adminCourseUsecase.editCourse({
      courseId: 1,
      data: { title: "New", roles: ["STAFF"] },
    });

    expect(adminCourseRepository.updateCourse).toHaveBeenCalledWith({
      id: 1,
      data: {
        title: "New",
      },
    });
  });

  it("does not write role access when not provided", async () => {
    adminCourseRepository.updateCourse.mockResolvedValue({ id: 1 });

    await adminCourseUsecase.editCourse({ courseId: 1, data: { isPublished: false } });

    expect(adminCourseRepository.updateCourse).toHaveBeenCalledWith({
      id: 1,
      data: { isPublished: false },
    });
  });
});

describe("AdminCourseUsecase.approveUserAnswer", () => {
  it("flips approval then re-scores the attempt via the staff usecase", async () => {
    staffCourseUsecase.endAttempt.mockResolvedValue({ score: 100, passed: true });
    adminCourseRepository.updateUserAnswerApproval.mockResolvedValue({ count: 1 });

    const result = await adminCourseUsecase.approveUserAnswer({
      attemptId: 3,
      questionId: 4,
      isApproved: true,
    });

    expect(adminCourseRepository.updateUserAnswerApproval).toHaveBeenCalledWith({
      questionId: 4,
      attemptId: 3,
      isApproved: true,
    });
    // H1: admin re-score must bypass the staff terminal-state guard.
    expect(staffCourseUsecase.endAttempt).toHaveBeenCalledWith({ attemptId: 3, reScore: true });
    expect(result).toBe(true);
  });
});

describe("AdminCourseUsecase.decreaseAttemptToUser (guard)", () => {
  it("THROWS ATTEMPT_CANNOT_DECREASE when limit === consumed count", async () => {
    adminCourseRepository.getLastUserAttempt.mockResolvedValue({ id: 1, attemptLimit: 2, attemptCount: 2 });

    await expect(
      adminCourseUsecase.decreaseAttemptToUser({ testId: 1, userId: 7 }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: coursesMessagesCodes.ATTEMPT_CANNOT_DECREASE,
    });
    expect(adminCourseRepository.updateAttemptLimit).not.toHaveBeenCalled();
  });

  it("THROWS ATTEMPT_NOT_FOUND when the user has no attempt", async () => {
    adminCourseRepository.getLastUserAttempt.mockResolvedValue(null);

    await expect(
      adminCourseUsecase.increaseAttemptToUser({ testId: 1, userId: 7 }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: coursesMessagesCodes.ATTEMPT_NOT_FOUND,
    });
  });

  it("decrements the limit when count < limit", async () => {
    adminCourseRepository.getLastUserAttempt.mockResolvedValue({ id: 9, attemptLimit: 3, attemptCount: 1 });
    adminCourseRepository.updateAttemptLimit.mockResolvedValue(undefined);

    await adminCourseUsecase.decreaseAttemptToUser({ testId: 1, userId: 7 });
    expect(adminCourseRepository.updateAttemptLimit).toHaveBeenCalledWith({
      id: 9,
      attemptLimit: 2,
    });
  });
});

describe("AdminCourseUsecase.reorderTestQuestions", () => {
  it("assigns order = index + 1 for each posted question id", async () => {
    adminCourseRepository.reorderQuestion.mockResolvedValue({});

    await adminCourseUsecase.reorderTestQuestions({ data: [{ id: "5" }, { id: 8 }] });
    expect(adminCourseRepository.reorderQuestion).toHaveBeenNthCalledWith(1, { id: 5, order: 1 });
    expect(adminCourseRepository.reorderQuestion).toHaveBeenNthCalledWith(2, { id: 8, order: 2 });
  });
});
