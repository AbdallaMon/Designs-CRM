// Per-feature UI dictionary: projects board list + project work-surface + tasks/updates/delivery panels.
//
// COMPOSITION MODEL: one file per feature/area. Fill BOTH `ar` and `en` with the SAME keys,
// namespaced under "projects.*" (e.g. "projects.title", "projects.actions.create"). The barrel
// (./index.js) deep-merges every stub's `ar` into one ar map and `en` into one en map, then
// uiDictionary merges those on top of its core keys. You do NOT edit the barrel or uiDictionary —
// just fill this file and call t("projects.<key>") in the feature's components.
//
// CONTRACT: ar is the existing/authoritative wording (verbatim from the components it replaces),
// so ar renders identically. en is the additive natural translation. Keys identical across ar/en.

export const ar = {
  // ── board list page (ProjectsPage) ──────────────────────────────────────────
  "projects.page.title": "المشاريع",
  "projects.page.denied": "لا تملك صلاحية الوصول إلى المشاريع",
  "projects.mode.active": "النشطة",
  "projects.mode.archived": "المؤرشفة",
  "projects.search.byClientId": "بحث برقم العميل",
  "projects.action.refresh": "تحديث",
  "projects.state.loading": "جاري التحميل...",
  "projects.state.empty": "لا توجد بيانات",
  "projects.pagination.rows": "عدد الصفوف",

  // ── lead projects group surface (LeadProjects) ──────────────────────────────
  "projects.group.sectionTitle": "المشاريع",
  "projects.group.empty.title": "لا توجد مشاريع",
  "projects.group.empty.description": "لم يتم إنشاء أي مشروع لهذا العميل بعد.",
  "projects.group.emptyInGroup": "لا توجد مشاريع في هذه المجموعة",
  "projects.group.noneSelected": "لم يتم اختيار مشروع",

  // ── work-surface (ProjectDetails) ───────────────────────────────────────────
  "projects.detail.onHold": "هذا المشروع معلّق حالياً.",
  "projects.detail.rejected": "تم رفض هذا المشروع.",
  "projects.detail.progressTitle": "تقدّم المشروع",
  "projects.detail.editTitle": "تعديل تفاصيل المشروع",
  "projects.detail.field.status": "حالة المشروع",
  "projects.detail.field.priority": "الأولوية",
  "projects.detail.field.area": "المساحة (م²)",
  "projects.detail.cancel": "إلغاء",
  "projects.detail.saveChanges": "حفظ التغييرات",
  "projects.detail.groupChip": "المجموعة: {value}",
  "projects.detail.editDetails": "تعديل التفاصيل",
  "projects.detail.areaTitle": "مساحة المشروع",
  "projects.detail.areaValue": "{value} م²",
  "projects.detail.areaUnset": "غير محددة",
  "projects.detail.timelineTitle": "المدة الزمنية",
  "projects.detail.timelineNotStarted": "لم يبدأ",
  "projects.detail.timelineOngoing": "جارٍ",
  "projects.detail.designersTitle": "مصممو المشروع",
  "projects.detail.assignNew": "تعيين مصمم جديد",
  "projects.detail.remove": "إزالة",
  "projects.detail.noDesigners": "لا يوجد مصممون معيّنون لهذا المشروع بعد",

  // ── priority labels (inline) ────────────────────────────────────────────────
  "projects.priority.veryLow": "منخفضة جداً",
  "projects.priority.low": "منخفضة",
  "projects.priority.medium": "متوسطة",
  "projects.priority.high": "عالية",
  "projects.priority.veryHigh": "عالية جداً",

  // ── mutation loading toasts ─────────────────────────────────────────────────
  "projects.loading.changeStatus": "جاري تحديث الحالة...",
  "projects.loading.save": "جاري الحفظ...",

  // ── assign designer modal (AssignDesignerModal) ─────────────────────────────
  "projects.assign.removeTitle": "إزالة المصمم",
  "projects.assign.assignTitle": "تعيين مصمم",
  "projects.assign.confirmRemove": "هل أنت متأكد من إزالة المصمم من هذا المشروع؟",
  "projects.assign.removeFromModification": "إزالة المستخدم من جزء التعديل أيضاً",
  "projects.assign.selectDesigner": "اختر مصمماً",
  "projects.assign.addToModification": "إضافة المستخدم إلى جزء التعديل",
  "projects.assign.cancel": "إلغاء",
  "projects.assign.remove": "إزالة",
  "projects.assign.assign": "تعيين",
  "projects.assign.loading.remove": "جاري إزالة المصمم...",
  "projects.assign.loading.assign": "جاري تعيين المصمم...",

  // ── delivery schedules panel (DeliverySchedulesPanel) ───────────────────────
  "projects.delivery.newTitle": "موعد تسليم جديد",
  "projects.delivery.name": "الاسم",
  "projects.delivery.daysFromToday": "عدد الأيام من اليوم",
  "projects.delivery.deliveryDate": "موعد التسليم: {value}",
  "projects.delivery.cancel": "إلغاء",
  "projects.delivery.saving": "جاري الحفظ...",
  "projects.delivery.save": "حفظ",
  "projects.delivery.linkTitle": "ربط التسليم باجتماع",
  "projects.delivery.noMeetings": "لا توجد اجتماعات لهذا العميل.",
  "projects.delivery.link": "ربط",
  "projects.delivery.sectionTitle": "مواعيد التسليم",
  "projects.delivery.newButton": "موعد جديد",
  "projects.delivery.empty": "لا توجد مواعيد تسليم بعد.",
  "projects.delivery.meetingChip": "اجتماع #{id}",
  "projects.delivery.linkTooltip": "ربط باجتماع",
  "projects.delivery.deleteTooltip": "حذف موعد التسليم",
  "projects.delivery.createdBy": "أنشأه:",
  "projects.delivery.loading.add": "جاري الإضافة...",
  "projects.delivery.loading.link": "جاري ربط الاجتماع...",
  "projects.delivery.loading.delete": "جاري الحذف...",

  // ── project tasks panel (ProjectTasksPanel) ─────────────────────────────────
  "projects.tasks.modificationsTitle": "التعديلات",
  "projects.tasks.projectTasksTitle": "مهام المشروع",
  "projects.tasks.create": "إنشاء {name}",
  "projects.tasks.empty": "لا توجد مهام.",
  "projects.tasks.type": "النوع: {type}",
  "projects.tasks.due": "الاستحقاق: {value}",
  "projects.tasks.assignedTo": "معيّنة إلى: {name}",
  "projects.tasks.delete": "حذف",
  "projects.tasks.dueUnset": "غير محدد",
  "projects.tasks.defaultName": "مهمة",
  "projects.tasks.loading.delete": "جاري الحذف...",

  // ── task actions (TaskActions) ──────────────────────────────────────────────
  "projects.taskActions.changeStatus": "تغيير الحالة",
  "projects.taskActions.changePriority": "تغيير الأولوية",
  "projects.taskActions.loading.update": "جاري التحديث...",

  // ── create task modal (CreateTaskModal) ─────────────────────────────────────
  "projects.createTask.title": "إنشاء {name}",
  "projects.createTask.titleField": "العنوان",
  "projects.createTask.description": "الوصف",
  "projects.createTask.dueDate": "تاريخ الاستحقاق",
  "projects.createTask.priority": "الأولوية",
  "projects.createTask.cancel": "إلغاء",
  "projects.createTask.create": "إنشاء",
  "projects.createTask.loading.create": "جاري الإنشاء...",
  "projects.createTask.defaultName": "مهمة",

  // ── updates list (UpdatesList) ──────────────────────────────────────────────
  "projects.updates.denied": "لا تملك صلاحية الوصول إلى التحديثات",
  "projects.updates.title": "التحديثات",
  "projects.updates.filter.all": "الكل",
  "projects.updates.filter.active": "نشطة",
  "projects.updates.filter.archived": "مؤرشفة",
  "projects.updates.filterByDepartment": "تصفية حسب القسم",
  "projects.updates.allDepartments": "كل الأقسام",
  "projects.updates.loading": "جاري التحميل...",
  "projects.updates.empty": "لا توجد تحديثات",

  // ── update card (UpdateCard) ────────────────────────────────────────────────
  "projects.updateCard.done": "منجز",
  "projects.updateCard.archived": "مؤرشف",
  "projects.updateCard.department": "القسم",
  "projects.updateCard.authorize": "اعتماد",
  "projects.updateCard.unauthorize": "إلغاء الاعتماد",
  "projects.updateCard.unarchive": "إلغاء الأرشفة",
  "projects.updateCard.archive": "أرشفة",
  "projects.updateCard.markDone": "وضع علامة منجز",
  "projects.updateCard.loading.update": "جاري التحديث...",
  "projects.updateCard.loading.archive": "جاري تحديث الأرشفة...",
  "projects.updateCard.loading.markDone": "جاري وضع علامة منجز...",

  // ── create update modal (CreateUpdateModal) ─────────────────────────────────
  "projects.createUpdate.adminExclusive": "عند اختيار الإدارة لا يمكن المشاركة مع أي قسم آخر",
  "projects.createUpdate.unselectAdmin": "يجب إلغاء اختيار الإدارة للمشاركة مع أقسام أخرى",
  "projects.createUpdate.titleRequired": "العنوان مطلوب",
  "projects.createUpdate.deptRequired": "يجب اختيار قسم واحد على الأقل",
  "projects.createUpdate.openButton": "إنشاء تحديث",
  "projects.createUpdate.dialogTitle": "تحديث جديد",
  "projects.createUpdate.titleField": "العنوان",
  "projects.createUpdate.description": "الوصف",
  "projects.createUpdate.mainDepartment": "القسم الرئيسي",
  "projects.createUpdate.sharedDepartments": "الأقسام المشاركة",
  "projects.createUpdate.cancel": "إلغاء",
  "projects.createUpdate.submit": "إنشاء التحديث",
  "projects.createUpdate.loading.create": "جاري الإنشاء...",
};

