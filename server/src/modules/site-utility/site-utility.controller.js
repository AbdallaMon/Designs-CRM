import { ok, created, deleted } from "../../shared/http/response.js";
import { siteUtilityMessagesCodes, messagesNames } from "@dms/shared";
import { siteUtilityUsecase } from "./site-utility.usecase.js";

const TK = messagesNames.siteUtilityMessages;

// Thin controller: read validated input, call the usecase, respond via helpers.
// No business rules here (primitive coercion only).
export class SiteUtilityController {
  /** @param {import("./site-utility.usecase.js").SiteUtilityUsecase} usecase */
  constructor(usecase) {
    this.usecase = usecase;
  }

  // ── PDF config ─────────────────────────────────────────────────────────────
  getPdfConfig = async (req, res) => {
    const config = await this.usecase.getPdfConfig();
    return ok(res, config, siteUtilityMessagesCodes.PDF_CONFIG_FETCHED, TK);
  };

  updatePdfConfig = async (req, res) => {
    const config = await this.usecase.updatePdfConfig({ input: req.body });
    return ok(res, config, siteUtilityMessagesCodes.PDF_CONFIG_UPDATED, TK);
  };

  // ── Contract payment conditions ──────────────────────────────────────────────
  listPaymentConditions = async (req, res) => {
    const result = await this.usecase.listPaymentConditions({
      authUser: req.auth,
    });
    return ok(
      res,
      result,
      siteUtilityMessagesCodes.PAYMENT_CONDITIONS_FETCHED,
      TK,
    );
  };

  createPaymentCondition = async (req, res) => {
    const row = await this.usecase.createPaymentCondition({ input: req.body });
    return created(
      res,
      row,
      siteUtilityMessagesCodes.PAYMENT_CONDITION_CREATED,
      TK,
    );
  };

  updatePaymentCondition = async (req, res) => {
    const row = await this.usecase.updatePaymentCondition({
      id: req.params.id,
      input: req.body,
    });
    return ok(res, row, siteUtilityMessagesCodes.PAYMENT_CONDITION_UPDATED, TK);
  };

  deletePaymentCondition = async (req, res) => {
    await this.usecase.deletePaymentCondition({ id: req.params.id });
    return deleted(res, siteUtilityMessagesCodes.PAYMENT_CONDITION_DELETED, TK);
  };
}

export const siteUtilityController = new SiteUtilityController(
  siteUtilityUsecase,
);
