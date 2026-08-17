export async function isInCache(url) {
  // Deliberately do not inspect or use Cache Storage for signed private media.
  return Boolean(url) && false;
}
