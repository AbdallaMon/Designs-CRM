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
// 🔒 PDF GENERATION IS LOGIC-FROZEN: `buildAndUploadContractPdf` is invoked via a lazy
// adapter EXACTLY as legacy did (SIGNING → build PDF → REGISTERED). We never touch the PDF
// logic, the fragile `__dirname`-relative font loading, the fonts, or the output bytes.
import { AppError } from "../../../shared/errors/AppError.js";
import { contractsMessagesCodes as C } from "@dms/shared";

// Lazy adapters to the not-yet-migrated, FROZEN client-contract + PDF services.
const legacyDefaults = {
  getContractSessionByToken: (a) =>
    import("../../../../services/main/contract/clientContractServices.js").then((m) =>
      m.getContractSessionByToken(a),
    ),
  getDefaultContractUtilityData: (a) =>
    import("../../../../services/main/contract/clientContractServices.js").then((m) =>
      m.getDefaultContractUtilityData(a),
    ),
  changeContractSessionStatus: (a) =>
    import("../../../../services/main/contract/clientContractServices.js").then((m) =>
      m.changeContractSessionStatus(a),
    ),
  // 🔒 FROZEN — wrapped, never modified.
  buildAndUploadContractPdf: (a) =>
    import("../../../../services/main/contract/generateContractPdf.js").then((m) =>
      m.buildAndUploadContractPdf(a),
    ),
};

export class ClientContractUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // GET /session?token= — resolve the session from the token + the default utility data.
  // Legacy returned { data: session, contractUtility }; we preserve that nested shape.
  async getSession({ token }) {
    if (!token) throw new AppError(C.CONTRACT_SESSION_INVALID, 400);
    const session = await this.legacy.getContractSessionByToken({ token });
    const contractUtility = await this.legacy.getDefaultContractUtilityData();
    return { data: session, contractUtility };
  }

  // PUT /session/status — token-keyed status change ONLY (no client id override — the IDOR
  // close vs legacy, which accepted a raw `id`). The token selects the session.
  async changeStatus({ token, sessionStatus }) {
    if (!token) throw new AppError(C.CONTRACT_SESSION_INVALID, 400);
    return this.legacy.changeContractSessionStatus({ token, sessionStatus });
  }

  // POST /generate-pdf — the e-sign finalize flow (token authoritative). Ported 1:1:
  //   SIGNING (+ signatureUrl) → 🔒 buildAndUploadContractPdf → REGISTERED (+ writtenAt).
  // The session is the one `sessionData.arToken` resolves to — nothing else.
  async generatePdf({ token, signatureUrl, lng }) {
    if (!token) throw new AppError(C.CONTRACT_SESSION_INVALID, 400);
    try {
      await this.legacy.changeContractSessionStatus({
        token,
        sessionStatus: "SIGNING",
        extra: { signatureUrl },
      });
      // 🔒 frozen PDF builder — wrapped only.
      await this.legacy.buildAndUploadContractPdf({ token, signatureUrl, lng });
      await this.legacy.changeContractSessionStatus({
        token,
        sessionStatus: "REGISTERED",
        extra: { writtenAt: new Date() },
      });
      return {};
    } catch (err) {
      console.error("PDF generation error:", err);
      throw new AppError(C.CONTRACT_PDF_GENERATION_FAILED, 500);
    }
  }
}

export const clientContractUsecase = new ClientContractUsecase();
