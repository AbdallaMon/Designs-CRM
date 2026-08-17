import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../staff-course.repo.js", () => ({
  staffCourseRepository: {
    listPublishedCourses: vi.fn(),
    getPublishedCourse: vi.fn(),
    countPreviewableLessons: vi.fn(),
    countPublishedCourseTests: vi.fn(),
    listCompletedLessonIds: vi.fn(),
    listCompletedTestIds: vi.fn(),
    listTestAttemptsForCourse: vi.fn(),
    getPreviewableLesson: vi.fn(),
    getLessonAccess: vi.fn(),
    listPreviousHomeworkLessons: vi.fn(),
    listCompletedLessonIdsIn: vi.fn(),
    listLessonsWithPublishedTests: vi.fn(),
    findPassedAttempt: vi.fn(),
    listHomeworks: vi.fn(),
    createHomework: vi.fn(),
    listHomeworkTypes: vi.fn(),
    findCourseProgress: vi.fn(),
    createCourseProgress: vi.fn(),
    findCompletedLesson: vi.fn(),
    createCompletedLesson: vi.fn(),
    lockCourseForUpdate: vi.fn(),
    getPublishedTestWithRelations: vi.fn(),
    listTestQuestions: vi.fn(),
    listUserAttempts: vi.fn(),
    getUserAttempt: vi.fn(),
    getAttemptOwner: vi.fn(),
    getAttemptOwnerForUpdate: vi.fn(),
    lockTestForUpdate: vi.fn(),
    getLastUserAttemptForUpdate: vi.fn(),
    createAttempt: vi.fn(),
    getQuestionTestId: vi.fn(),
    findExistingAnswer: vi.fn(),
    deleteSelectedAnswers: vi.fn(),
    updateUserAnswer: vi.fn(),
    createUserAnswer: vi.fn(),
    getAttemptForScoring: vi.fn(),
    updateAttemptScore: vi.fn(),
    runTransaction: vi.fn(),
  },
}));

vi.mock("../../../../infra/notifications/index.js", () => ({
  attemptFailedByUser: vi.fn(),
}));

import { coursesMessagesCodes, generalMessagesCodes } from "@dms/shared";
import { attemptFailedByUser } from "../../../../infra/notifications/index.js";
import {
  COURSE_ROLE_BY_PROFILE_KEY,
  courseRoleForAuthUser,
} from "../course-profile-role.js";
import { staffCourseRepository as repo } from "../staff-course.repo.js";
import { staffCourseUsecase as usecase } from "../staff-course.usecase.js";

const AUTH_USER = { id: 7, currentProfileKey: "NORMAL_SALES", permissions: [] };

const validQuestion = (overrides = {}) => ({
  id: 1,
  type: "SINGLE_CHOICE",
  question: "Question?",
  choices: [
    { id: 1, text: "A", value: "A", isCorrect: true, order: 1 },
    { id: 2, text: "B", value: "B", isCorrect: false, order: 2 },
  ],
  ...overrides,
});

const validCourseTest = (overrides = {}) => ({
  id: 9,
  published: true,
  attemptLimit: 2,
  timeLimit: 60,
  course: { id: 20, title: "Course" },
  lesson: null,
  questions: [validQuestion()],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  repo.runTransaction.mockImplementation((fn) => fn("TX"));
  repo.listPublishedCourses.mockResolvedValue([]);
  repo.getPublishedCourse.mockResolvedValue({ id: 20 });
  repo.countPreviewableLessons.mockResolvedValue(1);
  repo.countPublishedCourseTests.mockResolvedValue(1);
  repo.listCompletedLessonIds.mockResolvedValue([]);
  repo.listCompletedTestIds.mockResolvedValue([]);
  repo.listTestAttemptsForCourse.mockResolvedValue([]);
  repo.getPreviewableLesson.mockResolvedValue({ id: 3, courseId: 20, order: 1 });
  repo.getLessonAccess.mockResolvedValue({ id: 1 });
  repo.listPreviousHomeworkLessons.mockResolvedValue([]);
  repo.listCompletedLessonIdsIn.mockResolvedValue([]);
  repo.listLessonsWithPublishedTests.mockResolvedValue([]);
  repo.getPublishedTestWithRelations.mockResolvedValue(validCourseTest());
  repo.lockTestForUpdate.mockResolvedValue({ id: 9 });
  repo.getLastUserAttemptForUpdate.mockResolvedValue(null);
  repo.createAttempt.mockResolvedValue({ id: 10, testId: 9, userId: 7 });
  repo.getQuestionTestId.mockResolvedValue({ id: 1, testId: 9 });
  repo.findExistingAnswer.mockResolvedValue(null);
  repo.createUserAnswer.mockResolvedValue({ id: 100 });
  repo.updateUserAnswer.mockResolvedValue({ id: 100 });
  repo.findCourseProgress.mockResolvedValue({ id: 40 });
  repo.findCompletedLesson.mockResolvedValue(null);
  repo.createCompletedLesson.mockResolvedValue({ id: 50, lessonId: 3 });
});

