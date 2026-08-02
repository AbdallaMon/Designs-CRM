// contracts/client usecase — the PUBLIC client e-sign surface (legacy
// routes/contract/client-contract.js, mounted at /client/contracts with NO auth gate).
// The per-session TOKEN (Contract.arToken) IS the authentication, exactly like the public
// calendar booking flow and /files/client/*. There is NO permission code and NO session
// here, by design.
//
// IDOR SAFETY: every action derives the session FROM the verified token — never from a
// client-supplied id. The legacy `/session/status` accepted EITHER a token OR an `id` to
// pick the session (a client could target an arbitrary session by raw id); v2 keys the
// status change to the token ONLY (changeContractSessionStatus({ token })), so the token a
// caller holds is the only session they can touch. generate-pdf operates ONLY on the
// session that `sessionData.arToken` resolves to.
//
// 🔒 PDF GENERATION IS LOGIC-FROZEN: `buildAndUploadContractPdf` is invoked EXACTLY as
// legacy did (SIGNING → build PDF → REGISTERED). We never touch the PDF logic, the fragile
// `__dirname`-relative font loading, the fonts, or the output bytes.
import { AppError } from "../../../shared/errors/AppError.js";
import { contractsMessagesCodes } from "@dms/shared";
// The not-yet-migrated, FROZEN client-contract + PDF services (wrapped, never modified).
import {
  getContractSessionByToken,
  getDefaultContractUtilityData,
  changeContractSessionStatus,
} from "./client-contract.repo.js";
import { buildAndUploadContractPdf } from "../services/generate-contract-pdf.js";

class ClientContractUsecase {
  // GET /session?token= — resolve the session from the token + the default utility data.
  // Legacy returned { data: session, contractUtility }; we preserve that nested shape.
  async getSession({ token }) {
    if (!token) throw new AppError({ code: contractsMessagesCodes.CONTRACT_SESSION_INVALID, statusCode: 400 });
    const session = await getContractSessionByToken({ token });
    if (!session) {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_SESSION_INVALID, statusCode: 404 });
    }
    const contractUtility = await getDefaultContractUtilityData();
    return { data: session, contractUtility };
  }

  // PUT /session/status — token-keyed status change ONLY (no client id override — the IDOR
  // close vs legacy, which accepted a raw `id`). The token selects the session.
  async changeStatus({ token, sessionStatus }) {
    if (!token) throw new AppError({ code: contractsMessagesCodes.CONTRACT_SESSION_INVALID, statusCode: 400 });
    const updated = await changeContractSessionStatus({ token, sessionStatus });
    if (!updated) {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_SESSION_INVALID, statusCode: 404 });
    }
    return updated;
  }

  // POST /generate-pdf — the e-sign finalize flow (token authoritative). Ported 1:1:
  //   SIGNING (+ signatureUrl) → 🔒 buildAndUploadContractPdf → REGISTERED (+ writtenAt).
  // The session is the one `sessionData.arToken` resolves to — nothing else.
  async generatePdf({ token, signatureUrl, lng }) {
    if (!token) throw new AppError({ code: contractsMessagesCodes.CONTRACT_SESSION_INVALID, statusCode: 400 });
    const session = await getContractSessionByToken({ token });
    if (!session) {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_SESSION_INVALID, statusCode: 404 });
    }
    try {
      await changeContractSessionStatus({
        token,
        sessionStatus: "SIGNING",
        extra: { signatureUrl },
      });
      // 🔒 frozen PDF builder — wrapped only.
      await buildAndUploadContractPdf({ token, signatureUrl, lng });
      await changeContractSessionStatus({
        token,
        sessionStatus: "REGISTERED",
        extra: { writtenAt: new Date() },
      });
      return {};
    } catch (err) {
      console.error("PDF generation error:", err);
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_PDF_GENERATION_FAILED, statusCode: 500 });
    }
  }
}

export const clientContractUsecase = new ClientContractUsecase();
export { ClientContractUsecase };
