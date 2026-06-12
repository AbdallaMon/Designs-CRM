// Breadcrumb derivation for the TopBar: group ‹ page ‹ record, from usePathname(). Matches the
// active nav item by an exact-or-segment path comparison (NOT `.includes`) so /v2/leads and
// /v2/leads/123 both resolve to the leads item, and a trailing id becomes a "record" crumb.
// Single-language Arabic / RTL.

import { NAV_ITEMS } from "./nav.config";
import { resolveNavGroup, resolveNavItem } from "./navLabels";

/**
 * True when `pathname` equals the href's path (or is a sub-segment of it). When the href carries a
 * disambiguating `?segment=` (the two split leads links share /v2/leads), the active check also
 * requires the current `searchParams.segment` to match — so exactly ONE of the two is highlighted.
 * Items whose href has no query behave exactly as before (search is ignored).
 *
 * @param {string} pathname   current pathname (no query).
 * @param {string} href       nav item href (may include a `?segment=` query).
 * @param {URLSearchParams|null} [search]  current search params (for segment disambiguation).
 */
export function isPathActive(pathname, href, search = null) {
  if (!pathname || !href) return false;
  const [hrefPath, hrefQuery = ""] = href.split("?");
  const pathMatches = pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
  if (!pathMatches) return false;
  // No query on the href → pathname match is sufficient (legacy behavior).
  if (!hrefQuery) return true;
  // Disambiguate by `segment` when present (default: "new", matching LeadsPage).
  const hrefSegment = new URLSearchParams(hrefQuery).get("segment");
  if (!hrefSegment) return true;
  const currentSegment = search?.get?.("segment") ?? "new";
  return currentSegment === hrefSegment;
}

/** Find the nav item whose href best (longest path) matches the pathname (+ optional segment). */
export function matchNavItem(pathname, search = null) {
  let best = null;
  for (const it of NAV_ITEMS) {
    const itPath = it.href.split("?")[0];
    if (isPathActive(pathname, it.href, search) && (!best || itPath.length > best.href.split("?")[0].length)) {
      best = it;
    }
  }
  return best;
}

/**
 * Build breadcrumb crumbs [{ label, href? }] for the current path.
 * group (no link) ‹ page (link to item href) ‹ record (no link, when a deeper segment exists).
 * `lang` (default "ar") localizes the group/page labels via the bilingual nav resolvers.
 */
export function buildBreadcrumbs(pathname, lang = "ar", search = null) {
  const item = matchNavItem(pathname, search);
  if (!item) return [];

  const crumbs = [
    { label: resolveNavGroup(item.group, lang) },
    { label: resolveNavItem(item.labelKey, lang), href: item.href },
  ];

  // A record-level crumb when the path goes deeper than the item href (e.g. /v2/leads/123).
  // Slice against the href's PATH (query stripped) so the split-leads hrefs don't skew the offset.
  const itemPath = item.href.split("?")[0];
  const rest = pathname.slice(itemPath.length).replace(/^\/+/, "");
  if (rest) {
    const recordSeg = rest.split("/").filter(Boolean).pop();
    // Numeric ids render as "#id"; non-numeric trailing segments are shown verbatim.
    const label = /^\d+$/.test(recordSeg) ? `#${recordSeg}` : recordSeg;
    crumbs.push({ label });
  }
  return crumbs;
}
