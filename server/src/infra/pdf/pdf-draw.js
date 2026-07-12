import { fetchImageBuffer } from "./pdf-helpers.js";

// Draw a full-page background image (SiteUtility.pdfFrame or a per-page background)
// stretched to the page bounds. Shared by both PDF subsystems (contract +
// image-session) — extracted verbatim from the contract PDF's helper; the
// image-session previously inlined an identical closure. Behaviour-preserving:
// image loads that fail are swallowed with a console.warn, exactly as before.
export async function drawFullBackgroundImage(page, pdfDoc, backgroundImageUrl) {
  if (!backgroundImageUrl) return;
  try {
    const bytes = await fetchImageBuffer(backgroundImageUrl);
    let img;
    try {
      img = await pdfDoc.embedPng(bytes);
    } catch {
      img = await pdfDoc.embedJpg(bytes);
    }
    if (!img) return;
    const pw = page.getWidth();
    const ph = page.getHeight();
    page.drawImage(img, { x: 0, y: 0, width: pw, height: ph });
  } catch (e) {
    console.warn("Background image error:", e.message);
  }
}
