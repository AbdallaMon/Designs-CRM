import { fetchImageBuffer } from "../../../../infra/pdf/pdf-helpers.js";
import { FIXED_TEXT } from "../witten-blocks-data.js";

export async function renderDrawingsSection(
  ctx,
  { lng, contract, defaultDrawingUrl, fonts, colors },
) {
  const drawings = contract?.drawings || [];
  // URLs are resolved to absolute in fetchImageBuffer (toAbsoluteAssetUrl):
  // relative "/uploads/…" paths get the CRM domain prepended, full URLs pass through.
  const toRender = drawings.length
    ? drawings.map((d) => d.url)
    : defaultDrawingUrl
      ? [defaultDrawingUrl]
      : [];
  if (!toRender.length) {
    return;
  }
  const maxW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
  const maxH = 150;

  // Usable page height for forcing a new page
  const usableHeight = ctx.pageHeight - ctx.margin.top - ctx.margin.bottom;

  // Helper: scale embedded image to fit maxW/maxH
  const getScaledSize = (img) => {
    let { width: sw, height: sh } = img.size();
    const r = Math.min(maxW / sw, maxH / sh, 1);
    return { W: sw * r, H: sh * r };
  };

  // Spacing constants (match your drawing flow)
  const TITLE_RESERVE = 40; // matches ctx.writeTitle need (fs 14 + 26)
  const IMG_BLOCK_NEED = (h) => h + 16; // block need when placing an image (fit + margins)
  const IMG_AFTER_Y = (h) => h + 16; // y decrement after drawing

  // ===== Prefetch FIRST image so we can measure before deciding page break =====
  let firstImg = null;
  let firstUrl = null;
  let firstSize = null;

  if (toRender.length) {
    firstUrl = toRender[0];
    try {
      const bytes = await fetchImageBuffer(firstUrl);
      try {
        firstImg = await ctx.pdfDoc.embedPng(bytes);
      } catch {
        firstImg = await ctx.pdfDoc.embedJpg(bytes);
      }
      if (firstImg) firstSize = getScaledSize(firstImg);
    } catch {
      // ignore; we'll show URL fallback after title if needed
    }
  }

  // If we have a measurable first image, ensure we have room for: title + that image
  if (firstImg && firstSize) {
    const firstBlockNeed = TITLE_RESERVE + IMG_BLOCK_NEED(firstSize.H);
    const remaining = ctx.y - ctx.margin.bottom;

    if (remaining < firstBlockNeed) {
      // force a new page so title + first image stay together
      await ctx.need(usableHeight);
    }
  }

  // Title (always render the section title like your current behavior)
  await ctx.writeTitle(FIXED_TEXT.titles.drawings[lng]);

  // Draw FIRST image (or fallback to URL text if embedding failed)
  let startIndex = 0;
  if (firstUrl) {
    startIndex = 1;
    if (firstImg && firstSize) {
      const { W, H } = firstSize;

      // ensure the actual image block fits on the current page
      if (ctx.y - ctx.margin.bottom < IMG_BLOCK_NEED(H)) {
        await ctx.need(usableHeight);
      }
      await ctx.need(IMG_BLOCK_NEED(H));

      const centerX = ctx.margin.left + (maxW - W) / 2;
      ctx.page.drawImage(firstImg, {
        x: centerX,
        y: ctx.y - H,
        width: W,
        height: H,
      });
      ctx.y -= IMG_AFTER_Y(H);
    } else {
      // Fallback: show the URL if we couldn't embed the first image
      await ctx.writeLineAuto(firstUrl, 10, false, colors.red);
    }
  }

  // ===== Render the rest, checking each image’s own height exactly =====
  for (let idx = startIndex; idx < toRender.length; idx++) {
    const rawUrl = toRender[idx];
    try {
      const bytes = await fetchImageBuffer(rawUrl);
      let img;
      try {
        img = await ctx.pdfDoc.embedPng(bytes);
      } catch {
        img = await ctx.pdfDoc.embedJpg(bytes);
      }
      if (!img) continue;

      const { W, H } = getScaledSize(img);

      // If not enough space for THIS image block, start a new page
      if (ctx.y - ctx.margin.bottom < IMG_BLOCK_NEED(H)) {
        await ctx.need(usableHeight);
      }
      await ctx.need(IMG_BLOCK_NEED(H));

      const centerX = ctx.margin.left + (maxW - W) / 2;
      ctx.page.drawImage(img, {
        x: centerX,
        y: ctx.y - H,
        width: W,
        height: H,
      });

      ctx.y -= IMG_AFTER_Y(H);
    } catch {
      await ctx.writeLineAuto(rawUrl, 10, false, colors.red);
    }
  }
}

// async function renderDrawingsSection(
//   ctx,
//   { lng, contract, defaultDrawingUrl, fonts, colors }
// ) {
//   const drawings = contract?.drawings || [];
//   const toRender = drawings.length
//     ? drawings.map((d) => d.url)
//     : defaultDrawingUrl
//     ? [defaultDrawingUrl]
//     : [];

//   const maxW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
//   const maxH = 150;

//   // ---- half-page guard helpers ----
//   const usableHeight = ctx.pageHeight - ctx.margin.top - ctx.margin.bottom;
//   const minHeightNeeded = usableHeight * 0.3;

//   const ensureHalfPageRemaining = async () => {
//     const remaining = ctx.y - ctx.margin.bottom;
//     if (remaining < minHeightNeeded) {
//       await ctx.need(usableHeight);
//     }
//   };

//   // Ensure we have >= 50% page left before starting this block
//   await ensureHalfPageRemaining();
//   await ctx.writeTitle(FIXED_TEXT.titles.drawings[lng]);

//   for (const rawUrl of toRender) {
//     try {
//       const bytes = await fetchImageBuffer(rawUrl);
//       let img;
//       try {
//         img = await ctx.pdfDoc.embedPng(bytes);
//       } catch {
//         img = await ctx.pdfDoc.embedJpg(bytes);
//       }
//       if (!img) continue;

//       // Before drawing each image, ensure >= 50% of page is left
//       await ensureHalfPageRemaining();

//       let { width: sw, height: sh } = img.size();
//       let W = sw,
//         H = sh;
//       const r = Math.min(maxW / W, maxH / H, 1);
//       W *= r;
//       H *= r;

//       // Also make sure the actual image block fits (your original check)
//       await ctx.need(H + 28);

//       const centerX = ctx.margin.left + (maxW - W) / 2;

//       ctx.page.drawImage(img, {
//         x: centerX,
//         y: ctx.y - H,
//         width: W,
//         height: H,
//       });

//       ctx.y -= H + 16;
//     } catch {
//       await ctx.writeLineAuto(rawUrl, 10, false, colors.red);
//     }
//   }
// }
