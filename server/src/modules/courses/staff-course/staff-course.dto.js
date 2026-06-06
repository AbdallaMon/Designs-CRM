// Output shaping for the staff (course-consumption) surface. Pure — no Prisma here.
// Per decision #3, scoped list/detail responses attach a per-record `capabilities`
// object. Course-taking is granted to every authenticated role (STAFF_COURSE codes
// via SHARED_AUTHED); object-level access (which course/lesson/attempt) is enforced
// by the course-role gate + the attempt scope checker, so the capabilities just
// reflect the two consumption codes. Backend stays the source of truth.
import { PERMISSIONS, computeCapabilities, hasPermission } from "@dms/shared";

const STAFF_COURSE_CAPABILITY_RULES = {
  // browse/read course content
  canView: ({ permissions }) =>
    hasPermission(permissions, PERMISSIONS.STAFF_COURSE.VIEW),
  // mark lesson complete, submit homework, create attempt, submit answer, end attempt
  canTake: ({ permissions }) =>
    hasPermission(permissions, PERMISSIONS.STAFF_COURSE.TAKE),
};

export function computeStaffCourseCapabilities({ permissions } = {}) {
  return computeCapabilities(STAFF_COURSE_CAPABILITY_RULES, {
    permissions: permissions || [],
  });
}

/**
 * Attach `capabilities` to each course in the staff browse list. Rows are returned
 * VERBATIM otherwise (shape ported from legacy `getCourses`).
 * @param {object[]} courses
 * @param {{ permissions?: string[] }} ctx
 */
export function decorateStaffCourseList(courses, ctx) {
  const capabilities = computeStaffCourseCapabilities(ctx);
  return (courses || []).map((course) => ({ ...course, capabilities }));
}

/**
 * Attach `capabilities` to a single course detail (or pass through null). Legacy
 * `getCourse` returns `null` when the course is unpublished / role-mismatched.
 * @param {object|null} course
 * @param {{ permissions?: string[] }} ctx
 */
export function decorateStaffCourseDetail(course, ctx) {
  if (!course) return null;
  return { ...course, capabilities: computeStaffCourseCapabilities(ctx) };
}
