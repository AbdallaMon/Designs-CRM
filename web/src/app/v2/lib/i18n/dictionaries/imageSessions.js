// Per-feature UI dictionary: image / design sessions
//
// COMPOSITION MODEL: one file per feature/area. Fill BOTH `ar` and `en` with the SAME keys,
// namespaced under "imageSessions.*" (e.g. "imageSessions.title", "imageSessions.actions.create"). The barrel
// (./index.js) deep-merges every stub's `ar` into one ar map and `en` into one en map, then
// uiDictionary merges those on top of its core keys. You do NOT edit the barrel or uiDictionary —
// just fill this file and call t("imageSessions.<key>") in the feature's components.
//
// CONTRACT: ar is the existing/authoritative wording; en is the additive translation. Keep keys
// identical across ar and en. Arabic stays the default — an empty stub changes nothing.

export const ar = {
  // ── Admin reference-data page (SURFACE 1) ───────────────────────────────────────
  "imageSessions.admin.pageTitle": "معرض جلسات الصور",
  "imageSessions.admin.pageSubtitle":
    "إدارة البيانات المرجعية: الصور، الألوان، المساحات، الخامات، الطرز ومعلومات الصفحة.",
  "imageSessions.admin.breadcrumb.production": "الإنتاج",
  "imageSessions.admin.breadcrumb.imageSessions": "جلسات الصور",
  "imageSessions.admin.noViewPermission": "لا تملك صلاحية عرض بيانات جلسات الصور.",
  "imageSessions.admin.addImage": "إضافة صورة",
  "imageSessions.admin.addImagesBulk": "إضافة صور (متعددة)",
  "imageSessions.admin.add": "إضافة",
  "imageSessions.admin.edit": "تعديل",
  "imageSessions.admin.prosCons": "المزايا والعيوب",
  "imageSessions.admin.prosConsTitle": "المزايا والعيوب — {label}",
  "imageSessions.admin.close": "إغلاق",
  "imageSessions.admin.emptyData": "لا توجد بيانات لعرضها",

  // Admin reference type tab labels
  "imageSessions.admin.type.images": "معرض الصور",
  "imageSessions.admin.type.pageInfo": "معلومات الصفحة",
  "imageSessions.admin.type.colors": "الألوان والأنماط",
  "imageSessions.admin.type.spaces": "المساحات",
  "imageSessions.admin.type.materials": "الخامات",
  "imageSessions.admin.type.styles": "الطرز",

  // Admin reference columns
  "imageSessions.columns.name": "الاسم",
  "imageSessions.columns.background": "الخلفية",
  "imageSessions.columns.type": "النوع",
  "imageSessions.columns.title": "العنوان",
  "imageSessions.columns.image": "الصورة",

  // ── Reference form dialog ───────────────────────────────────────────────────────
  "imageSessions.form.editTitle": "تعديل {label}",
  "imageSessions.form.addTitle": "إضافة {label}",
  "imageSessions.form.name": "الاسم",
  "imageSessions.form.description": "الوصف",
  "imageSessions.form.background": "لون الخلفية",
  "imageSessions.form.pageType": "نوع الصفحة",
  "imageSessions.form.savedInArabic": "يتم الحفظ باللغة العربية.",
  "imageSessions.form.cancel": "إلغاء",
  "imageSessions.form.save": "حفظ",
  "imageSessions.form.add": "إضافة",
  "imageSessions.form.addingLoading": "جاري الإضافة...",

  // ── Pros & cons reorder ─────────────────────────────────────────────────────────
  "imageSessions.prosCons.pros": "المزايا",
  "imageSessions.prosCons.cons": "العيوب",
  "imageSessions.prosCons.empty": "لا توجد عناصر",
  "imageSessions.prosCons.emptyDescription": "أضف أول عنصر من الحقل بالأسفل.",
  "imageSessions.prosCons.newItemPlaceholder": "عنصر جديد",
  "imageSessions.prosCons.add": "إضافة",
  "imageSessions.prosCons.moveUp": "تحريك لأعلى",
  "imageSessions.prosCons.moveDown": "تحريك لأسفل",
  "imageSessions.prosCons.saveEdit": "حفظ التعديل",
  "imageSessions.prosCons.save": "حفظ",
  "imageSessions.prosCons.delete": "حذف",
  "imageSessions.prosCons.reorderLoading": "جاري حفظ الترتيب...",
  "imageSessions.prosCons.deleteLoading": "جاري الحذف...",

  // ── Upload image dialog ─────────────────────────────────────────────────────────
  "imageSessions.upload.titleBulk": "إضافة صور (متعددة)",
  "imageSessions.upload.titleSingle": "إضافة صورة",
  "imageSessions.upload.style": "الطراز",
  "imageSessions.upload.spaces": "المساحات",
  "imageSessions.upload.filesSelected": "{count} ملف محدد",
  "imageSessions.upload.pickImages": "اختر صوراً",
  "imageSessions.upload.pickImage": "اختر صورة",
  "imageSessions.upload.cancel": "إلغاء",
  "imageSessions.upload.save": "حفظ",
  "imageSessions.upload.savingLoading": "جاري حفظ الصور...",

  // ── Lead sessions panel (SURFACE 2) ─────────────────────────────────────────────
  "imageSessions.lead.pageTitle": "جلسات الصور للعميل المحتمل",
  "imageSessions.lead.pageSubtitle": "العميل المحتمل #{id}",
  "imageSessions.lead.breadcrumb.sales": "المبيعات",
  "imageSessions.lead.breadcrumb.leads": "الصفقات",
  "imageSessions.lead.breadcrumb.lead": "العميل #{id}",
  "imageSessions.lead.breadcrumb.sessions": "جلسات الصور",

  "imageSessions.lead.newSessionTitle": "إنشاء جلسة جديدة",
  "imageSessions.lead.newSessionHint": "اختر المساحات المطلوبة لهذه الجلسة (مساحة واحدة على الأقل).",
  "imageSessions.lead.noSpaces": "لا توجد مساحات متاحة",
  "imageSessions.lead.cancel": "إلغاء",
  "imageSessions.lead.create": "إنشاء",

  "imageSessions.lead.editNameTitle": "تعديل اسم الجلسة",
  "imageSessions.lead.sessionName": "اسم الجلسة",
  "imageSessions.lead.save": "حفظ",

  "imageSessions.lead.regenerateTitle": "إعادة إنشاء الرابط",
  "imageSessions.lead.regenerateWarning":
    "سيتوقف الرابط القديم عن العمل فورًا. أي رابط شاركته سابقًا مع العميل لن يعمل بعد الآن.",
  "imageSessions.lead.regenerateConfirm": "هل تريد المتابعة وإنشاء رابط جديد؟",
  "imageSessions.lead.regenerate": "إعادة الإنشاء",

  "imageSessions.lead.sessionFallbackName": "جلسة #{id}",
  "imageSessions.lead.copied": "تم النسخ",
  "imageSessions.lead.copyLink": "نسخ الرابط",
  "imageSessions.lead.openClientLink": "فتح رابط العميل",
  "imageSessions.lead.openLink": "فتح الرابط",
  "imageSessions.lead.downloadFile": "تحميل الملف",
  "imageSessions.lead.editName": "تعديل الاسم",
  "imageSessions.lead.edit": "تعديل",
  "imageSessions.lead.deleteSession": "حذف الجلسة",
  "imageSessions.lead.delete": "حذف",

  "imageSessions.lead.regenerateLoading": "جاري إعادة إنشاء الرابط...",
  "imageSessions.lead.savingLoading": "جاري الحفظ...",
  "imageSessions.lead.deleteLoading": "جاري حذف الجلسة...",
  "imageSessions.lead.createLoading": "جاري إنشاء الجلسة...",

  "imageSessions.lead.noViewPermission": "لا تملك صلاحية عرض جلسات الصور.",
  "imageSessions.lead.cardTitle": "جلسات الصور",
  "imageSessions.lead.cardSubtitle": "روابط اختيار التصاميم التي تشاركها مع العميل المحتمل.",
  "imageSessions.lead.newSession": "جلسة جديدة",
  "imageSessions.lead.emptyTitle": "لا توجد جلسات بعد",
  "imageSessions.lead.emptyManage": "أنشئ جلسة جديدة لمشاركة رابط اختيار التصاميم مع العميل.",
  "imageSessions.lead.emptyView": "لم يتم إنشاء أي جلسة لهذا العميل بعد.",

  // Session status labels (shared)
  "imageSessions.status.INITIAL": "البداية",
  "imageSessions.status.PREVIEW_COLOR_PATTERN": "معاينة الألوان",
  "imageSessions.status.SELECTED_COLOR_PATTERN": "تم اختيار الألوان",
  "imageSessions.status.PREVIEW_MATERIAL": "معاينة الخامات",
  "imageSessions.status.SELECTED_MATERIAL": "تم اختيار الخامات",
  "imageSessions.status.PREVIEW_STYLE": "معاينة الطرز",
  "imageSessions.status.SELECTED_STYLE": "تم اختيار الطرز",
  "imageSessions.status.PREVIEW_IMAGES": "معاينة الصور",
  "imageSessions.status.SELECTED_IMAGES": "تم اختيار الصور",
  "imageSessions.status.PDF_GENERATED": "تم إنشاء الملف",
  "imageSessions.status.SUBMITTED": "تم الإرسال",

  // Wizard step labels (shared)
  "imageSessions.step.colors": "الألوان",
  "imageSessions.step.materials": "الخامات",
  "imageSessions.step.styles": "الطرز",
  "imageSessions.step.images": "الصور",
  "imageSessions.step.preview": "المعاينة",
  "imageSessions.step.signature": "التوقيع",
  "imageSessions.step.done": "الملف",

  // ── Public client wizard (SURFACE 3) ────────────────────────────────────────────
  "imageSessions.public.confirm.INITIAL": "مرحبًا بك في جلسة اختيار التصاميم",
  "imageSessions.public.confirm.SELECTED_COLOR_PATTERN": "تم حفظ اختيار الألوان",
  "imageSessions.public.confirm.SELECTED_MATERIAL": "تم حفظ اختيار الخامات",
  "imageSessions.public.confirm.SELECTED_STYLE": "تم حفظ اختيار الطراز",
  "imageSessions.public.confirm.PREVIEW_IMAGES": "تم حفظ اختيار الصور",

  "imageSessions.public.savingLoading": "جاري الحفظ...",
  "imageSessions.public.invalidLinkTitle": "رابط الجلسة غير صالح",
  "imageSessions.public.successTitle": "تم إرسال اختياراتك بنجاح",
  "imageSessions.public.successMessage": "شكرًا لك. سيتواصل معك فريقنا قريبًا.",
  "imageSessions.public.downloadFile": "تحميل الملف",
  "imageSessions.public.continue": "متابعة",
  "imageSessions.public.startHint": "اضغط «التالي» للبدء باختيار الألوان.",
  "imageSessions.public.reviewHint": "راجع اختياراتك بالأسفل ثم تابع إلى الخطوة التالية.",
  "imageSessions.public.previous": "السابق",
  "imageSessions.public.next": "التالي",
  "imageSessions.public.headerTitle": "اختيار التصاميم",
  "imageSessions.public.headerSubtitle": "الخطوة {current} من {total}",

  // Public wizard step nav
  "imageSessions.public.nav.previous": "السابق",
  "imageSessions.public.nav.next": "التالي",
  "imageSessions.public.nav.saveAndContinue": "حفظ والمتابعة",
  "imageSessions.public.saveSelectionLoading": "جاري حفظ اختيارك...",
  "imageSessions.public.noColors": "لا توجد ألوان متاحة",
  "imageSessions.public.noMaterials": "لا توجد خامات متاحة",
  "imageSessions.public.noStyles": "لا توجد طرز متاحة",
  "imageSessions.public.noImages": "لا توجد صور متاحة",
  "imageSessions.public.noImagesDescription": "لم نعثر على صور للمساحات والطراز المختار.",

  // Public selection summary
  "imageSessions.public.summary.title": "اختياراتك حتى الآن",
  "imageSessions.public.summary.spaces": "المساحات",
  "imageSessions.public.summary.colors": "الألوان",
  "imageSessions.public.summary.materials": "الخامات",
  "imageSessions.public.summary.style": "الطراز",
  "imageSessions.public.summary.images": "الصور",
  "imageSessions.public.summary.imagesCount": "{count} صورة مختارة",

  // Public signature step
  "imageSessions.public.signature.title": "التوقيع واعتماد الاختيارات",
  "imageSessions.public.signature.generating": "جارٍ إنشاء الملف…",
  "imageSessions.public.signature.chooseMethod": "اختر طريقة التوقيع",
  "imageSessions.public.signature.online": "توقيع إلكتروني",
  "imageSessions.public.signature.uploadImage": "رفع صورة توقيع",
  "imageSessions.public.signature.drawTitle": "ارسم توقيعك",
  "imageSessions.public.signature.back": "رجوع",
  "imageSessions.public.signature.clear": "مسح",
  "imageSessions.public.signature.approve": "اعتماد",
  "imageSessions.public.signature.uploadTitle": "رفع صورة التوقيع",
  "imageSessions.public.signature.uploadHint":
    "رجاءً قص الصورة بحيث تحتوي على التوقيع فقط. ستظهر المعاينة تلقائيًا بعد اختيار الصورة.",
  "imageSessions.public.signature.pickImage": "اختر صورة",
  "imageSessions.public.signature.noImagePicked": "لم يتم اختيار صورة",
  "imageSessions.public.signature.preview": "المعاينة",
  "imageSessions.public.signature.uploadFailed": "فشل رفع التوقيع.",
  "imageSessions.public.signature.generatingLoading": "جارٍ إنشاء الملف…",
  "imageSessions.public.signature.signBeforeSave": "يرجى التوقيع قبل الحفظ.",
  "imageSessions.public.signature.processError": "خطأ أثناء معالجة الصورة. جرّب صورة أخرى أو قصّها بشكل أوضح.",
  "imageSessions.public.signature.noPreviewReady": "لا توجد معاينة جاهزة.",
};

