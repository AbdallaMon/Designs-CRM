// Signed private media may use the browser's normal HTTP cache (`Cache-Control:
// private`) but is never persisted in Cache Storage or the service worker.
export async function isInPrivateMediaCache(url) {
  void url;
  return false;
}
