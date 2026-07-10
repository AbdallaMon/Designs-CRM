export const BOOKING_LEAD_FIELD_LABELS = {
  location: "Location",
  projectType: "Project type",
  projectStage: "Project stage",
  previousWork: "Previous work",
  hasArchitecturalPlan: "Architectural plan",
  serviceType: "Service type",
  decisionMaker: "Decision maker",
  bookingRequestStatus: "Request status",
  bookingSubmittedAt: "Submitted at",
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
    ABU_DHABI: "Abu Dhabi",
    ABU_DHABI_AL_AIN: "Abu Dhabi / Al Ain",
    DUBAI: "Dubai",
    SHARJAH: "Sharjah",
    SHARJAH_KHOR_FAKKAN: "Sharjah / Khor Fakkan",
    RAS_AL_KHAIMAH: "Ras Al Khaimah",
    AJMAN: "Ajman",
    UMM_AL_QUWAIN: "Umm Al Quwain",
    FUJAIRAH: "Fujairah",
    DIBBA_FUJAIRAH: "Dibba Al-Fujairah",
  },
  projectType: {
    PRIVATE_VILLA: "Private villa",
    PALACE: "Palace / large villa",
    TOWNHOUSE: "Townhouse",
    APARTMENT: "Apartment",
    COMMERCIAL: "Commercial project",
  },
  projectStage: {
    ON_PLAN: "Still on plan",
    EXCAVATION: "Excavation and foundations stage",
    COLUMNS_AND_BRICKWORK: "Columns and brickwork stage",
    PLASTERING_AND_EXTENSIONS: "Plastering and utilities stage",
    FINISHING: "Finishing stage",
    RENOVATION: "Home is ready and I want to renovate",
  },
  previousWork: {
    NO: "No, I haven't started yet",
    STARTED_NOT_FINALIZED: "Yes, but nothing is finalized yet",
    STARTED_WITH_OTHER: "Yes, we've already started with another party",
  },
  hasArchitecturalPlan: {
    YES: "Yes",
    NO: "No",
    YES_WITH_NOTES: "Yes, but I have notes and I'm not comfortable with it",
  },
  serviceType: {
    DESIGN_ONLY: "Design only",
    DESIGN_AND_PLANS: "Design + execution plans",
    DESIGN_AND_EXECUTION_AND_QUALITY_SUPERVISION:
      "Design + execution + quality-control supervision",
  },
  decisionMaker: {
    ME: "I'm the decision maker",
    ME_AND_PARTNER: "Me and a partner / spouse / family",
    NOT_ME: "I'm not the final decision maker",
  },
  bookingRequestStatus: {
    IN_PROGRESS: "In progress",
    SUBMITTED: "Submitted",
  },
};
