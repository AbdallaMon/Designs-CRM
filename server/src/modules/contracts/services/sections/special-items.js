import { writeParagraphOrList } from "../contract-pdf-context.js";

export async function renderDbSpecialItems(
  ctx,
  { lng, contract, fonts, colors, defaultContractUtilityData },
) {
  if (!defaultContractUtilityData?.specialClauses?.length) return;
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
