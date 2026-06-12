// image-sessions/client validation — the PUBLIC client image-selection surface. The TOKEN
// is the authentication; the session is derived FROM the token, never from a client-supplied
// id (the v2 usecase OVERRIDES `session.id`/`clientLeadId` with the token-resolved values).
// Bodies that carry a session keep `.passthrough()` on the `session`/`sessionData` object
// (it carries many display fields the FROZEN PDF builder reads), but the top-level body is
// `.strict()` to block injected sibling fields. The status enum is constrained to the real
// SessionStatus values so a bad status is a clean 422 instead of a DB error.
import { z } from "zod";

// SSRF hardening for the PUBLIC generate-pdf surface. The frozen builder does
// `fetch(`${process.env.CRM_DOMAIN}${signatureUrl}`)` (clientServices.js l.91) — raw string
// concat with no scheme/host lock. Legitimate signatures are ALWAYS relative upload paths
// produced by the FROZEN chunk-upload handler (`/uploads/<uuid>.<ext>`), submitted verbatim
// by the FE (SignatureComponet.jsx). So we lock signatureUrl to a safe RELATIVE path under
// the upload domain — IDENTICAL to the contracts module's lock: leading single `/`, no `..`
// traversal, no scheme, no leading `//`, no `@`, conservative charset, image extension only.
const SIGNATURE_PATH = /^\/[A-Za-z0-9_\-./]+\.(png|jpe?g|webp)$/;
const SIGNATURE_URL = z
  .string()
  .min(1)
  .regex(SIGNATURE_PATH)
  .refine(
    (v) =>
      !v.includes("..") && // no path traversal
      !v.includes("://") && // no embedded scheme (http:// etc.)
      !v.startsWith("//") && // no protocol-relative / host hijack
      !v.includes("@"), // no userinfo@host trick
    { message: "INVALID_SIGNATURE_URL" },
  );

// SessionStatus enum — packages/db/prisma/schema.prisma l.1662-1674.
const SESSION_STATUS = z.enum([
  "INITIAL",
  "PREVIEW_COLOR_PATTERN",
  "SELECTED_COLOR_PATTERN",
  "PREVIEW_MATERIAL",
  "SELECTED_MATERIAL",
  "PREVIEW_STYLE",
  "SELECTED_STYLE",
  "PREVIEW_IMAGES",
  "SELECTED_IMAGES",
  "PDF_GENERATED",
  "SUBMITTED",
]);

// A session object that carries (at least) the token used to resolve the real session
// server-side. `.passthrough()` — the FE sends the full session (many display fields used by
// the frozen PDF builder); only `token` is authoritative and `id`/`clientLeadId` are
// overridden in the usecase from the token-resolved record.
const sessionWithToken = z.object({ token: z.string().min(1) }).passthrough();

const idParam = z.coerce.number().int().positive();

export class ClientImageSessionValidation {
  // ── reference-data reads (query) ─────────────────────────────────────────────────────
  static pageInfoQuery = z.object({ lng: z.string().optional(), type: z.string().optional() }).passthrough();
  static prosConsQuery = z
    .object({
      id: z.union([z.coerce.number().int(), z.string()]).optional(),
      type: z.string().optional(),
      lng: z.string().optional(),
      isClient: z.string().optional(),
    })
    .passthrough();
  static lngQuery = z.object({ lng: z.string().optional() }).passthrough();
  static imagesQuery = z
    .object({ spaceIds: z.string().optional(), styleId: z.union([z.coerce.number().int(), z.string()]).optional() })
    .passthrough();
  static sessionQuery = z.object({ token: z.string().min(1) }).passthrough();
  static modelDataQuery = z.object({ model: z.string().min(1) }).passthrough();

  // ── params ─────────────────────────────────────────────────────────────────────────────
  static imageIdParam = z.object({ imageId: idParam });

  // ── DELETE /images/:imageId — token-scoped body (the IDOR close). The token is the
  // authentication; the usecase resolves the session FROM the token and confirms the target
  // image BELONGS to that session before the frozen delete runs. Top-level `.strict()` so no
  // sibling field (e.g. an injected imageSessionId) can ride along.
  static deleteImage = z.object({ token: z.string().min(1) }).strict();

  // ── PUT /session/status — token-keyed only (no client-supplied id override) ────────────
  static changeStatus = z
    .object({
      token: z.string().min(1),
      sessionStatus: SESSION_STATUS,
    })
    .strict();

  // ── token-authoritative saves ──────────────────────────────────────────────────────────
  static saveColor = z
    .object({
      session: sessionWithToken,
      selectedColor: z.any(),
      customColors: z.array(z.any()).nullish(),
      status: SESSION_STATUS,
    })
    .strict();
  static saveMaterials = z
    .object({
      session: sessionWithToken,
      selectedMaterials: z.array(z.any()),
      status: SESSION_STATUS,
    })
    .strict();
  static saveStyle = z
    .object({
      session: sessionWithToken,
      selectedStyle: z.any(),
      status: SESSION_STATUS,
    })
    .strict();
  static saveImages = z
    .object({
      session: sessionWithToken,
      selectedImages: z.array(z.any()),
      status: SESSION_STATUS,
    })
    .strict();

  // ── POST /generate-pdf — sessionData.token is the session selector; signatureUrl SSRF-locked ──
  static generatePdf = z
    .object({
      sessionData: sessionWithToken,
      signatureUrl: SIGNATURE_URL,
      sessionStatus: SESSION_STATUS,
      lng: z.union([z.string(), z.boolean()]).nullish(),
    })
    .strict();

  // ── EXTRAS router (token-keyed) ──────────────────────────────────────────────────────────
  static savePatterns = z
    .object({
      token: z.string().min(1),
      patterns: z.array(z.coerce.number().int().positive()),
    })
    .strict();
  static saveSelection = z
    .object({
      token: z.string().min(1),
      imageIds: z.array(z.coerce.number().int().positive()),
    })
    .strict();
}
