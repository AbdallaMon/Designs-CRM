// Single-language (Arabic) resolution for backend message CODES emitted by the courses / LMS
// domain API ({ success, message: CODE, translationKey: "coursesMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/courses/courses.js); this is the FE
// lookup, covering BOTH surfaces (admin-course authoring + staff-course learner). Every code
// the courses surface can emit has an entry here; unknown codes fall back to a generic string.
// Mirrors features/calendar/config/calendarMessages.js.

export const coursesMessages = {
  // ── reads (admin) ──────────────────────────────────────────────────────────────
  COURSES_FETCHED: "تم جلب الدورات",
  COURSE_FETCHED: "تم جلب الدورة",
  LESSONS_FETCHED: "تم جلب الدروس",
  LESSON_FETCHED: "تم جلب الدرس",
  LESSON_VIDEOS_FETCHED: "تم جلب فيديوهات الدرس",
  LESSON_PDFS_FETCHED: "تم جلب ملفات الدرس",
  LESSON_LINKS_FETCHED: "تم جلب روابط الدرس",
  LESSON_VIDEO_PDFS_FETCHED: "تم جلب ملفات الفيديو",
  ALLOWED_ROLES_FETCHED: "تم جلب الأدوار المسموح لها",
  ALLOWED_USERS_FETCHED: "تم جلب المستخدمين المسموح لهم",
  HOMEWORKS_FETCHED: "تم جلب الواجبات",
  TESTS_FETCHED: "تم جلب الاختبارات",
  TEST_FETCHED: "تم جلب الاختبار",
  TEST_QUESTION_FETCHED: "تم جلب السؤال",
  ATTEMPTS_FETCHED: "تم جلب المحاولات",
  ATTEMPT_FETCHED: "تم جلب المحاولة",
  DASHBOARD_FETCHED: "تم جلب لوحة المعلومات",
  PROGRESS_FETCHED: "تم جلب التقدم",

  // ── mutations (admin) ──────────────────────────────────────────────────────────
  COURSE_CREATED: "تم إنشاء الدورة",
  COURSE_UPDATED: "تم تحديث الدورة",
  LESSON_CREATED: "تم إنشاء الدرس",
  LESSON_UPDATED: "تم تحديث الدرس",
  LESSON_DELETED: "تم حذف الدرس",
  LESSON_HOMEWORK_TOGGLED: "تم تعديل إعداد الواجب",
  LESSON_VIDEO_CREATED: "تم إضافة الفيديو",
  LESSON_VIDEO_UPDATED: "تم تحديث الفيديو",
  LESSON_VIDEO_DELETED: "تم حذف الفيديو",
  LESSON_PDF_CREATED: "تم إضافة الملف",
  LESSON_PDF_UPDATED: "تم تحديث الملف",
  LESSON_PDF_DELETED: "تم حذف الملف",
  LESSON_LINK_CREATED: "تم إضافة الرابط",
  LESSON_LINK_UPDATED: "تم تحديث الرابط",
  LESSON_LINK_DELETED: "تم حذف الرابط",
  LESSON_VIDEO_PDF_CREATED: "تم إضافة ملف الفيديو",
  LESSON_VIDEO_PDF_DELETED: "تم حذف ملف الفيديو",
  LESSON_ACCESS_GRANTED: "تم منح صلاحية الوصول للدرس",
  LESSON_ACCESS_DELETED: "تم إلغاء صلاحية الوصول للدرس",
  TEST_CREATED: "تم إنشاء الاختبار",
  TEST_UPDATED: "تم تحديث الاختبار",
  TEST_DELETED: "تم حذف الاختبار",
  TEST_QUESTION_CREATED: "تم إضافة السؤال",
  TEST_QUESTION_UPDATED: "تم تحديث السؤال",
  TEST_QUESTION_DELETED: "تم حذف السؤال",
  TEST_QUESTIONS_REORDERED: "تم إعادة ترتيب الأسئلة",
  ATTEMPT_INCREASED: "تم زيادة عدد المحاولات",
  ATTEMPT_DECREASED: "تم إنقاص عدد المحاولات",
  ANSWER_APPROVED: "تم اعتماد الإجابة",

  // ── mutations (staff) ──────────────────────────────────────────────────────────
  LESSON_COMPLETED: "تم إكمال الدرس",
  HOMEWORK_SAVED: "تم حفظ الواجب",
  ATTEMPT_CREATED: "تم بدء المحاولة",
  ANSWER_SUBMITTED: "تم إرسال الإجابة",
  ATTEMPT_ENDED: "تم إنهاء المحاولة",

  // ── errors ───────────────────────────────────────────────────────────────────
  COURSE_NOT_FOUND: "الدورة غير موجودة",
  LESSON_NOT_FOUND: "الدرس غير موجود",
  TEST_NOT_FOUND: "الاختبار غير موجود",
  ATTEMPT_NOT_FOUND: "المحاولة غير موجودة",
  ATTEMPT_ACCESS_DENIED: "لا تملك صلاحية الوصول إلى هذه المحاولة",
  COURSE_ACCESS_DENIED: "لا تملك صلاحية الوصول إلى هذه الدورة",
  LESSON_ACCESS_DENIED: "لا تملك صلاحية الوصول إلى هذا الدرس",
  PREVIOUS_LESSONS_INCOMPLETE: "يجب إكمال الدروس السابقة واجتياز اختباراتها أولاً",
  ATTEMPT_LIMIT_REACHED: "لقد وصلت إلى الحد الأقصى لعدد المحاولات",
  ATTEMPT_CANNOT_DECREASE: "لا يمكن إنقاص المحاولات أقل من العدد المستهلك",
  ATTEMPT_ALREADY_ENDED: "تم إنهاء هذه المحاولة بالفعل",
  QUESTION_TEST_MISMATCH: "هذا السؤال لا ينتمي إلى هذا الاختبار",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
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
export function resolveCoursesMessage(code, { fallback, translationKey } = {}) {
  if (code && coursesMessages[code]) return coursesMessages[code];
  return resolveMessageCode(code, { translationKey, fallback });
}
