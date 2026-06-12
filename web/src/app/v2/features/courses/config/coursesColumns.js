// Declarative column/label config for the courses feature — the config-folder contract.
// Tables in this v2 app are hand-built MUI (no shared DataTable), so a "column" here is a
// { field, headerName, accessor } descriptor the page maps over. Both surfaces share this
// file: the ADMIN authoring list (CoursesPage) and the STAFF learner list (MyCoursesPage).
// Single-language Arabic, RTL.

// ── Course roles (CourseRole.role is the Prisma UserRole enum) ──────────────────────────────
// Arabic labels mirror features/utilities RolesTab ROLE_LABELS. `roles[]` on a course gates
// which roles may see it (BE: where roles.some.role); used by the admin create/edit form.
export const COURSE_ROLE_LABELS = {
  ADMIN: "مدير",
  SUPER_ADMIN: "مدير عام",
  STAFF: "موظف",
  SUPER_SALES: "مشرف مبيعات",
  CONTACT_INITIATOR: "بادئ التواصل",
  THREE_D_DESIGNER: "مصمم ثري دي",
  TWO_D_DESIGNER: "مصمم تو دي",
  TWO_D_EXECUTOR: "منفّذ",
  ACCOUNTANT: "محاسب",
};

export const COURSE_ROLE_OPTIONS = Object.entries(COURSE_ROLE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const courseRoleLabel = (r) => COURSE_ROLE_LABELS[r] || r;

// ── ADMIN list columns ──────────────────────────────────────────────────────────────────────
// Shape per row (admin-course.repository listCourses include): { id, title, description,
// imageUrl, isPublished, roles:[{id,role,courseId}], _count:{lessons,tests}, capabilities }.
export const coursesAdminColumns = [
  { field: "id", headerName: "#", accessor: (r) => r.id },
  { field: "title", headerName: "عنوان الدورة", accessor: (r) => r.title || `دورة #${r.id}` },
  {
    field: "lessons",
    headerName: "الدروس",
    accessor: (r) => r._count?.lessons ?? 0,
  },
  {
    field: "tests",
    headerName: "الاختبارات",
    accessor: (r) => r._count?.tests ?? 0,
  },
  {
    field: "isPublished",
    headerName: "الحالة",
    accessor: (r) => (r.isPublished ? "منشورة" : "مسودة"),
  },
];

// ── STAFF dashboard course-progress columns ──────────────────────────────────────────────────
// The learner list (MyCoursesPage) renders cards, not a table, but the dashboard
// `courseProgress[]` shape is documented here for reference:
//   { id, title, description, imageUrl, isPublished, completionPercentage, completedLessons,
//     totalLessons, lastActivity }
export const LEARNER_COURSE_FIELDS = [
  "id",
  "title",
  "description",
  "completionPercentage",
  "completedLessons",
  "totalLessons",
];
