// Per-feature UI dictionary: tasks list page (TasksPage).
//
// COMPOSITION MODEL: one file per feature/area. Fill BOTH `ar` and `en` with the SAME keys,
// namespaced under "tasks.*". The barrel (./index.js) deep-merges every stub's `ar` into one ar
// map and `en` into one en map, then uiDictionary merges those on top of its core keys. You do
// NOT edit the barrel or uiDictionary — just fill this file and call t("tasks.<key>") in the
// feature's components.
//
// CONTRACT: ar is the existing/authoritative wording (verbatim from the components it replaces),
// so ar renders identically. en is the additive natural translation. Keys identical across ar/en.

export const ar = {
  "tasks.page.denied": "لا تملك صلاحية الوصول إلى المهام",
  "tasks.page.title": "المهام",
  "tasks.action.create": "إنشاء مهمة",
  "tasks.action.refresh": "تحديث",
  "tasks.empty": "لا توجد مهام",
  "tasks.type": "النوع: {type}",
  "tasks.openDetails": "فتح التفاصيل",
  "tasks.due": "الاستحقاق: {value}",
  "tasks.dueUnset": "غير محدد",
  "tasks.assignedTo": "معيّنة إلى: {name}",
  "tasks.delete": "حذف",
  "tasks.loading.delete": "جاري الحذف...",
  "tasks.modal.name": "مهمة",
};

export const en = {
  "tasks.page.denied": "You don't have permission to access tasks",
  "tasks.page.title": "Tasks",
  "tasks.action.create": "Create task",
  "tasks.action.refresh": "Refresh",
  "tasks.empty": "No tasks",
  "tasks.type": "Type: {type}",
  "tasks.openDetails": "Open details",
  "tasks.due": "Due: {value}",
  "tasks.dueUnset": "Not set",
  "tasks.assignedTo": "Assigned to: {name}",
  "tasks.delete": "Delete",
  "tasks.loading.delete": "Deleting...",
  "tasks.modal.name": "task",
};
