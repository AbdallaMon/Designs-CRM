import { ok, created, deleted } from "../../shared/http/response.js";
import { siteUtilityMessagesCodes, messagesNames } from "@dms/shared";
import { siteUtilityUsecase } from "./site-utility.usecase.js";

const TK = messagesNames.siteUtilityMessages;

// Thin controller: read validated input, call the usecase, respond via helpers.
// No business rules here (primitive coercion only).
class SiteUtilityController {
  // ── PDF config ─────────────────────────────────────────────────────────────
  async getPdfConfig(req, res) {
    const config = await siteUtilityUsecase.getPdfConfig();
    return ok(res, config, siteUtilityMessagesCodes.PDF_CONFIG_FETCHED, TK);
  }

  async updatePdfConfig(req, res) {
    const config = await siteUtilityUsecase.updatePdfConfig({ input: req.body });
    return ok(res, config, siteUtilityMessagesCodes.PDF_CONFIG_UPDATED, TK);
  }

  // ── Contract payment conditions ──────────────────────────────────────────────
  async listPaymentConditions(req, res) {
    const result = await siteUtilityUsecase.listPaymentConditions({
      authUser: req.auth,
    });
    return ok(
      res,
      result,
      siteUtilityMessagesCodes.PAYMENT_CONDITIONS_FETCHED,
      TK,
    );
  }

  async createPaymentCondition(req, res) {
    const row = await siteUtilityUsecase.createPaymentCondition({ input: req.body });
    return created(
      res,
      row,
      siteUtilityMessagesCodes.PAYMENT_CONDITION_CREATED,
      TK,
    );
  }

  async updatePaymentCondition(req, res) {
    const row = await siteUtilityUsecase.updatePaymentCondition({
      id: req.params.id,
      input: req.body,
    });
    return ok(res, row, siteUtilityMessagesCodes.PAYMENT_CONDITION_UPDATED, TK);
  }

  async deletePaymentCondition(req, res) {
    await siteUtilityUsecase.deletePaymentCondition({ id: req.params.id });
    return deleted(res, siteUtilityMessagesCodes.PAYMENT_CONDITION_DELETED, TK);
  }
}

export const siteUtilityController = new SiteUtilityController();
export { SiteUtilityController };
