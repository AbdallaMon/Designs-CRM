import prisma from "../../../prisma/prisma.js";
import { endAttempt } from "./staffCoursesServices.js";

export async function getCourses({ limit = 1, skip = 10 }) {
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
      roles: true,
    },
  });
  const total = await prisma.course.count();
  const totalPages = Math.ceil(total / limit);

  return { data: courses, totalPages, total };
}
export async function createNewCourse({ data }) {
  return await prisma.course.create({
    data: {
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      isPublished: data.isPublished,
      roles: {
        create: data.roles.map((role) => ({
          role,
        })),
      },
    },
  });
}

export async function editCourse({ data, courseId }) {
  const roles = data.roles;
  delete data.roles;
  const submitData = { ...data };
  return await prisma.course.update({
    where: { id: Number(courseId) },
    data: {
      ...submitData,
      roles: roles
        ? {
            deleteMany: {}, // delete all old roles for this course
            create: roles.map((role) => ({
              role,
            })),
          }
        : undefined,
    },
  });
}

export async function getLessonsByCourseId({ courseId }) {
  const lessons = await prisma.lesson.findMany({
    where: {
      courseId: Number(courseId),
    },
    orderBy: {
      order: "asc", // or "desc"
    },
    include: {
      videos: true,
      pdfs: true,
      links: true,
      _count: {
        select: {
          tests: true,
        },
      },
    },
  });
  const course = await prisma.course.findUnique({
    where: { id: Number(courseId) },
    select: {
      title: true,
    },
  });
  return { lessons, courseTitle: course.title };
}

export async function createNewLesson({ data, courseId }) {
  if (data.order) {
    data.order = Number(data.order);
  }
  if (data.duration) {
    data.duration = Number(data.duration);
  }
  data.courseId = Number(courseId);
  return await prisma.lesson.create({
    data,
  });
}
export async function editLesson({ data, lessonId }) {
  if (data.order) {
    data.order = Number(data.order);
  }
  if (data.duration) {
    data.duration = Number(data.duration);
  }
  return await prisma.lesson.update({
    where: {
      id: Number(lessonId),
    },
    data,
  });
}

export async function deleteLesson(lessonId) {
  lessonId = Number(lessonId);
  return prisma.$transaction(async (tx) => {
    // Delete SelectedAnswer
    await tx.selectedAnswer.deleteMany({
      where: {
        answer: {
          attempt: {
            test: {
              lessonId,
            },
          },
        },
      },
    });

    // Delete UserAnswer
    await tx.userAnswer.deleteMany({
      where: {
        attempt: {
          test: {
            lessonId,
          },
        },
      },
    });

    // Delete TestAttempt
    await tx.testAttempt.deleteMany({
      where: {
        test: {
          lessonId,
        },
      },
    });

    // Delete TestChoice
    await tx.testChoice.deleteMany({
      where: {
        question: {
          test: {
            lessonId,
          },
        },
      },
    });

    // Delete TestQuestion
    await tx.testQuestion.deleteMany({
      where: {
        test: {
          lessonId,
        },
      },
    });

    // Delete Tests linked to this lesson
    await tx.test.deleteMany({
      where: {
        lessonId,
      },
    });

    // Delete PDFs, Videos, Links
    await tx.lessonPDF.deleteMany({
      where: {
        lessonId,
      },
    });

    await tx.lessonVideo.deleteMany({
      where: {
        lessonId,
      },
    });

    await tx.lessonLink.deleteMany({
      where: {
        lessonId,
      },
    });

    // Finally, delete the lesson
    await tx.lesson.delete({
      where: {
        id: lessonId,
      },
    });
  });
}

export async function getLessonById({ lessonId }) {
  return await prisma.lesson.findUnique({
    where: {
      id: Number(lessonId),
    },
  });
}
export async function getVideosByLessonId({ lessonId }) {
  const lessonVideo = await prisma.lessonVideo.findMany({
    where: {
      lessonId: Number(lessonId),
    },
  });

  return lessonVideo;
}

export async function createNewLessonVideo({ data, lessonId }) {
  if (data.order) {
    data.order = Number(data.order);
  }

  data.lessonId = Number(lessonId);
  return await prisma.lessonVideo.create({
    data,
  });
}
export async function editLessonVideo({ data, videoId }) {
  if (data.order) {
    data.order = Number(data.order);
  }

  return await prisma.lessonVideo.update({
    where: {
      id: Number(videoId),
    },
    data,
  });
}
export async function deleteLessonVideo({ videoId }) {
  await prisma.LessonVideoPdf.deleteMany({
    where: {
      videoId: Number(videoId),
    },
  });
  return await prisma.lessonVideo.delete({
    where: {
      id: Number(videoId),
    },
  });
}

