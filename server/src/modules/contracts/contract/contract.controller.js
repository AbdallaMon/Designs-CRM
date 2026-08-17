// contracts/contract controller — thin. Reads validated input, derives the acting user
// from req.auth (never the body), calls the usecase, responds via the shared envelope
// helpers with language-neutral codes. The object-scope check lives in the usecase (it
// resolves the parent clientLead — directly for :leadId, or via contract→clientLeadId for
// :contractId/child routes — and runs the leads-module checker before any read/write).
// Path ids are authoritative over body ids.
import { ok, created } from "../../../shared/http/response.js";
import { CONTRACT_PAYMENT_STATUSES, contractsMessagesCodes, messagesNames } from "@dms/shared";
import { auditCtxFromReq } from "../../../infra/audit/record-action.js";
import { contractUsecase } from "./contract.usecase.js";

const TK = messagesNames.contractsMessages;

class ContractController {
  // ── contract-level ────────────────────────────────────────────────────────────────
  async listLeadContracts(req, res) {
    const data = await contractUsecase.listLeadContracts({ leadId: req.params.leadId, authUser: req.auth });
    return ok(res, data, contractsMessagesCodes.CONTRACTS_FETCHED, TK);
  }

  async createContract(req, res) {
    const data = await contractUsecase.createContract({ payload: req.body, authUser: req.auth, auditCtx: auditCtxFromReq(req) });
    return created(res, data, contractsMessagesCodes.CONTRACT_CREATED, TK);
  }

  async getContractById(req, res) {
    const data = await contractUsecase.getContractById({ contractId: req.params.contractId, authUser: req.auth });
    return ok(res, data, contractsMessagesCodes.CONTRACT_FETCHED, TK);
  }

  async updateContractBasics(req, res) {
    const data = await contractUsecase.updateContractBasics({
      contractId: req.params.contractId,
      payload: req.body,
      authUser: req.auth,
    });
    return ok(res, data, contractsMessagesCodes.CONTRACT_UPDATED, TK);
  }

  async cancelContract(req, res) {
    const data = await contractUsecase.cancelContract({ contractId: req.params.contractId, authUser: req.auth });
    return ok(res, data, contractsMessagesCodes.CONTRACT_CANCELLED, TK);
  }

  async generatePdfToken(req, res) {
    const data = await contractUsecase.generatePdfToken({ contractId: req.params.contractId, authUser: req.auth });
    return ok(res, data, contractsMessagesCodes.CONTRACT_PDF_TOKEN_GENERATED, TK);
  }

  // ── payments grouped list (global, role-scoped inside the frozen service) ────────────
  async getGroupedPayments(req, res) {
    const data = await contractUsecase.getGroupedPayments({
      page: req.query.page ?? 1,
      limit: req.query.limit ?? 10,
      status: req.query.status ?? CONTRACT_PAYMENT_STATUSES.DUE,
      authUser: req.auth,
    });
    return ok(res, data, contractsMessagesCodes.CONTRACT_PAYMENTS_FETCHED, TK);
  }

  // ── stages ──────────────────────────────────────────────────────────────────────────
  async createStage(req, res) {
    const data = await contractUsecase.createStage({
      contractId: req.params.contractId,
      stage: req.body,
      authUser: req.auth,
    });
    return created(res, data, contractsMessagesCodes.CONTRACT_STAGE_CREATED, TK);
  }

  async updateStage(req, res) {
    const data = await contractUsecase.updateStage({
      contractId: req.params.contractId,
      stageId: req.params.stageId,
      newStage: req.body,
      authUser: req.auth,
    });
    return ok(res, data, contractsMessagesCodes.CONTRACT_STAGE_UPDATED, TK);
  }

  async deleteStage(req, res) {
    const data = await contractUsecase.deleteStage({
      contractId: req.params.contractId,
      stageId: req.params.stageId,
      authUser: req.auth,
    });
    return ok(res, data, contractsMessagesCodes.CONTRACT_STAGE_DELETED, TK);
  }

