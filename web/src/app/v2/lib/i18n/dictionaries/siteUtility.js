// Per-feature UI dictionary: site settings / utilities config.
//
// COMPOSITION MODEL: one file per feature/area. Fill BOTH `ar` and `en` with the SAME keys,
// namespaced under "siteUtility.*". The barrel (./index.js) deep-merges every stub's `ar` into one
// ar map and `en` into one en map, then uiDictionary merges those on top of its core keys. You do
// NOT edit the barrel or uiDictionary — just fill this file and call t("siteUtility.<key>") in the
// feature's components.
//
// CONTRACT: ar is the existing/authoritative wording (verbatim from the components it replaces),
// so ar renders identically. en is the additive natural translation. Keys identical across ar/en.

export const ar = {
  // ── page: tabs / access ─────────────────────────────────────────────────────
  "siteUtility.tab.pdf": "إعدادات الـ PDF",
  "siteUtility.tab.conditions": "شروط دفع العقود",
  "siteUtility.tab.contract": "إعدادات عقد التصميم",
  "siteUtility.page.denied": "لا تملك صلاحية الوصول إلى هذه الصفحة",

  // ── common actions ──────────────────────────────────────────────────────────
  "siteUtility.action.refresh": "تحديث",
  "siteUtility.action.new": "جديد",
  "siteUtility.action.create": "إنشاء",
  "siteUtility.action.save": "حفظ",
  "siteUtility.action.cancel": "إلغاء",
  "siteUtility.action.edit": "تعديل",
  "siteUtility.action.delete": "حذف",
  "siteUtility.action.close": "إغلاق",
  "siteUtility.state.loading": "جاري التحميل...",

  // ── PDF utility ─────────────────────────────────────────────────────────────
  "siteUtility.pdf.title": "إعدادات ملف الـ PDF",
  "siteUtility.pdf.field.noValue": "لا يوجد {label}",
  "siteUtility.pdf.field.addHint": "اضغط تعديل للإضافة.",
  "siteUtility.pdf.field.editTooltip": "تعديل {title}",
  "siteUtility.pdf.field.editTitle": "تعديل {title}",
  "siteUtility.pdf.field.addTitle": "إضافة {title}",
  "siteUtility.pdf.field.url": "الرابط",
  "siteUtility.pdf.field.file": "ملف",
  "siteUtility.pdf.field.useImageHint": "سيتم استخدام {what} عند الحفظ.",
  "siteUtility.pdf.field.useImage": "الصورة المرفوعة",
  "siteUtility.pdf.field.useLink": "الرابط",

  // ── file input ──────────────────────────────────────────────────────────────
  "siteUtility.file.sizeLimit": "الحد الأقصى لحجم الملف: {size} MB",
  "siteUtility.file.tooLarge": "حجم الملف يتجاوز الحد المسموح ({size} MB).",
  "siteUtility.file.notAllowed": "نوع الملف غير مسموح به.",
  "siteUtility.file.view": "عرض الملف",

  // ── contract payment conditions ─────────────────────────────────────────────
  "siteUtility.conditions.title": "شروط دفع العقود",
  "siteUtility.conditions.denied": "لا تملك صلاحية عرض شروط دفع العقود.",
  "siteUtility.conditions.empty": "لا توجد شروط دفع بعد.",
  "siteUtility.conditions.col.type": "النوع",
  "siteUtility.conditions.col.condition": "الشرط",
  "siteUtility.conditions.col.labelAr": "الاسم (عربي)",
  "siteUtility.conditions.col.labelEn": "الاسم (إنجليزي)",
  "siteUtility.conditions.col.actions": "الإجراءات",
  "siteUtility.conditions.dialog.editTitle": "تعديل شرط الدفع",
  "siteUtility.conditions.dialog.createTitle": "إنشاء شرط دفع",
  "siteUtility.conditions.field.type": "النوع",
  "siteUtility.conditions.field.condition": "الشرط",
  "siteUtility.conditions.field.labelAr": "الاسم (عربي)",
  "siteUtility.conditions.field.labelEn": "الاسم (إنجليزي)",
  "siteUtility.conditions.uniqueNote":
    "ملاحظة: (النوع، الشرط، الاسم العربي، الاسم الإنجليزي) يجب أن تكون فريدة معًا.",
  "siteUtility.conditions.delete.title": "حذف شرط الدفع",
  "siteUtility.conditions.delete.confirm": "هل أنت متأكد من حذف \"{label}\"؟",
  "siteUtility.conditions.tooltip.edit": "تعديل",
  "siteUtility.conditions.tooltip.delete": "حذف",
  "siteUtility.conditions.tooltip.inUse": "قيد الاستخدام — لا يمكن الحذف",
  "siteUtility.conditions.tooltip.cannotDelete": "لا يمكن الحذف",

  // ── contract utility editor ─────────────────────────────────────────────────
  "siteUtility.contract.title": "إعدادات عقد التصميم",
  "siteUtility.contract.denied": "لا تملك صلاحية عرض إعدادات عقد التصميم.",
  "siteUtility.contract.notInitialized":
    "لم يتم تهيئة إعدادات عقد التصميم بعد. احفظ الالتزامات أولاً لإنشاء السجل، ثم يمكنك إضافة البنود.",
  "siteUtility.contract.field.ar": "عربي",
  "siteUtility.contract.field.en": "English",

  // obligations
  "siteUtility.contract.obligations.title": "التزامات الفريقين",
  "siteUtility.contract.obligations.partyOne": "الفريق الأول",
  "siteUtility.contract.obligations.partyTwo": "الفريق الثاني",

  // clause sections
  "siteUtility.contract.section.stages": "بنود المراحل",
  "siteUtility.contract.section.special": "البنود الخاصة",
  "siteUtility.contract.section.levels": "بنود المستويات",
  "siteUtility.contract.clause.empty": "لا توجد بنود بعد.",
  "siteUtility.contract.clause.order": "ترتيب: {order}",
  "siteUtility.contract.clause.active": "مُفعّل",
  "siteUtility.contract.clause.inactive": "غير مُفعّل",

  // clause dialog
  "siteUtility.contract.dialog.stage.edit": "تعديل بند مرحلة",
  "siteUtility.contract.dialog.stage.add": "إضافة بند مرحلة",
  "siteUtility.contract.dialog.special.edit": "تعديل بند خاص",
  "siteUtility.contract.dialog.special.add": "إضافة بند خاص",
  "siteUtility.contract.dialog.level.edit": "تعديل بند مستوى",
  "siteUtility.contract.dialog.level.add": "إضافة بند مستوى",
  "siteUtility.contract.field.headingAr": "العنوان (عربي)",
  "siteUtility.contract.field.headingEn": "Heading (EN)",
  "siteUtility.contract.field.titleAr": "الاسم (عربي)",
  "siteUtility.contract.field.titleEn": "Title (EN)",
  "siteUtility.contract.field.descriptionAr": "الوصف (عربي)",
  "siteUtility.contract.field.descriptionEn": "Description (EN)",
  "siteUtility.contract.field.level": "المستوى",
  "siteUtility.contract.field.textAr": "النص (عربي)",
  "siteUtility.contract.field.textEn": "Text (EN)",
  "siteUtility.contract.field.order": "الترتيب",
  "siteUtility.contract.field.active": "مُفعّل",

  // clause delete
  "siteUtility.contract.delete.title": "حذف البند",
  "siteUtility.contract.delete.confirm": "هل أنت متأكد من حذف \"{label}\"؟",
};

