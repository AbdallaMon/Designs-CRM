import { Router } from "express";
import {
  getAndThrowError,
  getPagination,
} from "../../services/main/utility.js";
import {
  createNewCourse,
  createNewLesson,
  createNewLessonLink,
  createNewLessonPdf,
  createNewLessonVideo,
  deleteLessonPdf,
  deleteLessonVideo,
  delteLessonLink,
  editCourse,
  editLesson,
  editLessonLink,
  editLessonPdf,
  editLessonVideo,
  getCourses,
  getLessonById,
  getLessonsByCourseId,
  getLinksByLessonId,
  getPdfsByLessonId,
  getVideosByLessonId,
} from "../../services/main/courses/adminCourseServices.js";
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
export default router;
