export const BOOKING_LEAD_FIELD_LABELS = {
  location: "الموقع",
  projectType: "نوع المشروع",
  projectStage: "مرحلة المشروع",
  previousWork: "أعمال سابقة",
  hasArchitecturalPlan: "المخطط المعماري",
  serviceType: "نوع الخدمة",
  decisionMaker: "صاحب القرار",
  bookingRequestStatus: "حالة الطلب",
  bookingSubmittedAt: "تاريخ الإرسال",
};

export const BOOKING_LEAD_FIELDS = [
  "location",
  "projectType",
  "projectStage",
  "previousWork",
  "hasArchitecturalPlan",
  "serviceType",
  "decisionMaker",
  "bookingRequestStatus",
  "bookingSubmittedAt",
];

export const BOOKING_LEAD_VALUE_LABELS = {
  location: {
    ABU_DHABI: "أبو ظبي",
    ABU_DHABI_AL_AIN: "أبو ظبي / العين",
    DUBAI: "دبي",
    SHARJAH: "الشارقة",
    SHARJAH_KHOR_FAKKAN: "الشارقة / خورفكان",
    RAS_AL_KHAIMAH: "رأس الخيمة",
    AJMAN: "عجمان",
    UMM_AL_QUWAIN: "أم القيوين",
    FUJAIRAH: "الفجيرة",
    DIBBA_FUJAIRAH: "دبا الفجيرة",
  },
  projectType: {
    PRIVATE_VILLA: "فيلا خاصة",
    PALACE: "قصر / فيلا كبيرة",
    TOWNHOUSE: "تاون هاوس",
    APARTMENT: "شقة",
    COMMERCIAL: "مشروع تجاري",
  },
  projectStage: {
    ON_PLAN: "ما زال على المخطط",
    EXCAVATION: "مرحلة الحفر والأساسات",
    COLUMNS_AND_BRICKWORK: "مرحلة الأعمدة والطابوق",
    PLASTERING_AND_EXTENSIONS: "مرحلة اللياسة والتمديدات",
    FINISHING: "مرحلة التشطيب",
    RENOVATION: "البيت جاهز وأريد تجديد",
  },
  previousWork: {
    NO: "لا، لم أبدأ بعد",
    STARTED_NOT_FINALIZED: "نعم، لكن لم أعتمد شيء نهائي",
    STARTED_WITH_OTHER: "نعم، بدأنا فعلاً مع جهة أخرى",
  },
  hasArchitecturalPlan: {
    YES: "نعم",
    NO: "لا",
    YES_WITH_NOTES: "نعم، لكن عندي ملاحظات ومش مرتاح له",
  },
  serviceType: {
    DESIGN_ONLY: "تصميم فقط",
    DESIGN_AND_PLANS: "تصميم + مخططات تنفيذية",
    DESIGN_AND_EXECUTION_AND_QUALITY_SUPERVISION:
      "تصميم + تنفيذ + إشراف ضبط جودة",
  },
  decisionMaker: {
    ME: "أنا صاحب القرار",
    ME_AND_PARTNER: "أنا وشريك / زوجة / العائلة",
    NOT_ME: "لست صاحب القرار النهائي",
  },
  bookingRequestStatus: {
    IN_PROGRESS: "جاري",
    SUBMITTED: "تم الإرسال",
  },
};
