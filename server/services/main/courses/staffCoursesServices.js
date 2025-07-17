import prisma from "../../../prisma/prisma.js";

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
        include: {
          tests: {
            where: { published: true },
            select: {
              id: true,
              title: true,
              timeLimit:true,
              attempts: {
                where: {
                  userId: Number(userId),
                },
                select: { startTime:true,endTime:true,score:true,passed: true, id: true, testId: true, userId: true },
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
              timeLimit:true,
              attempts: {
                where: {
                  userId: Number(userId),
                },
                select: { startTime:true,endTime:true,score:true,passed: true, id: true, testId: true, userId: true },
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
  const passedTests = await prisma.testAttempt.findMany({
    where: {
      userId,
      test: {
        courseId,
      },
      passed: true,
    },
    select: {
      testId: true,
    },
  });

  const passedTestIds = passedTests.map((t) => t.testId);
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
    passedTests: passedTestIds,
    testAttempts,
  };
  return userProgress;
}
export async function getLesson({ role, lessonId }) {
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
      videos: true,
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

  return lesson;
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

// staff test

export async function getUserTest({ testId }) {
  return await prisma.test.findUnique({
    where: {
      id: Number(testId),
      published: true,
    },
    include: {
      course: true,
      lesson: true,
    },
  });
}

export async function getUserTestQuestion({ testId, userId }) {
  return await prisma.testQuestion.findMany({
    where: {
      testId: Number(testId),
    },
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
  const testLimit = await prisma.test.findUnique({
    where: {
      id: Number(testId),
    },
    select: {
      timeLimit: true,
      attemptLimit: true,
    },
  });

  const userLastAttampt = await prisma.TestAttempt.findFirst({
    where: {
      testId: Number(testId),
      userId: Number(userId),
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  if (userLastAttampt) {
    if (userLastAttampt.attemptCount >= testLimit.attemptLimit) {
      throw new Error("You can't submit a new attempt");
    }
  }
  const newAttampt = await prisma.testAttempt.create({
    data: {
      testId: Number(testId),
      userId: Number(userId),
      attemptCount: (userLastAttampt?.attemptCount || 0) + 1,
      attemptLimit: testLimit.attemptLimit,
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
              create: answer.selectedAnswers.map((value) => ({ value })),
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
              create: answer.selectedAnswers.map((value) => ({ value })),
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
    if (answer.question.type === 'TEXT') {
      if(answer.isApproved){
              earnedPoints += 1;
      }
      earnedPoints += 0;
      continue;
    }

    const correctChoices = answer.question.choices
      .filter((c) => c.isCorrect)
      .map((c) => c.text);
    const selectedChoices = answer.selectedAnswers.map((c) => c.value);

    if (answer.question.type === 'MULTIPLE_CHOICE') {
      const totalCorrect = correctChoices.length;
      const selectedCorrect = selectedChoices.filter((v) =>
        correctChoices.includes(v)
      ).length;
      earnedPoints += selectedCorrect / totalCorrect;
    } else {
      // SINGLE_CHOICE / TRUE_FALSE: full point only if fully correct
      const isCorrect =
        JSON.stringify(correctChoices.sort()) ===
        JSON.stringify(selectedChoices.sort());

      if (isCorrect) {
        earnedPoints += 1;
      }
    }
  }

  const score = (earnedPoints / totalQuestions) * 100;
  const passed = score >= 60;
  await prisma.testAttempt.update({
    where: { id: attemptId },
    data: {
      score,
      passed,
      endTime: new Date(),
    },
  });

  return { score, passed };
}
