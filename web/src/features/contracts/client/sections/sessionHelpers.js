// sessionHelpers.js
// Helpers extracted from ContractSession.jsx (kept unchanged behavior)
import dayjs from "dayjs";
import "dayjs/locale/ar";
import {
  COUNTRY_LABEL,
  EMIRATE_LABEL,
  UAE_LABEL,
} from "@/app/helpers/constants";
import { PAYMENT_ORDINAL } from "@/features/contracts/client/wittenBlocksData.js";

// -----------------------------
// Helpers (kept unchanged behavior)
// -----------------------------
export const formatAED = (value, lng) => {
  try {
    const n = Number(value ?? 0);
    const locale = lng === "ar" ? "ar-AE" : "en-AE";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${value} AED`;
  }
};

export const emirateOrCountryLabel = ({ emirate, country }, lng) => {
  if (!emirate || emirate === "OUTSIDE") {
    if (country && COUNTRY_LABEL[country]) return COUNTRY_LABEL[country][lng];
    return country || "-";
  }
  return `${EMIRATE_LABEL[lng][emirate]} — ${UAE_LABEL[lng]}`;
};

export const extractStageNumber = (title, fallbackOrder) => {
  if (!title) return fallbackOrder ?? 0;
  const m = String(title).match(/(\d+)$/);
  if (m) return Number(m[1]);
  return fallbackOrder ?? 0;
};

export const numList = (arr) => arr.filter((v) => v != null && v !== "").join(", ");

export const getToday = (lng) => {
  const locale = lng === "ar" ? "ar" : "en";
  return dayjs().locale(locale).format("YYYY/MM/DD");
};

// FRONTEND
export function buildPaymentLine({ payment, index, lng, taxRate }) {
  const ordinal =
    PAYMENT_ORDINAL[lng][index] ||
    (lng === "ar" ? `دفعة ${index}` : `Payment ${index}`);

  const baseAmountNum = Number(payment.amount || 0);
  const rate = taxRate > 1 ? taxRate / 100 : taxRate; // expects 0.05, but handles 5 too
  const amountWithTaxNum = baseAmountNum * (1 + (rate || 0));

  const amt = formatAED(baseAmountNum, lng);
  const amtWithTax = formatAED(amountWithTaxNum, lng);

  let primary =
    lng === "ar"
      ? payment.conditionItem?.labelAr
      : payment.conditionItem?.labelEn || payment.conditionItem?.labelAr;

  const taxNote =
    lng === "ar"
      ? `${amtWithTax} (شامل الضريبة)`
      : `${amtWithTax} (VAT included)`;

  if (index === 1) {
    return lng === "ar"
      ? `• ${ordinal} عند توقيع العقد بقيمه: ${taxNote}`
      : `• ${ordinal} on contract signature: ${taxNote}`;
  }

  return lng === "ar"
    ? `• ${ordinal} ${primary || ""} : ${taxNote}`
    : `• ${ordinal} ${primary || ""} : ${taxNote}`;
}

// small util to split first sentence (for highlighting)
export const splitFirstSentence = (text) => {
  if (!text) return ["", ""];
  const nl = text.indexOf("\n");
  const plain = nl > -1 ? text.slice(0, nl + 1) + text.slice(nl + 1) : text;
  const match = plain.match(/^(.+?[.!؟\n])(\s*)([\s\S]*)$/u);
  if (match) return [match[1].trim(), match[3].trim()];
  // fallback: split by first dot
  const idx = plain.indexOf(".");
  if (idx > -1)
    return [plain.slice(0, idx + 1).trim(), plain.slice(idx + 1).trim()];
  return [plain, ""];
};
