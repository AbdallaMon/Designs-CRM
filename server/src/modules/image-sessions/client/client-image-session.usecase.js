// Public client image-selection flow. The signed, purpose-scoped session token is the
// authentication boundary for reads, writes, uploads, and PDF generation.
//
// IDOR SAFETY (the close vs legacy): every legacy save/status/pdf handler keyed the
// ClientImageSession by a CLIENT-SUPPLIED body id (`session.id` / `changeSessionStatus`'s
// raw `id` / `sessionData.id`). A client holding a token for session A could pass session
// B's id and act on B. v2 resolves the session FROM the token server-side and OVERRIDES the
// identity fields (`id`/`token`/`clientLeadId`) with the resolved values before invoking any
// write — so the token a caller holds is the only session they can touch. Selection writes
// accept only server-validated choice IDs, and PDF rendering receives the current DB session
// overlaid on the compatible client payload. Status changes key by TOKEN only.
//
// 🔒 PDF GENERATION IS LOGIC-FROZEN + 🔒 UPLOAD-CHUNK FROZEN: `uploadPdfAndApproveSession`
// (→ frozen `generateImageSessionPdf`) is invoked directly EXACTLY as legacy did,
// preserving the INLINE SYNC pdf path. The legacy commented `pdfQueue.add(...)` enqueue stays
// commented/unused — we do NOT enable it. We never touch the PDF logic, the fragile
// `__dirname`-relative font loading, the fonts, the output bytes, or the chunk-upload flow.
import { AppError } from "../../../shared/errors/AppError.js";
import {
  IMAGE_SESSION_STATUSES, authMessagesCodes,
  imageSessionsMessagesCodes,
  messagesNames,
  PERMISSIONS,
  UTILITY_MODEL_ALLOWLIST,
} from "@dms/shared";
// reads (reference data by language) — read-only, no scope
import { getPageInfo } from "../admin/page-info.repo.js";
import { getConsAndPros } from "../admin/pros-cons.repo.js";
// status change keys by { token, sessionStatus } — the session-repo variant
import {
  getSessionByToken,
  advanceClientSessionStatus,
  claimPdfGeneration,
  releasePdfGenerationClaim,
} from "../session/image-session.repo.js";
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

const STATUS_ORDER = [
  IMAGE_SESSION_STATUSES.INITIAL,
  IMAGE_SESSION_STATUSES.PREVIEW_COLOR_PATTERN,
  IMAGE_SESSION_STATUSES.SELECTED_COLOR_PATTERN,
  IMAGE_SESSION_STATUSES.PREVIEW_MATERIAL,
  IMAGE_SESSION_STATUSES.SELECTED_MATERIAL,
  IMAGE_SESSION_STATUSES.PREVIEW_STYLE,
  IMAGE_SESSION_STATUSES.SELECTED_STYLE,
  IMAGE_SESSION_STATUSES.PREVIEW_IMAGES,
  IMAGE_SESSION_STATUSES.SELECTED_IMAGES,
  IMAGE_SESSION_STATUSES.PDF_GENERATED,
  IMAGE_SESSION_STATUSES.SUBMITTED,
];
const CLIENT_NAVIGATION = {
  INITIAL: IMAGE_SESSION_STATUSES.PREVIEW_COLOR_PATTERN,
  SELECTED_COLOR_PATTERN: IMAGE_SESSION_STATUSES.PREVIEW_MATERIAL,
  SELECTED_MATERIAL: IMAGE_SESSION_STATUSES.PREVIEW_STYLE,
  SELECTED_STYLE: IMAGE_SESSION_STATUSES.PREVIEW_IMAGES,
  PREVIEW_IMAGES: IMAGE_SESSION_STATUSES.SELECTED_IMAGES,
};
const PDF_CLAIM_TIMEOUT_MS = 5 * 60 * 1000;

