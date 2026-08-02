// Public client image-selection flow. The signed, purpose-scoped session token is the
// authentication boundary for reads, writes, uploads, and PDF generation.
//
// IDOR SAFETY (the close vs legacy): every legacy save/status/pdf handler keyed the
// ClientImageSession by a CLIENT-SUPPLIED body id (`session.id` / `changeSessionStatus`'s
// raw `id` / `sessionData.id`). A client holding a token for session A could pass session
// B's id and act on B. v2 resolves the session FROM the token server-side and OVERRIDES the
// identity fields (`id`/`token`/`clientLeadId`) with the resolved values before invoking any
// legacy write — so the token a caller holds is the only session they can touch. Display
// fields (selectedColor/customColors/style/materials/selectedImages/note) stay from the body
// (they only affect PDF rendering, not which session is written), preserving observable
// behavior. The status-change keys by TOKEN only (the legacy `id` selector is dropped).
//
// 🔒 PDF GENERATION IS LOGIC-FROZEN + 🔒 UPLOAD-CHUNK FROZEN: `uploadPdfAndApproveSession`
// (→ frozen `generateImageSessionPdf`) is invoked directly EXACTLY as legacy did,
// preserving the INLINE SYNC pdf path. The legacy commented `pdfQueue.add(...)` enqueue stays
// commented/unused — we do NOT enable it. We never touch the PDF logic, the fragile
// `__dirname`-relative font loading, the fonts, the output bytes, or the chunk-upload flow.
import { AppError } from "../../../shared/errors/AppError.js";
import { imageSessionsMessagesCodes, UTILITY_MODEL_ALLOWLIST } from "@dms/shared";
// reads (reference data by language) — read-only, no scope
import { getPageInfo } from "../admin/page-info.repo.js";
import { getConsAndPros } from "../admin/pros-cons.repo.js";
// status change keys by { token, sessionStatus } — the session-repo variant
import { getSessionByToken, changeSessionStatus } from "../session/image-session.repo.js";
import {
  clientImageSessionRepository,
  getColorsByLng,
  getMaterialsByLng,
  getStyleByLng,
  getImagesByStyleAndSpaces,
  saveClientSelectedColor,
  saveClientSelectedMaterials,
  saveClientSelectedStyle,
  saveClientSelectedImages,
  deleteImage as deleteImageFn,
  submitSelectedPatterns,
  submitSelectedImages,
  getImageSesssionModel,
} from "./client-image-session.repo.js";
// 🔒 frozen PDF orchestrator — wrapped, never modified.
import { uploadPdfAndApproveSession } from "../services/session-approval.js";

