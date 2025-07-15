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
              attempts: {
                where: {
                  userId: Number(userId),
                },
                select: { passed: true, id: true, testId: true, userId: true },
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
          attempts: {
            where: {
              userId: Number(userId),
            },
            select: { passed: true, id: true, testId: true, userId: true },
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
