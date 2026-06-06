/**
 * Normalizes an Origin header value:
 * - Strips duplicate comma-concatenated values (OpenLiteSpeed proxy bug)
 * - Removes trailing slash
 */
export function normalizeOrigin(origin) {
  if (!origin || typeof origin !== "string") return origin;
  const first = origin.split(",")[0].trim();
  return first.endsWith("/") ? first.slice(0, -1) : first;
}
