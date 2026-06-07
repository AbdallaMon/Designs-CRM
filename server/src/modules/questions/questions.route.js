// questions routes — the SPIN session-questions/answers + VERSA objection-handling
// surface (legacy `routes/questions/questions.js`, mounted `/shared/questions` behind the
// SHARED gate = all 9 authed roles). Mounted here under `/v2/questions`. Authentication
// is mounted ONCE; every route declares its QUESTION.* code (granted to every authed role
// via SHARED_AUTHED — reproducing the legacy SHARED gate exactly).
//
// OBJECT SCOPE: the lead-scoped routes do NOT use a route-level requireSpecialChecker —
// the parent lead must be RESOLVED first (from the path clientLeadId, or indirectly from
// a sessionQuestionId / versa stepId), which the usecase does before asserting access via
// the leads-module checker (the IDOR fix the legacy routes were missing). CONFIG reads of
// global question types are gated by the code alone.
//
// Endpoint map (legacy → v2):
//   GET  /question-types/:clientLeadId                 → GET  /question-types/:clientLeadId
//   GET  /session-questions/:clientLeadId              → GET  /session-questions/:clientLeadId
//   POST /:sessionQuestionId/answer                    → POST /:sessionQuestionId/answer
//   POST /answer/bulk                                  → POST /answer/bulk
//   POST /lead/:clientLeadId/custom-question           → POST /lead/:clientLeadId/custom-question
//   GET  /versa/:clientLeadId                          → GET  /versa/:clientLeadId
//   GET  /versa/:clientLeadId/category/:categoryId     → GET  /versa/:clientLeadId/category/:categoryId
//   POST /versa/:clientLeadId/category/:categoryId     → POST /versa/:clientLeadId/category/:categoryId
//   PUT  /versa/steps/:stepId                          → PUT  /versa/steps/:stepId
import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { questionsController } from "./questions.controller.js";
import { QuestionsValidation } from "./questions.validation.js";

const P = PERMISSIONS.QUESTION;
const router = Router();

router.use(AuthMiddleware.requireAuth);

router.get(
  "/question-types/:clientLeadId",
  AuthMiddleware.requirePermissions([P.CONFIG_VIEW]),
  validate(QuestionsValidation.clientLeadIdParam, "params"),
  asyncHandler(questionsController.getQuestionTypes),
);

router.get(
  "/session-questions/:clientLeadId",
  AuthMiddleware.requirePermissions([P.SESSION_VIEW]),
  validate(QuestionsValidation.clientLeadIdParam, "params"),
  validate(QuestionsValidation.sessionQuestionsQuery, "query"),
  asyncHandler(questionsController.getSessionQuestions),
);

router.post(
  "/answer/bulk",
  AuthMiddleware.requirePermissions([P.ANSWER_SUBMIT]),
  validate(QuestionsValidation.bulkAnswerBody),
  asyncHandler(questionsController.submitBulkAnswers),
);

router.post(
  "/:sessionQuestionId/answer",
  AuthMiddleware.requirePermissions([P.ANSWER_SUBMIT]),
  validate(QuestionsValidation.sessionQuestionIdParam, "params"),
  validate(QuestionsValidation.answerBody),
  asyncHandler(questionsController.submitAnswer),
);

router.post(
  "/lead/:clientLeadId/custom-question",
  AuthMiddleware.requirePermissions([P.CUSTOM_CREATE]),
  validate(QuestionsValidation.leadCustomParam, "params"),
  validate(QuestionsValidation.customQuestionBody),
  asyncHandler(questionsController.createCustomQuestion),
);

// VERSA — `/versa/steps/:stepId` is registered BEFORE `/versa/:clientLeadId` so the
// literal `steps` segment is not captured by the `:clientLeadId` param.
router.put(
  "/versa/steps/:stepId",
  AuthMiddleware.requirePermissions([P.VERSA_MANAGE]),
  validate(QuestionsValidation.versaStepParam, "params"),
  validate(QuestionsValidation.updateVersaStepBody),
  asyncHandler(questionsController.updateVersaStep),
);

router.get(
  "/versa/:clientLeadId",
  AuthMiddleware.requirePermissions([P.SESSION_VIEW]),
  validate(QuestionsValidation.clientLeadIdParam, "params"),
  asyncHandler(questionsController.getVersaCategories),
);

router.get(
  "/versa/:clientLeadId/category/:categoryId",
  AuthMiddleware.requirePermissions([P.SESSION_VIEW]),
  validate(QuestionsValidation.versaCategoryParam, "params"),
  asyncHandler(questionsController.getVersaByCategory),
);

router.post(
  "/versa/:clientLeadId/category/:categoryId",
  AuthMiddleware.requirePermissions([P.VERSA_MANAGE]),
  validate(QuestionsValidation.versaCategoryParam, "params"),
  validate(QuestionsValidation.createVersaBody),
  asyncHandler(questionsController.createVersa),
);

export { router as questionsRouter };