export async function getPdfsByLessonId({ lessonId }) {
  const lessonPDF = await prisma.lessonPDF.findMany({
    where: {
      lessonId: Number(lessonId),
    },
  });

  return lessonPDF;
}

export async function createNewLessonPdf({ data, lessonId }) {
  if (data.order) {
    data.order = Number(data.order);
  }

  data.lessonId = Number(lessonId);
  return await prisma.lessonPDF.create({
    data,
  });
}
export async function editLessonPdf({ data, pdfId }) {
  if (data.order) {
    data.order = Number(data.order);
  }

  return await prisma.lessonPDF.update({
    where: {
      id: Number(pdfId),
    },
    data,
  });
}
export async function deleteLessonPdf({ pdfId }) {
  return await prisma.lessonPDF.delete({
    where: {
      id: Number(pdfId),
    },
  });
}

export async function getLinksByLessonId({ lessonId }) {
  const lessonLink = await prisma.lessonLink.findMany({
    where: {
      lessonId: Number(lessonId),
    },
  });

  return lessonLink;
}

export async function createNewLessonLink({ data, lessonId }) {
  if (data.order) {
    data.order = Number(data.order);
  }

  data.lessonId = Number(lessonId);
  return await prisma.lessonLink.create({
    data,
  });
}
export async function editLessonLink({ data, linkId }) {
  if (data.order) {
    data.order = Number(data.order);
  }

  return await prisma.lessonLink.update({
    where: {
      id: Number(linkId),
    },
    data,
  });
}
export async function delteLessonLink({ linkId }) {
  return await prisma.lessonLink.delete({
    where: {
      id: Number(linkId),
    },
  });
}

// test
export async function getTests({ key, id }) {
  const item = await prisma[
    key === "courseId" ? "course" : "lesson"
  ].findUnique({
    where: {
      id: Number(id),
    },
    select: {
      title: true,
    },
  });
  let where = {
    [key]: Number(id),
  };
  if (key === "courseId") {
    where = {
      OR: [{ courseId: Number(id) }, { lesson: { courseId: Number(id) } }],
    };
  }
  const tests = await prisma.test.findMany({
    where,
    include: {
      _count: {
        select: {
          attempts: true,
          questions: true,
        },
      },
    },
  });
  return { title: item.title, tests };
}

export async function getTestData({ testId }) {
  const test = await prisma.test.findUnique({
    where: {
      id: Number(testId),
    },
    select: {
      id: true,
      attemptLimit: true,
      questions: {
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          order: true,
        },
      },
    },
  });
  return test.questions;
}
export async function createTest({
  key,
  id,
  attemptLimit,
  type,
  timeLimit,
  title,
  published,
}) {
  return await prisma.test.create({
    data: {
      [key]: Number(id),
      title,
      attemptLimit: attemptLimit ? Number(attemptLimit) : 0,
      type,
      timeLimit: Number(timeLimit) || 0,
      published,
    },
  });
}

