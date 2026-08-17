function matchLink(link, pathname) {
  if (link.active) return pathname.includes(link.active);
  return pathname === link.href;
}

export function resolveCurrentPage(links, pathname) {
  let fallback = null;
  for (const link of links) {
    if (link.subLinks?.length) {
      const sub =
        link.subLinks.find((item) => pathname === item.href) ??
        link.subLinks.find((item) => matchLink(item, pathname));
      if (sub) return { section: link.name, page: sub.name };
      if (matchLink(link, pathname)) fallback = { section: null, page: link.name };
    } else if (matchLink(link, pathname)) {
      return { section: null, page: link.name };
    }
  }
  return fallback;
}
