import { describe, it, expect, vi } from "vitest";

import { AppError } from "../../../shared/errors/AppError.js";
import { questionsMessagesCodes } from "@dms/shared";
import { QuestionsUsecase } from "../questions.usecase.js";

const C = questionsMessagesCodes;

// Fake leads checkers mirroring the keystone scope model:
//   - lead 100  → OWNED by the caller (userId 5): readable AND mutable.
//   - lead 200  → CLAIMABLE unassigned-NEW pool: READABLE (access) but NOT mutable.
//   - anything else → out of scope: both denied.
// checkIfUserCanAccessLead throws AppError(LEAD_ACCESS_DENIED, 403) on denial;
// checkIfUserCanMutateLead throws AppError(LEAD_MUTATE_DENIED, 403) on denial.
function makeLeads() {
  return {
    checkIfUserCanAccessLead: vi.fn(async ({ id }) => {
      if (Number(id) === 100) return { id: 100, userId: 5, status: "FOLLOW_UP" };
      if (Number(id) === 200) return { id: 200, userId: null, status: "NEW" };
      throw new AppError("LEAD_ACCESS_DENIED", 403);
    }),
    checkIfUserCanMutateLead: vi.fn(async ({ id }) => {
      if (Number(id) === 100) return { id: 100, userId: 5, status: "FOLLOW_UP" };
      // lead 200 is the claimable NEW pool — viewable but NOT writable.
      throw new AppError("LEAD_MUTATE_DENIED", 403);
    }),
  };
}

function makeRepo(overrides = {}) {
  return {
    ensureDefaultCategoriesAndQuestions: vi.fn().mockResolvedValue(undefined),
    ensureSessionQuestions: vi.fn().mockResolvedValue(undefined),
    getQuestionsTypes: vi.fn().mockResolvedValue([{ id: 1, name: "SITUATION" }]),
    getSessionQuestionsByClientLeadId: vi.fn().mockResolvedValue([{ id: 9 }]),
    upsertAnswer: vi.fn().mockResolvedValue({ id: 7, response: "ok" }),
    createCustomQuestion: vi.fn().mockResolvedValue({ id: 11 }),
    getCategoriesWithVersaStatus: vi.fn().mockResolvedValue([{ id: 2, hasVersa: false }]),
    getVersaByCategory: vi.fn().mockResolvedValue({ id: 3 }),
    createVersaModel: vi.fn().mockResolvedValue({ id: 4 }),
    updateVersaStep: vi.fn().mockResolvedValue({ id: 5, label: "x" }),
    versaStepExists: vi.fn().mockResolvedValue({ id: 5 }),
    findLeadIdBySessionQuestion: vi.fn(),
    findLeadIdByVersaStep: vi.fn(),
    ...overrides,
  };
}

const AUTH = { id: 5, role: "STAFF" };

