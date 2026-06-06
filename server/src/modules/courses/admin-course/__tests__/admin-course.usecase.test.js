import { describe, it, expect, vi } from "vitest";
import { AdminCourseUsecase } from "../admin-course.usecase.js";
import { coursesMessagesCodes } from "@dms/shared";

function makeRepo(overrides = {}) {
  return { ...overrides };
}

describe("AdminCourseUsecase.createCourse", () => {
  it("nested-creates the CourseRole rows from the roles[] payload", async () => {
    const repo = makeRepo({ createCourse: vi.fn().mockResolvedValue({ id: 1 }) });
    const usecase = new AdminCourseUsecase(repo, { endAttempt: vi.fn() });

    await usecase.createCourse({
      data: {
        title: "T",
        description: "D",
        imageUrl: null,
        isPublished: true,
        roles: ["STAFF", "ACCOUNTANT"],
      },
    });

    expect(repo.createCourse).toHaveBeenCalledWith({
      data: {
        title: "T",
        description: "D",
        imageUrl: null,
        isPublished: true,
        roles: { create: [{ role: "STAFF" }, { role: "ACCOUNTANT" }] },
      },
    });
  });
});

describe("AdminCourseUsecase.editCourse", () => {
  it("replaces roles wholesale (deleteMany + create) and spreads the rest", async () => {
    const repo = makeRepo({ updateCourse: vi.fn().mockResolvedValue({ id: 1 }) });
    const usecase = new AdminCourseUsecase(repo, { endAttempt: vi.fn() });

    await usecase.editCourse({
      courseId: 1,
      data: { title: "New", roles: ["STAFF"] },
    });

    expect(repo.updateCourse).toHaveBeenCalledWith({
      id: 1,
      data: {
        title: "New",
        roles: { deleteMany: {}, create: [{ role: "STAFF" }] },
      },
    });
  });

  it("leaves roles undefined when not provided (no role wipe)", async () => {
    const repo = makeRepo({ updateCourse: vi.fn().mockResolvedValue({ id: 1 }) });
    const usecase = new AdminCourseUsecase(repo, { endAttempt: vi.fn() });

    await usecase.editCourse({ courseId: 1, data: { isPublished: false } });

    expect(repo.updateCourse).toHaveBeenCalledWith({
      id: 1,
      data: { isPublished: false, roles: undefined },
    });
  });
});

describe("AdminCourseUsecase.approveUserAnswer", () => {
  it("flips approval then re-scores the attempt via injected endAttempt", async () => {
    const endAttempt = vi.fn().mockResolvedValue({ score: 100, passed: true });
    const repo = makeRepo({
      updateUserAnswerApproval: vi.fn().mockResolvedValue({ count: 1 }),
    });
    const usecase = new AdminCourseUsecase(repo, { endAttempt });

    const result = await usecase.approveUserAnswer({
      attemptId: 3,
      questionId: 4,
      isApproved: true,
    });

    expect(repo.updateUserAnswerApproval).toHaveBeenCalledWith({
      questionId: 4,
      attemptId: 3,
      isApproved: true,
    });
    // H1: admin re-score must bypass the staff terminal-state guard.
    expect(endAttempt).toHaveBeenCalledWith({ attemptId: 3, reScore: true });
    expect(result).toBe(true);
  });
});

describe("AdminCourseUsecase.decreaseAttemptToUser (guard)", () => {
  it("THROWS ATTEMPT_CANNOT_DECREASE when limit === consumed count", async () => {
    const repo = makeRepo({
      getLastUserAttempt: vi
        .fn()
        .mockResolvedValue({ id: 1, attemptLimit: 2, attemptCount: 2 }),
      updateAttemptLimit: vi.fn(),
    });
    const usecase = new AdminCourseUsecase(repo, { endAttempt: vi.fn() });

    await expect(
      usecase.decreaseAttemptToUser({ testId: 1, userId: 7 }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: coursesMessagesCodes.ATTEMPT_CANNOT_DECREASE,
    });
    expect(repo.updateAttemptLimit).not.toHaveBeenCalled();
  });

  it("THROWS ATTEMPT_NOT_FOUND when the user has no attempt", async () => {
    const repo = makeRepo({
      getLastUserAttempt: vi.fn().mockResolvedValue(null),
      updateAttemptLimit: vi.fn(),
    });
    const usecase = new AdminCourseUsecase(repo, { endAttempt: vi.fn() });

    await expect(
      usecase.increaseAttemptToUser({ testId: 1, userId: 7 }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: coursesMessagesCodes.ATTEMPT_NOT_FOUND,
    });
  });

  it("decrements the limit when count < limit", async () => {
    const repo = makeRepo({
      getLastUserAttempt: vi
        .fn()
        .mockResolvedValue({ id: 9, attemptLimit: 3, attemptCount: 1 }),
      updateAttemptLimit: vi.fn().mockResolvedValue(undefined),
    });
    const usecase = new AdminCourseUsecase(repo, { endAttempt: vi.fn() });

    await usecase.decreaseAttemptToUser({ testId: 1, userId: 7 });
    expect(repo.updateAttemptLimit).toHaveBeenCalledWith({
      id: 9,
      attemptLimit: 2,
    });
  });
});

describe("AdminCourseUsecase.reorderTestQuestions", () => {
  it("assigns order = index + 1 for each posted question id", async () => {
    const repo = makeRepo({ reorderQuestion: vi.fn().mockResolvedValue({}) });
    const usecase = new AdminCourseUsecase(repo, { endAttempt: vi.fn() });

    await usecase.reorderTestQuestions({ data: [{ id: "5" }, { id: 8 }] });
    expect(repo.reorderQuestion).toHaveBeenNthCalledWith(1, { id: 5, order: 1 });
    expect(repo.reorderQuestion).toHaveBeenNthCalledWith(2, { id: 8, order: 2 });
  });
});
