import { writeSubhead, writeParagraphOrList, buildPaymentLine } from "../contract-pdf-context.js";

export async function renderPartyOneWithPayments(
  ctx,
  { lng, contract, fonts, colors, defaultContractUtilityData },
) {
  await ctx.writeTitle(
    lng === "ar" ? "التزامات الفريق الأول" : "Party One Obligations",
  );

  const taxRate = Number(contract?.taxRate || 5);
  const base =
    lng === "ar"
      ? defaultContractUtilityData?.obligationsPartyOneAr
      : defaultContractUtilityData?.obligationsPartyOneEn;
  const items = (base || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((ln) => !/^الت.*زامات|Obligations/i.test(ln));
  await writeParagraphOrList(
    ctx,
    items
      .map((t) => (t.match(/^(\u2022|•|-|–|\d+[).])/) ? t : `${t}`))
      .join("\n"),
    { fonts, colors, fs: 11 },
  );

  const payments = contract?.paymentsNew || contract?.payments || [];
  if (payments.length) {
    await writeSubhead(
      ctx,
      lng === "ar" ? "جدول الدفعات" : "Payment schedule",
      { fonts, colors, fs: 12 },
    );
    const paymentLines = payments.map((p, i) =>
      buildPaymentLine({ payment: p, index: i + 1, lng, taxRate }),
    );
    await writeParagraphOrList(ctx, paymentLines.join("\n"), {
      fonts,
      colors,
      fs: 11,
    });
  }
}

// ===== Redesigned Stages “Cards”
