// contracts/client validation — the PUBLIC client e-sign surface. The TOKEN is the
// authentication; the session is derived FROM the token, never from a client-supplied id.
// Bodies are `.strict()` (mass-assignment hardening). NOTE: the legacy `/session/status`
// accepted EITHER a token OR an id to select the session; v2 accepts ONLY the token (the
// session is keyed by the verified arToken) — a client can no longer target an arbitrary
// session by passing a raw `id`. The generate-pdf flow takes the token from
// `sessionData.arToken` (legacy shape preserved) and is the ONLY field that selects the
// session.
import { z } from "zod";

// SSRF hardening for the PUBLIC generate-pdf surface. The frozen builder does
// `fetch(`${process.env.CRM_DOMAIN}${signatureUrl}`)` — raw string concat with no
// scheme/host lock. Legitimate signatures are ALWAYS relative upload paths produced by the
// chunk-upload handler: `/uploads/<uuid>.<ext>` (see server/services/main/utility/uploadAsChunk.js
// l.52-64 → returns `url: "/uploads/<uuid>.png"`; the FE submits that value verbatim as
// signatureUrl — ui/.../client/ContractSignature.jsx l.327/406). So we lock signatureUrl to a
// safe RELATIVE path under the upload domain: leading single `/`, no `..` traversal, no scheme,
// no leading `//`, no `@`, conservative charset, allowed image extension only.
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
    { message: "INVALID_SIGNATURE_URL" }
  );

// ContractSessionStatus enum — packages/db/prisma/schema.prisma l.351-355.
const SESSION_STATUS = z.enum(["INITIAL", "SIGNING", "REGISTERED"]);

export class ClientContractValidation {
  // GET /session?token=...
  static sessionQuery = z.object({ token: z.string().min(1) });

  // PUT /session/status — token-keyed only (no client-supplied id override).
  static changeStatus = z
    .object({
      token: z.string().min(1),
      sessionStatus: SESSION_STATUS,
    })
    .strict();

  // POST /generate-pdf — legacy body shape preserved: { sessionData:{ arToken }, signatureUrl, lng }.
  // The session is selected EXCLUSIVELY by sessionData.arToken (the token = authentication).
  // `sessionStatus` was read by legacy but never used (the flow forces SIGNING→REGISTERED);
  // it is not accepted, so it cannot influence the flow.
  static generatePdf = z
    .object({
      sessionData: z
        .object({ arToken: z.string().min(1) })
        .passthrough(), // sessionData may carry extra display fields; only arToken is consumed
      signatureUrl: SIGNATURE_URL,
      lng: z.union([z.string(), z.boolean()]).nullish(),
    })
    .strict();
}
