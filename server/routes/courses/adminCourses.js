import { Router } from "express";
import {
  getAndThrowError,
  getPagination,
} from "../../services/main/utility/utility.js";
import {
  approveUserAnswer,
  createALessonVideoPdf,
  createNewCourse,
  createNewLesson,
  createNewLessonAccess,
  createNewLessonLink,
  createNewLessonPdf,
  createNewLessonVideo,
  createTest,
  createTestQuestion,
  decreaseAttemptToUser,
  deleteAlessonAccess,
  deleteALessonVideoPdf,
  deleteLesson,
  deleteLessonPdf,
  deleteLessonVideo,
  deleteQuestion,
  deleteTest,
  delteLessonLink,
  editCourse,
  editLesson,
  editLessonLink,
  editLessonPdf,
  editLessonVideo,
  editQuestion,
  editTest,
  getAllowedLessonUsers,
  getAllowedRoles,
  getAttemptsSummary,
  getCourses,
  getDashBoardDataForAdmin,
  getLessonById,
  getLessonsByCourseId,
  getLessonVideoPdfs,
  getLinksByLessonId,
  getListOfHomeWorks,
  getPdfsByLessonId,
  getTestAttemptsSummary,
  getTestData,
  getTestQuestionData,
  getTests,
  getVideosByLessonId,
  increaseAttemptToUser,
  reOrderTestQuestions,
  toggleMustUploadHomeWork,
} from "../../services/main/courses/adminCourseServices.js";
import { getUserAttampts } from "../../services/main/courses/staffCoursesServices.js";
const router = Router();

router.get("", async (req, res) => {
  try {
    const { limit, skip } = getPagination(req);
    const result = await getCourses({
      limit: Number(limit),
      skip: Number(skip),
    });
    res.status(200).json(result);
  } catch (e) {
    getAndThrowError(e, res);
  }
});

