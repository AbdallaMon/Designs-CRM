// server/services/main/contract/generateContractPdf.js
import { PDFDocument, rgb } from "pdf-lib";
import {
  fetchImageBuffer,
  getRTLTextX,
  reText,
  splitTextIntoLines,
  enfontBoldBase64,
  enfontBase64,
  fontBoldBase64,
  fontBase64,
  isArabicText,
  formatAED,
  formatNumber,
} from "../../utilityServices.js";
import { uploadToFTPHttpAsBuffer } from "../utility.js";
import prisma from "../../../prisma/prisma.js";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import * as fontkit from "fontkit";
import "dayjs/locale/ar.js";
import "dayjs/locale/en.js";

// ====== IMPORT ALL FRONTEND DATA EXACTLY ======
import {
  STAGE_CLAUSES_DEFAULT,
  OBLIGATIONS_TEXT,
  FIXED_TEXT,
  PAYMENT_ORDINAL,
  STAGE_PROGRESS,
  HANDWRITTEN_SPECIAL_CLAUSES,
  CONTRACT_LEVELSENUM,
  COUNTRY_LABEL,
  EMIRATE_LABEL,
  UAE_LABEL,
  STAGE_STATUS_LABEL,
  PROJECT_TYPES_LABELS,
} from "./wittenBlocksData.js";

// ===== Helpers =====
const ASCII_RE = /^[\x00-\x7F\s.,:;@!?#%&*()+\-\/\\\[\]{}"'<>=|]+$/; // latin-ish

function widthOf(text, size, font) {
  return font.widthOfTextAtSize(String(text || ""), size);
}

async function drawFullBackgroundImage(page, pdfDoc, backgroundImageUrl) {
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

function createPdfContext({
  pdfDoc,
  pageWidth,
  pageHeight,
  margin,
  startTopOffset = 80,
  lng = "ar",
}) {
  let page = null;
  let y = 300;

  const ensurePage = async () => {
    if (!page) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      if (typeof ctx.drawBg === "function") await ctx.drawBg(page);
      y = pageHeight - margin.top - startTopOffset;
    }
  };
  const newPage = async () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    if (typeof ctx.drawBg === "function") await ctx.drawBg(page);
    y = pageHeight - margin.top - startTopOffset;
  };
  const need = async (h) => {
    if (!page) await ensurePage();
    if (y - h < margin.bottom) await newPage();
  };

  const ctx = {
    get page() {
      return page;
    },
    get y() {
      return y;
    },
    set y(v) {
      y = v;
    },
    pageWidth,
    pageHeight,
    margin,
    newPage,
    need,
    ensurePage,
    drawBg: null,
    writeTitle: null,
    writeLineAuto: null,
    lng,
  };
  return ctx;
}

// pick font per TEXT content
function pickFontsForText(text, fonts) {
  const isAr = isArabicText(String(text || ""));
  return isAr
    ? { font: fonts.arFont, bold: fonts.arBold }
    : { font: fonts.enFont, bold: fonts.enBold };
}
function isRTL(text) {
  return isArabicText(String(text || ""));
}

// ===== Shared render utils (subheads, lists with robust bullets) =====
async function writeSubhead(ctx, text, { fonts, colors, fs = 12 }) {
  const t = String(text || "");
  const { bold } = pickFontsForText(t, fonts);
  await ctx.need(fs + 10);
  const shaped = ctx.lng === "ar" ? reText(t) : t;
  const contentW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
  const x =
    ctx.lng === "ar"
      ? getRTLTextX(shaped, fs, bold, ctx.margin.left, contentW)
      : ctx.margin.left;
  ctx.page.drawText(shaped, {
    x,
    y: ctx.y,
    size: fs,
    font: bold,
    color: colors.heading,
  });
  ctx.y -= fs + 6;
}

// Draw a paragraph or bullet list; bullets always in English font to avoid glyph issues
async function writeParagraphOrList(ctx, text, { fonts, colors, fs = 11 }) {
  const raw = String(text ?? "");
  if (!raw.trim()) return;

  const linesIn = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const isLikelyList =
    linesIn.some((ln) => /^(\u2022|•|-|–|\d+[).])\s*/.test(ln)) ||
    linesIn.length > 1;

  if (!isLikelyList) {
    const forceLatin = ASCII_RE.test(raw);
    await ctx.writeLineAuto(
      raw,
      fs,
      false,
      colors.textColor,
      forceLatin ? "ltr" : ctx.lng === "ar" ? "rtl" : null
    );
    return;
  }

  const contentW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
  const indent = 14;
  const wrapW = contentW - indent;
  const bulletFS = fs;

  let isFirstBullet = true;

  for (const original of linesIn) {
    const lnText = original.replace(/^(\u2022|•|-|–|\d+[).])\s*/, "").trim();
    const isLatin = ASCII_RE.test(lnText);
    const useFontObj = isLatin
      ? { font: fonts.enFont, bold: fonts.enBold }
      : pickFontsForText(lnText, fonts);
    const useFont = useFontObj.font;

    const rtl = !isLatin && ctx.lng === "ar";
    const shaped = rtl ? reText(lnText) : lnText;
    const wrapped = splitTextIntoLines(shaped, wrapW, useFont, fs);

    for (let i = 0; i < wrapped.length; i++) {
      const line = wrapped[i];
      await ctx.need(fs + 8);

      const bullet = "•";
      const bFont = fonts.enFont;

      // extra margin before the very first bullet in a block
      if (isFirstBullet && i === 0) {
        ctx.y -= 4;
        isFirstBullet = false;
      }

      if (rtl) {
        if (i === 0) {
          const bw = widthOf(bullet, bulletFS, bFont);
          ctx.page.drawText(bullet, {
            x: ctx.margin.left + contentW - bw,
            y: ctx.y,
            size: bulletFS,
            font: bFont,
            color: colors.textColor,
          });
        }
        const tx = getRTLTextX(
          line,
          fs,
          useFont,
          ctx.margin.left,
          contentW - indent
        );
        ctx.page.drawText(line, {
          x: tx,
          y: ctx.y,
          size: fs,
          font: useFont,
          color: colors.textColor,
        });
      } else {
        if (i === 0) {
          ctx.page.drawText(bullet, {
            x: ctx.margin.left,
            y: ctx.y,
            size: bulletFS,
            font: bFont,
            color: colors.textColor,
          });
        }
        const tx = ctx.margin.left + indent;
        ctx.page.drawText(line, {
          x: tx,
          y: ctx.y,
          size: fs,
          font: useFont,
          color: colors.textColor,
        });
      }
      ctx.y -= fs + 6;
    }
    // extra space between bullets
    ctx.y -= 4;
  }
  ctx.y -= 2;
}

// ===== Section renderers =====
async function renderIntroPage(ctx, { introImageUrl, title, fonts, colors }) {
  const { pdfDoc, pageWidth, pageHeight } = ctx;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  await drawFullBackgroundImage(page, pdfDoc, introImageUrl);
  if (!title) return;
  const { bold } = pickFontsForText(title, fonts);
  const fs = 16;
  const tw = bold.widthOfTextAtSize(title, fs);
  page.drawText(isRTL(title) ? reText(title) : title, {
    x: (pageWidth - tw) / 2,
    y: pageHeight * 0.62,
    size: fs,
    font: bold,
    color: colors.primary,
  });
}