export const en = {
  // ── page: tabs / access ─────────────────────────────────────────────────────
  "siteUtility.tab.pdf": "PDF Settings",
  "siteUtility.tab.conditions": "Contract Payment Conditions",
  "siteUtility.tab.contract": "Design Contract Settings",
  "siteUtility.page.denied": "You don't have permission to access this page",

  // ── common actions ──────────────────────────────────────────────────────────
  "siteUtility.action.refresh": "Refresh",
  "siteUtility.action.new": "New",
  "siteUtility.action.create": "Create",
  "siteUtility.action.save": "Save",
  "siteUtility.action.cancel": "Cancel",
  "siteUtility.action.edit": "Edit",
  "siteUtility.action.delete": "Delete",
  "siteUtility.action.close": "Close",
  "siteUtility.state.loading": "Loading...",

  // ── PDF utility ─────────────────────────────────────────────────────────────
  "siteUtility.pdf.title": "PDF File Settings",
  "siteUtility.pdf.field.noValue": "No {label}",
  "siteUtility.pdf.field.addHint": "Click edit to add.",
  "siteUtility.pdf.field.editTooltip": "Edit {title}",
  "siteUtility.pdf.field.editTitle": "Edit {title}",
  "siteUtility.pdf.field.addTitle": "Add {title}",
  "siteUtility.pdf.field.url": "URL",
  "siteUtility.pdf.field.file": "File",
  "siteUtility.pdf.field.useImageHint": "{what} will be used on save.",
  "siteUtility.pdf.field.useImage": "the uploaded image",
  "siteUtility.pdf.field.useLink": "the link",

  // ── file input ──────────────────────────────────────────────────────────────
  "siteUtility.file.sizeLimit": "Maximum file size: {size} MB",
  "siteUtility.file.tooLarge": "File size exceeds the allowed limit ({size} MB).",
  "siteUtility.file.notAllowed": "File type is not allowed.",
  "siteUtility.file.view": "View file",

  // ── contract payment conditions ─────────────────────────────────────────────
  "siteUtility.conditions.title": "Contract Payment Conditions",
  "siteUtility.conditions.denied": "You don't have permission to view contract payment conditions.",
  "siteUtility.conditions.empty": "No payment conditions yet.",
  "siteUtility.conditions.col.type": "Type",
  "siteUtility.conditions.col.condition": "Condition",
  "siteUtility.conditions.col.labelAr": "Name (Arabic)",
  "siteUtility.conditions.col.labelEn": "Name (English)",
  "siteUtility.conditions.col.actions": "Actions",
  "siteUtility.conditions.dialog.editTitle": "Edit Payment Condition",
  "siteUtility.conditions.dialog.createTitle": "Create Payment Condition",
  "siteUtility.conditions.field.type": "Type",
  "siteUtility.conditions.field.condition": "Condition",
  "siteUtility.conditions.field.labelAr": "Name (Arabic)",
  "siteUtility.conditions.field.labelEn": "Name (English)",
  "siteUtility.conditions.uniqueNote":
    "Note: (type, condition, Arabic name, English name) must be unique together.",
  "siteUtility.conditions.delete.title": "Delete Payment Condition",
  "siteUtility.conditions.delete.confirm": "Are you sure you want to delete \"{label}\"?",
  "siteUtility.conditions.tooltip.edit": "Edit",
  "siteUtility.conditions.tooltip.delete": "Delete",
  "siteUtility.conditions.tooltip.inUse": "In use — cannot be deleted",
  "siteUtility.conditions.tooltip.cannotDelete": "Cannot be deleted",

  // ── contract utility editor ─────────────────────────────────────────────────
  "siteUtility.contract.title": "Design Contract Settings",
  "siteUtility.contract.denied": "You don't have permission to view design contract settings.",
  "siteUtility.contract.notInitialized":
    "Design contract settings have not been initialized yet. Save the obligations first to create the record, then you can add clauses.",
  "siteUtility.contract.field.ar": "Arabic",
  "siteUtility.contract.field.en": "English",

  // obligations
  "siteUtility.contract.obligations.title": "Obligations of Both Parties",
  "siteUtility.contract.obligations.partyOne": "First Party",
  "siteUtility.contract.obligations.partyTwo": "Second Party",

  // clause sections
  "siteUtility.contract.section.stages": "Stage Clauses",
  "siteUtility.contract.section.special": "Special Clauses",
  "siteUtility.contract.section.levels": "Level Clauses",
  "siteUtility.contract.clause.empty": "No clauses yet.",
  "siteUtility.contract.clause.order": "Order: {order}",
  "siteUtility.contract.clause.active": "Active",
  "siteUtility.contract.clause.inactive": "Inactive",

  // clause dialog
  "siteUtility.contract.dialog.stage.edit": "Edit Stage Clause",
  "siteUtility.contract.dialog.stage.add": "Add Stage Clause",
  "siteUtility.contract.dialog.special.edit": "Edit Special Clause",
  "siteUtility.contract.dialog.special.add": "Add Special Clause",
  "siteUtility.contract.dialog.level.edit": "Edit Level Clause",
  "siteUtility.contract.dialog.level.add": "Add Level Clause",
  "siteUtility.contract.field.headingAr": "Heading (Arabic)",
  "siteUtility.contract.field.headingEn": "Heading (EN)",
  "siteUtility.contract.field.titleAr": "Title (Arabic)",
  "siteUtility.contract.field.titleEn": "Title (EN)",
  "siteUtility.contract.field.descriptionAr": "Description (Arabic)",
  "siteUtility.contract.field.descriptionEn": "Description (EN)",
  "siteUtility.contract.field.level": "Level",
  "siteUtility.contract.field.textAr": "Text (Arabic)",
  "siteUtility.contract.field.textEn": "Text (EN)",
  "siteUtility.contract.field.order": "Order",
  "siteUtility.contract.field.active": "Active",

  // clause delete
  "siteUtility.contract.delete.title": "Delete Clause",
  "siteUtility.contract.delete.confirm": "Are you sure you want to delete \"{label}\"?",
};