router.post("", async (req, res) => {
  try {
    const data = await createNewCourse({ data: req.body });
    res.status(200).json({ data, message: "New course created" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/dashboard", async (req, res) => {
  try {
    const result = await getDashBoardDataForAdmin({});
    res.status(200).json({ data: result });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.put("/:courseId", async (req, res) => {
  try {
    const data = await editCourse({
      data: req.body,
      courseId: req.params.courseId,
    });
    res.status(200).json({ data, message: "Courses edited" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/:courseId/lessons", async (req, res) => {
  try {
    const data = await getLessonsByCourseId({ courseId: req.params.courseId });
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/:courseId/lessons", async (req, res) => {
  try {
    const data = await createNewLesson({
      courseId: req.params.courseId,
      data: req.body,
    });
    res.status(200).json({ data, message: "New lesson added" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/:courseId/lessons/:lessonId", async (req, res) => {
  try {
    const data = await getLessonById({ lessonId: req.params.lessonId });
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.put("/:courseId/lessons/:lessonId", async (req, res) => {
  try {
    const data = await editLesson({
      data: req.body,
      lessonId: req.params.lessonId,
    });
    res.status(200).json({ data, message: "Lesson edited" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

router.post(
  "/:courseId/lessons/:lessonId/home-works/toggle",
  async (req, res) => {
    try {
      const data = await toggleMustUploadHomeWork({
        lessonId: req.params.lessonId,
        mustUploadHomework: req.body.mustUploadHomework,
      });
      res.status(200).json({ data, message: "Lesson edited" });
    } catch (e) {
      getAndThrowError(e, res);
    }
  }
);

router.delete("/:courseId/lessons/:lessonId", async (req, res) => {
  try {
    const data = await deleteLesson(req.params.lessonId);
    res.status(200).json({ data, message: "Lesson deleted" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

router.get("/:courseId/lessons/:lessonId/videos", async (req, res) => {
  try {
    const data = await getVideosByLessonId({ lessonId: req.params.lessonId });
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/:courseId/lessons/:lessonId/videos", async (req, res) => {
  try {
    const data = await createNewLessonVideo({
      lessonId: req.params.lessonId,
      data: req.body,
    });
    res.status(200).json({ data, message: "New video added" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.put("/:courseId/lessons/:lessonId/videos/:videoId", async (req, res) => {
  try {
    const data = await editLessonVideo({
      data: req.body,
      videoId: req.params.videoId,
    });
    res.status(200).json({ data, message: "Video edited" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.delete(
  "/:courseId/lessons/:lessonId/videos/:videoId",
  async (req, res) => {
    try {
      const data = await deleteLessonVideo({
        data: req.body,
        videoId: req.params.videoId,
      });
      res.status(200).json({ data, message: "Video Deleted" });
    } catch (e) {
      getAndThrowError(e, res);
    }
  }
);
// pdf

router.get("/:courseId/lessons/:lessonId/pdfs", async (req, res) => {
  try {
    const data = await getPdfsByLessonId({ lessonId: req.params.lessonId });
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/:courseId/lessons/:lessonId/pdfs", async (req, res) => {
  try {
    const data = await createNewLessonPdf({
      lessonId: req.params.lessonId,
      data: req.body,
    });
    res.status(200).json({ data, message: "New pdf added" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.put("/:courseId/lessons/:lessonId/pdfs/:pdfId", async (req, res) => {
  try {
    const data = await editLessonPdf({
      data: req.body,
      pdfId: req.params.pdfId,
    });
    res.status(200).json({ data, message: "Pdf edited" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.delete("/:courseId/lessons/:lessonId/pdfs/:pdfId", async (req, res) => {
  try {
    const data = await deleteLessonPdf({
      data: req.body,
      pdfId: req.params.pdfId,
    });
    res.status(200).json({ data, message: "Pdf Deleted" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
// link

router.get("/:courseId/lessons/:lessonId/links", async (req, res) => {
  try {
    const data = await getLinksByLessonId({ lessonId: req.params.lessonId });
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/:courseId/lessons/:lessonId/links", async (req, res) => {
  try {
    const data = await createNewLessonLink({
      lessonId: req.params.lessonId,
      data: req.body,
    });
    res.status(200).json({ data, message: "New link added" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.put("/:courseId/lessons/:lessonId/links/:linkId", async (req, res) => {
  try {
    const data = await editLessonLink({
      data: req.body,
      linkId: req.params.linkId,
    });
    res.status(200).json({ data, message: "Link edited" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.delete(
  "/:courseId/lessons/:lessonId/links/:linkId",
  async (req, res) => {
    try {
      const data = await delteLessonLink({
        data: req.body,
        linkId: req.params.linkId,
      });
      res.status(200).json({ data, message: "Link deleted" });
    } catch (e) {
      getAndThrowError(e, res);
    }
  }
);
router.get("/:courseId/allowed-roles", async (req, res) => {
  try {
    const data = await getAllowedRoles({
      courseId: req.params.courseId,
    });
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/:courseId/lessons/:lessonId/allowed-users", async (req, res) => {
  try {
    const data = await getAllowedLessonUsers({
      lessonId: req.params.lessonId,
    });
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/:courseId/lessons/:lessonId/allowed-users", async (req, res) => {
  try {
    const data = await createNewLessonAccess({
      lessonId: req.params.lessonId,
      userId: req.body.userId,
    });
    res.status(200).json({ data, message: "User access granted" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/:courseId/lessons/:lessonId/home-works", async (req, res) => {
  try {
    const data = await getListOfHomeWorks({
      lessonId: Number(req.params.lessonId),
    });
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get(
  "/:courseId/lessons/:lessonId/videos/:videoId/pdfs",
  async (req, res) => {
    try {
      const data = await getLessonVideoPdfs({
        lessonVideoId: req.params.videoId,
      });
      res.status(200).json({ data });
    } catch (e) {
      getAndThrowError(e, res);
    }
  }
);
router.post(
  "/:courseId/lessons/:lessonId/videos/:videoId/pdfs",
  async (req, res) => {
    try {
      const data = await createALessonVideoPdf({
        lessonVideoId: req.params.videoId,
        title: req.body.title,
        url: req.body.url,
      });
      res.status(200).json({ data, message: "Added succussfully" });
    } catch (e) {
      getAndThrowError(e, res);
    }
  }
);
router.delete(
  "/:courseId/lessons/:lessonId/videos/:videoId/pdfs/:pdfId",
  async (req, res) => {
    try {
      const data = await deleteALessonVideoPdf({
        lessonVideoPdfId: Number(req.params.pdfId),
      });
      res.status(200).json({ data, message: "Deleted succussfully" });
    } catch (e) {
      getAndThrowError(e, res);
    }
  }
);
router.delete(
  "/:courseId/lessons/:lessonId/allowed-users/:accessId",
  async (req, res) => {
    try {
      const data = await deleteAlessonAccess({
        id: req.params.accessId,
      });
      res.status(200).json({ data, message: "User access deleted" });
    } catch (e) {
      getAndThrowError(e, res);
    }
  }
);
//test

router.get("/tests", async (req, res) => {
  try {
    const data = await getTests({ key: req.query.key, id: req.query.id });
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/tests/attempts", async (req, res) => {
  try {
    const { limit, skip } = getPagination(req);

    const data = await getAttemptsSummary({
      limit: Number(limit),
      skip: Number(skip),
      userId: req.query.userId,
    });
    res.status(200).json(data);
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/tests", async (req, res) => {
  try {
    const data = await createTest({
      key: req.query.key,
      id: req.query.id,
      attemptLimit: req.body.attemptLimit,
      type: req.body.testType,
      ...req.body,
    });
    res.status(200).json({ data, message: "test created succssfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

router.get("/tests/:testId", async (req, res) => {
  try {
    const data = await getTestData({ testId: req.params.testId });
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.put("/tests/:testId", async (req, res) => {
  try {
    const data = await editTest({
      testId: req.params.testId,
      data: req.body,
    });
    res.status(200).json({ data, message: "test created succssfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.delete("/tests/:testId/", async (req, res) => {
  try {
    const data = await deleteTest({
      testId: req.params.testId,
    });
    res.status(200).json({ data, message: "Test deleted succssfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/tests/:testId/attempts", async (req, res) => {
  try {
    const data = await getTestAttemptsSummary({
      testId: req.params.testId,
      userId: req.query.userId,
    });
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/tests/:testId/attampts/user", async (req, res) => {
  try {
    const data = await getUserAttampts({
      testId: req.params.testId,
      userId: Number(req.query.userId),
    });
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/tests/:testId/attempts/increase", async (req, res) => {
  try {
    const data = await increaseAttemptToUser({
      testId: req.params.testId,
      userId: Number(req.query.userId),
    });
    res.status(200).json({ data, message: "Updated succssfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/tests/:testId/attempts/decrease", async (req, res) => {
  try {
    const data = await decreaseAttemptToUser({
      testId: req.params.testId,
      userId: Number(req.query.userId),
    });
    res.status(200).json({ data, message: "Updated succssfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post(
  "/tests/:testId/attempts/:attemptId/questions/:questionId/approve",
  async (req, res) => {
    try {
      const data = await approveUserAnswer({
        questionId: req.params.questionId,
        attemptId: req.params.attemptId,
        isApproved: req.body.isApproved,
      });
      res.status(200).json({ data, message: "Question Approved succssfully" });
    } catch (e) {
      getAndThrowError(e, res);
    }
  }
);
router.post("/tests/:testId/test-questions", async (req, res) => {
  try {
    const data = await createTestQuestion({
      data: req.body,
      id: req.params.testId,
    });
    res.status(200).json({ data, message: "Question created succssfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/tests/:testId/test-questions/re-order", async (req, res) => {
  try {
    const data = await reOrderTestQuestions({
      data: req.body,
    });
    res.status(200).json({ data, message: "Question Edited succssfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/tests/:testId/test-questions/:questionId", async (req, res) => {
  try {
    const data = await getTestQuestionData({
      id: req.params.questionId,
    });
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.put("/tests/:testId/test-questions/:questionId", async (req, res) => {
  try {
    const data = await editQuestion({
      data: req.body,
      questionId: req.params.questionId,
    });
    res.status(200).json({ data, message: "Question edited succssfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.delete("/tests/:testId/test-questions/:questionId", async (req, res) => {
  try {
    const data = await deleteQuestion({
      questionId: req.params.questionId,
    });
    res.status(200).json({ data, message: "Question deleted succssfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

export default router;
