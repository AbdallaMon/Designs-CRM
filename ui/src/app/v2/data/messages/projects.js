// Central Arabic map for the PROJECTS message CODES
// (packages/shared/messages-codes/projects/projects.js → projectsMessagesCodes).
// translationKey namespace: "projectsMessages". Covers project/task/update/delivery.
// Harvested from features/projects/config/projectsMessages.js. CODE → عربي.

export const projectsMessages = {
  // ── projects: reads ────────────────────────────────────────────────────────────
  PROJECTS_FETCHED: "تم جلب المشاريع",
  PROJECT_FETCHED: "تم جلب المشروع",
  DESIGNER_PROJECTS_FETCHED: "تم جلب مشاريع المصممين",
  DESIGNER_LEAD_FETCHED: "تم جلب بيانات العميل",
  ARCHIVED_PROJECTS_FETCHED: "تم جلب المشاريع المؤرشفة",
  USER_PROJECTS_FETCHED: "تم جلب مشاريع المستخدم",
  PROJECT_GROUPS_FETCHED: "تم جلب مجموعات المشاريع",

  // ── projects: mutations ──────────────────────────────────────────────────────────
  PROJECT_UPDATED: "تم تحديث المشروع",
  PROJECT_DESIGNER_ASSIGNED: "تم تحديث تعيين المصمم",
  PROJECT_STATUS_CHANGED: "تم تغيير حالة المشروع",

  // ── tasks ────────────────────────────────────────────────────────────────────────
  TASKS_FETCHED: "تم جلب المهام",
  TASK_FETCHED: "تم جلب المهمة",
  TASK_CREATED: "تم إنشاء المهمة",
  MODIFICATION_CREATED: "تم إنشاء التعديل",
  TASK_UPDATED: "تم تحديث المهمة",
  MODIFICATION_UPDATED: "تم تحديث التعديل",
  TASK_DELETED: "تم حذف المهمة",
  NOTES_FETCHED: "تم جلب الملاحظات",
  NOTE_ADDED: "تمت إضافة الملاحظة",

  // ── updates ──────────────────────────────────────────────────────────────────────
  UPDATES_FETCHED: "تم جلب التحديثات",
  UPDATE_SHARED_SETTINGS_FETCHED: "تم جلب إعدادات المشاركة",
  UPDATE_CREATED: "تم إنشاء التحديث",
  UPDATE_DEPARTMENT_AUTHORIZED: "تم اعتماد القسم",
  UPDATE_DEPARTMENT_UNAUTHORIZED: "تم إلغاء اعتماد القسم",
  UPDATE_ARCHIVE_TOGGLED: "تم تحديث حالة الأرشفة",
  SHARED_UPDATE_ARCHIVE_TOGGLED: "تم تحديث حالة الأرشفة",
  UPDATE_MARKED_DONE: "تم وضع علامة منجز على التحديث",

  // ── delivery ─────────────────────────────────────────────────────────────────────
  DELIVERY_SCHEDULES_FETCHED: "تم جلب مواعيد التسليم",
  DELIVERY_SCHEDULE_CREATED: "تمت إضافة موعد التسليم",
  DELIVERY_LINKED_TO_MEETING: "تم ربط التسليم بالاجتماع",
  DELIVERY_SCHEDULE_DELETED: "تم حذف موعد التسليم",

  // ── errors / scope / guards ────────────────────────────────────────────────────
  PROJECT_NOT_FOUND: "المشروع غير موجود",
  PROJECT_ACCESS_DENIED: "لا تملك صلاحية الوصول إلى هذا المشروع",
  PROJECT_MUTATE_DENIED: "لا تملك صلاحية تعديل هذا المشروع",
  TASK_NOT_FOUND: "المهمة غير موجودة",
  UPDATE_NOT_FOUND: "التحديث غير موجود",
  SHARED_UPDATE_NOT_FOUND: "التحديث المشترك غير موجود",
  DELIVERY_NOT_FOUND: "موعد التسليم غير موجود",
  PROJECT_STATUS_TRANSITION_FORBIDDEN: "لا يمكن تغيير الحالة من الحالة الحالية",
  TASK_STATUS_TRANSITION_FORBIDDEN: "لا يمكن تعديل مهمة منتهية",
  PROJECT_NOT_IN_MODIFICATION: "المشروع ليس في مرحلة التعديل بعد",
  DESIGNER_ALREADY_ASSIGNED: "المصمم معيّن بالفعل",
  DELETE_MODEL_REQUIRED: "نوع العنصر المراد حذفه مطلوب",
  DELETE_NOT_ALLOWED: "لا يمكن حذف هذا العنصر",
};