class ClientImageSessionUsecase {
  // Resolve the authoritative session from the token. Throws TOKEN_INVALID on a missing/
  // unknown token so no write ever runs against a session the caller didn't prove they hold.
  async #resolveByToken(token) {
    if (!token) throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_TOKEN_INVALID, statusCode: 400 });
    const session = await getSessionByToken({ token });
    if (!session || session.clientLeadId == null) throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_NOT_FOUND, statusCode: 404 });
    return session;
  }

  // ── public reference-data reads (no scope) ────────────────────────────────────────────
  getPageInfo({ lng, type }) {
    return getPageInfo({ notArchived: true, lng: lng || "ar", type });
  }
  getProsAndCons({ id, type, lng, isClient }) {
    return getConsAndPros({ id, type, lng, isClient });
  }
  getColors({ lng }) {
    return getColorsByLng({ lng });
  }
  getMaterials({ lng }) {
    return getMaterialsByLng({ lng });
  }
  getStyles({ lng }) {
    return getStyleByLng({ lng });
  }
  getImages({ spaceIds, styleId }) {
    return getImagesByStyleAndSpaces({ spaceIds, styleId });
  }

  // GET /session?token= — resolve the session from the token (the auth).
  getSession({ token }) {
    return this.#resolveByToken(token);
  }

  // PUT /session/status — token-keyed status change ONLY (the IDOR close vs legacy, which
  // accepted a raw body `id`). The token selects the session; the legacy `id` path is dropped.
  async changeStatus({ token, sessionStatus }) {
    if (!token) throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_TOKEN_INVALID, statusCode: 400 });
    return changeSessionStatus({ token, sessionStatus });
  }

  // ── token-authoritative saves: resolve session by token, OVERRIDE identity, then save ───
  async saveColor({ session, selectedColor, customColors, status }) {
    const resolved = await this.#resolveByToken(session?.token);
    const safeSession = { ...session, id: resolved.id, token: resolved.token, clientLeadId: resolved.clientLeadId };
    return saveClientSelectedColor({ session: safeSession, selectedColor, customColors, status });
  }
  async saveMaterials({ session, selectedMaterials, status }) {
    const resolved = await this.#resolveByToken(session?.token);
    const safeSession = { ...session, id: resolved.id, token: resolved.token, clientLeadId: resolved.clientLeadId };
    return saveClientSelectedMaterials({ session: safeSession, selectedMaterials, status });
  }
  async saveStyle({ session, selectedStyle, status }) {
    const resolved = await this.#resolveByToken(session?.token);
    const safeSession = { ...session, id: resolved.id, token: resolved.token, clientLeadId: resolved.clientLeadId };
    return saveClientSelectedStyle({ session: safeSession, selectedStyle, status });
  }
  async saveImages({ session, selectedImages, status }) {
    const resolved = await this.#resolveByToken(session?.token);
    const safeSession = { ...session, id: resolved.id, token: resolved.token, clientLeadId: resolved.clientLeadId };
    return saveClientSelectedImages({ session: safeSession, selectedImages, status });
  }

  // DELETE /images/:imageId — delete a client-selected image. IDOR CLOSE: legacy keyed by
  // the raw imageId alone with NO session scoping — any caller could enumerate ids and wipe
  // every client's selected images (and notes). v2 applies the SAME invariant as the other
  // public writes: the TOKEN is the authentication, the session is resolved FROM the token,
  // and the target image must BELONG to that session before the frozen delete runs. A
  // cross-session (or non-existent) image is reported as NOT_FOUND — never leaking whether
  // the image exists in another session.
  async deleteImage({ token, imageId }) {
    const resolved = await this.#resolveByToken(token);
    const owner = await clientImageSessionRepository.findSelectedImageOwnerSessionId({ imageId: Number(imageId) });
    if (!owner || owner.imageSessionId !== resolved.id) {
      throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_NOT_FOUND, statusCode: 404 });
    }
    // 🔒 frozen deleteImage — invoked UNCHANGED, now gated by the token-scope check above.
    return deleteImageFn({ imageId: Number(imageId) });
  }

  // POST /generate-pdf — the e-sign finalize flow (🔒 inline SYNC pdf path preserved). Ported
  // 1:1: changeSessionStatus(token, sessionStatus, {signatureUrl}) → 🔒 uploadPdfAndApproveSession.
  // IDOR close: the session identity passed to the frozen orchestrator is taken from the
  // TOKEN-resolved record, not the client body. The commented `pdfQueue.add(...)` enqueue
  // stays unused. signatureUrl is SSRF-locked in the validation layer.
  async generatePdf({ sessionData, signatureUrl, sessionStatus, lng }) {
    const token = sessionData?.token;
    const resolved = await this.#resolveByToken(token);
    const safeSessionData = {
      ...sessionData,
      id: resolved.id,
      token: resolved.token,
      clientLeadId: resolved.clientLeadId,
    };
    try {
      await changeSessionStatus({ token, sessionStatus, extra: { signatureUrl } });
      // 🔒 frozen PDF orchestrator → frozen generateImageSessionPdf — wrapped only.
      await uploadPdfAndApproveSession({ sessionData: safeSessionData, signatureUrl, lng });
      return {};
    } catch (err) {
      console.error("PDF generation error:", err);
      throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_PDF_GENERATION_FAILED, statusCode: 500 });
    }
  }

  // ── EXTRAS router (legacy `routes/client/image-session.js`, same base) ───────────────────
  // GET /data?model= — generic-model read. Legacy did an OPEN prisma[model].findMany() with
  // no allow-list (mass-read). v2 rejects any model not in UTILITY_MODEL_ALLOWLIST; the
  // returned shape (full findMany) is preserved 1:1 for the legit reference models.
  async getModelData({ model }) {
    if (!model || !UTILITY_MODEL_ALLOWLIST.includes(model)) {
      throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_MODEL_NOT_ALLOWED, statusCode: 400 });
    }
    return getImageSesssionModel({ model });
  }
  // POST /save-patterns — already token-keyed in the legacy service (token authoritative).
  savePatterns({ token, patternIds }) {
    if (!token) throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_TOKEN_INVALID, statusCode: 400 });
    return submitSelectedPatterns({ token, patternIds });
  }
  // POST /save-images (EXTRAS) — already token-keyed in the legacy service (token authoritative).
  saveSelectionByToken({ token, imageIds }) {
    if (!token) throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_TOKEN_INVALID, statusCode: 400 });
    return submitSelectedImages({ token, imageIds });
  }
}

export const clientImageSessionUsecase = new ClientImageSessionUsecase();
export { ClientImageSessionUsecase };
