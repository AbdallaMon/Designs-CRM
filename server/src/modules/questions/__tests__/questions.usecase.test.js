import { describe, it, expect, vi, beforeEach } from "vitest";

import { AppError } from "../../../shared/errors/AppError.js";
import { questionsMessagesCodes } from "@dms/shared";

// DI removed: the usecase calls the imported `questionsRepository` and `leadUsecase`
// singletons directly. Mock both so the scope model can be asserted without a DB.
vi.mock("../questions.repo.js", () => ({
  questionsRepository: {
    ensureDefaultCategoriesAndQuestions: vi.fn(),
    ensureSessionQuestions: vi.fn(),
    getQuestionsTypes: vi.fn(),
    getSessionQuestionsByClientLeadId: vi.fn(),
    upsertAnswer: vi.fn(),
    createCustomQuestion: vi.fn(),
    getCategoriesWithVersaStatus: vi.fn(),
    getVersaByCategory: vi.fn(),
    createVersaModel: vi.fn(),
    updateVersaStep: vi.fn(),
    versaStepExists: vi.fn(),
    findLeadIdBySessionQuestion: vi.fn(),
    findLeadIdByVersaStep: vi.fn(),
  },
}));

vi.mock("../../leads/lead/lead.usecase.js", () => ({
  leadUsecase: {
    checkIfUserCanAccessLead: vi.fn(),
    checkIfUserCanMutateLead: vi.fn(),
  },
}));

import { questionsUsecase } from "../questions.usecase.js";
import { questionsRepository } from "../questions.repo.js";
import { leadUsecase } from "../../leads/lead/lead.usecase.js";


// Leads checkers mirror the keystone scope model:
//   - lead 100  → OWNED by the caller (userId 5): readable AND mutable.
//   - lead 200  → CLAIMABLE unassigned-NEW pool: READABLE (access) but NOT mutable.
//   - anything else → out of scope: both denied.
// checkIfUserCanAccessLead throws AppError(LEAD_ACCESS_DENIED, 403) on denial;
// checkIfUserCanMutateLead throws AppError(LEAD_MUTATE_DENIED, 403) on denial.
beforeEach(() => {
  vi.clearAllMocks();

  leadUsecase.checkIfUserCanAccessLead.mockImplementation(async ({ id }) => {
    if (Number(id) === 100) return { id: 100, userId: 5, status: "FOLLOW_UP" };
    if (Number(id) === 200) return { id: 200, userId: null, status: "NEW" };
    throw new AppError({ code: "LEAD_ACCESS_DENIED", statusCode: 403 });
  });
  leadUsecase.checkIfUserCanMutateLead.mockImplementation(async ({ id }) => {
    if (Number(id) === 100) return { id: 100, userId: 5, status: "FOLLOW_UP" };
    // lead 200 is the claimable NEW pool — viewable but NOT writable.
    throw new AppError({ code: "LEAD_MUTATE_DENIED", statusCode: 403 });
  });

  questionsRepository.ensureDefaultCategoriesAndQuestions.mockResolvedValue(undefined);
  questionsRepository.ensureSessionQuestions.mockResolvedValue(undefined);
  questionsRepository.getQuestionsTypes.mockResolvedValue([{ id: 1, name: "SITUATION" }]);
  questionsRepository.getSessionQuestionsByClientLeadId.mockResolvedValue([{ id: 9 }]);
  questionsRepository.upsertAnswer.mockResolvedValue({ id: 7, response: "ok" });
  questionsRepository.createCustomQuestion.mockResolvedValue({ id: 11 });
  questionsRepository.getCategoriesWithVersaStatus.mockResolvedValue([{ id: 2, hasVersa: false }]);
  questionsRepository.getVersaByCategory.mockResolvedValue({ id: 3 });
  questionsRepository.createVersaModel.mockResolvedValue({ id: 4 });
  questionsRepository.updateVersaStep.mockResolvedValue({ id: 5, label: "x" });
  questionsRepository.versaStepExists.mockResolvedValue({ id: 5 });
});

const AUTH = { id: 5, role: "STAFF" };

