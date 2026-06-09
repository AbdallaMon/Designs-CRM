// Central Arabic map for the PRISMA-KNOWN message CODES.
// translationKey namespace: "prismaKnowMessages" (declared in
// packages/shared/messages-names.js but with NO codes file in packages/shared — it is a
// RESERVED namespace; the BE today maps known Prisma errors to DOMAIN codes, e.g.
// EMAIL_ALREADY_REGISTERED, IMAGE_SESSION_PAGE_INFO_TYPE_EXISTS, before they reach the
// client). This map is a SAFETY NET: if a raw Prisma error code ever leaks through the
// envelope (P2002 unique violation, P2025 record not found, etc.), it still resolves to a
// human Arabic string instead of the raw "P2002". CODE → عربي.

export const prismaKnowMessages = {
  P2002: "هذه البيانات موجودة بالفعل",
  P2003: "لا يمكن إتمام العملية بسبب ارتباط هذا العنصر بعناصر أخرى",
  P2014: "العملية تخالف العلاقة بين البيانات",
  P2025: "العنصر المطلوب غير موجود",
  P2000: "إحدى القيم المدخلة أطول من المسموح",
  P2011: "حقل مطلوب غير معبأ",
  // Generic prisma-known fallback used by the namespace lookup when the exact P-code
  // is not listed above.
  PRISMA_KNOWN_ERROR: "حدث خطأ في معالجة البيانات، حاول مرة أخرى",
};
