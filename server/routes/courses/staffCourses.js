import { Router } from "express";
import {
  createAHomeWork,
  createAttampt,
  endAttempt,
  getCourse,
  getCourses,
  getHomeWorks,
  getLesson,
  getUserAttampt,
  getUserAttampts,
  getUserCourseProgress,
  getUserDashboardStats,
  getUserTest,
  getUserTestQuestion,
  markLessonAsCompleted,
  submitAnswer,
} from "../../services/main/courses/staffCoursesServices.js";
import {
  getAndThrowError,
  getCurrentUser,
  getPagination,
} from "../../services/main/utility/utility.js";

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
router.get("/dashboard", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const result = await getUserDashboardStats(user.id);
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
    const user = await getCurrentUser(req);
    const result = await getLesson({
      lessonId: req.params.lessonId,
      role: req.query.role,
      userId: user.id,
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
// home work

router.get("/:courseId/lessons/:lessonId/home-work", async (req, res) => {
  try {
    const user = await getCurrentUser(req);

    const result = await getHomeWorks({
      lessonId: req.params.lessonId,
      courseId: req.params.courseId,
      userId: user.id,
    });
    res.status(200).json({ data: result, message: "Done" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

router.post("/:courseId/lessons/:lessonId/home-work", async (req, res) => {
  try {
    const user = await getCurrentUser(req);

    const result = await createAHomeWork({
      lessonId: req.params.lessonId,
      courseId: req.params.courseId,
      userId: user.id,
      data: req.body,
    });
    res.status(200).json({ data: result, message: "Home work saved" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
// tests
router.get("/tests/:testId", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const result = await getUserTest({
      testId: req.params.testId,
      userId: user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.id,
    });
    res.status(200).json({ data: result, message: "Done" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/tests/:testId/test-questions", async (req, res) => {
  try {
    const result = await getUserTestQuestion({
      testId: req.params.testId,
    });
    res.status(200).json({ data: result, message: "Done" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/tests/:testId/attampts", async (req, res) => {
  try {
    const user = await getCurrentUser(req);

    const result = await getUserAttampts({
      testId: req.params.testId,
      userId: user.id,
    });
    res.status(200).json({ data: result, message: "Done" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/tests/:testId/attampts/:attamptId", async (req, res) => {
  try {
    const user = await getCurrentUser(req);

    const result = await getUserAttampt({
      attamptId: req.params.attamptId,
      userId: user.id,
    });
    res.status(200).json({ data: result, message: "Done" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/tests/:testId/attampts", async (req, res) => {
  try {
    const user = await getCurrentUser(req);

    const result = await createAttampt({
      userId: user.id,
      testId: req.params.testId,
    });
    res.status(200).json({ data: result, message: "Done" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post(
  "/tests/:testId/attampts/:attemptId/questions/:questionId",
  async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      const result = await submitAnswer({
        userId: user.id,
        testId: req.params.testId,
        answer: req.body.answer,
        attemptId: req.params.attemptId,
        questionId: req.params.questionId,
      });
      res.status(200).json({ data: result, message: "Done" });
    } catch (e) {
      getAndThrowError(e, res);
    }
  }
);
router.put("/tests/:testId/attampts/:attemptId/", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const result = await endAttempt(Number(req.params.attemptId));
    res.status(200).json({ data: result, message: "Saved" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
export default router;
