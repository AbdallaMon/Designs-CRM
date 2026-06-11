// Static option/label sets for the courses / LMS UI (BOTH surfaces). Single-language Arabic.
// DISPLAY-only — the server is the source of truth for every value. Enum KEYS are the data
// contract (Prisma schema.prisma); labels are Arabic. No backend message CODES live here (those
// are in coursesMessages.js); these are UI pick-lists / static labels only.

import { ROLE_LABELS, resolveRoleLabel } from "@/app/v2/features/shell/roleLabels.js";

// Prisma UserRole keys, offered as the "allowed roles" multi-select on a course (Course.roles
// is CourseRole[] → a list of UserRole values). Order = display order; labels reuse ROLE_LABELS.
export const COURSE_ROLE_OPTIONS = Object.keys(ROLE_LABELS).map((value) => ({
  value,
  label: resolveRoleLabel(value),
}));

export { resolveRoleLabel };

// Prisma TestType — the kind of test (admin create/edit test form).
export const TEST_TYPE_OPTIONS = [
  { value: "LESSON", label: "اختبار درس" },
  { value: "FINAL", label: "اختبار نهائي" },
  { value: "PRACTICE", label: "تدريب" },
  { value: "PLACEMENT", label: "تحديد مستوى" },
];
export function resolveTestTypeLabel(value) {
  return TEST_TYPE_OPTIONS.find((t) => t.value === value)?.label ?? value ?? "—";
}

// Prisma CoursesQuestionType — the kind of question (admin question editor + the test-taker
// renders each type's input).
export const QUESTION_TYPE_OPTIONS = [
  { value: "SINGLE_CHOICE", label: "اختيار واحد" },
  { value: "MULTIPLE_CHOICE", label: "اختيار متعدد" },
  { value: "TRUE_FALSE", label: "صح / خطأ" },
  { value: "TEXT", label: "إجابة نصية" },
  { value: "ORDERING", label: "ترتيب" },
];
export function resolveQuestionTypeLabel(value) {
  return QUESTION_TYPE_OPTIONS.find((q) => q.value === value)?.label ?? value ?? "—";
}
// Choice-based question types render selectable choices; TEXT renders a free-text answer.
export const CHOICE_QUESTION_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "ORDERING"];
export const MULTI_SELECT_QUESTION_TYPES = ["MULTIPLE_CHOICE", "ORDERING"];

// Prisma LessonVideoType — how a lesson video is embedded.
export const VIDEO_TYPE_OPTIONS = [
  { value: "IFRAME", label: "إطار مضمّن (iframe)" },
  { value: "URL", label: "رابط مباشر" },
];

// Prisma HomeworkType — the learner homework submission kind.
export const HOMEWORK_TYPE_OPTIONS = [
  { value: "VIDEO", label: "فيديو" },
  { value: "SUMMARY", label: "ملخّص" },
];

// Published / draft display bucket for a course or test (the boolean isPublished/published).
export function publishLabel(isPublished) {
  return isPublished ? "منشورة" : "مسودة";
}

// Plain-Arabic UI strings that are NOT backend message codes (screen copy, button labels,
// state titles). Kept here so logic carries no inline literals the way codes are resolved via
// coursesMessages.js. Single source for the courses UI wording.
export const COURSES_UI = {
  // admin list
  adminTitle: "إدارة الدورات",
  adminSubtitlePrefix: "الإجمالي",
  createCourse: "إنشاء دورة",
  editCourse: "تعديل الدورة",
  noCourses: "لا توجد دورات",
  noCoursesHintCreate: "ابدأ بإنشاء أول دورة لفريقك.",
  noCoursesHintView: "لا توجد دورات مطابقة للتصفية الحالية.",
  deniedAdmin: "إدارة الدورات غير متاحة لصلاحياتك",
  deniedAdminMsg: "لا تملك صلاحية عرض الدورات. تواصل مع المسؤول إن كنت تظن أنه ينبغي أن تصل إليها.",
  openEditor: "فتح محرّر الدورة",
  // learner list
  learnerTitle: "دوراتي",
  noLearnerCourses: "لا توجد دورات متاحة لك",
  noLearnerCoursesMsg: "لم تُسنَد إليك أي دورة بعد. ستظهر دوراتك هنا فور إتاحتها.",
  deniedLearner: "الدورات غير متاحة لصلاحياتك",
  deniedLearnerMsg: "لا تملك صلاحية الوصول إلى الدورات التعليمية.",
  openCourse: "متابعة الدورة",
};
