import prisma from "../../../prisma/prisma.js";
import { attemptFailedByUser } from "../../notification.js";

export async function getCourses({ role, limit = 1, skip = 10 }) {
  const courses = await prisma.course.findMany({
    skip,
    take: limit,
    include: {
      _count: {
        select: {
          lessons: true,
          tests: true,
        },
      },
    },
    where: {
      isPublished: true,

      roles: {
        some: {
          role,
        },
      },
    },
  });
  return courses;
}

export async function getCourse({ courseId, role, userId }) {
  courseId = Number(courseId);

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      isPublished: true,
      roles: {
        some: {
          role,
        },
      },
    },
    include: {
      lessons: {
        where: {
          isPreviewable: true,
        },
        orderBy: {
          order: "asc", // or "desc"
        },
        include: {
          allowedUsers: {
            where: {
              userId: Number(userId),
            },
          },
          tests: {
            where: { published: true },
            select: {
              id: true,
              title: true,
              timeLimit: true,
              attempts: {
                where: {
                  userId: Number(userId),
                },
                select: {
                  startTime: true,
                  endTime: true,
                  score: true,
                  passed: true,
                  id: true,
                  testId: true,
                  userId: true,
                },
              },
            },
          },
        },
      },
      tests: {
        where: { published: true },
        select: {
          id: true,
          title: true,
          timeLimit: true,
          attempts: {
            where: {
              userId: Number(userId),
            },
            select: {
              startTime: true,
              endTime: true,
              score: true,
              passed: true,
              id: true,
              testId: true,
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!course) return null;

  const previewableLessonsCount = await prisma.lesson.count({
    where: {
      courseId: courseId,
      isPreviewable: true,
    },
  });

  const publishedTestsCount = await prisma.test.count({
    where: {
      courseId: courseId,
      published: true,
    },
  });

  return {
    ...course,
    _count: {
      lessons: previewableLessonsCount,
      tests: publishedTestsCount,
    },
  };
}

export async function getUserCourseProgress({ courseId, userId }) {
  courseId = Number(courseId);
  userId = Number(userId);
  const completedLessons = await prisma.completedLesson.findMany({
    where: {
      courseProgress: {
        userId,
        courseId,
      },
    },
    select: {
      lessonId: true,
    },
  });

  const completedLessonIds = completedLessons.map((l) => l.lessonId);

  const completedTests = await prisma.completedTest.findMany({
    where: {
      courseProgress: {
        userId,
        courseId,
      },
    },
    select: {
      testId: true,
    },
  });

  const completedTestsIds = completedTests.map((l) => l.testId);
  // const passedTests = await prisma.testAttempt.findMany({
  //   where: {
  //     userId,
  //     test: {
  //       courseId,
  //     },
  //     passed: true,
  //   },
  //   select: {
  //     testId: true,
  //   },
  // });

  // const passedTestIds = passedTests.map((t) => t.testId);
  const testAttempts = await prisma.testAttempt.findMany({
    where: {
      userId,
      test: {
        courseId,
      },
    },
    select: {
      testId: true,
      passed: true,
      score: true,
    },
  });
  const userProgress = {
    completedLessons: completedLessonIds,
    // passedTests: passedTestIds,
    testAttempts,
    completedTests: completedTestsIds,
  };
  return userProgress;
}
export async function getLesson({ role, lessonId, userId }) {
  lessonId = Number(lessonId);
  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lessonId,
      isPreviewable: true,
      course: {
        roles: {
          some: {
            role: role,
          },
        },
      },
    },
    include: {
      videos: {
        include: {
          pdfs: true,
        },
      },
      pdfs: true,
      links: true,
      course: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!lesson) {
    throw new Error("Lesson not found or access denied.");
  }
  await canAccessAlesson({ lesson, userId });
  return lesson;
}

export async function canAccessAlesson({ lesson, userId }) {
  const currentLessonAccess = await prisma.LessonAccess.findUnique({
    where: {
      userId_lessonId: {
        lessonId: Number(lesson.id),
        userId: Number(userId),
      },
    },
  });
  if (!currentLessonAccess) {
    throw new Error("You are not allowed to access this lesson yet.");
  }
  const previousLessons = await prisma.lesson.findMany({
    where: {
      courseId: lesson.courseId,
      order: { lt: lesson.order },
    },
    select: { id: true },
  });
  const previousLessonIds = previousLessons.map((l) => l.id);
  const completedLessons = await prisma.completedLesson.findMany({
    where: {
      courseProgress: {
        userId,
        courseId: lesson.courseId,
      },
      lessonId: { in: previousLessonIds },
    },
    select: { lessonId: true },
  });
  const completedLessonIds = completedLessons.map((l) => l.lessonId);
  const allPreviousCompleted = previousLessonIds.every((id) =>
    completedLessonIds.includes(id)
  );
  const lessonsWithTests = await prisma.lesson.findMany({
    where: {
      id: { in: previousLessonIds },
      tests: {
        some: { published: true },
      },
    },
    select: {
      id: true,
      courseId: true,
      tests: {
        where: { published: true },
        select: { id: true },
      },
    },
  });

  let allPreviousTestsPassed = true;

  for (const lessonWithTest of lessonsWithTests) {
    for (const test of lessonWithTest.tests) {
      const attempt = await prisma.testAttempt.findFirst({
        where: {
          userId,
          testId: test.id,
          passed: true,
        },
      });

      if (!attempt) {
        allPreviousTestsPassed = false;
        break;
      }
    }
    if (!allPreviousTestsPassed) break;
  }
  if (!allPreviousCompleted || !allPreviousTestsPassed) {
    throw new Error("You must complete and pass all previous lessons.");
  }
}
export async function canAccessALessonTest({ lesson, userId }) {
  const previousLessons = await prisma.lesson.findMany({
    where: {
      courseId: lesson.courseId,
      order: { lt: lesson.order },
    },
    select: { id: true },
  });
  const previousLessonIds = previousLessons.map((l) => l.id);
  const completedLessons = await prisma.completedLesson.findMany({
    where: {
      courseProgress: {
        userId,
        courseId: lesson.courseId,
      },
      lessonId: { in: [...previousLessonIds] },
    },
    select: { lessonId: true },
  });
  const completedLessonIds = completedLessons.map((l) => l.lessonId);
  const allPreviousCompleted = [...previousLessonIds].every((id) =>
    completedLessonIds.includes(id)
  );
  const lessonsWithTests = await prisma.lesson.findMany({
    where: {
      id: { in: previousLessonIds },
      tests: {
        some: { published: true },
      },
    },
    select: {
      id: true,
      courseId: true,
      tests: {
        where: { published: true },
        select: { id: true },
      },
    },
  });

  let allPreviousTestsPassed = true;

  for (const lessonWithTest of lessonsWithTests) {
    for (const test of lessonWithTest.tests) {
      const attempt = await prisma.testAttempt.findFirst({
        where: {
          userId,
          testId: test.id,
          passed: true,
        },
      });

      if (!attempt) {
        allPreviousTestsPassed = false;
        break;
      }
    }
    if (!allPreviousTestsPassed) break;
  }
  if (!allPreviousCompleted || !allPreviousTestsPassed) {
    throw new Error("You must complete and pass all previous lessons.");
  }
}
export async function canAccessACourseTest({ course, userId }) {
  const previousLessons = await prisma.lesson.findMany({
    where: {
      courseId: course.id,
    },
    select: { id: true },
  });
  const previousLessonIds = previousLessons.map((l) => l.id);
  const completedLessons = await prisma.completedLesson.findMany({
    where: {
      courseProgress: {
        userId,
        courseId: course.id,
      },
      lessonId: { in: previousLessonIds },
    },
    select: { lessonId: true },
  });
  const completedLessonIds = completedLessons.map((l) => l.lessonId);
  const allPreviousCompleted = previousLessonIds.every((id) =>
    completedLessonIds.includes(id)
  );
  const lessonsWithTests = await prisma.lesson.findMany({
    where: {
      id: { in: previousLessonIds },
      tests: {
        some: { published: true },
      },
    },
    select: {
      id: true,
      courseId: true,
      tests: {
        where: { published: true },
        select: { id: true },
      },
    },
  });

  let allPreviousTestsPassed = true;

  for (const lessonWithTest of lessonsWithTests) {
    for (const test of lessonWithTest.tests) {
      const attempt = await prisma.testAttempt.findFirst({
        where: {
          userId,
          testId: test.id,
          passed: true,
        },
      });

      if (!attempt) {
        allPreviousTestsPassed = false;
        break;
      }
    }
    if (!allPreviousTestsPassed) break;
  }
  if (!allPreviousCompleted || !allPreviousTestsPassed) {
    throw new Error("You must complete and pass all previous lessons.");
  }
}

export async function getHomeWorks({ userId, lessonId }) {
  return await prisma.LessonHomework.findMany({
    where: {
      lessonId: Number(lessonId),
      userId: Number(userId),
    },
  });
}
export async function createAHomeWork({
  data,
  lessonId,
  userId,
  courseId,
  testId,
}) {
  await prisma.LessonHomework.create({
    data: {
      lessonId: Number(lessonId),
      userId: Number(userId),
      url: data.url,
      type: data.type,
      title: data.title || data.type,
    },
  });
  const homeWorks = await prisma.LessonHomework.findMany({
    where: {
      userId: Number(userId),
      lessonId: Number(lessonId),
    },
    select: {
      type: true,
    },
  });

  const hasVideo = homeWorks.some((hw) => hw.type === "VIDEO");
  const hasSummary = homeWorks.some((hw) => hw.type === "SUMMARY");
  if (hasSummary && hasVideo) {
    await markLessonAsCompleted({ lessonId, userId, courseId });
  }
  // if (hasVideo) {
  //   await markTestAsCompleted({ testId: data.testId, userId, courseId });
  // }
  return;
}
export async function markLessonAsCompleted({ lessonId, courseId, userId }) {
  lessonId = Number(lessonId);
  userId = Number(userId);
  courseId = Number(courseId);
  let courseProgress = await prisma.CourseProgress.findFirst({
    where: {
      courseId,
      userId,
    },
  });
  if (!courseProgress) {
    courseProgress = await prisma.courseProgress.create({
      data: { courseId, userId },
    });
  }

  return await prisma.CompletedLesson.create({
    data: {
      lessonId,
      courseProgressId: courseProgress.id,
    },
  });
}

export async function markTestAsCompleted({ testId, courseId, userId }) {
  testId = Number(testId);
  userId = Number(userId);
  courseId = Number(courseId);
  let courseProgress = await prisma.CourseProgress.findFirst({
    where: {
      courseId,
      userId,
    },
  });
  if (!courseProgress) {
    courseProgress = await prisma.courseProgress.create({
      data: { courseId, userId },
    });
  }

  return await prisma.completedTest.create({
    data: {
      testId,
      courseProgressId: courseProgress.id,
    },
  });
}

// staff test

export async function getUserTest({ testId, userId }) {
  const test = await prisma.test.findUnique({
    where: {
      id: Number(testId),
      published: true,
    },
    include: {
      course: true,
      lesson: true,
    },
  });
  if (userId) {
    if (test.lesson) {
      await canAccessALessonTest({ lesson: test.lesson, userId });
    }
    if (test.course) {
      await canAccessACourseTest({ course: test.course, userId });
    }
  }
  return test;
}

export async function getUserTestQuestion({ testId, userId }) {
  return await prisma.testQuestion.findMany({
    where: {
      testId: Number(testId),
    },
    orderBy: { order: "asc" },
    include: {
      choices: true,
    },
  });
}

export async function getUserAttampts({ testId, userId }) {
  return await prisma.testAttempt.findMany({
    where: {
      testId: Number(testId),
      userId: Number(userId),
    },
    include: {
      user: true,
      answers: {
        include: {
          selectedAnswers: true,
        },
      },
    },
  });
}
export async function getUserAttampt({ attamptId, userId }) {
  return await prisma.testAttempt.findUnique({
    where: {
      id: Number(attamptId),
      userId: Number(userId),
    },
    include: {
      answers: {
        include: {
          selectedAnswers: true,
        },
      },
    },
  });
}

export async function createAttampt({ testId, userId }) {
  const test = await prisma.test.findUnique({ where: { id: Number(testId) } });
  const userLastAttampt = await prisma.TestAttempt.findFirst({
    where: {
      testId: Number(testId),
      userId: Number(userId),
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const attemptLimit = Math.max(
    userLastAttampt?.attemptLimit ?? 0,
    test.attemptLimit
  );
  if (userLastAttampt) {
    if (userLastAttampt.attemptCount >= userLastAttampt.attemptLimit) {
      throw new Error("You can't submit a new attempt");
    }
  }
  const newAttampt = await prisma.testAttempt.create({
    data: {
      testId: Number(testId),
      userId: Number(userId),
      attemptCount: (userLastAttampt?.attemptCount || 0) + 1,
      attemptLimit: attemptLimit,
      startTime: new Date(),
    },
  });
  const attampt = await prisma.testAttempt.findUnique({
    where: {
      id: Number(newAttampt.id),
    },
  });
  return attampt;
}

export async function submitAnswer({
  answer,
  attemptId,
  testId,
  questionId,
  userId,
}) {
  userId = Number(userId);
  questionId = Number(questionId);
  attemptId = Number(attemptId);
  testId = Number(testId);
  console.log(answer, "answer");
  const existingAnswer = await prisma.userAnswer.findFirst({
    where: {
      attemptId,
      questionId,
    },
    include: {
      selectedAnswers: true,
    },
  });
  if (existingAnswer) {
    if (existingAnswer.selectedAnswers.length > 0) {
      await prisma.selectedAnswer.deleteMany({
        where: {
          userAnswerId: existingAnswer.id,
        },
      });
    }

    const updatedAnswer = await prisma.userAnswer.update({
      where: {
        id: existingAnswer.id,
      },
      data: {
        textAnswer: answer.textAnswer || null,
        selectedAnswers: answer.selectedAnswers
          ? {
              create: answer.selectedAnswers.map((value, index) => ({
                value,
                order: index + 1,
              })),
            }
          : undefined,
      },
    });

    return updatedAnswer;
  } else {
    // 4️⃣ Create new user answer
    const newAnswer = await prisma.userAnswer.create({
      data: {
        attemptId: attemptId,
        questionId,
        textAnswer: answer.textAnswer || null,
        selectedAnswers: answer.selectedAnswers
          ? {
              create: answer.selectedAnswers.map((value, index) => ({
                value,
                order: index + 1,
              })),
            }
          : undefined,
      },
    });
    return newAnswer;
  }
}

export async function endAttempt(attemptId) {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          questions: {
            include: {
              choices: true,
            },
          },
        },
      },
      answers: {
        include: {
          question: {
            include: {
              choices: true,
            },
          },
          selectedAnswers: true,
        },
      },
    },
  });

  if (!attempt) throw new Error("Attempt not found");

  const totalQuestions = attempt.test.questions.length;
  let earnedPoints = 0;

  for (const answer of attempt.answers) {
    if (answer.question.type === "TEXT") {
      if (answer.isApproved) {
        earnedPoints += 1;
      }
      continue;
    }

    const correctChoices = answer.question.choices
      .filter((c) => c.isCorrect)
      .map((c) => c.text);

    const selectedChoices = answer.selectedAnswers.map((c) => c.value);

    if (answer.question.type === "ORDERING") {
      const correctOrder = answer.question.choices
        .sort((a, b) => a.order - b.order)
        .map((c) => c.text);
      const isCorrect =
        JSON.stringify(correctOrder) === JSON.stringify(selectedChoices);

      if (isCorrect) {
        earnedPoints += 1;
      } else {
        // Optional: partial score by how many are in correct position
        let correctPositions = 0;
        for (let i = 0; i < correctOrder.length; i++) {
          if (selectedChoices[i] === correctOrder[i]) {
            correctPositions += 1;
          }
        }
        earnedPoints += correctPositions / correctOrder.length;
      }
      continue;
    }

    if (answer.question.type === "MULTIPLE_CHOICE") {
      const totalCorrect = correctChoices.length;
      const selectedCorrect = selectedChoices.filter((v) =>
        correctChoices.includes(v)
      ).length;
      earnedPoints += selectedCorrect / totalCorrect;
    } else {
      // SINGLE_CHOICE / TRUE_FALSE
      const isCorrect =
        JSON.stringify(correctChoices.sort()) ===
        JSON.stringify(selectedChoices.sort());

      if (isCorrect) {
        earnedPoints += 1;
      }
    }
  }

  const score = (earnedPoints / totalQuestions) * 100;
  const passed = score >= 80;
  await prisma.testAttempt.update({
    where: { id: attemptId },
    data: {
      score,
      passed,
      endTime: new Date(),
    },
  });
  if (!passed && attempt.attemptCount >= attempt.attemptLimit) {
    await attemptFailedByUser({
      testId: attempt.testId,
      userId: attempt.userId,
    });
  }
  return { score, passed };
}