describe("active profile to CourseRole mapping", () => {
  it("maps every active profile explicitly and never reads a legacy role flag", () => {
    expect(COURSE_ROLE_BY_PROFILE_KEY).toEqual({
      ADMIN: "ADMIN",
      SUPER_ADMIN: "SUPER_ADMIN",
      NORMAL_SALES: "STAFF",
      PRIMARY_SALES: "STAFF",
      SUPER_SALES: "STAFF",
      ACCOUNTANT: "ACCOUNTANT",
      DESIGNER_3D: "THREE_D_DESIGNER",
      DESIGNER_2D: "TWO_D_DESIGNER",
      EXECUTOR_2D: "TWO_D_EXECUTOR",
      CONTACT_INITIATOR: null,
    });
    expect(
      courseRoleForAuthUser({
        currentProfileKey: "NORMAL_SALES",
        role: "ADMIN",
        isPrimary: true,
        isSuperSales: true,
      }),
    ).toBe("STAFF");
  });

  it.each(Object.entries(COURSE_ROLE_BY_PROFILE_KEY))(
    "%s applies the same visibility to list, detail, and lesson (%s)",
    async (profileKey, courseRole) => {
      const authUser = { id: 7, currentProfileKey: profileKey };
      if (!courseRole) {
        await expect(usecase.listCourses({ authUser })).resolves.toEqual([]);
        await expect(
          usecase.getCourse({ courseId: 20, userId: 7, authUser }),
        ).resolves.toBeNull();
        await expect(
          usecase.getLesson({ lessonId: 3, courseId: 20, userId: 7, authUser }),
        ).rejects.toMatchObject({
          statusCode: 403,
          message: coursesMessagesCodes.COURSE_ACCESS_DENIED,
        });
        return;
      }

      await usecase.listCourses({ skip: 0, take: 10, authUser });
      await usecase.getCourse({ courseId: 20, userId: 7, authUser });
      await usecase.getLesson({ lessonId: 3, courseId: 20, userId: 7, authUser });
      expect(repo.listPublishedCourses).toHaveBeenLastCalledWith(
        expect.objectContaining({ courseRole }),
      );
      expect(repo.getPublishedCourse).toHaveBeenLastCalledWith(
        expect.objectContaining({ courseRole }),
      );
      expect(repo.getPreviewableLesson).toHaveBeenLastCalledWith(
        expect.objectContaining({ courseRole, courseId: 20, lessonId: 3 }),
      );
    },
  );
});

describe("learner access gates", () => {
  it("removes choices.isCorrect from every learner question response", async () => {
    repo.listTestQuestions.mockResolvedValue([
      validQuestion({ choices: [{ id: 1, text: "A", isCorrect: true }] }),
    ]);
    const questions = await usecase.getUserTestQuestions({
      testId: 9,
      userId: 7,
      authUser: AUTH_USER,
    });
    expect(questions[0].choices[0]).not.toHaveProperty("isCorrect");
  });

  it.each(["getUserTest", "getUserTestQuestions", "getUserAttempts"])(
    "denies direct %s calls when the published test is outside profile scope",
    async (method) => {
      repo.getPublishedTestWithRelations.mockResolvedValue(null);
      await expect(
        usecase[method]({ testId: 9, userId: 7, authUser: AUTH_USER }),
      ).rejects.toMatchObject({
        statusCode: 403,
        message: coursesMessagesCodes.COURSE_ACCESS_DENIED,
      });
    },
  );

  it("requires LessonAccess for direct lesson-test reads", async () => {
    repo.getPublishedTestWithRelations.mockResolvedValue(
      validCourseTest({
        course: null,
        lesson: { id: 3, courseId: 20, order: 1 },
      }),
    );
    repo.getLessonAccess.mockResolvedValue(null);
    await expect(
      usecase.getUserTest({ testId: 9, userId: 7, authUser: AUTH_USER }),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: coursesMessagesCodes.LESSON_ACCESS_DENIED,
    });
  });

  it("requires prior lesson completion and tests", async () => {
    repo.listPreviousHomeworkLessons.mockResolvedValue([{ id: 2 }]);
    await expect(
      usecase.getUserTest({ testId: 9, userId: 7, authUser: AUTH_USER }),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: coursesMessagesCodes.PREVIOUS_LESSONS_INCOMPLETE,
    });
  });

  it("rejects forged attempt/test binding before returning an attempt", async () => {
    repo.getAttemptOwner.mockResolvedValue({ id: 5, userId: 7, testId: 9 });
    await expect(
      usecase.getUserAttempt({
        attemptId: 5,
        testId: 10,
        userId: 7,
        authUser: AUTH_USER,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: coursesMessagesCodes.QUESTION_TEST_MISMATCH,
    });
  });

  it.each(["markLessonAsCompleted", "createHomework"])(
    "rejects a forged courseId/lessonId on %s",
    async (method) => {
      repo.getPreviewableLesson.mockResolvedValue(null);
      await expect(
        usecase[method]({
          lessonId: 3,
          courseId: 999,
          userId: 7,
          authUser: AUTH_USER,
          data: { url: "x", type: "VIDEO" },
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: coursesMessagesCodes.LESSON_NOT_FOUND,
      });
      expect(repo.createHomework).not.toHaveBeenCalled();
      expect(repo.createCompletedLesson).not.toHaveBeenCalled();
    },
  );
});

