// admin-residual display constants — single language (Arabic / RTL). These drive the
// report filter form (emirate / status / lead-type options) and the small label lookups in
// the commissions + archive tabs. VALUES are the Prisma enum keys (the contract the frozen
// report generators query on); labels are Arabic. The lead-status set mirrors the leads
// feature's ClientLeadStatus map so the report filter reads identically.

// Emirate enum (schema.prisma `enum Emirate`) — the report `emirates[]` filter.
export const EMIRATE_LABELS = {
  DUBAI: "دبي",
  ABU_DHABI: "أبو ظبي",
  SHARJAH: "الشارقة",
  AJMAN: "عجمان",
  UMM_AL_QUWAIN: "أم القيوين",
  RAS_AL_KHAIMAH: "رأس الخيمة",
  FUJAIRAH: "الفجيرة",
  KHOR_FAKKAN: "خورفكان",
  OUTSIDE: "خارج الدولة",
};

// Lead status (ClientLeadStatus) — the report `statuses[]` filter. Same keys/labels as the
// leads feature uses (kept local so this feature stays self-contained).
export const LEAD_STATUS_LABELS = {
  NEW: "جديد",
  IN_PROGRESS: "قيد التنفيذ",
  INTERESTED: "مهتم",
  NEEDS_IDENTIFIED: "تحديد الاحتياجات",
  LEADEXCHANGE: "تبادل العملاء",
  NEGOTIATING: "تفاوض",
  REJECTED: "مرفوض",
  FINALIZED: "منتهي",
  CONVERTED: "محوّل",
  ON_HOLD: "معلّق",
  ARCHIVED: "مؤرشف",
};

// Lead category (LeadCategory) — the report `type` lens. The frozen lead-report reads
// `reportType` ("finalized" forces status FINALIZED) — exposed as a simple lens select.
export const REPORT_TYPE_OPTIONS = [
  { value: "", labelAr: "كل العملاء" },
  { value: "finalized", labelAr: "العملاء المنتهون فقط" },
];

export const emirateLabel = (v) => EMIRATE_LABELS[v] ?? v ?? "—";
export const leadStatusLabel = (v) => LEAD_STATUS_LABELS[v] ?? v ?? "—";

// Money/number formatting for the commissions + report summary cards (AED, Arabic-friendly
// Western digits to match the legacy reports).
export const formatAed = (n) => {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num)) return "0";
  return `${num.toLocaleString("en-US", { maximumFractionDigits: 2 })} د.إ`;
};

export const formatDate = (value) => {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toISOString().split("T")[0];
  } catch {
    return "—";
  }
};
