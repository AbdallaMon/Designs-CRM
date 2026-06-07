// image-sessions/client usecase — the PUBLIC client image-selection flow. Combines BOTH
// legacy routers mounted at `/client/image-session`:
//   - `routes/image-session/client-image-session.js` (page-info, pros-and-cons, session,
//     session/status, colors/materials/styles/images reads+saves, image delete, generate-pdf)
//   - `routes/client/image-session.js` (the EXTRAS router: /data model read, /save-patterns,
//     /save-images) — a second router on the same base, using the `clientImageServices.js`
//     + `shared/index.js` services.
// There is NO permission code and NO session here, by design — the per-session TOKEN is the
// authentication, exactly like the public calendar booking flow and `/files/client/*`.
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
// (→ frozen `generateImageSessionPdf`) is invoked via a lazy adapter EXACTLY as legacy did,
// preserving the INLINE SYNC pdf path. The legacy commented `pdfQueue.add(...)` enqueue stays
// commented/unused — we do NOT enable it. We never touch the PDF logic, the fragile
// `__dirname`-relative font loading, the fonts, the output bytes, or the chunk-upload flow.
import { AppError } from "../../../shared/errors/AppError.js";
import { imageSessionsMessagesCodes as M, UTILITY_MODEL_ALLOWLIST } from "@dms/shared";
import { clientImageSessionRepository } from "./client-image-session.repository.js";

const SVC = "../../../../services/main/image-session/imageSessionSevices.js";
const CLIENT_SVC = "../../../../services/main/client/clientServices.js";
const EXTRAS_SVC = "../../../../services/main/image-session/clientImageServices.js";
const SHARED_SVC = "../../../../services/main/shared/index.js";

const load = (path, fn) => (a) => import(path).then((m) => m[fn](a));

const legacyDefaults = {
  // reads (reference data by language) — read-only, no scope
  getPageInfo: load(SVC, "getPageInfo"),
  getConsAndPros: load(SVC, "getConsAndPros"),
  getSessionByToken: load(SVC, "getSessionByToken"),
  getColorsByLng: load(SVC, "getColorsByLng"),
  getMaterialsByLng: load(SVC, "getMaterialsByLng"),
  getStyleByLng: load(SVC, "getStyleByLng"),
  getImagesByStyleAndSpaces: load(SVC, "getImagesByStyleAndSpaces"),
  // token-keyed writes
  changeSessionStatus: load(SVC, "changeSessionStatus"),
  saveClientSelectedColor: load(SVC, "saveClientSelectedColor"),
  saveClientSelectedMaterials: load(SVC, "saveClientSelectedMaterials"),
  saveClientSelectedStyle: load(SVC, "saveClientSelectedStyle"),
  saveClientSelectedImages: load(SVC, "saveClientSelectedImages"),
  deleteImage: load(SVC, "deleteImage"),
  // 🔒 frozen PDF orchestrator — wrapped, never modified.
  uploadPdfAndApproveSession: load(CLIENT_SVC, "uploadPdfAndApproveSession"),
  // EXTRAS router services (already token-keyed)
  submitSelectedPatterns: load(EXTRAS_SVC, "submitSelectedPatterns"),
  submitSelectedImages: load(EXTRAS_SVC, "submitSelectedImages"),
  // EXTRAS generic-model read (hardened with the allow-list)
  getImageSesssionModel: load(SHARED_SVC, "getImageSesssionModel"),
  getImages: load(SHARED_SVC, "getImages"),
};

export class ClientImageSessionUsecase {
  constructor(legacy = {}, repo = clientImageSessionRepository) {
    this.legacy = { ...legacyDefaults, ...legacy };
    this.repo = repo;
  }