class ClientImageSessionUsecase {
  // Resolve the authoritative session from the token. Throws TOKEN_INVALID on a missing/
  // unknown token so no write ever runs against a session the caller didn't prove they hold.
  async #resolveByToken(token) {
    if (!token) throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_TOKEN_INVALID, statusCode: 400 });
    const session = await getSessionByToken({ token });
    if (!session || session.clientLeadId == null) throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_NOT_FOUND, statusCode: 404 });
    return session;
  }

  #selectionStatus(sessionStatus, previewStatus, selectedStatus) {
    if ([IMAGE_SESSION_STATUSES.PDF_GENERATED, IMAGE_SESSION_STATUSES.SUBMITTED].includes(sessionStatus)) {
      throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_SUBMITTED_LOCKED, statusCode: 409 });
    }
    const currentIndex = STATUS_ORDER.indexOf(sessionStatus);
    const previewIndex = STATUS_ORDER.indexOf(previewStatus);
    if (currentIndex < previewIndex) {
      throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_SUBMITTED_LOCKED, statusCode: 409 });
    }
    return currentIndex > STATUS_ORDER.indexOf(selectedStatus) ? sessionStatus : selectedStatus;
  }

  async authorizeReferenceRead({ token, auth }) {
    if (token) {
      const session = await this.#resolveByToken(token);
      return { sessionId: session.id, clientLeadId: session.clientLeadId };
    }
    if (auth?.permissions?.includes(PERMISSIONS.IMAGE_SESSION.ADMIN_VIEW)) {
      return { userId: auth.id, admin: true };
    }
    throw new AppError({
      code: authMessagesCodes.UNAUTHORIZED,
      statusCode: 401,
      translationKey: messagesNames.authMessages,
    });
  }

  #assertAllChoicesExist(requestedIds, rows) {
    const uniqueIds = [...new Set(requestedIds.map(Number))];
    if (rows.length !== uniqueIds.length) {
      throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_NOT_FOUND, statusCode: 404 });
    }
    return uniqueIds;
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
    const session = await this.#resolveByToken(token);
    if (CLIENT_NAVIGATION[session.sessionStatus] !== sessionStatus) {
      throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_SUBMITTED_LOCKED, statusCode: 409 });
    }
    const changed = await advanceClientSessionStatus({
      token,
      fromStatus: session.sessionStatus,
      toStatus: sessionStatus,
    });
    if (!changed) {
      throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_SUBMITTED_LOCKED, statusCode: 409 });
    }
    return changed;
  }

  // ── token-authoritative saves: resolve session by token, OVERRIDE identity, then save ───
  async saveColor({ session, selectedColor, customColors, status }) {
    const resolved = await this.#resolveByToken(session?.token);
    const choice = await clientImageSessionRepository.findColorChoice({ colorId: selectedColor.id });
    if (!choice) throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_NOT_FOUND, statusCode: 404 });
    const nextStatus = this.#selectionStatus(
      resolved.sessionStatus,
      IMAGE_SESSION_STATUSES.PREVIEW_COLOR_PATTERN,
      IMAGE_SESSION_STATUSES.SELECTED_COLOR_PATTERN,
    );
    const safeSession = { ...session, id: resolved.id, token: resolved.token, clientLeadId: resolved.clientLeadId };
    return saveClientSelectedColor({ session: safeSession, selectedColor, customColors, status: nextStatus });
  }
  async saveMaterials({ session, selectedMaterials, status }) {
    const resolved = await this.#resolveByToken(session?.token);
    const requestedIds = [...new Set(selectedMaterials.map((material) => Number(material.id)))];
    const choices = await clientImageSessionRepository.findMaterialChoices({ materialIds: requestedIds });
    this.#assertAllChoicesExist(requestedIds, choices);
    const nextStatus = this.#selectionStatus(resolved.sessionStatus, IMAGE_SESSION_STATUSES.PREVIEW_MATERIAL, IMAGE_SESSION_STATUSES.SELECTED_MATERIAL);
    const safeSession = { ...session, id: resolved.id, token: resolved.token, clientLeadId: resolved.clientLeadId };
    return saveClientSelectedMaterials({
      session: safeSession,
      selectedMaterials: requestedIds.map((id) => ({ id })),
      status: nextStatus,
    });
  }
  async saveStyle({ session, selectedStyle, status }) {
    const resolved = await this.#resolveByToken(session?.token);
    const choice = await clientImageSessionRepository.findStyleChoice({ styleId: selectedStyle.id });
    if (!choice) throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_NOT_FOUND, statusCode: 404 });
    const nextStatus = this.#selectionStatus(resolved.sessionStatus, IMAGE_SESSION_STATUSES.PREVIEW_STYLE, IMAGE_SESSION_STATUSES.SELECTED_STYLE);
    const safeSession = { ...session, id: resolved.id, token: resolved.token, clientLeadId: resolved.clientLeadId };
    return saveClientSelectedStyle({ session: safeSession, selectedStyle, status: nextStatus });
  }
  async saveImages({ session, selectedImages, status }) {
    const resolved = await this.#resolveByToken(session?.token);
    const requestedIds = [...new Set(selectedImages.map((image) => Number(image.id)))];
    const spaceIds = resolved.selectedSpaces.map(({ space }) => Number(space.id));
    const choices = await clientImageSessionRepository.findDesignImageChoices({
      imageIds: requestedIds,
      styleId: resolved.styleId,
      spaceIds,
    });
    this.#assertAllChoicesExist(requestedIds, choices);
    const nextStatus = this.#selectionStatus(resolved.sessionStatus, IMAGE_SESSION_STATUSES.SELECTED_STYLE, IMAGE_SESSION_STATUSES.PREVIEW_IMAGES);
    const safeSession = { ...session, id: resolved.id, token: resolved.token, clientLeadId: resolved.clientLeadId };
    return saveClientSelectedImages({
      session: safeSession,
      selectedImages: requestedIds.map((id) => ({ id })),
      status: nextStatus,
    });
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

  // POST /generate-pdf — preserve the frozen inline renderer while wrapping it in an
  // idempotent claim. A stale claim is recoverable, a failed render releases the claim, and a
  // downstream side-effect failure after SUBMITTED still reports the committed success.
  async generatePdf({ sessionData, signatureUrl, sessionStatus, lng }) {
    const token = sessionData?.token;
    const resolved = await this.#resolveByToken(token);
    if (resolved.sessionStatus === IMAGE_SESSION_STATUSES.SUBMITTED && resolved.pdfUrl) return {};
    if (![IMAGE_SESSION_STATUSES.SELECTED_IMAGES, IMAGE_SESSION_STATUSES.PDF_GENERATED].includes(resolved.sessionStatus)) {
      throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_SUBMITTED_LOCKED, statusCode: 409 });
    }

    const claimed = await claimPdfGeneration({
      token,
      signatureUrl,
      staleBefore: new Date(Date.now() - PDF_CLAIM_TIMEOUT_MS),
    });
    if (!claimed) {
      const latest = await getSessionByToken({ token });
      if (latest?.sessionStatus === IMAGE_SESSION_STATUSES.SUBMITTED && latest.pdfUrl) return {};
      throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_SUBMITTED_LOCKED, statusCode: 409 });
    }

    const safeSessionData = { ...sessionData, ...claimed, id: claimed.id, token, clientLeadId: claimed.clientLeadId };
    try {
      // 🔒 frozen PDF orchestrator → frozen generateImageSessionPdf — wrapped only.
      await uploadPdfAndApproveSession({ sessionData: safeSessionData, signatureUrl, lng });
      return {};
    } catch (err) {
      const latest = await getSessionByToken({ token });
      if (latest?.sessionStatus === IMAGE_SESSION_STATUSES.SUBMITTED && latest.pdfUrl) return {};
      await releasePdfGenerationClaim({ token, claimUpdatedAt: claimed.updatedAt });
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
