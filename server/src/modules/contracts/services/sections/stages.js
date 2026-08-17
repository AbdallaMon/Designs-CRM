import { WORK_STAGE_STATUSES } from "@dms/shared";
import { widthOf, pickFontsForText, isRTL, ASCII_RE } from "../contract-pdf-context.js";
import { getRTLTextX, reText, splitTextIntoLines, isArabicText, formatNumber } from "../../../../infra/pdf/pdf-helpers.js";
import { FIXED_TEXT, STAGE_PROGRESS, CONTRACT_LEVELSENUM, STAGE_STATUS_LABEL } from "../witten-blocks-data.js";

export async function renderStagesCards(ctx, { lng, contract, fonts, colors }) {
  await ctx.writeTitle(FIXED_TEXT.titles.allStagesMatrix[lng]);

  const baseStages = CONTRACT_LEVELSENUM.map((s, i) => ({
    key: s.enum,
    order: i + 1,
    label:
      (lng === "ar" ? s.labelAr : s.labelEn) || s.label || `Stage ${i + 1}`,
  }));

  const stagesMap = new Map();
  (contract?.stages || []).forEach((st) => {
    const k = st.order || 0;
    stagesMap.set(k, st);
  });

  const contentW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;

  for (const s of baseStages) {
    const included = stagesMap.has(s.order);
    const data = stagesMap.get(s.order) || {};
    const statusKey = data?.stageStatus || WORK_STAGE_STATUSES.NOT_STARTED;
    const statusLabel = STAGE_STATUS_LABEL?.[lng]?.[statusKey] || statusKey;
    const deliveryDays = data?.deliveryDays;

    const pad = 12;
    const headerH = 22;
    const borderW = 0.8;
    const maxTextW = contentW - pad * 2;

    const titleLine = `${s.order}. ${s.label}`;
    const { bold: titleFont } = pickFontsForText(titleLine, fonts);

    const details = (STAGE_PROGRESS[s.order]?.[lng] || []).map((t) => `${t}`);
    if (data?.notes) details.push(String(data.notes));

    let detailsHeight = 0;
    for (const t of details) {
      const { font } = pickFontsForText(t, fonts);
      const lines = splitTextIntoLines(
        isRTL(t) ? reText(t) : t,
        maxTextW,
        font,
        11,
      );
      detailsHeight += lines.length * (11 + 2) + 4;
    }

    const infoLine =
      included && deliveryDays != null
        ? lng === "ar"
          ? `أيام التسليم: ${formatNumber(deliveryDays, "ar")} يوم`
          : `Delivery days: ${formatNumber(deliveryDays, lng)}`
        : lng === "ar"
          ? "غير محدد"
          : "Not specified";

    const bodyBlocks = detailsHeight + 14 + 8;
    const cardH = headerH + bodyBlocks + 4;

    await ctx.need(cardH + pad * 2 + borderW * 2);

    const x = ctx.margin.left;
    const yTop = ctx.y;
    const boxH = cardH + pad * 2;

    // Body
    ctx.page.drawRectangle({
      x,
      y: yTop - boxH,
      width: contentW,
      height: boxH,
      color: colors.accentBg,
      borderColor: colors.borderColor,
      borderWidth: borderW,
    });

    // Header bar
    const headerY = yTop - pad - headerH;
    ctx.page.drawRectangle({
      x: x,
      y: headerY,
      width: contentW,
      height: headerH,
      color: colors.bgPrimary,
    });

    // Header title
    {
      const titleText = ctx.lng === "ar" ? reText(titleLine) : titleLine;
      const tx =
        ctx.lng === "ar"
          ? getRTLTextX(titleText, 12, titleFont, x + pad, contentW - pad * 2)
          : x + pad;
      ctx.page.drawText(titleText, {
        x: tx,
        y: headerY + (headerH - 12) / 2 + 2,
        size: 12,
        font: titleFont,
        color: colors.heading,
      });
    }

    // Included & Status row
    let y = headerY - 10;
    {
      const includedLabel = included
        ? lng === "ar"
          ? "يشمل العقد"
          : "Included"
        : lng === "ar"
          ? "لا يشمل"
          : "Not included";
      const leftLine = (lng === "ar" ? "الحالة: " : "Status: ") + statusLabel;
      const rightLine = (lng === "ar" ? "الشمول: " : "Scope: ") + includedLabel;

      // left
      const { font: lf } = pickFontsForText(leftLine, fonts);
      const lt = ctx.lng === "ar" ? reText(leftLine) : leftLine;
      const ltx =
        ctx.lng === "ar"
          ? getRTLTextX(lt, 11, lf, x + pad, contentW / 2 - pad)
          : x + pad;
      ctx.page.drawText(lt, {
        x: ltx,
        y,
        size: 11,
        font: lf,
        color: colors.textColor,
      });

      // right
      const { font: rf } = pickFontsForText(rightLine, fonts);
      const rt = ctx.lng === "ar" ? reText(rightLine) : rightLine;
      const rtw = widthOf(rt, 11, rf);
      const rtx = ctx.lng === "ar" ? x + pad : x + contentW - pad - rtw;
      ctx.page.drawText(rt, {
        x: rtx,
        y,
        size: 11,
        font: rf,
        color: colors.textColor,
      });
    }

    y -= 14;

    // Delivery days
    {
      const t = String(infoLine || "");
      const { font } = pickFontsForText(t, fonts);
      const shaped = ctx.lng === "ar" ? reText(t) : t;
      const tx =
        ctx.lng === "ar"
          ? getRTLTextX(shaped, 11, font, x + pad, contentW - pad * 2)
          : x + pad;
      ctx.page.drawText(shaped, {
        x: tx,
        y,
        size: 11,
        font,
        color: colors.textColor,
      });
      y -= 12;
    }

    // Details (bullets) — add extra margin before first bullet
    let firstBulletOfThisCard = true;

    for (const t of details) {
      const isLatin = ASCII_RE.test(t.replace(/^(\u2022|•|-|–)\s*/, ""));
      const { font } = isLatin
        ? { font: fonts.enFont }
        : pickFontsForText(t, fonts);
      const rtl = !isLatin && ctx.lng === "ar";
      const shaped = rtl ? reText(t) : t;
      const lines = splitTextIntoLines(shaped, maxTextW, font, 11);

      // top margin before first bullet item
      if (firstBulletOfThisCard) {
        y -= 6;
        firstBulletOfThisCard = false;
      }

      for (let i = 0; i < lines.length; i++) {
        const ln = lines[i];
        const bullet = "•";
        const bFont = fonts.enFont;

        if (rtl) {
          if (i === 0) {
            const bw = widthOf(bullet, 11, bFont);
            ctx.page.drawText(bullet, {
              x: x + contentW - 12 - bw,
              y,
              size: 11,
              font: bFont,
              color: colors.textColor,
            });
          }
          const tx = getRTLTextX(
            ln,
            11,
            font,
            x + pad,
            contentW - pad * 2 - 14,
          );
          ctx.page.drawText(ln, {
            x: tx,
            y,
            size: 11,
            font,
            color: colors.textColor,
          });
        } else {
          if (i === 0) {
            ctx.page.drawText(bullet, {
              x: x + pad,
              y,
              size: 11,
              font: bFont,
              color: colors.textColor,
            });
          }
          ctx.page.drawText(ln, {
            x: x + pad + 14,
            y,
            size: 11,
            font,
            color: colors.textColor,
          });
        }
        y -= 13;
      }
      // extra space after each bullet item
      y -= 4;
    }

    ctx.y = y - 10;
  }
}

