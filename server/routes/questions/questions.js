import { Router } from "express";
import {
  createCustomQuestion,
  ensureDefaultCategoriesAndQuestions,
  ensureSessionQuestions,
  getQuestionsTypes,
  getSessionQuestionsByMettingId,
  makeAnswerToAQuestion,
  submitMoreThanAnswer,
} from "../../services/main/shared-questions.js";
import {
  getCurrentUser,
  verifyTokenAndHandleAuthorization,
} from "../../services/main/utility.js";

const router = Router();

router.use((req, res, next) => {
  verifyTokenAndHandleAuthorization(req, res, next, "SHARED");
});

router.get("/question-types/:meetingReminderId", async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    await ensureDefaultCategoriesAndQuestions();
    await ensureSessionQuestions({
      meetingReminderId: req.params.meetingReminderId,
      userId: currentUser.id,
    });
    const types = await getQuestionsTypes();
    res.status(200).json({ data: types });
  } catch (error) {
    console.error("Error fetching question types:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching  question types" });
  }
});
router.get("/session-questions/:meetingReminderId", async (req, res) => {
  try {
    const questions = await getSessionQuestionsByMettingId({
      meetingReminderId: req.params.meetingReminderId,
      questionTypeId: req.query.questionTypeId,
    });
    res.status(200).json({ data: questions });
  } catch (error) {
    console.error("Error fetching meeting question :", error);
    res.status(500).json({
      message: "An error occurred while fetching meeting question ",
    });
  }
});
router.post("/:sessionQuestionId/answer", async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const answer = await makeAnswerToAQuestion({
      sessionQuestionId: req.params.sessionQuestionId,
      response: req.body.response,
      userId: currentUser.id,
    });
    res.status(200).json({ data: answer, message: "Answer saved" });
  } catch (e) {
    console.error("Error making answer:", error);
    res.status(500).json({ message: "An error occurred while making answer" });
  }
});
router.post("/answer/bulk", async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    console.log(req.body.answers);
    const answers = await submitMoreThanAnswer({
      answers: req.body.answers,
      userId: currentUser.id,
    });
    res.status(200).json({ data: answers, message: "Answers saved" });
  } catch (e) {
    console.error("Error making answer:", error);
    res.status(500).json({ message: "An error occurred while making answer" });
  }
});
router.post("/meeting/:meetingReminderId/custom-question", async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const question = await createCustomQuestion({
      meetingReminderId: req.params.meetingReminderId,
      questionTypeId: req.body.questionTypeId,
      title: req.body.title,
      userId: currentUser.id,
      isCustom: req.body.isCustom,
    });
    res.status(200).json({ data: question, message: "Question created" });
  } catch (e) {
    console.error("Error making answer:", error);
    res.status(500).json({ message: "An error occurred while making answer" });
  }
});
export default router;
