// Per-feature UI dictionary: questions / objection handling
//
// COMPOSITION MODEL: one file per feature/area. Fill BOTH `ar` and `en` with the SAME keys,
// namespaced under "questions.*" (e.g. "questions.title", "questions.actions.create"). The barrel
// (./index.js) deep-merges every stub's `ar` into one ar map and `en` into one en map, then
// uiDictionary merges those on top of its core keys. You do NOT edit the barrel or uiDictionary —
// just fill this file and call t("questions.<key>") in the feature's components.
//
// CONTRACT: ar is the existing/authoritative wording; en is the additive translation. Keep keys
// identical across ar and en. Arabic stays the default — an empty stub changes nothing.

export const ar = {
  // QuestionsPanel (thin wiring smoke-screen)
  "questions.noViewPermission": "لا تملك صلاحية عرض أسئلة العميل",
  "questions.title": "أسئلة العميل",
  "questions.selectLeadHint": "حدد عميلاً (leadId) لعرض أنواع الأسئلة الخاصة به.",
  "questions.fetchTypesError": "تعذر جلب أنواع الأسئلة.",
  "questions.typesCount": "أنواع الأسئلة ({count})",
  "questions.noTypes": "لا توجد أنواع أسئلة.",

  // SpinPanel — SPIN session questions
  "questions.spin.title": "أسئلة SPIN",
  "questions.spin.noViewPermissionDescription":
    "تواصل مع المسؤول لمنحك صلاحية الاطلاع على أسئلة SPIN لهذا العميل.",
  "questions.spin.subtitle": "اختر نوع السؤال ثم سجّل إجابات العميل.",
  "questions.spin.saveAll": "حفظ الكل",
  "questions.spin.saveAllCount": "حفظ الكل ({count})",
  "questions.spin.savingAnswer": "جاري حفظ الإجابة...",
  "questions.spin.savingAnswers": "جاري حفظ الإجابات...",
  "questions.spin.addingQuestion": "جاري إضافة السؤال...",
  "questions.spin.noTypesTitle": "لا توجد أنواع أسئلة",
  "questions.spin.noTypesDescription": "لم تُعرّف أنواع أسئلة SPIN بعد.",
  "questions.spin.noQuestionsTitle": "لا توجد أسئلة لهذا النوع",
  "questions.spin.noQuestionsAddHint": "أضف سؤالاً مخصصاً للبدء.",
  "questions.spin.noQuestionsDescription": "لم تُضَف أسئلة لهذا النوع بعد.",
  "questions.spin.customQuestion": "سؤال مخصص",
  "questions.spin.answerPlaceholder": "إجابة العميل",
  "questions.spin.saveAnswer": "حفظ الإجابة",

  // CustomQuestionDialog
  "questions.spin.dialog.title": "سؤال مخصص",
  "questions.spin.dialog.questionLabel": "نص السؤال",
  "questions.spin.dialog.cancel": "إلغاء",
  "questions.spin.dialog.add": "إضافة",

  // VersaPanel — objection handling
  "questions.versa.title": "معالجة الاعتراضات (VERSA)",
  "questions.versa.noViewPermissionTitle": "لا تملك صلاحية عرض معالجة الاعتراضات",
  "questions.versa.noViewPermissionDescription":
    "تواصل مع المسؤول لمنحك صلاحية الاطلاع على VERSA لهذا العميل.",
  "questions.versa.subtitle": "اختر فئة لعرض الاعتراضات وردودها وتحريرها.",
  "questions.versa.noCategoriesTitle": "لا توجد فئات",
  "questions.versa.noCategoriesDescription": "لم تُعرّف فئات معالجة الاعتراضات بعد.",
  "questions.versa.objectionLabel": "الاعتراض",
  "questions.versa.responseLabel": "الرد",
  "questions.versa.save": "حفظ",
  "questions.versa.creatingVersa": "جاري إنشاء معالجة الاعتراضات...",
  "questions.versa.savingStep": "جاري حفظ الخطوة...",
  "questions.versa.noStepsTitle": "لا توجد خطوات معالجة",
  "questions.versa.noStepsManageDescription": "أنشئ معالجة الاعتراضات لهذه الفئة.",
  "questions.versa.noStepsDescription": "لم تُنشأ معالجة اعتراضات لهذه الفئة بعد.",
  "questions.versa.createVersa": "إنشاء معالجة",
};

export const en = {
  // QuestionsPanel (thin wiring smoke-screen)
  "questions.noViewPermission": "You do not have permission to view client questions",
  "questions.title": "Client Questions",
  "questions.selectLeadHint": "Select a client (leadId) to view its question types.",
  "questions.fetchTypesError": "Failed to fetch question types.",
  "questions.typesCount": "Question Types ({count})",
  "questions.noTypes": "No question types.",

  // SpinPanel — SPIN session questions
  "questions.spin.title": "SPIN Questions",
  "questions.spin.noViewPermissionDescription":
    "Contact the administrator to grant you access to this client's SPIN questions.",
  "questions.spin.subtitle": "Select a question type, then record the client's answers.",
  "questions.spin.saveAll": "Save All",
  "questions.spin.saveAllCount": "Save All ({count})",
  "questions.spin.savingAnswer": "Saving answer...",
  "questions.spin.savingAnswers": "Saving answers...",
  "questions.spin.addingQuestion": "Adding question...",
  "questions.spin.noTypesTitle": "No question types",
  "questions.spin.noTypesDescription": "No SPIN question types have been defined yet.",
  "questions.spin.noQuestionsTitle": "No questions for this type",
  "questions.spin.noQuestionsAddHint": "Add a custom question to get started.",
  "questions.spin.noQuestionsDescription": "No questions have been added for this type yet.",
  "questions.spin.customQuestion": "Custom Question",
  "questions.spin.answerPlaceholder": "Client's answer",
  "questions.spin.saveAnswer": "Save answer",

  // CustomQuestionDialog
  "questions.spin.dialog.title": "Custom Question",
  "questions.spin.dialog.questionLabel": "Question text",
  "questions.spin.dialog.cancel": "Cancel",
  "questions.spin.dialog.add": "Add",

  // VersaPanel — objection handling
  "questions.versa.title": "Objection Handling (VERSA)",
  "questions.versa.noViewPermissionTitle": "You do not have permission to view objection handling",
  "questions.versa.noViewPermissionDescription":
    "Contact the administrator to grant you access to this client's VERSA.",
  "questions.versa.subtitle": "Select a category to view, respond to, and edit objections.",
  "questions.versa.noCategoriesTitle": "No categories",
  "questions.versa.noCategoriesDescription": "No objection-handling categories have been defined yet.",
  "questions.versa.objectionLabel": "Objection",
  "questions.versa.responseLabel": "Response",
  "questions.versa.save": "Save",
  "questions.versa.creatingVersa": "Creating objection handling...",
  "questions.versa.savingStep": "Saving step...",
  "questions.versa.noStepsTitle": "No handling steps",
  "questions.versa.noStepsManageDescription": "Create objection handling for this category.",
  "questions.versa.noStepsDescription": "No objection handling has been created for this category yet.",
  "questions.versa.createVersa": "Create handling",
};
