// questions controller — thin. Reads validated input, derives the acting user from
// req.auth (never the body), calls the usecase, responds via helpers. The object-scope
// check lives in the usecase (it must resolve the parent lead first), so there is no
// separate route-level special checker here — the usecase asserts lead access before any
// read/write of lead-scoped data.
import { ok, created } from "../../shared/http/response.js";
import { questionsMessagesCodes, messagesNames } from "@dms/shared";
import { questionsUsecase } from "./questions.usecase.js";

const C = questionsMessagesCodes;
const TK = messagesNames.questionsMessages;

export class QuestionsController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  getQuestionTypes = async (req, res) => {
    const data = await this.usecase.getQuestionTypes({
      clientLeadId: req.params.clientLeadId,
      authUser: req.auth,
    });
    return ok(res, data, C.QUESTION_TYPES_FETCHED, TK);
  };

  getSessionQuestions = async (req, res) => {
    const data = await this.usecase.getSessionQuestions({
      clientLeadId: req.params.clientLeadId,
      questionTypeId: req.query.questionTypeId,
      authUser: req.auth,
    });
    return ok(res, data, C.SESSION_QUESTIONS_FETCHED, TK);
  };

  submitAnswer = async (req, res) => {
    const data = await this.usecase.submitAnswer({
      sessionQuestionId: req.params.sessionQuestionId,
      response: req.body.response,
      authUser: req.auth,
    });
    return ok(res, data, C.ANSWER_SAVED, TK);
  };

  submitBulkAnswers = async (req, res) => {
    const data = await this.usecase.submitBulkAnswers({
      answers: req.body.answers,
      authUser: req.auth,
    });
    return ok(res, data, C.ANSWERS_SAVED, TK);
  };

  createCustomQuestion = async (req, res) => {
    const data = await this.usecase.createCustomQuestion({
      clientLeadId: req.params.clientLeadId,
      questionTypeId: req.body.questionTypeId,
      title: req.body.title,
      authUser: req.auth,
    });
    return created(res, data, C.CUSTOM_QUESTION_CREATED, TK);
  };

  getVersaCategories = async (req, res) => {
    const data = await this.usecase.getVersaCategories({
      clientLeadId: req.params.clientLeadId,
      authUser: req.auth,
    });
    return ok(res, data, C.VERSA_CATEGORIES_FETCHED, TK);
  };

  getVersaByCategory = async (req, res) => {
    const data = await this.usecase.getVersaByCategory({
      clientLeadId: req.params.clientLeadId,
      categoryId: req.params.categoryId,
      authUser: req.auth,
    });
    return ok(res, data, C.VERSA_FETCHED, TK);
  };

  createVersa = async (req, res) => {
    const data = await this.usecase.createVersa({
      clientLeadId: req.params.clientLeadId,
      categoryId: req.params.categoryId,
      authUser: req.auth,
    });
    return created(res, data, C.VERSA_CREATED, TK);
  };

  updateVersaStep = async (req, res) => {
    const data = await this.usecase.updateVersaStep({
      stepId: req.params.stepId,
      fields: req.body,
      authUser: req.auth,
    });
    return ok(res, data, C.VERSA_STEP_SAVED, TK);
  };
}

export const questionsController = new QuestionsController(questionsUsecase);
