import { formatAED } from "../../../../infra/pdf/pdf-helpers.js";
import { FIXED_TEXT } from "../witten-blocks-data.js";

export async function renderAmountSection(ctx, { lng, contract }) {
  const amount = Number(contract?.amount ?? 0);
  const vatRate = Number(contract?.taxRate ?? 0);
  const total = contract?.totalAmount ?? amount * (1 + vatRate / 100);

  await ctx.writeTitle(FIXED_TEXT.titles.amounts[lng]);
  if (lng === "ar") {
    await ctx.writeLineAuto(
      `اتفق الفريقان علي أن تكون تكلفة التصميم الداخلي للمشروع هي: ${formatAED(
        amount,
        "ar",
      )}`,
      11,
      false,
    );
    await ctx.writeLineAuto(
      `مع ضريبة ${vatRate || 0}% تصبح تكلفة التصميم ${formatAED(
        total,
        "ar",
      )} .`,
      11,
      false,
    );
  } else {
    await ctx.writeLineAuto(
      `Both parties agreed that the interior design cost is: ${formatAED(
        amount,
        "en",
      )}.`,
      11,
      false,
    );
    await ctx.writeLineAuto(
      `With VAT ${vatRate || 0}%, the total design cost becomes ${formatAED(
        total,
        "en",
      )}.`,
      11,
      false,
    );
  }
}
// SERVER / PDF
