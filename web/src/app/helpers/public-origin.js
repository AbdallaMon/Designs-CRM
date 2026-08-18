function normalizeHttpOrigin(value) {
  try {
    const parsed = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.origin : "";
  } catch {
    return "";
  }
}

export function resolveWebOrigin({ webUrl, protocol, host } = {}) {
  const explicit = normalizeHttpOrigin(webUrl);
  if (explicit) return explicit;

  const composed = protocol && host
    ? normalizeHttpOrigin(`${protocol}://${host}`)
    : "";
  return composed || "http://localhost:3001";
}

export const WEB_ORIGIN = resolveWebOrigin({
  webUrl: process.env.NEXT_PUBLIC_WEB_URL,
  protocol: process.env.NEXT_PUBLIC_PROTOCOL,
  host: process.env.NEXT_PUBLIC_HOST,
});

export function webUrl(pathname) {
  return new URL(pathname, `${WEB_ORIGIN}/`).toString();
}
