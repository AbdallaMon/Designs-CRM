// Breadcrumb derivation for the TopBar: group ‹ page ‹ record, from usePathname(). Matches the
// active nav item by an exact-or-segment path comparison (NOT `.includes`) so /v2/leads and
// /v2/leads/123 both resolve to the leads item, and a trailing id becomes a "record" crumb.
// Single-language Arabic / RTL.

import { NAV_ITEMS } from "./nav.config";
import { resolveNavGroup, resolveNavItem } from "./navLabels";

/** True when `pathname` equals `href` or is a sub-segment of it (href boundary respected). */
export function isPathActive(pathname, href) {
  if (!pathname || !href) return false;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

/** Find the nav item whose href best (longest) matches the pathname. */
export function matchNavItem(pathname) {
  let best = null;
  for (const it of NAV_ITEMS) {
    if (isPathActive(pathname, it.href) && (!best || it.href.length > best.href.length)) {
      best = it;
    }
  }
  return best;
}

/**
 * Build breadcrumb crumbs [{ label, href? }] for the current path.
 * group (no link) ‹ page (link to item href) ‹ record (no link, when a deeper segment exists).
 */
export function buildBreadcrumbs(pathname) {
  const item = matchNavItem(pathname);
  if (!item) return [];

  const crumbs = [
    { label: resolveNavGroup(item.group) },
    { label: resolveNavItem(item.labelKey), href: item.href },
  ];

  // A record-level crumb when the path goes deeper than the item href (e.g. /v2/leads/123).
  const rest = pathname.slice(item.href.length).replace(/^\/+/, "");
  if (rest) {
    const recordSeg = rest.split("/").filter(Boolean).pop();
    // Numeric ids render as "#id"; non-numeric trailing segments are shown verbatim.
    const label = /^\d+$/.test(recordSeg) ? `#${recordSeg}` : recordSeg;
    crumbs.push({ label });
  }
  return crumbs;
}
