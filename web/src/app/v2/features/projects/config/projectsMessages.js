// Single-language (Arabic) resolution for backend message CODES emitted by the projects
// domain API ({ success, message: CODE, translationKey: "projectsMessages" }). The
// backend stays language-neutral (packages/shared/messages-codes/projects/projects.js);
// this is the FE lookup. Every code the projects/task/update/delivery surfaces can emit
// has an entry here; unknown codes fall back to a generic string.

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

  // ── generic envelope codes (shared) ────────────────────────────────────────────
  OK: "تمت العملية بنجاح",
  CREATED: "تم الإنشاء بنجاح",
  UPDATED: "تم التحديث بنجاح",
  DELETED: "تم الحذف بنجاح",
  FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء",
  ACCESS_DENIED: "لا تملك صلاحية الوصول",
  VALIDATION_ERROR: "بيانات غير صحيحة",
};

import { resolveMessageCode } from "@/app/v2/data/resolveMessageCode.js";

/**
 * Resolve a backend message CODE to an Arabic display string. Feature Arabic wins first;
 * unknown codes delegate to the CENTRAL resolver. `translationKey` routes the central lookup.
 * @param {string} code
 * @param {{ fallback?: string, translationKey?: string }} [opts]
 */
export function resolveProjectsMessage(code, { fallback, translationKey } = {}) {
  if (code && projectsMessages[code]) return projectsMessages[code];
  return resolveMessageCode(code, { translationKey, fallback });
}
