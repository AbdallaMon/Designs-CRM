// questions controller — thin. Reads validated input, derives the acting user from
// req.auth (never the body), calls the usecase, responds via helpers. The object-scope
// check lives in the usecase (it must resolve the parent lead first), so there is no
// separate route-level special checker here — the usecase asserts lead access before any
// read/write of lead-scoped data.
import { ok, created } from "../../shared/http/response.js";
import { questionsMessagesCodes, messagesNames } from "@dms/shared";
import { questionsUsecase } from "./questions.usecase.js";

const TK = messagesNames.questionsMessages;

export class QuestionsController {
  async getQuestionTypes(req, res) {
    const data = await questionsUsecase.getQuestionTypes({
      clientLeadId: req.params.clientLeadId,
      authUser: req.auth,
    });
    return ok(res, data, questionsMessagesCodes.QUESTION_TYPES_FETCHED, TK);
  }

  async getSessionQuestions(req, res) {
    const data = await questionsUsecase.getSessionQuestions({
      clientLeadId: req.params.clientLeadId,
      questionTypeId: req.query.questionTypeId,
      authUser: req.auth,
    });
    return ok(res, data, questionsMessagesCodes.SESSION_QUESTIONS_FETCHED, TK);
  }

  async submitAnswer(req, res) {
    const data = await questionsUsecase.submitAnswer({
      sessionQuestionId: req.params.sessionQuestionId,
      response: req.body.response,
      authUser: req.auth,
    });
    return ok(res, data, questionsMessagesCodes.ANSWER_SAVED, TK);
  }

  async submitBulkAnswers(req, res) {
    const data = await questionsUsecase.submitBulkAnswers({
      answers: req.body.answers,
      authUser: req.auth,
    });
    return ok(res, data, questionsMessagesCodes.ANSWERS_SAVED, TK);
  }

  async createCustomQuestion(req, res) {
    const data = await questionsUsecase.createCustomQuestion({
      clientLeadId: req.params.clientLeadId,
      questionTypeId: req.body.questionTypeId,
      title: req.body.title,
      authUser: req.auth,
    });
    return created(res, data, questionsMessagesCodes.CUSTOM_QUESTION_CREATED, TK);
  }

  async getVersaCategories(req, res) {
    const data = await questionsUsecase.getVersaCategories({
      clientLeadId: req.params.clientLeadId,
      authUser: req.auth,
    });
    return ok(res, data, questionsMessagesCodes.VERSA_CATEGORIES_FETCHED, TK);
  }

  async getVersaByCategory(req, res) {
    const data = await questionsUsecase.getVersaByCategory({
      clientLeadId: req.params.clientLeadId,
      categoryId: req.params.categoryId,
      authUser: req.auth,
    });
    return ok(res, data, questionsMessagesCodes.VERSA_FETCHED, TK);
  }

  async createVersa(req, res) {
    const data = await questionsUsecase.createVersa({
      clientLeadId: req.params.clientLeadId,
      categoryId: req.params.categoryId,
      authUser: req.auth,
    });
    return created(res, data, questionsMessagesCodes.VERSA_CREATED, TK);
  }

  async updateVersaStep(req, res) {
    const data = await questionsUsecase.updateVersaStep({
      stepId: req.params.stepId,
      fields: req.body,
      authUser: req.auth,
    });
    return ok(res, data, questionsMessagesCodes.VERSA_STEP_SAVED, TK);
  }
}

export const questionsController = new QuestionsController();