async function renderClientSection(ctx, { lng, contract, fonts, colors }) {
  await ctx.writeTitle(FIXED_TEXT.titles.partyOne[lng]);

  const owner = contract?.clientLead?.client || {};
  const lead = contract?.clientLead || {};
  const emirate = lead?.emirate || null;
  const country = lead?.country || null;
  const code = lead?.code || lead?.id || null;
  const projectType =
    lng === "ar" ? contract.title : contract.titleEn || contract.title;

  const address = (() => {
    if (!emirate || emirate === "OUTSIDE") {
      if (country && COUNTRY_LABEL[country]) return COUNTRY_LABEL[country][lng];
      return country || (lng === "ar" ? "—" : "-");
    }
    const emirateLabel = EMIRATE_LABEL[lng]?.[emirate] || emirate;
    return `${emirateLabel} — ${UAE_LABEL[lng]}`;
  })();

  const stageNums = (contract?.stages || [])
    .map((s) => Number(s.order || 0))
    .filter(Boolean)
    .sort((a, b) => a - b);

  const today = dayjs()
    .locale(lng === "ar" ? "ar" : "en")
    .format("YYYY/MM/DD");

  // Prepare items (label/value)
  const items = [
    [lng === "ar" ? "اسم المالك" : "Owner name", String(owner?.name || "-")],
    [lng === "ar" ? "العنوان" : "Address", String(address || "-")],
    [lng === "ar" ? "رقم الهاتف" : "Phone", String(owner?.phone || "-")],
    [lng === "ar" ? "البريد الإلكتروني" : "Email", String(owner?.email || "-")],
    [lng === "ar" ? "نوع المشروع" : "Project Type", String(projectType || "-")],
    [lng === "ar" ? "كود المشروع" : "Project Code", String(code || "-")],
    [
      FIXED_TEXT.titles.includesStages[lng],
      stageNums.length ? stageNums.join(", ") : "-",
    ],
    [
      lng === "ar" ? "تاريخ كتابة العقد" : "Contract Written Date",
      String(today),
    ],
  ];

  // Layout
  const contentW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
  const gutter = 10; // 🔧 was 14 (narrower column gap)
  const colW = (contentW - gutter) / 2;

  // Tighter sizing
  const pad = 6; // 🔧 was 8  (cell padding)
  const labelFS = 11;
  const valueFS = 11;
  const valueTopGap = 6; // 🔧 was 14 (space between label and value)
  const rowGap = 3; // 🔧 was 6  (space between rows)
  const LINE_LEADING = 2; // 🔧 was hardcoded +4 per line

  // Helper: render one cell and return its height
  const renderCell = (x, yTop, label, value, alignRight) => {
    const { bold: labelFont } = pickFontsForText(label, fonts);

    // Value font selection: keep phone/email/ASCII as Latin font
    const valueIsLatin =
      /phone|email/i.test(label) ||
      label.includes("الهاتف") ||
      label.includes("البريد") ||
      ASCII_RE.test(String(value || ""));

    const vFont = valueIsLatin
      ? fonts.enFont
      : pickFontsForText(value, fonts).font;

    // Shape texts only if Arabic content
    const shapeIfAr = (t) =>
      ASCII_RE.test(String(t || ""))
        ? String(t || "")
        : reText(String(t || ""));

    const shapedLabel = shapeIfAr(label);
    const valueText = String(value || "");
    const shapedValue = ASCII_RE.test(valueText)
      ? valueText
      : reText(valueText);

    const maxTextW = colW - pad * 2;

    // Wrap value
    const valueLines = splitTextIntoLines(
      shapedValue,
      maxTextW,
      vFont,
      valueFS
    );

    // Heights
    const labelH = labelFS + 1; // 🔧 was +2
    const valueH = valueLines.length * (valueFS + LINE_LEADING); // 🔧 tighter leading
    const boxH = pad + labelH + valueTopGap + valueH + pad;

    // Compute X for label & value so that VALUE ALWAYS sits under its LABEL
    const labelX = alignRight
      ? getRTLTextX(shapedLabel, labelFS, labelFont, x + pad, maxTextW)
      : x + pad;

    ctx.page.drawText(shapedLabel, {
      x: labelX,
      y: yTop - labelFS,
      size: labelFS,
      font: labelFont,
      color: colors.heading,
    });

    // Draw each value line with the SAME alignment side as label
    let vy = yTop - pad - labelH - valueTopGap;
    for (const line of valueLines) {
      const lineX = alignRight
        ? getRTLTextX(line, valueFS, vFont, x + pad, maxTextW)
        : x + pad;
      ctx.page.drawText(line, {
        x: lineX,
        y: vy,
        size: valueFS,
        font: vFont,
        color: colors.textColor,
      });
      vy -= valueFS + LINE_LEADING; // 🔧 tighter line spacing
    }

    return boxH;
  };

  // Two columns (fill order depends on language)
  let i = 0;
  while (i < items.length) {
    await ctx.need(60); // 🔧 was 70 (allow starting rows with slightly less space)
    const xLeft = ctx.margin.left;
    const xRight = ctx.margin.left + colW + gutter;
    const yTop = ctx.y;

    const alignRight = lng === "ar"; // AR aligns to the right AND fills right column first

    // Decide which side gets the first item of the pair
    const primaryX = alignRight ? xRight : xLeft;
    const secondaryX = alignRight ? xLeft : xRight;

    // First item of the pair
    const [l1, v1] = items[i] || ["", ""];
    const h1 = renderCell(primaryX, yTop, l1, v1, alignRight);

    // Optional second item of the same row
    let h2 = 0;
    if (i + 1 < items.length) {
      const [l2, v2] = items[i + 1];
      h2 = renderCell(secondaryX, yTop, l2, v2, alignRight);
    }

    const rowH = Math.max(h1, h2);
    ctx.y = yTop - rowH - rowGap; // 🔧 tighter row gap
    i += 2;
  }
}

async function renderAmountSection(ctx, { lng, contract }) {
  const amount = Number(contract?.amount ?? 0);
  const vatRate = Number(contract?.taxRate ?? 0);
  const total = contract?.totalAmount ?? amount * (1 + vatRate / 100);

  await ctx.writeTitle(FIXED_TEXT.titles.amounts[lng]);
  if (lng === "ar") {
    await ctx.writeLineAuto(
      `اتفق الفريقان علي أن تكون تكلفة التصميم الداخلي للمشروع هي: ${formatAED(
        amount,
        "ar"
      )}`,
      11,
      false
    );
    await ctx.writeLineAuto(
      `مع ضريبة ${vatRate || 0}% تصبح تكلفة التصميم ${formatAED(
        total,
        "ar"
      )} .`,
      11,
      false
    );
  } else {
    await ctx.writeLineAuto(
      `Both parties agreed that the interior design cost is: ${formatAED(
        amount,
        "en"
      )}.`,
      11,
      false
    );
    await ctx.writeLineAuto(
      `With VAT ${vatRate || 0}%, the total design cost becomes ${formatAED(
        total,
        "en"
      )}.`,
      11,
      false
    );
  }
}
function buildPaymentLine({ payment, index, lng }) {
  const ordinal =
    PAYMENT_ORDINAL[lng][index] ||
    (lng === "ar" ? `دفعة ${index}` : `Payment ${index}`);
  const amt = formatAED(payment.amount, lng);
  const beforeStageText =
    payment.beforeStageOrder && lng === "ar"
      ? ` وقبل البدء بالمرحلة ${payment.beforeStageOrder}`
      : payment.beforeStageOrder && lng === "en"
      ? ` and before starting stage ${payment.beforeStageOrder}`
      : "";
  const primary = PROJECT_TYPES_LABELS[payment?.project?.type]?.[lng] || "";
  if (index === 1) {
    return lng === "ar"
      ? ` ${ordinal} عند توقيع العقد بقيمه: ${amt}`
      : ` ${ordinal} on contract signature: ${amt}`;
  }
  return lng === "ar"
    ? `- ${ordinal} الانتهاء من ${primary}${beforeStageText} بقيمة : ${amt}`
    : `- ${ordinal} upon completion of ${primary}${beforeStageText}: ${amt}`;
}

