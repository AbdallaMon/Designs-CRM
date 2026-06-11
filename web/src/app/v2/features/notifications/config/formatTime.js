// Arabic relative-time + absolute-date formatting for notification rows. Self-contained — the
// installed dayjs build has neither the `ar` locale nor the `relativeTime` plugin, so we render
// a small Arabic "منذ ..." string ourselves (no new dependency). `dayjs` is used only for the
// absolute fallback / tooltip date. Single-language Arabic / RTL.

import dayjs from "dayjs";

/** Absolute date for a notification (tooltip / fallback). */
export function formatAbsolute(value) {
  if (!value) return "—";
  const d = dayjs(value);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm") : "—";
}

/** Arabic relative time ("منذ ٣ ساعات"); falls back to the absolute date for old/invalid dates. */
export function formatRelative(value) {
  if (!value) return "—";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "—";

  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 0) return "الآن"; // future / clock skew → treat as just now
  if (diffSec < 45) return "الآن";

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return plural(diffMin, "دقيقة", "دقيقتين", "دقائق");

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return plural(diffHr, "ساعة", "ساعتين", "ساعات");

  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return plural(diffDay, "يوم", "يومين", "أيام");

  // A week or older → show the absolute date (relative loses meaning).
  return formatAbsolute(value);
}

// Arabic count grammar: 1 → singular, 2 → dual, 3-10 → plural, 11+ → singular ("منذ ١٥ يومًا").
function plural(n, one, two, few) {
  if (n === 1) return `منذ ${one}`;
  if (n === 2) return `منذ ${two}`;
  if (n >= 3 && n <= 10) return `منذ ${n} ${few}`;
  return `منذ ${n} ${one}`;
}
