import { Router } from "express";
import {
  createCustomQuestion,
  createVersaModel,
  ensureDefaultCategoriesAndQuestions,
  ensureSessionQuestions,
  getCategoriesWithVersaStatus,
  getQuestionsTypes,
  getSessionQuestionsByClientLeadId,
  getVersaByCategory,
  makeAnswerToAQuestion,
  submitMoreThanAnswer,
  updateVersa,
} from "../../services/main/shared-questions.js";
import {
  getCurrentUser,
  verifyTokenAndHandleAuthorization,
} from "../../services/main/utility.js";

const router = Router();

router.use((req, res, next) => {
  verifyTokenAndHandleAuthorization(req, res, next, "SHARED");
});

router.get("/question-types/:clientLeadId", async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    await ensureDefaultCategoriesAndQuestions();
    await ensureSessionQuestions({
      clientLeadId: req.params.clientLeadId,
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
router.get("/session-questions/:clientLeadId", async (req, res) => {
  try {
    const questions = await getSessionQuestionsByClientLeadId({
      clientLeadId: req.params.clientLeadId,
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
router.post("/lead/:clientLeadId/custom-question", async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const question = await createCustomQuestion({
      clientLeadId: req.params.clientLeadId,
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
// versa

router.get("/versa/:clientLeadId", async (req, res) => {
  try {
    const versaCats = await getCategoriesWithVersaStatus({
      clientLeadId: req.params.clientLeadId,
    });
    res.status(200).json({ data: versaCats });
  } catch (error) {
    console.error("Error fetching meeting question :", error);
    res.status(500).json({
      message: "An error occurred while fetching meeting question ",
    });
  }
});
router.get("/versa/:clientLeadId/category/:categoryId", async (req, res) => {
  try {
    const versaCats = await getVersaByCategory({
      clientLeadId: req.params.clientLeadId,
      categoryId: req.params.categoryId,
    });
    res.status(200).json({ data: versaCats });
  } catch (error) {
    console.error("Error fetching meeting question :", error);
    res.status(500).json({
      message: "An error occurred while fetching meeting question ",
    });
  }
});
router.post("/versa/:clientLeadId/category/:categoryId", async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const versa = await createVersaModel({
      userId: currentUser.id,
      ...req.body,
    });
    res.status(200).json({ data: versa, message: "VERSA created" });
  } catch (e) {
    console.error("Error making answer:", error);
    res.status(500).json({ message: "An error occurred while making answer" });
  }
});
router.put("/versa/steps/:stepId", async (req, res) => {
  try {
    const versa = await updateVersa({ stepId: req.params.stepId, ...req.body });
    res.status(200).json({ data: versa, message: "VERSA saved" });
  } catch (e) {
    console.error("Error making answer:", error);
    res.status(500).json({ message: "An error occurred while making answer" });
  }
});
export default router;
