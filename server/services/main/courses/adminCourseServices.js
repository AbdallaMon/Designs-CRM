import prisma from "../../../prisma/prisma.js";

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
  console.log(data, "edit lesson");
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