export async function renderStagesTable(
  ctx,
  { lng, contract, fonts, colors, defaultContractUtilityData },
) {
  // ===== Data =====
  const allStages = CONTRACT_LEVELSENUM.map((s, i) => ({
    order: i + 1,
    key: s.enum,
    label:
      (lng === "ar" ? s.labelAr : s.labelEn) || s.label || `Stage ${i + 1}`,
  })).slice(0, 7);

  const stagesMain = allStages.slice(0, 6); // first six in the main row
  let stageLast;
  // const stageLast = allStages[6] || null; // seventh in its own full-width row

  const stagesMap = new Map();
  (contract?.stages || []).forEach((st) => {
    const k = st.order || 0;
    stagesMap.set(k, st);
  });

  const rtl = lng === "ar";

  // ===== Layout tuning (EDIT THESE FIRST) =====
  const WIDTH_BOOST = 18; // increase for wider columns
  const colGapX = 6; // gap between main 6 columns
  const pad = 8; // general padding
  const padDetails = 5; // smaller padding inside details blocks
  const lineGap = 1.8;
  const borderW = 0.7;

  // Badge and header cell tuning
  const BADGE_R = 9; // circle radius
  const BADGE_D = BADGE_R * 2; // diameter
  const badgeTopGap = 6;
  const badgeTextGap = 6; // gap between badge bottom and the status/title block
  const statusTitleGapY = 3; // gap between status and title

  // Heights for main 6 columns
  const topH = 48 + badgeTopGap + BADGE_D + badgeTextGap; // status + title with badge space
  const midH = 28; // delivery days
  const detH = 128; // details
  const colH = topH + midH + detH;

  // Seventh stage (full-width, 3 columns in one short row)
  const lastRowGapY = 12;
  const lastH = 70;

  // Title spacing estimate (keep title with table)
  const TITLE_CONSUME = 28;

  // ===== Compute geometry (with width boost) =====
  const pageContentMax = ctx.pageHeight - ctx.margin.top - ctx.margin.bottom;
  const remaining = ctx.y - ctx.margin.bottom;
  const contentW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
  const effectiveContentW = contentW + WIDTH_BOOST; // width gain
  const halfBoost = WIDTH_BOOST / 2;
  const startX = rtl
    ? ctx.pageWidth - ctx.margin.right - effectiveContentW
    : ctx.margin.left - halfBoost;

  const colCount = Math.max(1, Math.min(6, stagesMain.length));
  const colW = (effectiveContentW - (colCount - 1) * colGapX) / colCount;

  const plannedTotal =
    TITLE_CONSUME + colH + (stageLast ? lastRowGapY + lastH : 0);
  const needsOwnPage =
    remaining < 0.45 * pageContentMax || remaining < plannedTotal;
  if (needsOwnPage) await ctx.newPage();

  // Title
  await ctx.writeTitle(FIXED_TEXT.titles.allStagesMatrix[lng]);

  // ===== Fonts (responsive) =====
  let fsTop = 12,
    fsMid = 11.5,
    fsDet = 10.5; // base
  if (colW < 120) {
    fsTop = 11.5;
    fsMid = 11;
    fsDet = 10;
  }
  if (colW < 104) {
    fsTop = 11;
    fsMid = 10.5;
    fsDet = 9.5;
  }

  const fsBadge = Math.max(10, fsTop - 0.5);
  const fsStatus = Math.max(9, fsTop - 1.5);
  const fsTitle = Math.min(fsTop + 0.5, 13.5);
  const fsLast = Math.max(10, fsTop - 0.5);

  // ===== Helpers =====
  const pickFont = (text, { bold = false } = {}) => {
    const isArHere = isArabicText ? isArabicText(text) : rtl;
    if (isArHere) return bold ? fonts?.arBold || fonts?.arFont : fonts?.arFont;
    return bold ? fonts?.enBold || fonts?.enFont : fonts?.enFont;
  };

  const drawBox = ({
    x,
    yTop,
    w,
    h,
    fill = colors.accentBg,
    stroke = colors.borderColor,
  }) => {
    ctx.page.drawRectangle({
      x,
      y: yTop - h,
      width: w,
      height: h,
      color: fill || undefined,
      borderColor: stroke || undefined,
      borderWidth: borderW,
    });
  };

  // centered stage badge (number)
  const drawCenteredBadge = ({ num, x, yTop, w }) => {
    const cx = x + w / 2;
    const cy = yTop - badgeTopGap - BADGE_R;
    ctx.page.drawCircle({
      x: cx,
      y: cy,
      size: BADGE_R,
      borderColor: colors.primaryDark,
      borderWidth: 0.8,
      color: colors.primaryLight,
    });
    const txt = String(num);
    const f = pickFont(txt, { bold: true });
    const tw = f.widthOfTextAtSize(txt, fsBadge);
    ctx.page.drawText(txt, {
      x: cx - tw / 2,
      y: cy - fsBadge / 2 + 1,
      size: fsBadge,
      font: f,
      color: colors.heading,
    });
  };

  // Clamp a single line with ellipsis if it exceeds width
  const clampLineWithEllipsis = (text, font, fs, maxW) => {
    let t = text;
    let w = font.widthOfTextAtSize(t, fs);
    if (w <= maxW) return t;
    const ell = "…";
    const ellW = font.widthOfTextAtSize(ell, fs);
    let lo = 0,
      hi = t.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      const cand = t.slice(0, mid) + ell;
      if (font.widthOfTextAtSize(cand, fs) <= maxW) lo = mid + 1;
      else hi = mid;
    }
    const cut = Math.max(0, lo - 1);
    return t.slice(0, cut) + ell;
  };

  // Wrap into maxLines; last line ellipsized if needed
  const wrapWithHardClamp = (
    text,
    { maxW, fs, bold = false, maxLines = 2 },
  ) => {
    const f = pickFont(text, { bold });
    const shaped =
      rtl && (isArabicText ? isArabicText(text) : true)
        ? reText(String(text || ""))
        : String(text || "");
    const lines = splitTextIntoLines(shaped, maxW, f, fs);
    if (lines.length <= maxLines) return { f, lines };
    const kept = lines.slice(0, maxLines - 1);
    const lastRaw = lines[maxLines - 1] || "";
    const clamped = clampLineWithEllipsis(lastRaw, f, fs, maxW);
    kept.push(clamped);
    return { f, lines: kept };
  };

  // centered text block (multiple lines)
  const drawTextCentered = (
    text,
    {
      x,
      yTop,
      w,
      h,
      fs,
      bold = false,
      color = colors.textColor,
      padOverride = null,
      maxLines = 2,
    },
  ) => {
    const innerPad = padOverride == null ? pad : padOverride;
    const maxTextW = Math.max(0, w - innerPad * 2);
    const { f, lines } = wrapWithHardClamp(text, {
      maxW: maxTextW,
      fs,
      bold,
      maxLines,
    });
    const lineHeight = fs + lineGap;
    const blockH = Math.min(
      lines.length * lineHeight,
      Math.max(lineHeight, h - innerPad * 2),
    );
    let cy = yTop - (h - blockH) / 2 - fs;
    for (let i = 0; i < lines.length; i++) {
      if (cy < yTop - h + innerPad) break;
      const ln = lines[i];
      const lnW = f.widthOfTextAtSize(ln, fs);
      const cx = x + w / 2 - lnW / 2;
      ctx.page.drawText(ln, { x: cx, y: cy, size: fs, font: f, color });
      cy -= lineHeight;
      if (cy < yTop - h + innerPad) break;
    }
  };

  // details with bullets (NOT bold)
  const drawBulletsClipped = (
    items,
    { x, yTop, w, h, fs = fsDet, color = colors.textColor },
  ) => {
    const bulletGap = 3;
    const innerPad = padDetails;
    const fBullet = fonts?.enFont || pickFont("", { bold: false }); // NOT bold
    const lineHeight = fs + bulletGap;
    const maxLines = Math.max(
      1,
      Math.floor((h - innerPad * 2 + bulletGap) / lineHeight),
    );
    let linesUsed = 0;
    let cy = yTop - innerPad - fs;
    const maxTextW = w - innerPad * 2 - 12;

    for (let idx = 0; idx < items.length; idx++) {
      if (linesUsed >= maxLines) break;
      const raw = String(items[idx] || "");
      const isArItem = rtl && (isArabicText ? isArabicText(raw) : true);
      const f = pickFont(raw, { bold: false }); // NOT bold
      const shaped = isArItem ? reText(raw) : raw;
      const wrapped = splitTextIntoLines(shaped, maxTextW, f, fs);

      // bullet dot
      if (isArItem) {
        ctx.page.drawText("•", {
          x: x + w - innerPad - 8,
          y: cy,
          size: fs,
          font: fBullet,
          color,
        });
      } else {
        ctx.page.drawText("•", {
          x: x + innerPad,
          y: cy,
          size: fs,
          font: fBullet,
          color,
        });
      }

      // first line
      const first = wrapped[0] || "";
      const tx0 = isArItem
        ? getRTLTextX(first, fs, f, x + innerPad, w - innerPad * 2 - 12)
        : x + innerPad + 12;

      ctx.page.drawText(first, { x: tx0, y: cy, size: fs, font: f, color });
      cy -= lineHeight;
      linesUsed++;

      // continuation lines
      for (let i = 1; i < wrapped.length && linesUsed < maxLines; i++) {
        const ln = wrapped[i];
        const tx = isArItem
          ? getRTLTextX(ln, fs, f, x + innerPad, w - innerPad * 2 - 12)
          : x + innerPad + 12;
        ctx.page.drawText(ln, { x: tx, y: cy, size: fs, font: f, color });
        cy -= lineHeight;
        linesUsed++;
      }

      if (linesUsed < maxLines) cy -= 1.2; // tiny gap between bullets
    }
  };

  const colXAt = (index, colW) => {
    if (!rtl) return startX + index * (colW + colGapX);
    return startX + effectiveContentW - (index + 1) * colW - index * colGapX;
  };

  // ===== Main row: 6 columns =====
  await ctx.need(colH);
  const rowTop = ctx.y;

  stagesMain.forEach((s, i) => {
    const stData = stagesMap.get(s.order) || {};
    const included = stagesMap.has(s.order);
    const deliveryDays = stData?.deliveryDays;

    const statusText = included
      ? rtl
        ? "يشمل العقد"
        : "Included"
      : rtl
        ? "لا يشمل العقد"
        : "Not included";

    const daysStr =
      included && deliveryDays != null
        ? rtl
          ? `${formatNumber(deliveryDays, "ar")} يوم`
          : `${deliveryDays} days`
        : "—";
    // Level clauses are keyed by `level` (LEVEL_1..7) in the editor, which writes
    // `level` correctly but leaves `order` at its DB default of 0 — so matching by
    // `order` never hits. Match by `level` (like the web StagesTable client).
    const currentDetails = defaultContractUtilityData?.levelClauses?.find(
      (clause) => clause.level === s.key,
    );
    const details =
      (lng === "ar" ? currentDetails?.textAr : currentDetails?.textEn)?.split(
        "\n",
      ) || [];
    if (stData?.notes) details.push(String(stData.notes));

    const x = colXAt(i, colW);

    // Top cell (status + title)
    drawBox({
      x,
      yTop: rowTop,
      w: colW,
      h: topH,
      fill: colors.accentBg,
      stroke: colors.borderColor,
    });

    // centered badge with stage number
    drawCenteredBadge({ num: s.order, x, yTop: rowTop, w: colW });

    // two-tier text inside header
    (function drawTwoTierCentered() {
      const innerPad = pad;
      const textAreaTop = rowTop - (badgeTopGap + BADGE_D + badgeTextGap);
      const textAreaH = topH - (badgeTopGap + BADGE_D + badgeTextGap);

      // status
      const f1 = pickFont(statusText, { bold: false });
      const statusMaxW = colW - innerPad * 2;
      const t1raw = rtl ? reText(statusText) : statusText;
      const t1 = clampLineWithEllipsis(t1raw, f1, fsStatus, statusMaxW);
      const w1 = f1.widthOfTextAtSize(t1, fsStatus);

      // title (1-2 lines)
      const titleMaxW = colW - innerPad * 2;
      const { f: f2, lines: titleLines } = wrapWithHardClamp(s.label, {
        maxW: titleMaxW,
        fs: fsTitle,
        bold: true,
        maxLines: 2,
      });

      const lh1 = fsStatus + lineGap;
      const lh2 = fsTitle + lineGap;
      const titleBlockH = titleLines.length * lh2;
      const blockH = lh1 + statusTitleGapY + titleBlockH;

      let cy = textAreaTop - (textAreaH - blockH) / 2 - fsStatus;

      // status
      ctx.page.drawText(t1, {
        x: x + colW / 2 - w1 / 2,
        y: cy,
        size: fsStatus,
        font: f1,
        color: included ? colors.success : colors.red,
      });
      cy -= lh1 + statusTitleGapY;

      // title
      for (let i = 0; i < titleLines.length; i++) {
        const ln = rtl ? reText(titleLines[i]) : titleLines[i];
        const w2 = f2.widthOfTextAtSize(ln, fsTitle);
        ctx.page.drawText(ln, {
          x: x + colW / 2 - w2 / 2,
          y: cy,
          size: fsTitle,
          font: f2,
          color: colors.heading,
        });
        cy -= lh2;
      }
    })();

    // Middle cell (days)
    const midTop = rowTop - topH;
    drawBox({
      x,
      yTop: midTop,
      w: colW,
      h: midH,
      fill: colors.accentBg,
      stroke: colors.borderColor,
    });
    drawTextCentered(daysStr, {
      x,
      yTop: midTop,
      w: colW,
      h: midH,
      fs: fsMid,
      bold: false,
      maxLines: 1,
    });

    // Details cell
    const detTop = midTop - midH;
    drawBox({
      x,
      yTop: detTop,
      w: colW,
      h: detH,
      fill: colors.accentBg,
      stroke: colors.borderColor,
    });
    drawBulletsClipped(details, {
      x,
      yTop: detTop,
      w: colW,
      h: detH,
      fs: fsDet,
    });
  });

  ctx.y = rowTop - colH;
  // increase gap with bottom after main row
  ctx.y -= lastRowGapY;
  // ===== Seventh stage (disabled in this version) =====
  if (stageLast) {
    // (kept as in your source; unreachable since stageLast is undefined)
  }
}

//two sections (kept commented)

// === PAGE-SPACE GUARDS ADDED HERE ===
