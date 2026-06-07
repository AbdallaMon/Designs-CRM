// contracts/client controller — thin. The PUBLIC client e-sign surface. The token comes
// from the query (GET /session) or the body (PUT /session/status, POST /generate-pdf); no
// session is involved. Responds via the shared envelope helpers with language-neutral
// codes — REPLACING the legacy Arabic/English PROSE ("تم حفظ الاستجابة بنجاح" /
// "Response saved successfully" / "Error in generating pdf").
import { ok } from "../../../shared/http/response.js";
import { contractsMessagesCodes, messagesNames } from "@dms/shared";
import { clientContractUsecase } from "./client-contract.usecase.js";

const C = contractsMessagesCodes;
const TK = messagesNames.contractsMessages;

export class ClientContractController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  getSession = async (req, res) => {
    const data = await this.usecase.getSession({ token: req.query.token });
    return ok(res, data, C.CONTRACT_SESSION_FETCHED, TK);
  };

  changeStatus = async (req, res) => {
    const data = await this.usecase.changeStatus({
      token: req.body.token,
      sessionStatus: req.body.sessionStatus,
    });
    return ok(res, data, C.CONTRACT_SESSION_STATUS_UPDATED, TK);
  };

  generatePdf = async (req, res) => {
    // The token is the session selector — taken ONLY from sessionData.arToken (legacy shape).
    const data = await this.usecase.generatePdf({
      token: req.body.sessionData.arToken,
      signatureUrl: req.body.signatureUrl,
      lng: req.body.lng,
    });
    return ok(res, data, C.CONTRACT_PDF_GENERATED, TK);
  };
}

export const clientContractController = new ClientContractController(clientContractUsecase);