describe("questions usecase — object scope (the IDOR fix)", () => {
  it("getQuestionTypes: allows an in-scope lead and seeds with req.auth.id as userId", async () => {
    const leads = makeLeads();
    const repo = makeRepo();
    const uc = new QuestionsUsecase(repo, leads);
    const data = await uc.getQuestionTypes({ clientLeadId: 100, authUser: AUTH });
    expect(data).toEqual([{ id: 1, name: "SITUATION" }]);
    expect(leads.checkIfUserCanAccessLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    // userId for seeding comes from req.auth, never the body.
    expect(repo.ensureSessionQuestions).toHaveBeenCalledWith({ clientLeadId: 100, userId: 5 });
  });

  it("getQuestionTypes: DENIES an out-of-scope lead (403) and never seeds/reads", async () => {
    const leads = makeLeads();
    const repo = makeRepo();
    const uc = new QuestionsUsecase(repo, leads);
    await expect(uc.getQuestionTypes({ clientLeadId: 999, authUser: AUTH })).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(repo.ensureSessionQuestions).not.toHaveBeenCalled();
    expect(repo.getQuestionsTypes).not.toHaveBeenCalled();
  });

  it("getSessionQuestions: denies an out-of-scope lead", async () => {
    const uc = new QuestionsUsecase(makeRepo(), makeLeads());
    await expect(
      uc.getSessionQuestions({ clientLeadId: 999, questionTypeId: 1, authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("submitAnswer: resolves the parent lead from sessionQuestionId, then MUTATE-scope-checks (owner)", async () => {
    const repo = makeRepo({ findLeadIdBySessionQuestion: vi.fn().mockResolvedValue(100) });
    const leads = makeLeads();
    const uc = new QuestionsUsecase(repo, leads);
    const out = await uc.submitAnswer({ sessionQuestionId: 9, response: "hi", authUser: AUTH });
    expect(out).toMatchObject({ id: 7 });
    // WRITE path → mutate checker, NOT the access checker.
    expect(leads.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leads.checkIfUserCanAccessLead).not.toHaveBeenCalled();
    // userId derived from req.auth.
    expect(repo.upsertAnswer).toHaveBeenCalledWith({ sessionQuestionId: 9, response: "hi", userId: 5 });
  });

  it("submitAnswer: DENIES a claimable unassigned-NEW lead (mutate-scope, not read-scope)", async () => {
    // Lead 200 is in the caller's READ scope (claimable NEW pool) but NOT mutate scope.
    const repo = makeRepo({ findLeadIdBySessionQuestion: vi.fn().mockResolvedValue(200) });
    const uc = new QuestionsUsecase(repo, makeLeads());
    await expect(
      uc.submitAnswer({ sessionQuestionId: 9, response: "hi", authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(repo.upsertAnswer).not.toHaveBeenCalled();
  });

  it("submitAnswer: DENIES when the resolved parent lead is out of scope (IDOR closed)", async () => {
    const repo = makeRepo({ findLeadIdBySessionQuestion: vi.fn().mockResolvedValue(999) });
    const uc = new QuestionsUsecase(repo, makeLeads());
    await expect(
      uc.submitAnswer({ sessionQuestionId: 9, response: "hi", authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(repo.upsertAnswer).not.toHaveBeenCalled();
  });

  it("submitAnswer: 404 when the session question does not exist", async () => {
    const repo = makeRepo({ findLeadIdBySessionQuestion: vi.fn().mockResolvedValue(null) });
    const uc = new QuestionsUsecase(repo, makeLeads());
    await expect(
      uc.submitAnswer({ sessionQuestionId: 12345, response: "hi", authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 404, message: C.QUESTION_NOT_FOUND });
  });

  it("submitBulkAnswers: MUTATE-scope-checks EACH answer's parent lead independently", async () => {
    // First answer is owned (100, mutable), second is the claimable NEW pool (200 —
    // readable but NOT mutable) → whole call denied on mutate-scope. The first item's
    // answer must NOT have been written (deny before any persist for the bad item).
    const findLeadIdBySessionQuestion = vi
      .fn()
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(200);
    const repo = makeRepo({ findLeadIdBySessionQuestion });
    const leads = makeLeads();
    const uc = new QuestionsUsecase(repo, leads);
    await expect(
      uc.submitBulkAnswers({
        answers: [
          { sessionQuestionId: 1, response: "a" },
          { sessionQuestionId: 2, response: "b" },
        ],
        authUser: AUTH,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
    // Mutate check ran for BOTH leads; the access checker was never used.
    expect(leads.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leads.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 200, authUser: AUTH });
    expect(leads.checkIfUserCanAccessLead).not.toHaveBeenCalled();
    // Only the first (owned) item was persisted before the second was denied.
    expect(repo.upsertAnswer).toHaveBeenCalledTimes(1);
  });

  it("createCustomQuestion: WRITE path uses mutate-scope (owner allowed)", async () => {
    const repo = makeRepo();
    const leads = makeLeads();
    const uc = new QuestionsUsecase(repo, leads);
    await uc.createCustomQuestion({ clientLeadId: 100, questionTypeId: 1, title: "Q", authUser: AUTH });
    expect(leads.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leads.checkIfUserCanAccessLead).not.toHaveBeenCalled();
    expect(repo.createCustomQuestion).toHaveBeenCalled();
  });

  it("createCustomQuestion: DENIES a claimable unassigned-NEW lead (mutate-scope)", async () => {
    const repo = makeRepo();
    const uc = new QuestionsUsecase(repo, makeLeads());
    await expect(
      uc.createCustomQuestion({ clientLeadId: 200, questionTypeId: 1, title: "Q", authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(repo.createCustomQuestion).not.toHaveBeenCalled();
  });

  it("createVersa: ignores body categoryId — uses the path categoryId + req.auth userId (mutate-scope)", async () => {
    const repo = makeRepo();
    const leads = makeLeads();
    const uc = new QuestionsUsecase(repo, leads);
    await uc.createVersa({ clientLeadId: 100, categoryId: 3, authUser: AUTH });
    expect(leads.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leads.checkIfUserCanAccessLead).not.toHaveBeenCalled();
    expect(repo.createVersaModel).toHaveBeenCalledWith({ clientLeadId: 100, categoryId: 3, userId: 5 });
  });

  it("createVersa: DENIES a claimable unassigned-NEW lead (mutate-scope)", async () => {
    const repo = makeRepo();
    const uc = new QuestionsUsecase(repo, makeLeads());
    await expect(
      uc.createVersa({ clientLeadId: 200, categoryId: 3, authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(repo.createVersaModel).not.toHaveBeenCalled();
  });

  it("updateVersaStep: resolves stepId → parent lead → MUTATE-scope-check before writing", async () => {
    const repo = makeRepo({ findLeadIdByVersaStep: vi.fn().mockResolvedValue(100) });
    const leads = makeLeads();
    const uc = new QuestionsUsecase(repo, leads);
    await uc.updateVersaStep({ stepId: 5, fields: { label: "x" }, authUser: AUTH });
    expect(leads.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leads.checkIfUserCanAccessLead).not.toHaveBeenCalled();
    expect(repo.updateVersaStep).toHaveBeenCalledWith({ stepId: 5, label: "x" });
  });

  it("updateVersaStep: DENIES a claimable unassigned-NEW parent lead (mutate-scope, not read-scope)", async () => {
    const repo = makeRepo({ findLeadIdByVersaStep: vi.fn().mockResolvedValue(200) });
    const uc = new QuestionsUsecase(repo, makeLeads());
    await expect(
      uc.updateVersaStep({ stepId: 5, fields: { label: "x" }, authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(repo.updateVersaStep).not.toHaveBeenCalled();
  });

  it("updateVersaStep: DENIES when the step's parent lead is out of scope", async () => {
    const repo = makeRepo({ findLeadIdByVersaStep: vi.fn().mockResolvedValue(999) });
    const uc = new QuestionsUsecase(repo, makeLeads());
    await expect(
      uc.updateVersaStep({ stepId: 5, fields: { label: "x" }, authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(repo.updateVersaStep).not.toHaveBeenCalled();
  });

  it("updateVersaStep: 404 when the step does not exist", async () => {
    const repo = makeRepo({ versaStepExists: vi.fn().mockResolvedValue(null) });
    const uc = new QuestionsUsecase(repo, makeLeads());
    await expect(
      uc.updateVersaStep({ stepId: 99999, fields: {}, authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 404, message: C.VERSA_STEP_NOT_FOUND });
  });
});
