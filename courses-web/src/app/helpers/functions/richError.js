// Pure helper that turns a backend error envelope into a UI-ready description: the
// resolved denial reason plus any explained-redirect metadata the backend sent
// (redirectTo / redirectText / dontRedirect). Kept pure and side-effect free so it can be
// unit-tested under vitest-node and reused by both handleSubmit and getData without
// depending on a router — actual navigation is wired by a later RouteGuard task.
//
// Relative import (not the "@/..." alias) so this module — and the resolveMessage chain it
// pulls in — loads cleanly under vitest's node environment without alias resolution.
import { resolveMessage } from "../messages/resolveMessage";

/**
 * @param {object} [body] parsed backend error envelope (message CODE + optional
 *   redirectTo/redirectText/dontRedirect carried by the Phase 1 error contract).
 * @returns {{ message: string, redirectTo: string|null, redirectText: string|null, dontRedirect: boolean }}
 */
export function describeApiError(body = {}) {
  const details = Array.isArray(body.details)
    ? body.details
        .map((detail) => {
          if (!detail || typeof detail !== "object") return null;
          const path = detail.path ? `${detail.path}: ` : "";
          return detail.message ? `${path}${detail.message}` : null;
        })
        .filter(Boolean)
    : [];
  const baseMessage = resolveMessage(body.message);
  return {
    message: details.length ? `${baseMessage}. ${details.join("; ")}` : baseMessage,
    redirectTo: body.redirectTo ?? null,
    redirectText: body.redirectText ? resolveMessage(body.redirectText) : null,
    dontRedirect: Boolean(body.dontRedirect),
  };
}