describe("questions usecase — object scope (the IDOR fix)", () => {
  it("getQuestionTypes: allows an in-scope lead and seeds with req.auth.id as userId", async () => {
    const data = await questionsUsecase.getQuestionTypes({ clientLeadId: 100, authUser: AUTH });
    expect(data).toEqual([{ id: 1, name: "SITUATION" }]);
    expect(leadUsecase.checkIfUserCanAccessLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    // userId for seeding comes from req.auth, never the body.
    expect(questionsRepository.ensureSessionQuestions).toHaveBeenCalledWith({ clientLeadId: 100, userId: 5 });
  });

  it("getQuestionTypes: DENIES an out-of-scope lead (403) and never seeds/reads", async () => {
    await expect(questionsUsecase.getQuestionTypes({ clientLeadId: 999, authUser: AUTH })).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(questionsRepository.ensureSessionQuestions).not.toHaveBeenCalled();
    expect(questionsRepository.getQuestionsTypes).not.toHaveBeenCalled();
  });

  it("getSessionQuestions: denies an out-of-scope lead", async () => {
    await expect(
      questionsUsecase.getSessionQuestions({ clientLeadId: 999, questionTypeId: 1, authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("submitAnswer: resolves the parent lead from sessionQuestionId, then MUTATE-scope-checks (owner)", async () => {
    questionsRepository.findLeadIdBySessionQuestion.mockResolvedValue(100);
    const out = await questionsUsecase.submitAnswer({ sessionQuestionId: 9, response: "hi", authUser: AUTH });
    expect(out).toMatchObject({ id: 7 });
    // WRITE path → mutate checker, NOT the access checker.
    expect(leadUsecase.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leadUsecase.checkIfUserCanAccessLead).not.toHaveBeenCalled();
    // userId derived from req.auth.
    expect(questionsRepository.upsertAnswer).toHaveBeenCalledWith({ sessionQuestionId: 9, response: "hi", userId: 5 });
  });

  it("submitAnswer: DENIES a claimable unassigned-NEW lead (mutate-scope, not read-scope)", async () => {
    // Lead 200 is in the caller's READ scope (claimable NEW pool) but NOT mutate scope.
    questionsRepository.findLeadIdBySessionQuestion.mockResolvedValue(200);
    await expect(
      questionsUsecase.submitAnswer({ sessionQuestionId: 9, response: "hi", authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(questionsRepository.upsertAnswer).not.toHaveBeenCalled();
  });

  it("submitAnswer: DENIES when the resolved parent lead is out of scope (IDOR closed)", async () => {
    questionsRepository.findLeadIdBySessionQuestion.mockResolvedValue(999);
    await expect(
      questionsUsecase.submitAnswer({ sessionQuestionId: 9, response: "hi", authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(questionsRepository.upsertAnswer).not.toHaveBeenCalled();
  });

  it("submitAnswer: 404 when the session question does not exist", async () => {
    questionsRepository.findLeadIdBySessionQuestion.mockResolvedValue(null);
    await expect(
      questionsUsecase.submitAnswer({ sessionQuestionId: 12345, response: "hi", authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 404, message: questionsMessagesCodes.QUESTION_NOT_FOUND });
  });

  it("submitBulkAnswers: MUTATE-scope-checks EACH answer's parent lead independently", async () => {
    // First answer is owned (100, mutable), second is the claimable NEW pool (200 —
    // readable but NOT mutable) → whole call denied on mutate-scope. The first item's
    // answer must NOT have been written (deny before any persist for the bad item).
    questionsRepository.findLeadIdBySessionQuestion
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(200);
    await expect(
      questionsUsecase.submitBulkAnswers({
        answers: [
          { sessionQuestionId: 1, response: "a" },
          { sessionQuestionId: 2, response: "b" },
        ],
        authUser: AUTH,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
    // Mutate check ran for BOTH leads; the access checker was never used.
    expect(leadUsecase.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leadUsecase.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 200, authUser: AUTH });
    expect(leadUsecase.checkIfUserCanAccessLead).not.toHaveBeenCalled();
    // Only the first (owned) item was persisted before the second was denied.
    expect(questionsRepository.upsertAnswer).toHaveBeenCalledTimes(1);
  });

  it("createCustomQuestion: WRITE path uses mutate-scope (owner allowed)", async () => {
    await questionsUsecase.createCustomQuestion({ clientLeadId: 100, questionTypeId: 1, title: "Q", authUser: AUTH });
    expect(leadUsecase.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leadUsecase.checkIfUserCanAccessLead).not.toHaveBeenCalled();
    expect(questionsRepository.createCustomQuestion).toHaveBeenCalled();
  });

  it("createCustomQuestion: DENIES a claimable unassigned-NEW lead (mutate-scope)", async () => {
    await expect(
      questionsUsecase.createCustomQuestion({ clientLeadId: 200, questionTypeId: 1, title: "Q", authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(questionsRepository.createCustomQuestion).not.toHaveBeenCalled();
  });

  it("createVersa: ignores body categoryId — uses the path categoryId + req.auth userId (mutate-scope)", async () => {
    await questionsUsecase.createVersa({ clientLeadId: 100, categoryId: 3, authUser: AUTH });
    expect(leadUsecase.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leadUsecase.checkIfUserCanAccessLead).not.toHaveBeenCalled();
    expect(questionsRepository.createVersaModel).toHaveBeenCalledWith({ clientLeadId: 100, categoryId: 3, userId: 5 });
  });

  it("createVersa: DENIES a claimable unassigned-NEW lead (mutate-scope)", async () => {
    await expect(
      questionsUsecase.createVersa({ clientLeadId: 200, categoryId: 3, authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(questionsRepository.createVersaModel).not.toHaveBeenCalled();
  });

  it("updateVersaStep: resolves stepId → parent lead → MUTATE-scope-check before writing", async () => {
    questionsRepository.findLeadIdByVersaStep.mockResolvedValue(100);
    await questionsUsecase.updateVersaStep({ stepId: 5, fields: { label: "x" }, authUser: AUTH });
    expect(leadUsecase.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leadUsecase.checkIfUserCanAccessLead).not.toHaveBeenCalled();
    expect(questionsRepository.updateVersaStep).toHaveBeenCalledWith({ stepId: 5, label: "x" });
  });

  it("updateVersaStep: DENIES a claimable unassigned-NEW parent lead (mutate-scope, not read-scope)", async () => {
    questionsRepository.findLeadIdByVersaStep.mockResolvedValue(200);
    await expect(
      questionsUsecase.updateVersaStep({ stepId: 5, fields: { label: "x" }, authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(questionsRepository.updateVersaStep).not.toHaveBeenCalled();
  });

  it("updateVersaStep: DENIES when the step's parent lead is out of scope", async () => {
    questionsRepository.findLeadIdByVersaStep.mockResolvedValue(999);
    await expect(
      questionsUsecase.updateVersaStep({ stepId: 5, fields: { label: "x" }, authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(questionsRepository.updateVersaStep).not.toHaveBeenCalled();
  });

  it("updateVersaStep: 404 when the step does not exist", async () => {
    questionsRepository.versaStepExists.mockResolvedValue(null);
    await expect(
      questionsUsecase.updateVersaStep({ stepId: 99999, fields: {}, authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 404, message: questionsMessagesCodes.VERSA_STEP_NOT_FOUND });
  });
});