async function renderDbSpecialItems(ctx, { lng, contract, fonts, colors }) {
  const items = (contract?.specialItems || [])
    .map((it) => (lng === "ar" ? it.labelAr : it.labelEn || it.labelAr))
    .filter(Boolean);
  if (!items.length) return;
  await ctx.writeTitle(lng === "ar" ? "بنود خاصة" : "Special Terms");
  await writeParagraphOrList(ctx, items.map((t) => `${t}`).join("\n"), {
    fonts,
    colors,
    fs: 11,
  });
}

async function renderPartyOneWithPayments(
  ctx,
  { lng, contract, fonts, colors }
) {
  await ctx.writeTitle(
    lng === "ar" ? "التزامات الفريق الأول" : "Party One Obligations"
  );

  const base = OBLIGATIONS_TEXT.partyOne[lng].base || "";
  const items = base
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((ln) => !/^الت.*زامات|Obligations/i.test(ln));
  await writeParagraphOrList(
    ctx,
    items
      .map((t) => (t.match(/^(\u2022|•|-|–|\d+[).])/) ? t : `${t}`))
      .join("\n"),
    { fonts, colors, fs: 11 }
  );

  const payments = contract?.paymentsNew || contract?.payments || [];
  if (payments.length) {
    await writeSubhead(
      ctx,
      lng === "ar" ? "جدول الدفعات" : "Payment schedule",
      { fonts, colors, fs: 12 }
    );
    const paymentLines = payments.map((p, i) =>
      buildPaymentLine({ payment: p, index: i + 1, lng })
    );
    await writeParagraphOrList(ctx, paymentLines.join("\n"), {
      fonts,
      colors,
      fs: 11,
    });
  }
}