export const en = {
  // ── Admin reference-data page (SURFACE 1) ───────────────────────────────────────
  "imageSessions.admin.pageTitle": "Design Sessions Gallery",
  "imageSessions.admin.pageSubtitle":
    "Manage reference data: images, colors, spaces, materials, styles and page info.",
  "imageSessions.admin.breadcrumb.production": "Production",
  "imageSessions.admin.breadcrumb.imageSessions": "Design Sessions",
  "imageSessions.admin.noViewPermission": "You don't have permission to view design-session data.",
  "imageSessions.admin.addImage": "Add image",
  "imageSessions.admin.addImagesBulk": "Add images (bulk)",
  "imageSessions.admin.add": "Add",
  "imageSessions.admin.edit": "Edit",
  "imageSessions.admin.prosCons": "Pros & cons",
  "imageSessions.admin.prosConsTitle": "Pros & cons — {label}",
  "imageSessions.admin.close": "Close",
  "imageSessions.admin.emptyData": "No data to display",

  // Admin reference type tab labels
  "imageSessions.admin.type.images": "Image gallery",
  "imageSessions.admin.type.pageInfo": "Page info",
  "imageSessions.admin.type.colors": "Colors & patterns",
  "imageSessions.admin.type.spaces": "Spaces",
  "imageSessions.admin.type.materials": "Materials",
  "imageSessions.admin.type.styles": "Styles",

  // Admin reference columns
  "imageSessions.columns.name": "Name",
  "imageSessions.columns.background": "Background",
  "imageSessions.columns.type": "Type",
  "imageSessions.columns.title": "Title",
  "imageSessions.columns.image": "Image",

  // ── Reference form dialog ───────────────────────────────────────────────────────
  "imageSessions.form.editTitle": "Edit {label}",
  "imageSessions.form.addTitle": "Add {label}",
  "imageSessions.form.name": "Name",
  "imageSessions.form.description": "Description",
  "imageSessions.form.background": "Background color",
  "imageSessions.form.pageType": "Page type",
  "imageSessions.form.savedInArabic": "Saved in Arabic.",
  "imageSessions.form.cancel": "Cancel",
  "imageSessions.form.save": "Save",
  "imageSessions.form.add": "Add",
  "imageSessions.form.addingLoading": "Adding...",

  // ── Pros & cons reorder ─────────────────────────────────────────────────────────
  "imageSessions.prosCons.pros": "Pros",
  "imageSessions.prosCons.cons": "Cons",
  "imageSessions.prosCons.empty": "No items",
  "imageSessions.prosCons.emptyDescription": "Add your first item using the field below.",
  "imageSessions.prosCons.newItemPlaceholder": "New item",
  "imageSessions.prosCons.add": "Add",
  "imageSessions.prosCons.moveUp": "Move up",
  "imageSessions.prosCons.moveDown": "Move down",
  "imageSessions.prosCons.saveEdit": "Save edit",
  "imageSessions.prosCons.save": "Save",
  "imageSessions.prosCons.delete": "Delete",
  "imageSessions.prosCons.reorderLoading": "Saving order...",
  "imageSessions.prosCons.deleteLoading": "Deleting...",

  // ── Upload image dialog ─────────────────────────────────────────────────────────
  "imageSessions.upload.titleBulk": "Add images (bulk)",
  "imageSessions.upload.titleSingle": "Add image",
  "imageSessions.upload.style": "Style",
  "imageSessions.upload.spaces": "Spaces",
  "imageSessions.upload.filesSelected": "{count} file(s) selected",
  "imageSessions.upload.pickImages": "Choose images",
  "imageSessions.upload.pickImage": "Choose image",
  "imageSessions.upload.cancel": "Cancel",
  "imageSessions.upload.save": "Save",
  "imageSessions.upload.savingLoading": "Saving images...",

  // ── Lead sessions panel (SURFACE 2) ─────────────────────────────────────────────
  "imageSessions.lead.pageTitle": "Client design sessions",
  "imageSessions.lead.pageSubtitle": "Lead #{id}",
  "imageSessions.lead.breadcrumb.sales": "Sales",
  "imageSessions.lead.breadcrumb.leads": "Deals",
  "imageSessions.lead.breadcrumb.lead": "Client #{id}",
  "imageSessions.lead.breadcrumb.sessions": "Design sessions",

  "imageSessions.lead.newSessionTitle": "Create a new session",
  "imageSessions.lead.newSessionHint": "Choose the spaces for this session (at least one).",
  "imageSessions.lead.noSpaces": "No spaces available",
  "imageSessions.lead.cancel": "Cancel",
  "imageSessions.lead.create": "Create",

  "imageSessions.lead.editNameTitle": "Edit session name",
  "imageSessions.lead.sessionName": "Session name",
  "imageSessions.lead.save": "Save",

  "imageSessions.lead.regenerateTitle": "Regenerate link",
  "imageSessions.lead.regenerateWarning":
    "The old link will stop working immediately. Any link you previously shared with the client will no longer work.",
  "imageSessions.lead.regenerateConfirm": "Do you want to continue and generate a new link?",
  "imageSessions.lead.regenerate": "Regenerate",

  "imageSessions.lead.sessionFallbackName": "Session #{id}",
  "imageSessions.lead.copied": "Copied",
  "imageSessions.lead.copyLink": "Copy link",
  "imageSessions.lead.openClientLink": "Open client link",
  "imageSessions.lead.openLink": "Open link",
  "imageSessions.lead.downloadFile": "Download file",
  "imageSessions.lead.editName": "Edit name",
  "imageSessions.lead.edit": "Edit",
  "imageSessions.lead.deleteSession": "Delete session",
  "imageSessions.lead.delete": "Delete",

  "imageSessions.lead.regenerateLoading": "Regenerating link...",
  "imageSessions.lead.savingLoading": "Saving...",
  "imageSessions.lead.deleteLoading": "Deleting session...",
  "imageSessions.lead.createLoading": "Creating session...",

  "imageSessions.lead.noViewPermission": "You don't have permission to view design sessions.",
  "imageSessions.lead.cardTitle": "Design sessions",
  "imageSessions.lead.cardSubtitle": "Design-selection links you share with the lead.",
  "imageSessions.lead.newSession": "New session",
  "imageSessions.lead.emptyTitle": "No sessions yet",
  "imageSessions.lead.emptyManage": "Create a new session to share a design-selection link with the client.",
  "imageSessions.lead.emptyView": "No session has been created for this client yet.",

  // Session status labels (shared)
  "imageSessions.status.INITIAL": "Start",
  "imageSessions.status.PREVIEW_COLOR_PATTERN": "Preview colors",
  "imageSessions.status.SELECTED_COLOR_PATTERN": "Colors selected",
  "imageSessions.status.PREVIEW_MATERIAL": "Preview materials",
  "imageSessions.status.SELECTED_MATERIAL": "Materials selected",
  "imageSessions.status.PREVIEW_STYLE": "Preview styles",
  "imageSessions.status.SELECTED_STYLE": "Style selected",
  "imageSessions.status.PREVIEW_IMAGES": "Preview images",
  "imageSessions.status.SELECTED_IMAGES": "Images selected",
  "imageSessions.status.PDF_GENERATED": "File generated",
  "imageSessions.status.SUBMITTED": "Submitted",

  // Wizard step labels (shared)
  "imageSessions.step.colors": "Colors",
  "imageSessions.step.materials": "Materials",
  "imageSessions.step.styles": "Styles",
  "imageSessions.step.images": "Images",
  "imageSessions.step.preview": "Preview",
  "imageSessions.step.signature": "Signature",
  "imageSessions.step.done": "File",

  // ── Public client wizard (SURFACE 3) ────────────────────────────────────────────
  "imageSessions.public.confirm.INITIAL": "Welcome to the design-selection session",
  "imageSessions.public.confirm.SELECTED_COLOR_PATTERN": "Color selection saved",
  "imageSessions.public.confirm.SELECTED_MATERIAL": "Material selection saved",
  "imageSessions.public.confirm.SELECTED_STYLE": "Style selection saved",
  "imageSessions.public.confirm.PREVIEW_IMAGES": "Image selection saved",

  "imageSessions.public.savingLoading": "Saving...",
  "imageSessions.public.invalidLinkTitle": "Invalid session link",
  "imageSessions.public.successTitle": "Your selections were submitted successfully",
  "imageSessions.public.successMessage": "Thank you. Our team will contact you soon.",
  "imageSessions.public.downloadFile": "Download file",
  "imageSessions.public.continue": "Continue",
  "imageSessions.public.startHint": "Press «Next» to start choosing colors.",
  "imageSessions.public.reviewHint": "Review your selections below, then continue to the next step.",
  "imageSessions.public.previous": "Previous",
  "imageSessions.public.next": "Next",
  "imageSessions.public.headerTitle": "Design selection",
  "imageSessions.public.headerSubtitle": "Step {current} of {total}",

  // Public wizard step nav
  "imageSessions.public.nav.previous": "Previous",
  "imageSessions.public.nav.next": "Next",
  "imageSessions.public.nav.saveAndContinue": "Save and continue",
  "imageSessions.public.saveSelectionLoading": "Saving your selection...",
  "imageSessions.public.noColors": "No colors available",
  "imageSessions.public.noMaterials": "No materials available",
  "imageSessions.public.noStyles": "No styles available",
  "imageSessions.public.noImages": "No images available",
  "imageSessions.public.noImagesDescription": "No images were found for the selected spaces and style.",

  // Public selection summary
  "imageSessions.public.summary.title": "Your selections so far",
  "imageSessions.public.summary.spaces": "Spaces",
  "imageSessions.public.summary.colors": "Colors",
  "imageSessions.public.summary.materials": "Materials",
  "imageSessions.public.summary.style": "Style",
  "imageSessions.public.summary.images": "Images",
  "imageSessions.public.summary.imagesCount": "{count} image(s) selected",

  // Public signature step
  "imageSessions.public.signature.title": "Signature & approval of selections",
  "imageSessions.public.signature.generating": "Generating the file…",
  "imageSessions.public.signature.chooseMethod": "Choose a signature method",
  "imageSessions.public.signature.online": "Electronic signature",
  "imageSessions.public.signature.uploadImage": "Upload signature image",
  "imageSessions.public.signature.drawTitle": "Draw your signature",
  "imageSessions.public.signature.back": "Back",
  "imageSessions.public.signature.clear": "Clear",
  "imageSessions.public.signature.approve": "Approve",
  "imageSessions.public.signature.uploadTitle": "Upload signature image",
  "imageSessions.public.signature.uploadHint":
    "Please crop the image so it contains only the signature. The preview will appear automatically after you choose the image.",
  "imageSessions.public.signature.pickImage": "Choose image",
  "imageSessions.public.signature.noImagePicked": "No image selected",
  "imageSessions.public.signature.preview": "Preview",
  "imageSessions.public.signature.uploadFailed": "Failed to upload the signature.",
  "imageSessions.public.signature.generatingLoading": "Generating the file…",
  "imageSessions.public.signature.signBeforeSave": "Please sign before saving.",
  "imageSessions.public.signature.processError": "Error processing the image. Try another image or crop it more clearly.",
  "imageSessions.public.signature.noPreviewReady": "No preview is ready.",
};
