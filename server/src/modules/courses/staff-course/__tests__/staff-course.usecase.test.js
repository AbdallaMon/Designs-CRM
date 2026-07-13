import { describe, it, expect, vi, beforeEach } from "vitest";

// DI-removal: the usecase now calls the directly-imported repo singleton and the
// notifications module (via a lazy import). Mock both seams — the notifier stub replaces
// the `notifyAttemptFailed` dependency the constructor used to inject.
vi.mock("../staff-course.repo.js", () => ({
  staffCourseRepository: {
    getAttemptOwner: vi.fn(),
    getQuestionTestId: vi.fn(),
    findExistingAnswer: vi.fn(),
    deleteSelectedAnswers: vi.fn(),
    updateUserAnswer: vi.fn(),
    createUserAnswer: vi.fn(),
    getTestById: vi.fn(),
    runTransaction: vi.fn(),
    getLastUserAttemptForUpdate: vi.fn(),
    createAttempt: vi.fn(),
    getAttemptForScoring: vi.fn(),
    updateAttemptScore: vi.fn(),
  },
}));

vi.mock("../../../../infra/notifications/index.js", () => ({
  attemptFailedByUser: vi.fn(),
}));

import { staffCourseUsecase } from "../staff-course.usecase.js";
import { staffCourseRepository } from "../staff-course.repo.js";
import { attemptFailedByUser } from "../../../../infra/notifications/index.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { coursesMessagesCodes } from "@dms/shared";

beforeEach(() => {
  vi.clearAllMocks();
  // M1: createAttempt runs inside repository.runTransaction; default it to run inline
  // with a fake tx client so the limit-check + insert path is exercised.
  staffCourseRepository.runTransaction.mockImplementation((fn) => fn("TX"));
});

describe("StaffCourseUsecase.checkIfUserCanAccessAttempt (scope / IDOR gate)", () => {
  it("returns the attempt row when it belongs to the caller", async () => {
    const attempt = { id: 5, userId: 7 };
    staffCourseRepository.getAttemptOwner.mockResolvedValue(attempt);

    const result = await staffCourseUsecase.checkIfUserCanAccessAttempt({
      attemptId: 5,
      authUserId: 7,
    });
    expect(result).toBe(attempt);
  });

  it("THROWS 404 ATTEMPT_NOT_FOUND when the attempt does not exist", async () => {
    staffCourseRepository.getAttemptOwner.mockResolvedValue(null);

    await expect(
      staffCourseUsecase.checkIfUserCanAccessAttempt({ attemptId: 99, authUserId: 7 }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: coursesMessagesCodes.ATTEMPT_NOT_FOUND,
    });
  });

  it("THROWS 403 ATTEMPT_ACCESS_DENIED for another user's attempt", async () => {
    staffCourseRepository.getAttemptOwner.mockResolvedValue({ id: 5, userId: 1 });

    const promise = staffCourseUsecase.checkIfUserCanAccessAttempt({
      attemptId: 5,
      authUserId: 7,
    });
    await expect(promise).rejects.toBeInstanceOf(AppError);
    await expect(promise).rejects.toMatchObject({
      statusCode: 403,
      message: coursesMessagesCodes.ATTEMPT_ACCESS_DENIED,
    });
  });
});

describe("StaffCourseUsecase.checkIfUserCanMutateAttempt (C1/C2 write-scope gate)", () => {
  it("returns the attempt row when it belongs to the caller", async () => {
    const attempt = { id: 5, userId: 7, testId: 9, endTime: null };
    staffCourseRepository.getAttemptOwner.mockResolvedValue(attempt);

    const result = await staffCourseUsecase.checkIfUserCanMutateAttempt({
      attemptId: 5,
      authUserId: 7,
    });
    expect(result).toBe(attempt);
  });

  it("THROWS 404 ATTEMPT_NOT_FOUND when the attempt does not exist", async () => {
    staffCourseRepository.getAttemptOwner.mockResolvedValue(null);

    await expect(
      staffCourseUsecase.checkIfUserCanMutateAttempt({ attemptId: 99, authUserId: 7 }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: coursesMessagesCodes.ATTEMPT_NOT_FOUND,
    });
  });

  it("THROWS 403 ATTEMPT_ACCESS_DENIED for another user's attempt (the IDOR block)", async () => {
    staffCourseRepository.getAttemptOwner.mockResolvedValue({ id: 5, userId: 1, testId: 9 });

    const promise = staffCourseUsecase.checkIfUserCanMutateAttempt({
      attemptId: 5,
      authUserId: 7,
    });
    await expect(promise).rejects.toBeInstanceOf(AppError);
    await expect(promise).rejects.toMatchObject({
      statusCode: 403,
      message: coursesMessagesCodes.ATTEMPT_ACCESS_DENIED,
    });
  });
});