// ===== Redesigned Stages “Cards”
async function renderStagesCards(ctx, { lng, contract, fonts, colors }) {
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
    const statusKey = data?.stageStatus || "NOT_STARTED";
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
        11
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
            contentW - pad * 2 - 14
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

async function renderStagesTable(ctx, { lng, contract, fonts, colors }) {
  // ===== Data =====
  const allStages = CONTRACT_LEVELSENUM.map((s, i) => ({
    order: i + 1,
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

  // Badge and header cell tuning (FIX: spacing so texts never overlap the badge)
  const BADGE_R = 9; // circle radius
  const BADGE_D = BADGE_R * 2; // diameter
  const badgeTopGap = 6;
  const badgeTextGap = 6; // vertical gap between badge bottom and the status/title block
  const statusTitleGapY = 3; // small gap between status line and title line

  // Heights for main 6 columns
  const topH = 48 + badgeTopGap + BADGE_D + badgeTextGap; // status + title (with safe space for badge)
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

  // centered stage badge (number) — lifted up so text block has its own space
  const drawCenteredBadge = ({ num, x, yTop, w }) => {
    const cx = x + w / 2;
    const cy = yTop - badgeTopGap - BADGE_R; // sits inside the reserved top chunk
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
    // binary shrink
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

  // Wrap into maxLines; last line ellipsized if needed (prevents overflow)
  const wrapWithHardClamp = (
    text,
    { maxW, fs, bold = false, maxLines = 2 }
  ) => {
    const f = pickFont(text, { bold });
    const shaped =
      rtl && (isArabicText ? isArabicText(text) : true)
        ? reText(String(text || ""))
        : String(text || "");
    const lines = splitTextIntoLines(shaped, maxW, f, fs);
    if (lines.length <= maxLines) return { f, lines };
    // keep (maxLines-1) + clamp last
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
    }
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
      Math.max(lineHeight, h - innerPad * 2)
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
    { x, yTop, w, h, fs = fsDet, color = colors.textColor }
  ) => {
    const bulletGap = 3;
    const innerPad = padDetails;
    const fBullet = fonts?.enFont || pickFont("", { bold: false }); // NOT bold
    const lineHeight = fs + bulletGap;
    const maxLines = Math.max(
      1,
      Math.floor((h - innerPad * 2 + bulletGap) / lineHeight)
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

    const details = (STAGE_PROGRESS?.[s.order]?.[lng] || []).slice();
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

    // centered badge with stage number (reserved space above text)
    drawCenteredBadge({ num: s.order, x, yTop: rowTop, w: colW });

    // ===== two-tier text inside header (NEVER overlaps badge; title hard-clamped) =====
    (function drawTwoTierCentered() {
      const innerPad = pad;
      // text area starts *below* the badge reserved zone
      const textAreaTop = rowTop - (badgeTopGap + BADGE_D + badgeTextGap);
      const textAreaH = topH - (badgeTopGap + BADGE_D + badgeTextGap);

      // status (single line, clamp if extreme)
      const f1 = pickFont(statusText, { bold: false });
      const statusMaxW = colW - innerPad * 2;
      const t1raw = rtl ? reText(statusText) : statusText;
      const t1 = clampLineWithEllipsis(t1raw, f1, fsStatus, statusMaxW);
      const w1 = f1.widthOfTextAtSize(t1, fsStatus);

      // title (up to 2 lines, ellipsis on last)
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

      // total text block height inside the text area
      const blockH = lh1 + statusTitleGapY + titleBlockH;

      // start so block is vertically centered in the text area
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

      // title (1–2 centered lines)
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

    // Middle cell (days) — centered
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

    // Details cell — bullets not bold
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

  // ===== Seventh stage: full width row, 3 columns =====
  if (stageLast) {
    await ctx.need(lastRowGapY + lastH);
    ctx.y -= lastRowGapY;

    const s = stageLast;
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

    const details = (STAGE_PROGRESS?.[s.order]?.[lng] || []).slice();
    if (stData?.notes) details.push(String(stData.notes));

    const fullX = startX;
    const fullW = effectiveContentW;
    const yTop = ctx.y;

    // 3 columns: small (status+title), small (days), large (details)
    const smallW = Math.max(110, Math.round(fullW * 0.18));
    const small2W = Math.max(90, Math.round(fullW * 0.14));
    const gap = 6;
    const largeW = fullW - smallW - small2W - 2 * gap; // more space for details

    const x1 = rtl ? fullX + fullW - smallW : fullX;
    const x2 = rtl ? x1 - gap - small2W : x1 + smallW + gap;
    const x3 = rtl ? x2 - gap - largeW : x2 + small2W + gap;

    // (1) status + title (clamped)
    drawBox({
      x: x1,
      yTop,
      w: smallW,
      h: lastH,
      fill: colors.accentBg,
      stroke: colors.borderColor,
    });
    drawCenteredBadge({ num: s.order, x: x1, yTop, w: smallW });

    (function drawTwoTierSmall() {
      const innerPad = pad;
      const textAreaTop =
        yTop - (badgeTopGap + BADGE_D + Math.max(4, badgeTextGap - 2));
      const textAreaH =
        lastH - (badgeTopGap + BADGE_D + Math.max(4, badgeTextGap - 2));

      const f1 = pickFont(statusText, { bold: false });
      const t1raw = rtl ? reText(statusText) : statusText;
      const t1 = clampLineWithEllipsis(
        t1raw,
        f1,
        fsLast - 1,
        smallW - innerPad * 2
      );
      const w1 = f1.widthOfTextAtSize(t1, fsLast - 1);

      const { f: f2, lines: titleLines } = wrapWithHardClamp(s.label, {
        maxW: smallW - innerPad * 2,
        fs: fsLast + 0.5,
        bold: true,
        maxLines: 2,
      });

      const lh1 = fsLast - 1 + lineGap;
      const lh2 = fsLast + 0.5 + lineGap;
      const blockH = lh1 + statusTitleGapY + titleLines.length * lh2;

      let cy = textAreaTop - (textAreaH - blockH) / 2 - (fsLast - 1);

      ctx.page.drawText(t1, {
        x: x1 + smallW / 2 - w1 / 2,
        y: cy,
        size: fsLast - 1,
        font: f1,
        color: included ? colors.success : colors.red,
      });
      cy -= lh1 + statusTitleGapY;

      for (let i = 0; i < titleLines.length; i++) {
        const ln = rtl ? reText(titleLines[i]) : titleLines[i];
        const w2 = f2.widthOfTextAtSize(ln, fsLast + 0.5);
        ctx.page.drawText(ln, {
          x: x1 + smallW / 2 - w2 / 2,
          y: cy,
          size: fsLast + 0.5,
          font: f2,
          color: colors.heading,
        });
        cy -= lh2;
      }
    })();

    // (2) days (centered)
    drawBox({
      x: x2,
      yTop,
      w: small2W,
      h: lastH,
      fill: colors.accentBg,
      stroke: colors.borderColor,
    });
    drawTextCentered(daysStr, {
      x: x2,
      yTop,
      w: small2W,
      h: lastH,
      fs: fsLast,
      bold: false,
      maxLines: 1,
    });

    // (3) details (remaining width)
    drawBox({
      x: x3,
      yTop,
      w: largeW,
      h: lastH,
      fill: colors.accentBg,
      stroke: colors.borderColor,
    });
    drawBulletsClipped(details, {
      x: x3,
      yTop,
      w: largeW,
      h: lastH,
      fs: Math.max(fsLast - 1, 10),
    });

    ctx.y = yTop - lastH;
  }
}

//two sections
// async function renderStagesTable(ctx, { lng, contract, fonts, colors }) {
//   // ===== Data =====
//   const stages = CONTRACT_LEVELSENUM.map((s, i) => ({
//     order: i + 1,
//     label:
//       (lng === "ar" ? s.labelAr : s.labelEn) || s.label || `Stage ${i + 1}`,
//   }));

//   const stagesMap = new Map();
//   (contract?.stages || []).forEach((st) => {
//     const k = st.order || 0;
//     stagesMap.set(k, st);
//   });

//   const rtl = lng === "ar";

//   // ===== Fixed layout (same as your last version) =====
//   const pad = 8;
//   const fsTop = 11;
//   const fsMid = 11;
//   const fsDet = 11;
//   const lineGap = 2;
//   const bulletGap = 2;
//   const borderW = 0.8;

//   const contentW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;

//   // Manual grid: 3 columns in row 1, 4 in row 2
//   const colGapX = 8;
//   const rowGapY = 12;

//   const topCols = 3;
//   const botCols = 4;

//   const topColW = (contentW - (topCols - 1) * colGapX) / topCols;
//   const botColW = (contentW - (botCols - 1) * colGapX) / botCols;

//   // Fixed cell heights
//   const statusLabelGap = 4;
//   const topH = 46;
//   const midH = 28;
//   const detH = 150;
//   const colH = topH + midH + detH;

//   // Title draw roughly consumes this much (based on ctx.writeTitle)
//   const TITLE_CONSUME = 16 + 12; // fs + spacing = 28

//   // Stage slices
//   const topStages = stages.slice(0, Math.min(3, stages.length));
//   const bottomStages = stages.slice(3, Math.min(7, stages.length));

//   // Compute planned height of the whole block (title + table)
//   const tableBlockH =
//     (topStages.length ? colH : 0) +
//     (bottomStages.length ? (topStages.length ? rowGapY : 0) + colH : 0);
//   const plannedTotal = TITLE_CONSUME + tableBlockH;

//   // Compute remaining & page content height
//   const pageContentMax = ctx.pageHeight - ctx.margin.top - ctx.margin.bottom;
//   const remaining = ctx.y - ctx.margin.bottom;

//   // Decision: does it deserve its own page?
//   // - If remaining < 75% of page OR remaining < plannedTotal, go to new page.
//   const needsOwnPage =
//     remaining < 0.7 * pageContentMax || remaining < plannedTotal;
//   if (needsOwnPage) {
//     await ctx.newPage();
//   }

//   // Draw the section title now (so the title stays with the table)
//   await ctx.writeTitle(FIXED_TEXT.titles.allStagesMatrix[lng]);

//   // ===== Helpers (same as your last version) =====
//   const pickFont = (text, { bold = false } = {}) => {
//     const isArHere = isArabicText ? isArabicText(text) : rtl;
//     if (isArHere) return bold ? fonts?.arBold || fonts?.arFont : fonts?.arFont;
//     return bold ? fonts?.enBold || fonts?.enFont : fonts?.enFont;
//   };

//   const drawBox = ({
//     x,
//     yTop,
//     w,
//     h,
//     fill = colors.accentBg,
//     stroke = colors.borderColor,
//   }) => {
//     ctx.page.drawRectangle({
//       x,
//       y: yTop - h,
//       width: w,
//       height: h,
//       color: fill || undefined,
//       borderColor: stroke || undefined,
//       borderWidth: borderW,
//     });
//   };

//   const drawTextClipped = (
//     text,
//     {
//       x,
//       yTop,
//       w,
//       h,
//       fs,
//       bold = false,
//       color = colors.textColor,
//       rtlOverride = null,
//     }
//   ) => {
//     const f = pickFont(text, { bold });
//     const isRtlText =
//       rtlOverride != null
//         ? rtlOverride
//         : rtl && (isArabicText ? isArabicText(text) : true);
//     const shaped = isRtlText ? reText(String(text || "")) : String(text || "");
//     const maxTextW = w - pad * 2;

//     const lineHeight = fs + lineGap;
//     const maxLines = Math.max(
//       1,
//       Math.floor((h - pad * 2 + lineGap) / lineHeight)
//     );

//     const allLines = splitTextIntoLines(shaped, maxTextW, f, fs);
//     const lines = allLines.slice(0, maxLines);

//     let cy = yTop - pad - fs;
//     for (const ln of lines) {
//       const tx = isRtlText
//         ? getRTLTextX(ln, fs, f, x + pad, maxTextW)
//         : x + pad;
//       ctx.page.drawText(ln, { x: tx, y: cy, size: fs, font: f, color });
//       cy -= lineHeight;
//     }
//   };

//   const drawTopCell = ({ x, yTop, w, h, statusText, stageText }) => {
//     drawBox({
//       x,
//       yTop,
//       w,
//       h,
//       fill: colors.accentBg,
//       stroke: colors.borderColor,
//     });

//     const fStatus = pickFont(statusText, { bold: true });
//     const isRtlStatus = rtl && (isArabicText ? isArabicText(statusText) : true);
//     const maxTextW = w - pad * 2;
//     const statusLine = String(statusText || "");
//     const statusY = yTop - pad - fsTop;
//     const statusX = isRtlStatus
//       ? getRTLTextX(reText(statusLine), fsTop, fStatus, x + pad, maxTextW)
//       : x + pad;

//     ctx.page.drawText(isRtlStatus ? reText(statusLine) : statusLine, {
//       x: statusX,
//       y: statusY,
//       size: fsTop,
//       font: fStatus,
//       color: colors.heading,
//     });

//     const remainingH = h - (pad + fsTop + statusLabelGap) - pad;
//     const stageTopAnchor = yTop - (pad + fsTop + statusLabelGap);
//     drawTextClipped(stageText, {
//       x,
//       yTop: stageTopAnchor,
//       w,
//       h: remainingH,
//       fs: fsTop,
//       bold: false,
//       color: colors.textColor,
//     });
//   };

//   const drawBulletsClipped = (
//     items,
//     { x, yTop, w, h, fs = fsDet, color = colors.textColor }
//   ) => {
//     const fBullet = fonts?.enFont || pickFont("", { bold: false });
//     const lineHeight = fs + bulletGap;
//     const maxLines = Math.max(
//       1,
//       Math.floor((h - pad * 2 + bulletGap) / lineHeight)
//     );
//     let linesUsed = 0;

//     let cy = yTop - pad - fs;
//     const maxTextW = w - pad * 2 - 14;

//     for (let idx = 0; idx < items.length; idx++) {
//       if (linesUsed >= maxLines) break;

//       const raw = String(items[idx] || "");
//       const isArItem = rtl && (isArabicText ? isArabicText(raw) : true);
//       const f = pickFont(raw);
//       const shaped = isArItem ? reText(raw) : raw;
//       const wrapped = splitTextIntoLines(shaped, maxTextW, f, fs);

//       if (linesUsed >= maxLines) break;

//       if (isArItem) {
//         ctx.page.drawText("•", {
//           x: x + w - pad - 8,
//           y: cy,
//           size: fs,
//           font: fBullet,
//           color,
//         });
//       } else {
//         ctx.page.drawText("•", {
//           x: x + pad,
//           y: cy,
//           size: fs,
//           font: fBullet,
//           color,
//         });
//       }

//       const first = wrapped[0] || "";
//       const tx0 = isArItem
//         ? getRTLTextX(first, fs, f, x + pad, w - pad * 2 - 14)
//         : x + pad + 14;
//       ctx.page.drawText(first, { x: tx0, y: cy, size: fs, font: f, color });
//       cy -= lineHeight;
//       linesUsed++;

//       for (let i = 1; i < wrapped.length && linesUsed < maxLines; i++) {
//         const ln = wrapped[i];
//         const tx = isArItem
//           ? getRTLTextX(ln, fs, f, x + pad, w - pad * 2 - 14)
//           : x + pad + 14;
//         ctx.page.drawText(ln, { x: tx, y: cy, size: fs, font: f, color });
//         cy -= lineHeight;
//         linesUsed++;
//       }

//       if (linesUsed < maxLines) cy -= 2;
//     }
//   };

//   const colXAt = (index, colCount, colW) => {
//     if (!rtl) return ctx.margin.left + index * (colW + colGapX);
//     return (
//       ctx.pageWidth - ctx.margin.right - (index + 1) * colW - index * colGapX
//     );
//   };

//   // ========== TOP ROW ==========
//   if (topStages.length) {
//     await ctx.need(colH + rowGapY);
//     const rowTop = ctx.y;

//     topStages.forEach((s, i) => {
//       const stData = stagesMap.get(s.order) || {};
//       const included = stagesMap.has(s.order);
//       const deliveryDays = stData?.deliveryDays;

//       const statusText = included
//         ? rtl
//           ? "يشمل العقد"
//           : "Included"
//         : rtl
//         ? "لا يشمل العقد"
//         : "Not included";
//       const daysStr =
//         included && deliveryDays != null
//           ? rtl
//             ? `${formatNumber(deliveryDays, "ar")} أيام`
//             : `${deliveryDays} days`
//           : "—";
//       const details = (STAGE_PROGRESS?.[s.order]?.[lng] || []).slice();
//       if (stData?.notes) details.push(String(stData.notes));

//       const x = colXAt(i, topStages.length, topColW);

//       drawTopCell({
//         x,
//         yTop: rowTop,
//         w: topColW,
//         h: topH,
//         statusText,
//         stageText: s.label,
//       });

//       const midTop = rowTop - topH;
//       drawBox({
//         x,
//         yTop: midTop,
//         w: topColW,
//         h: midH,
//         fill: colors.accentBg,
//         stroke: colors.borderColor,
//       });
//       drawTextClipped(daysStr, {
//         x,
//         yTop: midTop,
//         w: topColW,
//         h: midH,
//         fs: fsMid,
//       });

//       const detTop = midTop - midH;
//       drawBox({
//         x,
//         yTop: detTop,
//         w: topColW,
//         h: detH,
//         fill: colors.accentBg,
//         stroke: colors.borderColor,
//       });
//       drawBulletsClipped(details, {
//         x,
//         yTop: detTop,
//         w: topColW,
//         h: detH,
//         fs: fsDet,
//       });

//       const badge = String(s.order);
//       const bf = pickFont(badge, { bold: true });
//       const by = rowTop - 12;
//       const bx = rtl ? x + topColW - 10 : x + 4;
//       ctx.page.drawText(badge, {
//         x: bx,
//         y: by,
//         size: 9,
//         font: bf,
//         color: colors.heading,
//       });
//     });

//     ctx.y = rowTop - colH - rowGapY;
//   }

//   // ========== BOTTOM ROW ==========
//   if (bottomStages.length) {
//     await ctx.need(colH);
//     const rowTop = ctx.y;

//     bottomStages.forEach((s, i) => {
//       const stData = stagesMap.get(s.order) || {};
//       const included = stagesMap.has(s.order);
//       const deliveryDays = stData?.deliveryDays;

//       const statusText = included
//         ? rtl
//           ? "يشمل العقد"
//           : "Included"
//         : rtl
//         ? "لا يشمل العقد"
//         : "Not included";
//       const daysStr =
//         included && deliveryDays != null
//           ? rtl
//             ? `${formatNumber(deliveryDays, "ar")} أيام`
//             : `${deliveryDays} days`
//           : "—";
//       const details = (STAGE_PROGRESS?.[s.order]?.[lng] || []).slice();
//       if (stData?.notes) details.push(String(stData.notes));

//       const x = colXAt(i, bottomStages.length, botColW);

//       drawTopCell({
//         x,
//         yTop: rowTop,
//         w: botColW,
//         h: topH,
//         statusText,
//         stageText: s.label,
//       });

//       const midTop = rowTop - topH;
//       drawBox({
//         x,
//         yTop: midTop,
//         w: botColW,
//         h: midH,
//         fill: colors.accentBg,
//         stroke: colors.borderColor,
//       });
//       drawTextClipped(daysStr, {
//         x,
//         yTop: midTop,
//         w: botColW,
//         h: midH,
//         fs: fsMid,
//       });

//       const detTop = midTop - midH;
//       drawBox({
//         x,
//         yTop: detTop,
//         w: botColW,
//         h: detH,
//         fill: colors.accentBg,
//         stroke: colors.borderColor,
//       });
//       drawBulletsClipped(details, {
//         x,
//         yTop: detTop,
//         w: botColW,
//         h: detH,
//         fs: fsDet,
//       });

//       const badge = String(s.order);
//       const bf = pickFont(badge, { bold: true });
//       const by = rowTop - 12;
//       const bx = rtl ? x + botColW - 10 : x + 4;
//       ctx.page.drawText(badge, {
//         x: bx,
//         y: by,
//         size: 9,
//         font: bf,
//         color: colors.heading,
//       });
//     });

//     ctx.y = rowTop - colH;
//   }
//   if (needsOwnPage) {
//     await ctx.newPage(); // start a fresh page for the next section
//   } else {
//     ctx.y -= 8; // small breathing space when sharing a page
//   }
// }

async function renderStageClauses(ctx, { lng, fonts, colors }) {
  // extra spacing before this section starts
  ctx.y -= 16;

  await ctx.writeTitle(lng === "ar" ? "بنود المراحل" : "Stage Clauses");
  for (const i of [1, 2, 3, 4, 5, 6]) {
    const text = STAGE_CLAUSES_DEFAULT?.[i]?.[lng];
    if (!text) continue;
    const head = lng === "ar" ? `بنود المرحلة ${i}` : `Stage ${i} Terms`;
    await writeSubhead(ctx, head, { fonts, colors, fs: 12 });
    await writeParagraphOrList(ctx, text, { fonts, colors, fs: 11 });
    ctx.y -= 2;
  }
}

async function renderPartyTwoObligations(ctx, { lng, fonts, colors }) {
  await ctx.writeTitle(
    lng === "ar" ? "التزامات الفريق الثاني" : "Party Two Obligations"
  );
  const text = OBLIGATIONS_TEXT.partyTwo[lng] || "";
  await writeParagraphOrList(ctx, text, { fonts, colors, fs: 11 });
}

async function renderHandwrittenSpecialClauses(ctx, { lng, fonts, colors }) {
  const items = HANDWRITTEN_SPECIAL_CLAUSES?.[lng] || [];
  if (!items.length) return;
  await ctx.writeTitle(lng === "ar" ? "بنود خاصة " : "Special Terms");
  await writeParagraphOrList(ctx, items.map((t) => ` ${t}`).join("\n"), {
    fonts,
    colors,
    fs: 11,
  });
}

async function renderDrawingsSection(
  ctx,
  { lng, contract, defaultDrawingUrl, fonts, colors }
) {
  const drawings = contract?.drawings || [];
  const toRender = drawings.length
    ? drawings.map((d) => d.url)
    : defaultDrawingUrl
    ? [defaultDrawingUrl]
    : [];

  const maxW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
  const maxH = 150;

  // ---- half-page guard helpers ----
  const usableHeight = ctx.pageHeight - ctx.margin.top - ctx.margin.bottom;
  const minHeightNeeded = usableHeight * 0.2;
  console.log(usableHeight, "usableHeight");
  console.log(minHeightNeeded, "minHeightNeeded");

  const ensureHalfPageRemaining = async () => {
    const remaining = ctx.y - ctx.margin.bottom;
    if (remaining < minHeightNeeded) {
      // Ask for a full usable page to force a page break when needed
      await ctx.need(usableHeight);
    }
  };

  // Ensure we have >= 50% page left before starting this block
  await ensureHalfPageRemaining();
  await ctx.writeTitle(FIXED_TEXT.titles.drawings[lng]);

  for (const rawUrl of toRender) {
    try {
      const bytes = await fetchImageBuffer(rawUrl);
      let img;
      try {
        img = await ctx.pdfDoc.embedPng(bytes);
      } catch {
        img = await ctx.pdfDoc.embedJpg(bytes);
      }
      if (!img) continue;

      // Before drawing each image, ensure >= 50% of page is left
      await ensureHalfPageRemaining();

      let { width: sw, height: sh } = img.size();
      let W = sw,
        H = sh;
      const r = Math.min(maxW / W, maxH / H, 1);
      W *= r;
      H *= r;

      // Also make sure the actual image block fits (your original check)
      await ctx.need(H + 28);

      const centerX = ctx.margin.left + (maxW - W) / 2;

      ctx.page.drawImage(img, {
        x: centerX,
        y: ctx.y - H,
        width: W,
        height: H,
      });

      ctx.y -= H + 16;
    } catch {
      await ctx.writeLineAuto(rawUrl, 10, false, colors.red);
    }
  }
}

async function renderConfirmationAndSignaturePage(
  ctx,
  { lng, clientName, signatureUrl, fonts, colors }
) {
  await ctx.newPage();

  // Confirmation
  await ctx.writeTitle(FIXED_TEXT.titles.confirmation[lng]);

  // Day name + date
  const locale = lng === "ar" ? "ar" : "en";
  dayjs.locale(locale);
  const todayDate = dayjs().format("YYYY/MM/DD");
  const weekday = dayjs().format("dddd");

  // Additional approval paragraph and lines
  const approvalAr =
    "التـــوقيــــع والاعـــتمــــاد :\n" +
    "قام الطرف الاولي بالاطلاع علي جميع بنود الإتفاقية بالتفصيل , وعليها يوقع ويلتزم.\n" +
    `وقعت هذه الاتفاقية يوم : ${weekday} بتاريخ ${todayDate}\n`;
  const approvalEn =
    "Signature & Approval:\n" +
    "Party One has reviewed all agreement terms in detail and hereby signs and commits.\n" +
    `This agreement was signed on: ${weekday}, dated ${todayDate}\n`;

  await ctx.writeLineAuto(
    FIXED_TEXT.confirmationLabel[lng] ||
      (lng === "ar"
        ? "أقرّ بأنني قرأت جميع البنود وأوافق عليها"
        : "I confirm that I have read and agree to all terms"),
    12,
    false,
    colors.textColor
  );
  ctx.y -= 8;
  await ctx.writeLineAuto(
    lng === "ar" ? approvalAr : approvalEn,
    11,
    false,
    colors.textColor
  );
  ctx.y -= 10;

  // Parties line (pulled inward slightly)
  const colGap = 28;
  const innerEdgeInset = 8;
  const colW =
    (ctx.pageWidth -
      ctx.margin.left -
      ctx.margin.right -
      colGap -
      innerEdgeInset * 2) /
    2;
  const leftX = ctx.margin.left + innerEdgeInset;
  const rightX = ctx.margin.left + innerEdgeInset + colW + colGap;
  let leftY = ctx.y;
  let rightY = ctx.y;

  const secondParty = lng === "ar" ? "الفـــــريق الـــــثاني" : "Second Party";
  const firstParty = lng === "ar" ? "الفـــــريـــــق الاول" : "First Party";
  const sigLabel = lng === "ar" ? "التوقيع:" : "Signature:";
  const secondPartyName = "دريم ستوديوو";
  const firstPartyName = clientName || (lng === "ar" ? "المالك" : "Owner");

  // helper: resolve x according to language (RTL aligns to the right edge of the cell)
  const rtlX = (baseX, text, size, font) =>
    lng === "ar"
      ? getRTLTextX(text, size, font, baseX, colW) // align to right within the cell box
      : baseX;

  // Left block (Team Two)
  {
    const { bold } = pickFontsForText(secondParty, fonts);
    const title = lng === "ar" ? reText(secondParty) : secondParty;
    ctx.page.drawText(title, {
      x: rtlX(leftX, title, 12, bold),
      y: leftY,
      size: 12,
      font: bold,
      color: colors.heading,
    });
    leftY -= 16;

    const nameTxt = lng === "ar" ? reText(secondPartyName) : secondPartyName;
    const nameFont = pickFontsForText(secondPartyName, fonts).font;
    ctx.page.drawText(nameTxt, {
      x: rtlX(leftX, nameTxt, 11, nameFont),
      y: leftY,
      size: 11,
      font: nameFont,
      color: colors.textColor,
    });
    leftY -= 16;

    const sigTxt = lng === "ar" ? reText(sigLabel) : sigLabel;
    const sigFont = pickFontsForText(sigLabel, fonts).font;
    ctx.page.drawText(sigTxt, {
      x: rtlX(leftX, sigTxt, 11, sigFont),
      y: leftY,
      size: 11,
      font: sigFont,
      color: colors.textColor,
    });
    leftY -= 60; // space for stamp/signature
  }

  // Right block (Team One)
  {
    const { bold } = pickFontsForText(firstParty, fonts);
    const title = lng === "ar" ? reText(firstParty) : firstParty;
    ctx.page.drawText(title, {
      x: rtlX(rightX, title, 12, bold),
      y: rightY,
      size: 12,
      font: bold,
      color: colors.heading,
    });
    rightY -= 16;

    const roleName =
      lng === "ar" ? "المالك او وكيله" : "Owner or Authorized Representative";
    const roleTxt = lng === "ar" ? reText(roleName) : roleName;
    const roleFont = pickFontsForText(roleName, fonts).font;
    ctx.page.drawText(roleTxt, {
      x: rtlX(rightX, roleTxt, 11, roleFont),
      y: rightY,
      size: 11,
      font: roleFont,
      color: colors.textColor,
    });
    rightY -= 14;

    const firstNameTxt = lng === "ar" ? reText(firstPartyName) : firstPartyName;
    const firstNameFont = pickFontsForText(firstPartyName, fonts).font;
    ctx.page.drawText(firstNameTxt, {
      x: rtlX(rightX, firstNameTxt, 11, firstNameFont),
      y: rightY,
      size: 11,
      font: firstNameFont,
      color: colors.textColor,
    });
    rightY -= 16;

    const sigTxt = lng === "ar" ? reText(sigLabel) : sigLabel;
    const sigFont = pickFontsForText(sigLabel, fonts).font;
    ctx.page.drawText(sigTxt, {
      x: rtlX(rightX, sigTxt, 11, sigFont),
      y: rightY,
      size: 11,
      font: sigFont,
      color: colors.textColor,
    });
    rightY -= 60;
  }

  // Stamp/signature (Team Two)
  try {
    const stampBytes = await fetchImageBuffer(
      "https://dreamstudiio.com/dream-signature.png"
    );
    let stamp;
    try {
      stamp = await ctx.pdfDoc.embedPng(stampBytes);
    } catch {
      stamp = await ctx.pdfDoc.embedJpg(stampBytes);
    }
    if (stamp) {
      const scale = 0.22;
      ctx.page.drawImage(stamp, {
        x: leftX,
        y: leftY - stamp.size().height * scale - 6,
        width: stamp.size().width * scale,
        height: stamp.size().height * scale,
      });
    }
  } catch {}

  // Client signature image — pulled inward from the outer edge
  if (signatureUrl) {
    try {
      const bytes = await fetchImageBuffer(signatureUrl);
      let sig;
      try {
        sig = await ctx.pdfDoc.embedPng(bytes);
      } catch {
        sig = await ctx.pdfDoc.embedJpg(bytes);
      }
      if (sig) {
        const maxW = colW - 20;
        const maxH = 150;
        let { width: sw, height: sh } = sig.size();
        let W = sw,
          H = sh;
        const r = Math.min(maxW / W, maxH / H, 1);
        W *= r;
        H *= r;
        ctx.page.drawImage(sig, {
          x: rightX + 20,
          y: rightY - H + 40,
          width: W,
          height: H,
        });
      }
    } catch {
      await ctx.writeLineAuto(
        lng === "ar"
          ? "ملاحظة: لم يتم تحميل صورة التوقيع."
          : "Note: Signature image could not be loaded.",
        11,
        false,
        colors.red
      );
    }
  }
}

async function renderFooterPageNumbers(
  pdfDoc,
  { lng, fonts, colors, pageWidth }
) {
  const total = pdfDoc.getPageCount();
  const pages = pdfDoc.getPages();
  dayjs.locale(lng === "ar" ? "ar" : "en");

  // Exclude intro page from count and numbering
  for (let i = 0; i < total; i++) {
    if (i === 0) continue;

    const pg = pages[i];
    const fs = 10;
    const dateText = dayjs().format("MMMM D, YYYY");
    const pageText = i.toString();
    const dateFont = fonts.enFont;
    const { font: pageFont } = pickFontsForText(pageText, fonts);

    const dtw = dateFont.widthOfTextAtSize(dateText, fs);
    const ptw = pageFont.widthOfTextAtSize(pageText, fs);

    // Push lower
    const bottomY = 14;
    const pageTextY = 39;

    // pg.drawText(dateText, {
    //   x: 18,
    //   y: bottomY,
    //   size: fs,
    //   font: dateFont,
    //   color: colors.textColor,
    // });
    pg.drawText(isRTL(pageText) ? reText(pageText) : pageText, {
      x: Math.round((pageWidth - ptw) / 2),
      y: pageTextY,
      size: 12,
      font: pageFont,
      color: colors.white,
    });
  }
}

// ===== Public API =====
export async function generateContractPdf({
  contract,
  lng = "ar",
  clientName,
  signatureUrl,
  backgroundImageUrl,
  introImageUrl,
  // layout
  pageWidth = 600,
  pageHeight = 800,
  padding = { top: 72, right: 56, bottom: 72, left: 56 },
  defaultDrawingUrl = null,
}) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const arFont = await pdfDoc.embedFont(fontBase64);
  const arBold = await pdfDoc.embedFont(fontBoldBase64);
  const enFont = await pdfDoc.embedFont(enfontBase64);
  const enBold = await pdfDoc.embedFont(enfontBoldBase64);
  const fonts = { arFont, arBold, enFont, enBold };

  // Palette
  const colors = {
    primary: rgb(0.827, 0.675, 0.443),
    primaryDark: rgb(0.745, 0.592, 0.361),
    primaryLight: rgb(0.95, 0.92, 0.88),
    heading: rgb(0.22, 0.188, 0.157),
    textColor: rgb(0.345, 0.302, 0.247),
    bgPrimary: rgb(0.918, 0.906, 0.886),
    accentBg: rgb(0.98, 0.97, 0.95),
    success: rgb(0.518, 0.569, 0.471),
    borderColor: rgb(0.7, 0.7, 0.7),
    white: rgb(1, 1, 1),
    lightGray: rgb(0.95, 0.95, 0.95),
    shadowColor: rgb(0.85, 0.85, 0.85),
    red: rgb(1, 0, 0),
  };

  const margin = {
    top: padding.top,
    right: padding.right,
    bottom: padding.bottom,
    left: padding.left,
  };

  const ctx = createPdfContext({
    pdfDoc,
    pageWidth,
    pageHeight,
    margin,
    startTopOffset: 80,
    lng,
  });
  ctx.pdfDoc = pdfDoc;
  ctx.drawBg = async (pg) => {
    await drawFullBackgroundImage(pg, pdfDoc, backgroundImageUrl);
  };

  // Titles (add small top margin so titles don't stick to previous block)
  ctx.writeTitle = async (title) => {
    const fs = 16;
    // extra pre-gap before drawing the title
    ctx.y -= 6;
    await ctx.need(fs + 26);
    const { bold } = pickFontsForText(title, fonts);
    const contentW = pageWidth - margin.left - margin.right;
    const text = ctx.lng === "ar" ? reText(title) : title;
    const tx =
      ctx.lng === "ar"
        ? getRTLTextX(text, fs, bold, margin.left, contentW)
        : margin.left;
    ctx.page.drawText(text, {
      x: tx,
      y: ctx.y,
      size: fs,
      font: bold,
      color: colors.heading,
    });
    ctx.y -= fs + 12;
  };

  // Unified line writer (dir + latin detection)
  ctx.writeLineAuto = async (
    t,
    fs = 11,
    isBold = false,
    color = colors.textColor,
    overrideDir = null,
    forceFont = null
  ) => {
    const raw = String(t ?? "");
    const contentW = pageWidth - margin.left - margin.right;

    const isLatin = ASCII_RE.test(raw);
    const dir =
      overrideDir || (isLatin ? "ltr" : ctx.lng === "ar" ? "rtl" : "ltr");
    const { font, bold } = isLatin
      ? { font: fonts.enFont, bold: fonts.enBold }
      : pickFontsForText(raw, fonts);
    const useFont = forceFont ? forceFont : isBold ? bold : font;

    const shaped = dir === "rtl" ? reText(raw) : raw;
    const lines = splitTextIntoLines(shaped, contentW, useFont, fs);

    for (const line of lines) {
      await ctx.need(fs + 8);
      const tx =
        dir === "rtl"
          ? getRTLTextX(line, fs, useFont, margin.left, contentW)
          : margin.left;
      ctx.page.drawText(line, {
        x: tx,
        y: ctx.y,
        size: fs,
        font: useFont,
        color,
      });
      ctx.y -= fs + 6;
    }
  };

  // 1) Intro
  await renderIntroPage(ctx, {
    introImageUrl,
    title: lng === "ar" ? "" : "",
    fonts,
    colors,
  });

  // 2) Content
  await ctx.ensurePage();
  await renderClientSection(ctx, { lng, contract, fonts, colors });
  await renderAmountSection(ctx, { lng, contract });
  await renderDbSpecialItems(ctx, { lng, contract, fonts, colors });
  await renderPartyOneWithPayments(ctx, { lng, contract, fonts, colors });
  await renderStagesTable(ctx, { lng, contract, fonts, colors });
  await renderStageClauses(ctx, { lng, fonts, colors });
  await renderPartyTwoObligations(ctx, { lng, fonts, colors });
  await renderHandwrittenSpecialClauses(ctx, { lng, fonts, colors });
  await renderDrawingsSection(ctx, {
    lng,
    contract,
    defaultDrawingUrl,
    fonts,
    colors,
  });

  // 3) Confirmation + Signature ON THE SAME PAGE
  await renderConfirmationAndSignaturePage(ctx, {
    lng,
    clientName,
    signatureUrl,
    fonts,
    colors,
  });

  // 4) Footer (exclude intro page and push lower)
  await renderFooterPageNumbers(pdfDoc, { lng, fonts, colors, pageWidth });

  return await pdfDoc.save();
}

export async function buildAndUploadContractPdf({
  token,
  lng = "ar",
  signatureUrl,
  defaultDrawingUrl = null,
}) {
  const siteUtility = await prisma.siteUtility.findFirst();
  const backgroundImageUrl = siteUtility?.pdfFrame || null;
  const introImageUrl = siteUtility?.introPage || null;

  const contract = await prisma.contract.findUnique({
    where: { arToken: token },
    include: {
      clientLead: { include: { client: true } },
      stages: {
        include: {
          project: true,
        },
      },
      paymentsNew: {
        include: {
          project: true,
        },
      },
      drawings: true,
      specialItems: true,
    },
  });
  if (!contract) throw new Error("Contract not found");

  const clientName = contract?.clientLead?.client?.name || "";

  const arPdfBytes = await generateContractPdf({
    contract,
    lng: "ar",
    clientName,
    signatureUrl,
    backgroundImageUrl,
    introImageUrl,
    defaultDrawingUrl,
    padding: { top: 72, right: 56, bottom: 72, left: 56 },
  });
  const arPublicUrl = await generateContractPdfLinksInBothLanguages({
    contract,
    lng: "ar",
    pdfBytes: arPdfBytes,
  });
  const enPdfBytes = await generateContractPdf({
    contract,
    lng: "en",
    clientName,
    signatureUrl,
    backgroundImageUrl,
    introImageUrl,
    defaultDrawingUrl,
    padding: { top: 72, right: 56, bottom: 72, left: 56 },
  });
  const enPublicUrl = await generateContractPdfLinksInBothLanguages({
    contract,
    lng: "en",
    pdfBytes: enPdfBytes,
  });
  return arPublicUrl;
}
async function generateContractPdfLinksInBothLanguages({
  contract,
  lng,
  pdfBytes,
}) {
  const fileName = `contract-${contract.id}-${lng}-${uuidv4()}.pdf`;
  const remotePath = `public_html/uploads/${fileName}`;
  await uploadToFTPHttpAsBuffer(pdfBytes, remotePath, true);
  const publicUrl = `https://panel.dreamstudiio.com/uploads/${fileName}`;

  if (lng === "ar") {
    await prisma.contract.update({
      where: { id: Number(contract.id) },
      data: { pdfLinkAr: publicUrl },
    });
  } else {
    await prisma.contract.update({
      where: { id: Number(contract.id) },
      data: { pdfLinkEn: publicUrl },
    });
  }
  return publicUrl;
}
