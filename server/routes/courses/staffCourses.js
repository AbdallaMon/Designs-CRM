import { Router } from "express";
import {
  getCourse,
  getCourses,
  getLesson,
  getUserCourseProgress,
  markLessonAsCompleted,
} from "../../services/main/courses/staffCoursesServices.js";
import {
  getAndThrowError,
  getCurrentUser,
  getPagination,
} from "../../services/main/utility.js";

const router = Router();

router.get("", async (req, res) => {
  try {
    const { limit, skip } = getPagination(req);
    const result = await getCourses({
      limit: Number(limit),
      skip: Number(skip),
      role: req.query.role,
    });
    res.status(200).json({ data: result });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/:courseId", async (req, res) => {
  try {
    const user = await getCurrentUser(req);

    const result = await getCourse({
      courseId: req.params.courseId,
      role: req.query.role,
      userId: user.id,
    });
    res.status(200).json({ data: result });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/:courseId/progress", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const result = await getUserCourseProgress({
      courseId: req.params.courseId,
      userId: user.id,
    });
    res.status(200).json({ data: result });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/:courseId/lessons/:lessonId", async (req, res) => {
  try {
    const result = await getLesson({
      lessonId: req.params.lessonId,
      role: req.query.role,
    });
    res.status(200).json({ data: result });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.patch("/:courseId/lessons/:lessonId", async (req, res) => {
  try {
    const user = await getCurrentUser(req);

    const result = await markLessonAsCompleted({
      lessonId: req.params.lessonId,
      courseId: req.params.courseId,
      userId: user.id,
    });
    res.status(200).json({ data: result, message: "Done" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
export default router;
