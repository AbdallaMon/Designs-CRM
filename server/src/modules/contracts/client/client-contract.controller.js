// contracts/client controller — thin. The PUBLIC client e-sign surface. The token comes
// from the query (GET /session) or the body (PUT /session/status, POST /generate-pdf); no
// session is involved. Responds via the shared envelope helpers with language-neutral
// codes — REPLACING the legacy Arabic/English PROSE ("تم حفظ الاستجابة بنجاح" /
// "Response saved successfully" / "Error in generating pdf").
import { ok } from "../../../shared/http/response.js";
import { contractsMessagesCodes, messagesNames } from "@dms/shared";
import { clientContractUsecase } from "./client-contract.usecase.js";

const TK = messagesNames.contractsMessages;

class ClientContractController {
  async getSession(req, res) {
    const data = await clientContractUsecase.getSession({ token: req.query.token });
    return ok(res, data, contractsMessagesCodes.CONTRACT_SESSION_FETCHED, TK);
  }

  async changeStatus(req, res) {
    const data = await clientContractUsecase.changeStatus({
      token: req.body.token,
      sessionStatus: req.body.sessionStatus,
    });
    return ok(res, data, contractsMessagesCodes.CONTRACT_SESSION_STATUS_UPDATED, TK);
  }

  async generatePdf(req, res) {
    // The token is the session selector — taken ONLY from sessionData.arToken (legacy shape).
    const data = await clientContractUsecase.generatePdf({
      token: req.body.sessionData.arToken,
      signatureUrl: req.body.signatureUrl,
      lng: req.body.lng,
    });
    return ok(res, data, contractsMessagesCodes.CONTRACT_PDF_GENERATED, TK);
  }
}

export const clientContractController = new ClientContractController();
export { ClientContractController };