  // Resolve the authoritative session from the token. Throws TOKEN_INVALID on a missing/
  // unknown token so no write ever runs against a session the caller didn't prove they hold.
  async #resolveByToken(token) {
    if (!token) throw new AppError(M.IMAGE_SESSION_TOKEN_INVALID, 400);
    const session = await this.legacy.getSessionByToken({ token });
    if (!session || session.clientLeadId == null) throw new AppError(M.IMAGE_SESSION_NOT_FOUND, 404);
    return session;
  }

  // ── public reference-data reads (no scope) ────────────────────────────────────────────
  getPageInfo({ lng, type }) {
    return this.legacy.getPageInfo({ notArchived: true, lng: lng || "ar", type });
  }
  getProsAndCons({ id, type, lng, isClient }) {
    return this.legacy.getConsAndPros({ id, type, lng, isClient });
  }
  getColors({ lng }) {
    return this.legacy.getColorsByLng({ lng });
  }
  getMaterials({ lng }) {
    return this.legacy.getMaterialsByLng({ lng });
  }
  getStyles({ lng }) {
    return this.legacy.getStyleByLng({ lng });
  }
  getImages({ spaceIds, styleId }) {
    return this.legacy.getImagesByStyleAndSpaces({ spaceIds, styleId });
  }

  // GET /session?token= — resolve the session from the token (the auth).
  getSession({ token }) {
    return this.#resolveByToken(token);
  }

  // PUT /session/status — token-keyed status change ONLY (the IDOR close vs legacy, which
  // accepted a raw body `id`). The token selects the session; the legacy `id` path is dropped.
  async changeStatus({ token, sessionStatus }) {
    if (!token) throw new AppError(M.IMAGE_SESSION_TOKEN_INVALID, 400);
    return this.legacy.changeSessionStatus({ token, sessionStatus });
  }

  // ── token-authoritative saves: resolve session by token, OVERRIDE identity, then save ───
  async saveColor({ session, selectedColor, customColors, status }) {
    const resolved = await this.#resolveByToken(session?.token);
    const safeSession = { ...session, id: resolved.id, token: resolved.token, clientLeadId: resolved.clientLeadId };
    return this.legacy.saveClientSelectedColor({ session: safeSession, selectedColor, customColors, status });
  }
  async saveMaterials({ session, selectedMaterials, status }) {
    const resolved = await this.#resolveByToken(session?.token);
    const safeSession = { ...session, id: resolved.id, token: resolved.token, clientLeadId: resolved.clientLeadId };
    return this.legacy.saveClientSelectedMaterials({ session: safeSession, selectedMaterials, status });
  }
  async saveStyle({ session, selectedStyle, status }) {
    const resolved = await this.#resolveByToken(session?.token);
    const safeSession = { ...session, id: resolved.id, token: resolved.token, clientLeadId: resolved.clientLeadId };
    return this.legacy.saveClientSelectedStyle({ session: safeSession, selectedStyle, status });
  }
  async saveImages({ session, selectedImages, status }) {
    const resolved = await this.#resolveByToken(session?.token);
    const safeSession = { ...session, id: resolved.id, token: resolved.token, clientLeadId: resolved.clientLeadId };
    return this.legacy.saveClientSelectedImages({ session: safeSession, selectedImages, status });
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
    const owner = await this.repo.findSelectedImageOwnerSessionId({ imageId: Number(imageId) });
    if (!owner || owner.imageSessionId !== resolved.id) {
      throw new AppError(M.IMAGE_SESSION_NOT_FOUND, 404);
    }
    // 🔒 frozen deleteImage — invoked UNCHANGED, now gated by the token-scope check above.
    return this.legacy.deleteImage({ imageId: Number(imageId) });
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
      await this.legacy.changeSessionStatus({ token, sessionStatus, extra: { signatureUrl } });
      // 🔒 frozen PDF orchestrator → frozen generateImageSessionPdf — wrapped only.
      await this.legacy.uploadPdfAndApproveSession({ sessionData: safeSessionData, signatureUrl, lng });
      return {};
    } catch (err) {
      console.error("PDF generation error:", err);
      throw new AppError(M.IMAGE_SESSION_PDF_GENERATION_FAILED, 500);
    }
  }

  // ── EXTRAS router (legacy `routes/client/image-session.js`, same base) ───────────────────
  // GET /data?model= — generic-model read. Legacy did an OPEN prisma[model].findMany() with
  // no allow-list (mass-read). v2 rejects any model not in UTILITY_MODEL_ALLOWLIST; the
  // returned shape (full findMany) is preserved 1:1 for the legit reference models.
  async modelData({ model }) {
    if (!model || !UTILITY_MODEL_ALLOWLIST.includes(model)) {
      throw new AppError(M.IMAGE_SESSION_MODEL_NOT_ALLOWED, 400);
    }
    return this.legacy.getImageSesssionModel({ model });
  }
  // POST /save-patterns — already token-keyed in the legacy service (token authoritative).
  savePatterns({ token, patternIds }) {
    if (!token) throw new AppError(M.IMAGE_SESSION_TOKEN_INVALID, 400);
    return this.legacy.submitSelectedPatterns({ token, patternIds });
  }
  // POST /save-images (EXTRAS) — already token-keyed in the legacy service (token authoritative).
  saveSelectionByToken({ token, imageIds }) {
    if (!token) throw new AppError(M.IMAGE_SESSION_TOKEN_INVALID, 400);
    return this.legacy.submitSelectedImages({ token, imageIds });
  }
}

export const clientImageSessionUsecase = new ClientImageSessionUsecase();