function installParentLock(methodName) {
  let tail = Promise.resolve();
  repo[methodName].mockImplementation(async ({ client }) => {
    let release;
    const previous = tail;
    tail = new Promise((resolve) => {
      release = resolve;
    });
    await previous;
    client.release = release;
    return { id: 1 };
  });
  repo.runTransaction.mockImplementation(async (fn) => {
    const tx = {};
    try {
      return await fn(tx);
    } finally {
      tx.release?.();
    }
  });
}

describe("transactional duplicate prevention", () => {
  it("serializes concurrent first attempts by locking the Test row", async () => {
    installParentLock("lockTestForUpdate");
    let lastAttempt = null;
    repo.getPublishedTestWithRelations.mockResolvedValue(
      validCourseTest({ attemptLimit: 1 }),
    );
    repo.getLastUserAttemptForUpdate.mockImplementation(async () => lastAttempt);
    repo.createAttempt.mockImplementation(async ({ data }) => {
      lastAttempt = { ...data };
      return { id: 10, ...data };
    });

    const results = await Promise.allSettled([
      usecase.createAttempt({ testId: 9, userId: 7, authUser: AUTH_USER }),
      usecase.createAttempt({ testId: 9, userId: 7, authUser: AUTH_USER }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected").reason).toMatchObject({
      message: coursesMessagesCodes.ATTEMPT_LIMIT_REACHED,
    });
    expect(repo.createAttempt).toHaveBeenCalledTimes(1);
  });

  it("creates one CourseProgress and one CompletedLesson under concurrent completion", async () => {
    installParentLock("lockCourseForUpdate");
    let progress = null;
    let completed = null;
    repo.findCourseProgress.mockImplementation(async () => progress);
    repo.createCourseProgress.mockImplementation(async () => {
      progress = { id: 40 };
      return progress;
    });
    repo.findCompletedLesson.mockImplementation(async () => completed);
    repo.createCompletedLesson.mockImplementation(async () => {
      completed = { id: 50, lessonId: 3 };
      return completed;
    });

    const results = await Promise.all([
      usecase.markLessonAsCompleted({
        lessonId: 3,
        courseId: 20,
        userId: 7,
        authUser: AUTH_USER,
      }),
      usecase.markLessonAsCompleted({
        lessonId: 3,
        courseId: 20,
        userId: 7,
        authUser: AUTH_USER,
      }),
    ]);
    expect(results).toEqual([completed, completed]);
    expect(repo.createCourseProgress).toHaveBeenCalledTimes(1);
    expect(repo.createCompletedLesson).toHaveBeenCalledTimes(1);
  });

  it("serializes answers on the attempt row and atomically replaces the existing answer", async () => {
    installParentLock("getAttemptOwnerForUpdate");
    repo.getAttemptOwnerForUpdate.mockImplementation(async ({ client }) => {
      let release;
      const previous = repo.__answerTail ?? Promise.resolve();
      repo.__answerTail = new Promise((resolve) => {
        release = resolve;
      });
      await previous;
      client.release = release;
      return {
        id: 5,
        userId: 7,
        testId: 9,
        startTime: new Date(),
        endTime: null,
      };
    });
    let existing = null;
    repo.findExistingAnswer.mockImplementation(async () => existing);
    repo.createUserAnswer.mockImplementation(async () => {
      existing = { id: 100, selectedAnswers: [{ value: "A" }] };
      return existing;
    });
    repo.updateUserAnswer.mockImplementation(async () => existing);

    await Promise.all([
      usecase.submitAnswer({
        answer: { selectedAnswers: ["A"] },
        attemptId: 5,
        questionId: 1,
        testId: 9,
        authUserId: 7,
        authUser: AUTH_USER,
      }),
      usecase.submitAnswer({
        answer: { selectedAnswers: ["B"] },
        attemptId: 5,
        questionId: 1,
        testId: 9,
        authUserId: 7,
        authUser: AUTH_USER,
      }),
    ]);
    expect(repo.createUserAnswer).toHaveBeenCalledTimes(1);
    expect(repo.updateUserAnswer).toHaveBeenCalledTimes(1);
    expect(repo.deleteSelectedAnswers).toHaveBeenCalledWith(
      expect.objectContaining({ userAnswerId: 100 }),
    );
  });
});

describe("time limits and safe scoring", () => {
  it("rejects answers after the server-side time limit", async () => {
    repo.getAttemptOwnerForUpdate.mockResolvedValue({
      id: 5,
      userId: 7,
      testId: 9,
      startTime: new Date(Date.now() - 2 * 60 * 1000),
      endTime: null,
    });
    repo.getPublishedTestWithRelations.mockResolvedValue(
      validCourseTest({ timeLimit: 1 }),
    );
    await expect(
      usecase.submitAnswer({
        answer: { selectedAnswers: ["A"] },
        attemptId: 5,
        questionId: 1,
        testId: 9,
        authUserId: 7,
        authUser: AUTH_USER,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: coursesMessagesCodes.ATTEMPT_ALREADY_ENDED,
    });
    expect(repo.createUserAnswer).not.toHaveBeenCalled();
  });

  it("rejects zero-question tests at take time", async () => {
    repo.getPublishedTestWithRelations.mockResolvedValue(
      validCourseTest({ questions: [] }),
    );
    await expect(
      usecase.getUserTest({ testId: 9, userId: 7, authUser: AUTH_USER }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: generalMessagesCodes.BAD_REQUEST,
    });
  });

  it.each([
    validQuestion({
      type: "MULTIPLE_CHOICE",
      choices: [
        { text: "A", isCorrect: false },
        { text: "B", isCorrect: false },
      ],
    }),
    validQuestion({
      type: "ORDERING",
      choices: [
        { text: "A", order: 1 },
        { text: "B", order: 1 },
      ],
    }),
  ])("rejects invalid questions at take time", async (question) => {
    repo.getPublishedTestWithRelations.mockResolvedValue(
      validCourseTest({ questions: [question] }),
    );
    await expect(
      usecase.getUserTest({ testId: 9, userId: 7, authUser: AUTH_USER }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: generalMessagesCodes.BAD_REQUEST,
    });
  });

  it("never persists a NaN score and scores a valid answer", async () => {
    const attempt = {
      id: 5,
      testId: 9,
      userId: 7,
      attemptCount: 1,
      attemptLimit: 2,
      endTime: new Date(),
      test: { questions: [validQuestion()] },
      answers: [
        {
          isApproved: false,
          question: validQuestion(),
          selectedAnswers: [{ value: "A" }],
        },
      ],
    };
    repo.getAttemptOwnerForUpdate.mockResolvedValue({ id: 5 });
    repo.getAttemptForScoring.mockResolvedValue(attempt);
    const result = await usecase.endAttempt({ attemptId: 5, reScore: true });
    expect(result).toEqual({ score: 100, passed: true });
    expect(repo.updateAttemptScore).toHaveBeenCalledWith(
      expect.objectContaining({ score: 100, passed: true, client: "TX" }),
    );
    expect(Number.isFinite(result.score)).toBe(true);
    expect(attemptFailedByUser).not.toHaveBeenCalled();
  });

  it("rejects zero-question scoring instead of dividing by zero", async () => {
    repo.getAttemptOwnerForUpdate.mockResolvedValue({ id: 5 });
    repo.getAttemptForScoring.mockResolvedValue({
      id: 5,
      testId: 9,
      userId: 7,
      test: { questions: [] },
      answers: [],
    });
    await expect(
      usecase.endAttempt({ attemptId: 5, reScore: true }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: generalMessagesCodes.BAD_REQUEST,
    });
    expect(repo.updateAttemptScore).not.toHaveBeenCalled();
  });
});