export const en = {
  // ── board list page (ProjectsPage) ──────────────────────────────────────────
  "projects.page.title": "Projects",
  "projects.page.denied": "You don't have permission to access projects",
  "projects.mode.active": "Active",
  "projects.mode.archived": "Archived",
  "projects.search.byClientId": "Search by client number",
  "projects.action.refresh": "Refresh",
  "projects.state.loading": "Loading...",
  "projects.state.empty": "No data",
  "projects.pagination.rows": "Rows per page",

  // ── lead projects group surface (LeadProjects) ──────────────────────────────
  "projects.group.sectionTitle": "Projects",
  "projects.group.empty.title": "No projects",
  "projects.group.empty.description": "No project has been created for this client yet.",
  "projects.group.emptyInGroup": "No projects in this group",
  "projects.group.noneSelected": "No project selected",

  // ── work-surface (ProjectDetails) ───────────────────────────────────────────
  "projects.detail.onHold": "This project is currently on hold.",
  "projects.detail.rejected": "This project has been rejected.",
  "projects.detail.progressTitle": "Project progress",
  "projects.detail.editTitle": "Edit project details",
  "projects.detail.field.status": "Project status",
  "projects.detail.field.priority": "Priority",
  "projects.detail.field.area": "Area (m²)",
  "projects.detail.cancel": "Cancel",
  "projects.detail.saveChanges": "Save changes",
  "projects.detail.groupChip": "Group: {value}",
  "projects.detail.editDetails": "Edit details",
  "projects.detail.areaTitle": "Project area",
  "projects.detail.areaValue": "{value} m²",
  "projects.detail.areaUnset": "Not set",
  "projects.detail.timelineTitle": "Timeline",
  "projects.detail.timelineNotStarted": "Not started",
  "projects.detail.timelineOngoing": "ongoing",
  "projects.detail.designersTitle": "Project designers",
  "projects.detail.assignNew": "Assign new designer",
  "projects.detail.remove": "Remove",
  "projects.detail.noDesigners": "No designers assigned to this project yet",

  // ── priority labels (inline) ────────────────────────────────────────────────
  "projects.priority.veryLow": "Very low",
  "projects.priority.low": "Low",
  "projects.priority.medium": "Medium",
  "projects.priority.high": "High",
  "projects.priority.veryHigh": "Very high",

  // ── mutation loading toasts ─────────────────────────────────────────────────
  "projects.loading.changeStatus": "Updating status...",
  "projects.loading.save": "Saving...",

  // ── assign designer modal (AssignDesignerModal) ─────────────────────────────
  "projects.assign.removeTitle": "Remove designer",
  "projects.assign.assignTitle": "Assign designer",
  "projects.assign.confirmRemove": "Are you sure you want to remove the designer from this project?",
  "projects.assign.removeFromModification": "Also remove the user from the modification part",
  "projects.assign.selectDesigner": "Select a designer",
  "projects.assign.addToModification": "Add the user to the modification part",
  "projects.assign.cancel": "Cancel",
  "projects.assign.remove": "Remove",
  "projects.assign.assign": "Assign",
  "projects.assign.loading.remove": "Removing designer...",
  "projects.assign.loading.assign": "Assigning designer...",

  // ── delivery schedules panel (DeliverySchedulesPanel) ───────────────────────
  "projects.delivery.newTitle": "New delivery date",
  "projects.delivery.name": "Name",
  "projects.delivery.daysFromToday": "Days from today",
  "projects.delivery.deliveryDate": "Delivery date: {value}",
  "projects.delivery.cancel": "Cancel",
  "projects.delivery.saving": "Saving...",
  "projects.delivery.save": "Save",
  "projects.delivery.linkTitle": "Link delivery to a meeting",
  "projects.delivery.noMeetings": "No meetings for this client.",
  "projects.delivery.link": "Link",
  "projects.delivery.sectionTitle": "Delivery dates",
  "projects.delivery.newButton": "New date",
  "projects.delivery.empty": "No delivery dates yet.",
  "projects.delivery.meetingChip": "Meeting #{id}",
  "projects.delivery.linkTooltip": "Link to a meeting",
  "projects.delivery.deleteTooltip": "Delete delivery date",
  "projects.delivery.createdBy": "Created by:",
  "projects.delivery.loading.add": "Adding...",
  "projects.delivery.loading.link": "Linking meeting...",
  "projects.delivery.loading.delete": "Deleting...",

  // ── project tasks panel (ProjectTasksPanel) ─────────────────────────────────
  "projects.tasks.modificationsTitle": "Modifications",
  "projects.tasks.projectTasksTitle": "Project tasks",
  "projects.tasks.create": "Create {name}",
  "projects.tasks.empty": "No tasks.",
  "projects.tasks.type": "Type: {type}",
  "projects.tasks.due": "Due: {value}",
  "projects.tasks.assignedTo": "Assigned to: {name}",
  "projects.tasks.delete": "Delete",
  "projects.tasks.dueUnset": "Not set",
  "projects.tasks.defaultName": "task",
  "projects.tasks.loading.delete": "Deleting...",

  // ── task actions (TaskActions) ──────────────────────────────────────────────
  "projects.taskActions.changeStatus": "Change status",
  "projects.taskActions.changePriority": "Change priority",
  "projects.taskActions.loading.update": "Updating...",

  // ── create task modal (CreateTaskModal) ─────────────────────────────────────
  "projects.createTask.title": "Create {name}",
  "projects.createTask.titleField": "Title",
  "projects.createTask.description": "Description",
  "projects.createTask.dueDate": "Due date",
  "projects.createTask.priority": "Priority",
  "projects.createTask.cancel": "Cancel",
  "projects.createTask.create": "Create",
  "projects.createTask.loading.create": "Creating...",
  "projects.createTask.defaultName": "task",

  // ── updates list (UpdatesList) ──────────────────────────────────────────────
  "projects.updates.denied": "You don't have permission to access updates",
  "projects.updates.title": "Updates",
  "projects.updates.filter.all": "All",
  "projects.updates.filter.active": "Active",
  "projects.updates.filter.archived": "Archived",
  "projects.updates.filterByDepartment": "Filter by department",
  "projects.updates.allDepartments": "All departments",
  "projects.updates.loading": "Loading...",
  "projects.updates.empty": "No updates",

  // ── update card (UpdateCard) ────────────────────────────────────────────────
  "projects.updateCard.done": "Done",
  "projects.updateCard.archived": "Archived",
  "projects.updateCard.department": "Department",
  "projects.updateCard.authorize": "Authorize",
  "projects.updateCard.unauthorize": "Unauthorize",
  "projects.updateCard.unarchive": "Unarchive",
  "projects.updateCard.archive": "Archive",
  "projects.updateCard.markDone": "Mark as done",
  "projects.updateCard.loading.update": "Updating...",
  "projects.updateCard.loading.archive": "Updating archive state...",
  "projects.updateCard.loading.markDone": "Marking as done...",

  // ── create update modal (CreateUpdateModal) ─────────────────────────────────
  "projects.createUpdate.adminExclusive": "When selecting Admin you cannot share with any other department",
  "projects.createUpdate.unselectAdmin": "You must unselect Admin to share with other departments",
  "projects.createUpdate.titleRequired": "Title is required",
  "projects.createUpdate.deptRequired": "You must select at least one department",
  "projects.createUpdate.openButton": "Create update",
  "projects.createUpdate.dialogTitle": "New update",
  "projects.createUpdate.titleField": "Title",
  "projects.createUpdate.description": "Description",
  "projects.createUpdate.mainDepartment": "Main department",
  "projects.createUpdate.sharedDepartments": "Shared departments",
  "projects.createUpdate.cancel": "Cancel",
  "projects.createUpdate.submit": "Create update",
  "projects.createUpdate.loading.create": "Creating...",
};
