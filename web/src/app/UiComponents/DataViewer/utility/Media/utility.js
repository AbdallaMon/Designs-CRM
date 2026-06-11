export async function isInCache(url) {
  try {
    if (!url || !("caches" in window)) return false;

    const candidates = new Set();

    try {
      const u = new URL(url, window.location.origin);
      candidates.add(u.href);
      candidates.add(u.pathname + u.search);
      candidates.add(u.pathname);
    } catch {
      candidates.add(url);
      try {
        const abs = new URL(url, window.location.origin);
        candidates.add(abs.href);
        candidates.add(abs.pathname + abs.search);
        candidates.add(abs.pathname);
      } catch {}
    }

    for (const c of candidates) {
      const hit = await caches.match(c);
      if (hit) return true;
    }
    return false;
  } catch {
    return false;
  }
}