describe("StaffCourseUsecase.submitAnswer (C1 owner / H1 terminal / H2 binding)", () => {
  const baseAnswer = { textAnswer: "x", selectedAnswers: ["A"] };

  it("OWNER submitting a valid same-test question SUCCEEDS (legitimate use preserved)", async () => {
    const created = { id: 100 };
    staffCourseRepository.getAttemptOwner.mockResolvedValue({ id: 5, userId: 7, testId: 9, endTime: null });
    staffCourseRepository.getQuestionTestId.mockResolvedValue({ id: 3, testId: 9 });
    staffCourseRepository.findExistingAnswer.mockResolvedValue(null);
    staffCourseRepository.createUserAnswer.mockResolvedValue(created);

    const result = await staffCourseUsecase.submitAnswer({
      answer: baseAnswer,
      attemptId: 5,
      questionId: 3,
      testId: 9,
      authUserId: 7,
    });
    expect(result).toBe(created);
    expect(staffCourseRepository.createUserAnswer).toHaveBeenCalledTimes(1);
  });

  it("THROWS 403 when a NON-OWNER submits an answer (C1 IDOR)", async () => {
    staffCourseRepository.getAttemptOwner.mockResolvedValue({ id: 5, userId: 1, testId: 9, endTime: null });

    await expect(
      staffCourseUsecase.submitAnswer({
        answer: baseAnswer,
        attemptId: 5,
        questionId: 3,
        testId: 9,
        authUserId: 7,
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: coursesMessagesCodes.ATTEMPT_ACCESS_DENIED,
    });
    expect(staffCourseRepository.createUserAnswer).not.toHaveBeenCalled();
  });

  it("THROWS 400 QUESTION_TEST_MISMATCH when the question belongs to another test (H2)", async () => {
    staffCourseRepository.getAttemptOwner.mockResolvedValue({ id: 5, userId: 7, testId: 9, endTime: null });
    staffCourseRepository.getQuestionTestId.mockResolvedValue({ id: 3, testId: 42 });

    await expect(
      staffCourseUsecase.submitAnswer({
        answer: baseAnswer,
        attemptId: 5,
        questionId: 3,
        testId: 9,
        authUserId: 7,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: coursesMessagesCodes.QUESTION_TEST_MISMATCH,
    });
    expect(staffCourseRepository.createUserAnswer).not.toHaveBeenCalled();
  });

  it("THROWS 400 QUESTION_TEST_MISMATCH when the route :testId != the attempt's test (H2)", async () => {
    staffCourseRepository.getAttemptOwner.mockResolvedValue({ id: 5, userId: 7, testId: 9, endTime: null });

    await expect(
      staffCourseUsecase.submitAnswer({
        answer: baseAnswer,
        attemptId: 5,
        questionId: 3,
        testId: 1, // mismatched route test id
        authUserId: 7,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: coursesMessagesCodes.QUESTION_TEST_MISMATCH,
    });
    expect(staffCourseRepository.createUserAnswer).not.toHaveBeenCalled();
  });

  it("THROWS 409 ATTEMPT_ALREADY_ENDED when submitting to a finalized attempt (H1)", async () => {
    staffCourseRepository.getAttemptOwner.mockResolvedValue({
      id: 5,
      userId: 7,
      testId: 9,
      endTime: new Date(),
    });

    await expect(
      staffCourseUsecase.submitAnswer({
        answer: baseAnswer,
        attemptId: 5,
        questionId: 3,
        testId: 9,
        authUserId: 7,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: coursesMessagesCodes.ATTEMPT_ALREADY_ENDED,
    });
    expect(staffCourseRepository.createUserAnswer).not.toHaveBeenCalled();
  });
});

describe("StaffCourseUsecase.createAttempt (attempt-limit invariant + M1 atomicity)", () => {
  it("THROWS 400 ATTEMPT_LIMIT_REACHED when count >= limit", async () => {
    staffCourseRepository.getTestById.mockResolvedValue({ id: 1, attemptLimit: 2 });
    staffCourseRepository.getLastUserAttemptForUpdate.mockResolvedValue({ attemptCount: 2, attemptLimit: 2 });

    await expect(
      staffCourseUsecase.createAttempt({ testId: 1, userId: 7 }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: coursesMessagesCodes.ATTEMPT_LIMIT_REACHED,
    });
    expect(staffCourseRepository.createAttempt).not.toHaveBeenCalled();
    // The lock-read happened inside the transaction (TOCTOU-safe path).
    expect(staffCourseRepository.getLastUserAttemptForUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ testId: 1, userId: 7, client: "TX" }),
    );
  });

  it("creates the next attempt (count+1, max limit) when under the limit", async () => {
    const created = { id: 10 };
    staffCourseRepository.getTestById.mockResolvedValue({ id: 1, attemptLimit: 3 });
    staffCourseRepository.getLastUserAttemptForUpdate.mockResolvedValue({ attemptCount: 1, attemptLimit: 2 });
    staffCourseRepository.createAttempt.mockResolvedValue(created);

    const result = await staffCourseUsecase.createAttempt({ testId: 1, userId: 7 });
    expect(result).toBe(created);
    expect(staffCourseRepository.createAttempt).toHaveBeenCalledWith({
      client: "TX",
      data: expect.objectContaining({
        testId: 1,
        userId: 7,
        attemptCount: 2,
        attemptLimit: 3, // max(last.attemptLimit=2, test.attemptLimit=3)
      }),
    });
  });
});

describe("StaffCourseUsecase.endAttempt (scoring math ported 1:1)", () => {
  it("scores a fully-correct single-choice attempt as 100 / passed", async () => {
    const attempt = {
      id: 1,
      testId: 9,
      userId: 7,
      attemptCount: 1,
      attemptLimit: 2,
      test: { questions: [{ id: 1 }] },
      answers: [
        {
          isApproved: false,
          question: {
            type: "SINGLE_CHOICE",
            choices: [{ text: "A", isCorrect: true }],
          },
          selectedAnswers: [{ value: "A" }],
        },
      ],
    };
    staffCourseRepository.getAttemptForScoring.mockResolvedValue(attempt);
    staffCourseRepository.updateAttemptScore.mockResolvedValue(undefined);

    const result = await staffCourseUsecase.endAttempt({ attemptId: 1 });
    expect(result).toEqual({ score: 100, passed: true });
    expect(staffCourseRepository.updateAttemptScore).toHaveBeenCalledWith(
      expect.objectContaining({ attemptId: 1, score: 100, passed: true }),
    );
    expect(attemptFailedByUser).not.toHaveBeenCalled();
  });

  it("notifies on a fully-consumed FAILED attempt (count >= limit)", async () => {
    const attempt = {
      id: 2,
      testId: 9,
      userId: 7,
      attemptCount: 2,
      attemptLimit: 2,
      test: { questions: [{ id: 1 }] },
      answers: [
        {
          question: {
            type: "SINGLE_CHOICE",
            choices: [{ text: "A", isCorrect: true }],
          },
          selectedAnswers: [{ value: "B" }], // wrong → score 0 → failed
        },
      ],
    };
    staffCourseRepository.getAttemptForScoring.mockResolvedValue(attempt);
    staffCourseRepository.updateAttemptScore.mockResolvedValue(undefined);

    const result = await staffCourseUsecase.endAttempt({ attemptId: 2 });
    expect(result).toEqual({ score: 0, passed: false });
    expect(attemptFailedByUser).toHaveBeenCalledWith({ testId: 9, userId: 7 });
  });

  it("REJECTS a staff re-end of a finalized attempt with 409 (H1)", async () => {
    const attempt = {
      id: 3,
      testId: 9,
      userId: 7,
      attemptCount: 1,
      attemptLimit: 2,
      endTime: new Date(), // already finalized
      test: { questions: [{ id: 1 }] },
      answers: [],
    };
    staffCourseRepository.getAttemptForScoring.mockResolvedValue(attempt);

    // Staff path: no reScore flag → guard fires.
    await expect(staffCourseUsecase.endAttempt({ attemptId: 3 })).rejects.toMatchObject({
      statusCode: 409,
      message: coursesMessagesCodes.ATTEMPT_ALREADY_ENDED,
    });
    expect(staffCourseRepository.updateAttemptScore).not.toHaveBeenCalled();
  });

  it("ALLOWS the admin re-score path on a finalized attempt via reScore:true (H1)", async () => {
    const attempt = {
      id: 4,
      testId: 9,
      userId: 7,
      attemptCount: 1,
      attemptLimit: 2,
      endTime: new Date(), // finalized — staff would be blocked
      test: { questions: [{ id: 1 }] },
      answers: [
        {
          isApproved: true,
          question: { type: "TEXT", choices: [] },
          selectedAnswers: [],
        },
      ],
    };
    staffCourseRepository.getAttemptForScoring.mockResolvedValue(attempt);
    staffCourseRepository.updateAttemptScore.mockResolvedValue(undefined);

    const result = await staffCourseUsecase.endAttempt({ attemptId: 4, reScore: true });
    expect(result).toEqual({ score: 100, passed: true });
    expect(staffCourseRepository.updateAttemptScore).toHaveBeenCalledWith(
      expect.objectContaining({ attemptId: 4, score: 100, passed: true }),
    );
  });
});
