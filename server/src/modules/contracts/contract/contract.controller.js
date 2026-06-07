// contracts/contract controller — thin. Reads validated input, derives the acting user
// from req.auth (never the body), calls the usecase, responds via the shared envelope
// helpers with language-neutral codes. The object-scope check lives in the usecase (it
// resolves the parent clientLead — directly for :leadId, or via contract→clientLeadId for
// :contractId/child routes — and runs the leads-module checker before any read/write).
// Path ids are authoritative over body ids.
import { ok, created } from "../../../shared/http/response.js";
import { contractsMessagesCodes, messagesNames } from "@dms/shared";
import { contractUsecase } from "./contract.usecase.js";

const C = contractsMessagesCodes;
const TK = messagesNames.contractsMessages;

export class ContractController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  // ── contract-level ────────────────────────────────────────────────────────────────
  listForLead = async (req, res) => {
    const data = await this.usecase.listForLead({ leadId: req.params.leadId, authUser: req.auth });
    return ok(res, data, C.CONTRACTS_FETCHED, TK);
  };

  create = async (req, res) => {
    const data = await this.usecase.create({ payload: req.body, authUser: req.auth });
    return created(res, data, C.CONTRACT_CREATED, TK);
  };

  getById = async (req, res) => {
    const data = await this.usecase.getById({ contractId: req.params.contractId, authUser: req.auth });
    return ok(res, data, C.CONTRACT_FETCHED, TK);
  };

  updateBasics = async (req, res) => {
    const data = await this.usecase.updateBasics({
      contractId: req.params.contractId,
      payload: req.body,
      authUser: req.auth,
    });
    return ok(res, data, C.CONTRACT_UPDATED, TK);
  };

  cancel = async (req, res) => {
    const data = await this.usecase.cancel({ contractId: req.params.contractId, authUser: req.auth });
    return ok(res, data, C.CONTRACT_CANCELLED, TK);
  };

  generatePdfToken = async (req, res) => {
    const data = await this.usecase.generatePdfToken({ contractId: req.params.contractId, authUser: req.auth });
    return ok(res, data, C.CONTRACT_PDF_TOKEN_GENERATED, TK);
  };

  // ── payments grouped list (global, role-scoped inside the frozen service) ────────────
  paymentsGrouped = async (req, res) => {
    const data = await this.usecase.paymentsGrouped({
      page: req.query.page ?? 1,
      limit: req.query.limit ?? 10,
      status: req.query.status ?? "DUE",
      authUser: req.auth,
    });
    return ok(res, data, C.CONTRACT_PAYMENTS_FETCHED, TK);
  };

  // ── stages ──────────────────────────────────────────────────────────────────────────
  createStage = async (req, res) => {
    const data = await this.usecase.createStage({
      contractId: req.params.contractId,
      stage: req.body,
      authUser: req.auth,
    });
    return created(res, data, C.CONTRACT_STAGE_CREATED, TK);
  };

  updateStage = async (req, res) => {
    const data = await this.usecase.updateStage({
      contractId: req.params.contractId,
      stageId: req.params.stageId,
      newStage: req.body,
      authUser: req.auth,
    });
    return ok(res, data, C.CONTRACT_STAGE_UPDATED, TK);
  };

  deleteStage = async (req, res) => {
    const data = await this.usecase.deleteStage({
      contractId: req.params.contractId,
      stageId: req.params.stageId,
      authUser: req.auth,
    });
    return ok(res, data, C.CONTRACT_STAGE_DELETED, TK);
  };

  // ── payments (CRUD + workflow actions) ───────────────────────────────────────────────
  createPayment = async (req, res) => {
    const data = await this.usecase.createPayment({
      contractId: req.params.contractId,
      payment: req.body,
      authUser: req.auth,
    });
    return created(res, data, C.CONTRACT_PAYMENT_CREATED, TK);
  };

  updatePayment = async (req, res) => {
    const data = await this.usecase.updatePayment({
      paymentId: req.params.paymentId,
      newPayment: req.body,
      authUser: req.auth,
    });
    return ok(res, data, C.CONTRACT_PAYMENT_UPDATED, TK);
  };

  deletePayment = async (req, res) => {
    const data = await this.usecase.deletePayment({ paymentId: req.params.paymentId, authUser: req.auth });
    return ok(res, data, C.CONTRACT_PAYMENT_DELETED, TK);
  };

  updatePaymentStatus = async (req, res) => {
    const data = await this.usecase.updatePaymentStatus({
      paymentId: req.params.paymentId,
      status: req.body.status,
      authUser: req.auth,
    });
    return ok(res, data, C.CONTRACT_PAYMENT_STATUS_UPDATED, TK);
  };

  updatePaymentAmounts = async (req, res) => {
    const data = await this.usecase.updatePaymentAmounts({
      paymentId: req.params.paymentId,
      amountLost: req.body.amountLost,
      amountReceived: req.body.amountReceived,
      status: req.body.status,
      authUser: req.auth,
    });
    return ok(res, data, C.CONTRACT_PAYMENT_AMOUNTS_UPDATED, TK);
  };

  // ── drawings ─────────────────────────────────────────────────────────────────────────
  createDrawing = async (req, res) => {
    const data = await this.usecase.createDrawing({
      contractId: req.params.contractId,
      drawing: req.body,
      authUser: req.auth,
    });
    return created(res, data, C.CONTRACT_DRAWING_CREATED, TK);
  };

  updateDrawing = async (req, res) => {
    const data = await this.usecase.updateDrawing({
      drawId: req.params.drawId,
      newDrawing: req.body,
      authUser: req.auth,
    });
    return ok(res, data, C.CONTRACT_DRAWING_UPDATED, TK);
  };

  deleteDrawing = async (req, res) => {
    const data = await this.usecase.deleteDrawing({ drawId: req.params.drawId, authUser: req.auth });
    return ok(res, data, C.CONTRACT_DRAWING_DELETED, TK);
  };

  // ── special items ──────────────────────────────────────────────────────────────────────
  createSpecialItem = async (req, res) => {
    const data = await this.usecase.createSpecialItem({
      contractId: req.params.contractId,
      item: req.body,
      authUser: req.auth,
    });
    return created(res, data, C.CONTRACT_SPECIAL_ITEM_CREATED, TK);
  };

  updateSpecialItem = async (req, res) => {
    const data = await this.usecase.updateSpecialItem({
      specialItemId: req.params.itemId,
      newSpecialItem: req.body,
      authUser: req.auth,
    });
    return ok(res, data, C.CONTRACT_SPECIAL_ITEM_UPDATED, TK);
  };

  deleteSpecialItem = async (req, res) => {
    const data = await this.usecase.deleteSpecialItem({ specialItemId: req.params.itemId, authUser: req.auth });
    return ok(res, data, C.CONTRACT_SPECIAL_ITEM_DELETED, TK);
  };
}

export const contractController = new ContractController(contractUsecase);