  // ── payments (CRUD + workflow actions) ───────────────────────────────────────────────
  async createPayment(req, res) {
    const data = await contractUsecase.createPayment({
      contractId: req.params.contractId,
      payment: req.body,
      authUser: req.auth,
    });
    return created(res, data, contractsMessagesCodes.CONTRACT_PAYMENT_CREATED, TK);
  }

  async updatePayment(req, res) {
    const data = await contractUsecase.updatePayment({
      contractId: req.params.contractId,
      paymentId: req.params.paymentId,
      newPayment: req.body,
      authUser: req.auth,
    });
    return ok(res, data, contractsMessagesCodes.CONTRACT_PAYMENT_UPDATED, TK);
  }

  async deletePayment(req, res) {
    const data = await contractUsecase.deletePayment({
      contractId: req.params.contractId,
      paymentId: req.params.paymentId,
      authUser: req.auth,
    });
    return ok(res, data, contractsMessagesCodes.CONTRACT_PAYMENT_DELETED, TK);
  }

  async updatePaymentStatus(req, res) {
    const data = await contractUsecase.updatePaymentStatus({
      contractId: req.params.contractId,
      paymentId: req.params.paymentId,
      status: req.body.status,
      authUser: req.auth,
      auditCtx: auditCtxFromReq(req),
    });
    return ok(res, data, contractsMessagesCodes.CONTRACT_PAYMENT_STATUS_UPDATED, TK);
  }

  async updatePaymentAmounts(req, res) {
    const data = await contractUsecase.updatePaymentAmounts({
      contractId: req.params.contractId,
      paymentId: req.params.paymentId,
      amountLost: req.body.amountLost,
      amountReceived: req.body.amountReceived,
      status: req.body.status,
      authUser: req.auth,
    });
    return ok(res, data, contractsMessagesCodes.CONTRACT_PAYMENT_AMOUNTS_UPDATED, TK);
  }

  // ── drawings ─────────────────────────────────────────────────────────────────────────
  async createDrawing(req, res) {
    const data = await contractUsecase.createDrawing({
      contractId: req.params.contractId,
      drawing: req.body,
      authUser: req.auth,
    });
    return created(res, data, contractsMessagesCodes.CONTRACT_DRAWING_CREATED, TK);
  }

  async updateDrawing(req, res) {
    const data = await contractUsecase.updateDrawing({
      contractId: req.params.contractId,
      drawId: req.params.drawId,
      newDrawing: req.body,
      authUser: req.auth,
    });
    return ok(res, data, contractsMessagesCodes.CONTRACT_DRAWING_UPDATED, TK);
  }

  async deleteDrawing(req, res) {
    const data = await contractUsecase.deleteDrawing({
      contractId: req.params.contractId,
      drawId: req.params.drawId,
      authUser: req.auth,
    });
    return ok(res, data, contractsMessagesCodes.CONTRACT_DRAWING_DELETED, TK);
  }

  // ── special items ──────────────────────────────────────────────────────────────────────
  async createSpecialItem(req, res) {
    const data = await contractUsecase.createSpecialItem({
      contractId: req.params.contractId,
      item: req.body,
      authUser: req.auth,
    });
    return created(res, data, contractsMessagesCodes.CONTRACT_SPECIAL_ITEM_CREATED, TK);
  }

  async updateSpecialItem(req, res) {
    const data = await contractUsecase.updateSpecialItem({
      contractId: req.params.contractId,
      specialItemId: req.params.itemId,
      newSpecialItem: req.body,
      authUser: req.auth,
    });
    return ok(res, data, contractsMessagesCodes.CONTRACT_SPECIAL_ITEM_UPDATED, TK);
  }

  async deleteSpecialItem(req, res) {
    const data = await contractUsecase.deleteSpecialItem({
      contractId: req.params.contractId,
      specialItemId: req.params.itemId,
      authUser: req.auth,
    });
    return ok(res, data, contractsMessagesCodes.CONTRACT_SPECIAL_ITEM_DELETED, TK);
  }
}

export const contractController = new ContractController();
export { ContractController };
