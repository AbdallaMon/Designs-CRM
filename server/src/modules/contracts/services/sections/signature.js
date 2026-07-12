import { pickFontsForText } from "../contract-pdf-context.js";
import { fetchImageBuffer, getRTLTextX, reText, reverseString } from "../../../../infra/pdf/pdf-helpers.js";
import { FIXED_TEXT } from "../witten-blocks-data.js";
import dayjs from "dayjs";

export async function renderConfirmationAndSignaturePage(
  ctx,
  { lng, clientName, signatureUrl, signaturePartUrl, fonts, colors },
) {
  await ctx.newPage();

  // Confirmation
  await ctx.writeTitle(FIXED_TEXT.titles.confirmation[lng]);

  // Day name + date
  const locale = lng === "ar" ? "ar" : "en";
  dayjs.locale(locale);
  const todayDate = dayjs().format("DD/MM/YYYY");
  const weekday = dayjs().format("dddd");

  // Additional approval paragraph and lines
  const approvalAr =
    "التوقيع والاعتماد :\n" +
    "قام الطرف الاولي بالاطلاع علي جميع بنود الإتفاقية بالتفصيل , وعليها يوقع ويلتزم.\n" +
    `وقعت هذه الاتفاقية يوم : ${weekday} بتاريخ ${reverseString(
      todayDate.toString(),
    )}\n`;
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
    colors.textColor,
  );
  ctx.y -= 8;
  await ctx.writeLineAuto(
    lng === "ar" ? approvalAr : approvalEn,
    11,
    false,
    colors.textColor,
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
  const secondPartyName = lng === "ar" ? "دريم ستوديوو" : "Dream Studiio";
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

  // Stamp/signature (Team Two) — company signature from SiteUtility.pdfSignaturePart
  // (resolved with the shared default upstream), fetched via CRM_DOMAIN.
  try {
    const stampBytes = await fetchImageBuffer(
      signaturePartUrl || PDF_ASSET_DEFAULTS.pdfSignaturePart,
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
        colors.red,
      );
    }
  }
}
