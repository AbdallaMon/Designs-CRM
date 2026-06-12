// Per-feature UI dictionary: sales stages
//
// COMPOSITION MODEL: one file per feature/area. Fill BOTH `ar` and `en` with the SAME keys,
// namespaced under "salesStages.*" (e.g. "salesStages.title", "salesStages.actions.create"). The barrel
// (./index.js) deep-merges every stub's `ar` into one ar map and `en` into one en map, then
// uiDictionary merges those on top of its core keys. You do NOT edit the barrel or uiDictionary —
// just fill this file and call t("salesStages.<key>") in the feature's components.
//
// CONTRACT: ar is the existing/authoritative wording; en is the additive translation. Keep keys
// identical across ar and en. Arabic stays the default — an empty stub changes nothing.

export const ar = {
  // SalesStagesPanel (thin wiring smoke-screen)
  "salesStages.title": "مراحل البيع",
  "salesStages.denied": "لا تملك صلاحية عرض مراحل البيع",
  "salesStages.selectLeadHint": "حدد عميلاً (leadId) لعرض مراحل البيع الخاصة به.",
  "salesStages.fetchError": "تعذر جلب مراحل البيع.",
  "salesStages.stagesCount": "المراحل ({count})",
  "salesStages.noStageStarted": "لم تبدأ أي مرحلة بعد.",

  // SalesStagePanel (pipeline progression UI)
  "salesStages.panelTitle": "مرحلة البيع",
  "salesStages.panelSubtitle": "تقدّم العميل عبر مراحل خط أنابيب المبيعات العشرة.",
  "salesStages.deniedDescription":
    "تواصل مع المسؤول لمنحك صلاحية الاطلاع على مراحل البيع لهذا العميل.",
  "salesStages.advancing": "جاري الانتقال للمرحلة التالية...",
  "salesStages.rollingBack": "جاري الرجوع للمرحلة السابقة...",
  "salesStages.notStarted": "لم تبدأ مراحل البيع بعد.",
  "salesStages.allComplete": "اكتملت جميع مراحل البيع.",
  "salesStages.currentStage": "المرحلة الحالية: {stage}",
  "salesStages.rollBack": "رجوع",
  "salesStages.nextStage": "المرحلة التالية: {stage}",

  // Stage labels (SalesStageType enum → Arabic display label)
  "salesStages.stage.INITIAL_CONTACT": "أول تواصل",
  "salesStages.stage.SOCIAL_MEDIA_CHECK": "مراجعة وسائل التواصل",
  "salesStages.stage.WHATSAPP_QA": "أسئلة واتساب",
  "salesStages.stage.MEETING_BOOKED": "حجز اجتماع",
  "salesStages.stage.CLIENT_INFO_UPLOADED": "رفع بيانات العميل",
  "salesStages.stage.CONSULTATION_BOOKED": "حجز استشارة",
  "salesStages.stage.FOLLOWUP_AFTER_MEETING": "متابعة بعد الاجتماع",
  "salesStages.stage.HANDLE_OBJECTIONS": "معالجة الاعتراضات",
  "salesStages.stage.DEAL_CLOSED": "إغلاق الصفقة",
  "salesStages.stage.AFTER_SALES_FOLLOWUP": "متابعة ما بعد البيع",
};

export const en = {
  // SalesStagesPanel (thin wiring smoke-screen)
  "salesStages.title": "Sales Stages",
  "salesStages.denied": "You don't have permission to view sales stages",
  "salesStages.selectLeadHint": "Select a lead (leadId) to view its sales stages.",
  "salesStages.fetchError": "Failed to fetch sales stages.",
  "salesStages.stagesCount": "Stages ({count})",
  "salesStages.noStageStarted": "No stage has started yet.",

  // SalesStagePanel (pipeline progression UI)
  "salesStages.panelTitle": "Sales Stage",
  "salesStages.panelSubtitle": "The client's progress through the ten sales pipeline stages.",
  "salesStages.deniedDescription":
    "Contact the administrator to grant you access to view this client's sales stages.",
  "salesStages.advancing": "Advancing to the next stage...",
  "salesStages.rollingBack": "Rolling back to the previous stage...",
  "salesStages.notStarted": "Sales stages haven't started yet.",
  "salesStages.allComplete": "All sales stages are complete.",
  "salesStages.currentStage": "Current stage: {stage}",
  "salesStages.rollBack": "Back",
  "salesStages.nextStage": "Next stage: {stage}",

  // Stage labels (SalesStageType enum → English display label)
  "salesStages.stage.INITIAL_CONTACT": "Initial Contact",
  "salesStages.stage.SOCIAL_MEDIA_CHECK": "Social Media Check",
  "salesStages.stage.WHATSAPP_QA": "WhatsApp Q&A",
  "salesStages.stage.MEETING_BOOKED": "Meeting Booked",
  "salesStages.stage.CLIENT_INFO_UPLOADED": "Client Info Uploaded",
  "salesStages.stage.CONSULTATION_BOOKED": "Consultation Booked",
  "salesStages.stage.FOLLOWUP_AFTER_MEETING": "Follow-up After Meeting",
  "salesStages.stage.HANDLE_OBJECTIONS": "Handle Objections",
  "salesStages.stage.DEAL_CLOSED": "Deal Closed",
  "salesStages.stage.AFTER_SALES_FOLLOWUP": "After-Sales Follow-up",
};
