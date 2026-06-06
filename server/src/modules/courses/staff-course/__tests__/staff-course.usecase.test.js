import { describe, it, expect, vi } from "vitest";
import { StaffCourseUsecase } from "../staff-course.usecase.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { coursesMessagesCodes } from "@dms/shared";

/** Minimal fake repository — only the methods each tested usecase touches. */
function makeRepo(overrides = {}) {
  return { ...overrides };
}

// Stub notifier so endAttempt never reaches the (lazy) legacy notification import.
const noopNotify = vi.fn().mockResolvedValue(undefined);

describe("StaffCourseUsecase.checkIfUserCanAccessAttempt (scope / IDOR gate)", () => {
  it("returns the attempt row when it belongs to the caller", async () => {
    const attempt = { id: 5, userId: 7 };
    const repo = makeRepo({
      getAttemptOwner: vi.fn().mockResolvedValue(attempt),
    });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: noopNotify });

    const result = await usecase.checkIfUserCanAccessAttempt({
      attemptId: 5,
      authUserId: 7,
    });
    expect(result).toBe(attempt);
  });

  it("THROWS 404 ATTEMPT_NOT_FOUND when the attempt does not exist", async () => {
    const repo = makeRepo({ getAttemptOwner: vi.fn().mockResolvedValue(null) });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: noopNotify });

    await expect(
      usecase.checkIfUserCanAccessAttempt({ attemptId: 99, authUserId: 7 }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: coursesMessagesCodes.ATTEMPT_NOT_FOUND,
    });
  });

  it("THROWS 403 ATTEMPT_ACCESS_DENIED for another user's attempt", async () => {
    const repo = makeRepo({
      getAttemptOwner: vi.fn().mockResolvedValue({ id: 5, userId: 1 }),
    });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: noopNotify });

    const promise = usecase.checkIfUserCanAccessAttempt({
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
    const repo = makeRepo({
      getAttemptOwner: vi.fn().mockResolvedValue(attempt),
    });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: noopNotify });

    const result = await usecase.checkIfUserCanMutateAttempt({
      attemptId: 5,
      authUserId: 7,
    });
    expect(result).toBe(attempt);
  });

  it("THROWS 404 ATTEMPT_NOT_FOUND when the attempt does not exist", async () => {
    const repo = makeRepo({ getAttemptOwner: vi.fn().mockResolvedValue(null) });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: noopNotify });

    await expect(
      usecase.checkIfUserCanMutateAttempt({ attemptId: 99, authUserId: 7 }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: coursesMessagesCodes.ATTEMPT_NOT_FOUND,
    });
  });

  it("THROWS 403 ATTEMPT_ACCESS_DENIED for another user's attempt (the IDOR block)", async () => {
    const repo = makeRepo({
      getAttemptOwner: vi.fn().mockResolvedValue({ id: 5, userId: 1, testId: 9 }),
    });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: noopNotify });

    const promise = usecase.checkIfUserCanMutateAttempt({
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
    const repo = makeRepo({
      getAttemptOwner: vi
        .fn()
        .mockResolvedValue({ id: 5, userId: 7, testId: 9, endTime: null }),
      getQuestionTestId: vi.fn().mockResolvedValue({ id: 3, testId: 9 }),
      findExistingAnswer: vi.fn().mockResolvedValue(null),
      createUserAnswer: vi.fn().mockResolvedValue(created),
    });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: noopNotify });

    const result = await usecase.submitAnswer({
      answer: baseAnswer,
      attemptId: 5,
      questionId: 3,
      testId: 9,
      authUserId: 7,
    });
    expect(result).toBe(created);
    expect(repo.createUserAnswer).toHaveBeenCalledTimes(1);
  });

  it("THROWS 403 when a NON-OWNER submits an answer (C1 IDOR)", async () => {
    const repo = makeRepo({
      getAttemptOwner: vi
        .fn()
        .mockResolvedValue({ id: 5, userId: 1, testId: 9, endTime: null }),
      createUserAnswer: vi.fn(),
    });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: noopNotify });

    await expect(
      usecase.submitAnswer({
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
    expect(repo.createUserAnswer).not.toHaveBeenCalled();
  });

  it("THROWS 400 QUESTION_TEST_MISMATCH when the question belongs to another test (H2)", async () => {
    const repo = makeRepo({
      getAttemptOwner: vi
        .fn()
        .mockResolvedValue({ id: 5, userId: 7, testId: 9, endTime: null }),
      getQuestionTestId: vi.fn().mockResolvedValue({ id: 3, testId: 42 }),
      createUserAnswer: vi.fn(),
    });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: noopNotify });

    await expect(
      usecase.submitAnswer({
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
    expect(repo.createUserAnswer).not.toHaveBeenCalled();
  });

  it("THROWS 400 QUESTION_TEST_MISMATCH when the route :testId != the attempt's test (H2)", async () => {
    const repo = makeRepo({
      getAttemptOwner: vi
        .fn()
        .mockResolvedValue({ id: 5, userId: 7, testId: 9, endTime: null }),
      getQuestionTestId: vi.fn(),
      createUserAnswer: vi.fn(),
    });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: noopNotify });

    await expect(
      usecase.submitAnswer({
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
    expect(repo.createUserAnswer).not.toHaveBeenCalled();
  });

  it("THROWS 409 ATTEMPT_ALREADY_ENDED when submitting to a finalized attempt (H1)", async () => {
    const repo = makeRepo({
      getAttemptOwner: vi.fn().mockResolvedValue({
        id: 5,
        userId: 7,
        testId: 9,
        endTime: new Date(),
      }),
      createUserAnswer: vi.fn(),
    });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: noopNotify });

    await expect(
      usecase.submitAnswer({
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
    expect(repo.createUserAnswer).not.toHaveBeenCalled();
  });
});

describe("StaffCourseUsecase.createAttempt (attempt-limit invariant + M1 atomicity)", () => {
  // M1: createAttempt now runs inside repository.runTransaction and reads the prior
  // attempt FOR UPDATE. Fake both so the limit check + insert path is exercised.
  function makeAtomicRepo(extra = {}) {
    return makeRepo({
      runTransaction: vi.fn((fn) => fn("TX")),
      ...extra,
    });
  }

  it("THROWS 400 ATTEMPT_LIMIT_REACHED when count >= limit", async () => {
    const repo = makeAtomicRepo({
      getTestById: vi.fn().mockResolvedValue({ id: 1, attemptLimit: 2 }),
      getLastUserAttemptForUpdate: vi
        .fn()
        .mockResolvedValue({ attemptCount: 2, attemptLimit: 2 }),
      createAttempt: vi.fn(),
    });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: noopNotify });

    await expect(
      usecase.createAttempt({ testId: 1, userId: 7 }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: coursesMessagesCodes.ATTEMPT_LIMIT_REACHED,
    });
    expect(repo.createAttempt).not.toHaveBeenCalled();
    // The lock-read happened inside the transaction (TOCTOU-safe path).
    expect(repo.getLastUserAttemptForUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ testId: 1, userId: 7, client: "TX" }),
    );
  });

  it("creates the next attempt (count+1, max limit) when under the limit", async () => {
    const created = { id: 10 };
    const repo = makeAtomicRepo({
      getTestById: vi.fn().mockResolvedValue({ id: 1, attemptLimit: 3 }),
      getLastUserAttemptForUpdate: vi
        .fn()
        .mockResolvedValue({ attemptCount: 1, attemptLimit: 2 }),
      createAttempt: vi.fn().mockResolvedValue(created),
    });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: noopNotify });

    const result = await usecase.createAttempt({ testId: 1, userId: 7 });
    expect(result).toBe(created);
    expect(repo.createAttempt).toHaveBeenCalledWith({
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
    const repo = makeRepo({
      getAttemptForScoring: vi.fn().mockResolvedValue(attempt),
      updateAttemptScore: vi.fn().mockResolvedValue(undefined),
    });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: noopNotify });

    const result = await usecase.endAttempt({ attemptId: 1 });
    expect(result).toEqual({ score: 100, passed: true });
    expect(repo.updateAttemptScore).toHaveBeenCalledWith(
      expect.objectContaining({ attemptId: 1, score: 100, passed: true }),
    );
    expect(noopNotify).not.toHaveBeenCalled();
  });

  it("notifies on a fully-consumed FAILED attempt (count >= limit)", async () => {
    const notify = vi.fn().mockResolvedValue(undefined);
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
    const repo = makeRepo({
      getAttemptForScoring: vi.fn().mockResolvedValue(attempt),
      updateAttemptScore: vi.fn().mockResolvedValue(undefined),
    });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: notify });

    const result = await usecase.endAttempt({ attemptId: 2 });
    expect(result).toEqual({ score: 0, passed: false });
    expect(notify).toHaveBeenCalledWith({ testId: 9, userId: 7 });
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
    const repo = makeRepo({
      getAttemptForScoring: vi.fn().mockResolvedValue(attempt),
      updateAttemptScore: vi.fn(),
    });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: noopNotify });

    // Staff path: no reScore flag → guard fires.
    await expect(usecase.endAttempt({ attemptId: 3 })).rejects.toMatchObject({
      statusCode: 409,
      message: coursesMessagesCodes.ATTEMPT_ALREADY_ENDED,
    });
    expect(repo.updateAttemptScore).not.toHaveBeenCalled();
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
    const repo = makeRepo({
      getAttemptForScoring: vi.fn().mockResolvedValue(attempt),
      updateAttemptScore: vi.fn().mockResolvedValue(undefined),
    });
    const usecase = new StaffCourseUsecase(repo, { notifyAttemptFailed: noopNotify });

    const result = await usecase.endAttempt({ attemptId: 4, reScore: true });
    expect(result).toEqual({ score: 100, passed: true });
    expect(repo.updateAttemptScore).toHaveBeenCalledWith(
      expect.objectContaining({ attemptId: 4, score: 100, passed: true }),
    );
  });
});
