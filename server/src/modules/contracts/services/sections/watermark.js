import { reText } from "../../../../infra/pdf/pdf-helpers.js";
import { rgb, degrees } from "pdf-lib";

export async function drawCancelledWatermarkOnAllPages(
  pdfDoc,
  {
    fonts,
    textAr = "تم إلغاء هذا العقد",
    textEn = "THIS CONTRACT HAS BEEN CANCELLED",
    lng,
    color = rgb(1, 0, 0),

    // شفافية و زوايا
    opacity = 0.06, // شفافية العلامة المائية الأساسية (قابلة للتعديل)
    angleDeg = 33, // زاوية الميل
    gap = 180, // المسافة الرأسية بين السطور (قابلة للتعديل)
  } = {},
) {
  const wantAr = lng === "ar";

  // اختيار الخط حسب اللغة (بدون خلط)
  const mainFont =
    (wantAr
      ? fonts?.arBold || fonts?.arFont
      : fonts?.enBold || fonts?.enFont) || null;

  if (!mainFont) return; // لو مفيش خط، نخرج بهدوء بدون ما نبوظ الـ PDF

  // النص حسب اللغة
  const rawText = wantAr ? (textAr || "").trim() : (textEn || "").trim();
  if (!rawText) return;

  const text = wantAr ? reText(String(rawText)) : String(rawText);

  const pages = pdfDoc.getPages();
  const angle = degrees(angleDeg);

  for (const page of pages) {
    const pw = page.getWidth();
    const ph = page.getHeight();

    // حجم الخط الأساسي مناسب للصفحة (مياه بين كبيرة وواضحة بس مش مزعجة)
    let fs = Math.max(32, Math.min(64, Math.floor(Math.max(pw, ph) / 18)));

    // تأكد إنه مش عريض أوي
    const maxLineWidth = pw * 0.9;
    while (fs > 18 && mainFont.widthOfTextAtSize(text, fs) > maxLineWidth) {
      fs -= 2;
    }

    const textWidth = mainFont.widthOfTextAtSize(text, fs);

    // خطوة أفقية بين كل تكرار (علشان يملأ الصفحة من غير فراغ كبير)
    const stepX = textWidth + 80;

    // خطوة رأسية بين السطور (باستخدام gap اللي بتمرره)
    const stepY = Math.max(gap, fs * 2.2);

    // نغطي مساحة أكبر من الصفحة شوية علشان الدوران
    for (let y = -ph; y < ph * 2; y += stepY) {
      for (let x = -pw; x < pw * 2; x += stepX) {
        page.drawText(text, {
          x,
          y,
          size: fs,
          font: mainFont,
          color,
          opacity,
          rotate: angle,
        });
      }
    }
  }
}

// ===== Public API =====