export async function editTest({ data, testId }) {
  return await prisma.test.update({
    where: {
      id: Number(testId),
    },
    data,
  });
}
export async function deleteTest({ testId }) {
  testId = Number(testId);
  await prisma.testChoice.deleteMany({
    where: {
      question: {
        testId: testId,
      },
    },
  });
  await prisma.userAnswer.deleteMany({
    where: {
      question: {
        testId: testId,
      },
    },
  });
  await prisma.testQuestion.deleteMany({
    where: {
      testId: testId,
    },
  });
  await prisma.testAttempt.deleteMany({
    where: {
      testId: Number(testId),
    },
  });
  await prisma.test.deleteMany({
    where: {
      id: Number(testId),
    },
  });
  return true;
}
export async function reOrderTestQuestions({ data }) {
  data.forEach(async (question, index) => {
    await prisma.testQuestion.update({
      where: {
        id: Number(question.id),
      },
      data: {
        order: Number(index + 1),
      },
    });
  });
  return true;
}
export async function getTestQuestionData({ id }) {
  return await prisma.testQuestion.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      choices: {
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function createTestQuestion({ id, data }) {
  const lastQuestion = await prisma.testQuestion.findFirst({
    where: { testId: Number(id) },
    orderBy: { order: "desc" },
  });

  const nextOrder = lastQuestion ? lastQuestion.order + 1 : 1;
  const choices = data.choices.map((choice) => ({
    text: choice.text,
    value: choice.value,
    isCorrect: choice.isCorrect,
    order: choice.order,
  }));

  return await prisma.testQuestion.create({
    data: {
      testId: Number(id),
      type: data.type,
      question: data.question,
      order: nextOrder,
      choices: {
        create: choices,
      },
    },
  });
}

export async function editQuestion({ data, questionId }) {
  data.choices.forEach(async (choice) => {
    if (choice.type === "DELETE") {
      await prisma.testChoice.delete({ where: { id: Number(choice.id) } });
    } else if (choice.type === "CREATE") {
      delete choice.id;
      await prisma.testChoice.create({
        data: {
          isCorrect: choice.isCorrect,
          text: choice.text,
          value: choice.text,
          questionId: Number(questionId),
          order: choice.order,
        },
      });
    } else {
      await prisma.testChoice.update({
        where: {
          id: Number(choice.id),
        },
        data: {
          text: choice.text,
          value: choice.text,
          isCorrect: choice.isCorrect,
          order: choice.order,
        },
      });
    }
  });
  await prisma.testQuestion.update({
    where: { id: Number(questionId) },
    data: {
      question: data.question,
    },
  });
  return true;
}

export async function deleteQuestion({ questionId }) {
  await prisma.TestChoice.deleteMany({
    where: {
      questionId: Number(questionId),
    },
  });
  await prisma.userAnswer.deleteMany({
    where: {
      questionId: Number(questionId),
    },
  });
  await prisma.testQuestion.deleteMany({
    where: {
      id: Number(questionId),
    },
  });
  return true;
}

export async function getTestAttemptsSummary({ testId, userId }) {
  testId = Number(testId);
  const where = { testId: Number(testId) };
  if (userId) {
    where.userId = Number(userId);
  }
  const attempts = await prisma.testAttempt.findMany({
    where,
    select: {
      userId: true,
      score: true,
      passed: true,
      endTime: true,
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const grouped = attempts.reduce((acc, attempt) => {
    const userId = attempt.userId;
    if (!acc[userId]) {
      acc[userId] = {
        name: attempt.user.name,
        email: attempt.user.email,
        role: attempt.user.role,
        attempts: 1,
        maxScore: attempt.score ?? 0,
        passed: attempt.passed,
        lastAttempt: attempt.endTime ?? null,
        userId,
      };
    } else {
      acc[userId].attempts++;
      acc[userId].maxScore = Math.max(acc[userId].maxScore, attempt.score ?? 0);
      acc[userId].passed = acc[userId].passed || attempt.passed;
      if (
        attempt.endTime &&
        (!acc[userId].lastAttempt || acc[userId].lastAttempt < attempt.endTime)
      ) {
        acc[userId].lastAttempt = attempt.endTime;
      }
    }
    return acc;
  }, {});

  return Object.values(grouped);
}

export async function getAttemptsSummary({ limit = 1, skip = 10, userId }) {
  const where = {};
  if (userId) {
    where.userId = Number(userId);
  }
  const attempts = await prisma.testAttempt.findMany({
    where,
    skip,
    take: limit,
    select: {
      userId: true,
      score: true,
      passed: true,
      endTime: true,
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const total = await prisma.testAttempt.count();
  const totalPages = Math.ceil(total / limit);
  return { data: attempts, totalPages, total };
}

export async function approveUserAnswer({ attemptId, questionId, isApproved }) {
  const updatedAnswer = await prisma.userAnswer.updateMany({
    where: { questionId: Number(questionId), attemptId: Number(attemptId) },
    data: { isApproved },
  });

  await endAttempt(Number(attemptId));
}
export async function increaseAttemptToUser({ testId, userId }) {
  const userLastAttampt = await prisma.TestAttempt.findFirst({
    where: {
      testId: Number(testId),
      userId: Number(userId),
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  await prisma.TestAttempt.update({
    where: { id: Number(userLastAttampt.id) },
    data: {
      attemptLimit: userLastAttampt.attemptLimit + 1,
    },
  });
}
export async function decreaseAttemptToUser({ testId, userId }) {
  const userLastAttampt = await prisma.TestAttempt.findFirst({
    where: {
      testId: Number(testId),
      userId: Number(userId),
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  if (userLastAttampt.attemptLimit === userLastAttampt.attemptCount) {
    throw new Error(
      "Can't decrease as the user already has take his all attempts"
    );
  }
  await prisma.TestAttempt.update({
    where: { id: Number(userLastAttampt.id) },
    data: {
      attemptLimit: userLastAttampt.attemptLimit - 1,
    },
  });
}

// permissions

export async function getAllowedRoles({ courseId }) {
  const allowedRoles = await prisma.CourseRole.findMany({
    where: { courseId: Number(courseId) },
  });
  return allowedRoles?.map((r) => r.role);
}
export async function getAllowedLessonUsers({ lessonId }) {
  return await prisma.LessonAccess.findMany({
    where: { lessonId: Number(lessonId) },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}
export async function createNewLessonAccess({ lessonId, userId }) {
  await prisma.LessonAccess.create({
    data: {
      lessonId: Number(lessonId),
      userId: Number(userId),
    },
  });
}
export async function deleteAlessonAccess({ id }) {
  await prisma.LessonAccess.delete({
    where: {
      id: Number(id),
    },
  });
}

export async function getListOfHomeWorks({ lessonId }) {
  const groupedHomeworksByUser = await prisma.lessonHomework.findMany({
    where: { lessonId },
    include: {
      user: {
        select: { name: true, email: true, id: true },
      },
    },
  });

  const groupedByUser = Object.values(
    groupedHomeworksByUser.reduce((acc, hw) => {
      const uid = hw.user.id;
      if (!acc[uid]) {
        acc[uid] = {
          name: hw.user.name,
          email: hw.user.email,
          listOfHomeworks: [],
        };
      }

      const { id, title, url, type, createdAt } = hw;
      acc[uid].listOfHomeworks.push({ id, title, url, type, createdAt });

      return acc;
    }, {})
  );
  return groupedByUser;
}

export async function getLessonVideoPdfs({ lessonVideoId }) {
  return await prisma.LessonVideoPdf.findMany({
    where: {
      videoId: Number(lessonVideoId),
    },
  });
}

export async function createALessonVideoPdf({ title, url, lessonVideoId }) {
  return await prisma.LessonVideoPdf.create({
    data: {
      title,
      url,
      videoId: Number(lessonVideoId),
    },
  });
}
export async function deleteALessonVideoPdf({ lessonVideoPdfId }) {
  await prisma.LessonVideoPdf.delete({
    where: {
      id: Number(lessonVideoPdfId),
    },
  });
}

export async function toggleMustUploadHomeWork({
  mustUploadHomework,
  lessonId,
}) {
  return await prisma.lesson.update({
    where: {
      id: Number(lessonId),
    },
    data: {
      mustUploadHomework,
    },
  });
}

export async function getDashBoardDataForAdmin() {
  const testStats = await prisma.testAttempt.aggregate({
    _count: true,
    _avg: { score: true },
  });

  const totalAttempts = testStats._count;
  const averageScore = Number((testStats._avg.score ?? 0).toFixed(2));

  const passedAttempts = await prisma.testAttempt.count({
    where: { passed: true },
  });
  const failedAttempts = totalAttempts - passedAttempts;

  const totalCourses = await prisma.course.count();
  const publishedCourses = await prisma.course.count({
    where: { isPublished: true },
  });

  const totalLessons = await prisma.lesson.count();
  const totalVideos = await prisma.lessonVideo.count();
  const totalPDFs = await prisma.lessonPDF.count();
  const totalTestAttempts = await prisma.testAttempt.count();
  const passedTests = await prisma.testAttempt.count({
    where: { passed: true },
  });

  const courseCompletions = await prisma.courseProgress.count({
    where: {
      AND: [
        {
          completedLessons: {
            some: {}, // means has completed lessons
          },
        },
        {},
      ],
    },
  });

  const progressData = await prisma.courseProgress.findMany({
    include: {
      course: {
        include: {
          lessons: true,
          tests: true,
        },
      },
      completedLessons: true,
    },
  });

  const progressList = progressData.map((cp) => {
    const totalItems = cp.course.lessons.length;
    const completedItems = cp.completedLessons.length;
    return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  });
  const avgCourseProgress = Number(
    (
      progressList.reduce((sum, p) => sum + p, 0) / (progressList.length || 1)
    ).toFixed(2)
  );

  const totalHomeworkSubmissions = await prisma.lessonHomework.count();
  const topCoursesRaw = await prisma.course.findMany({
    take: 4,
    orderBy: {
      progress: {
        _count: "desc",
      },
    },
    include: {
      progress: {
        include: {
          completedLessons: true,
        },
      },
      tests: {
        include: {
          attempts: true,
        },
      },
      // 🔧 Add this line:
      lessons: true,
    },
  });

  const topCourses = topCoursesRaw.map((course) => {
    const enrollments = course.progress.length;

    const totalItems = course.lessons?.length || 0;

    const totalCompletionRates = course.progress.map((cp) => {
      const completed = cp.completedLessons.length;
      return (completed / totalItems) * 100;
    });

    const completionRate =
      totalCompletionRates.reduce((a, b) => a + b, 0) /
      (totalCompletionRates.length || 1);

    const allScores = course.tests.flatMap((test) =>
      test.attempts.map((a) => a.score ?? 0)
    );
    const averageScore =
      allScores.reduce((a, b) => a + b, 0) / (allScores.length || 1);

    return {
      id: course.id,
      title: course.title,
      enrollments,
      completionRate: Math.round(completionRate),
      averageScore: Math.round(averageScore),
    };
  });
  const result = {
    testStats: {
      totalAttempts,
      passedAttempts,
      failedAttempts,
      averageScore,
    },
    totalCourses,
    publishedCourses,
    totalLessons,
    totalVideos,
    totalPDFs,
    totalTestAttempts,
    passedTests,
    courseCompletions,
    avgCourseProgress,
    totalHomeworkSubmissions,
    topCourses,
  };
  return result;
}
