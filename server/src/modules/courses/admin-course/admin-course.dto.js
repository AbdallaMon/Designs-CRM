// Output shaping for the admin (management) course surface. Pure — no Prisma here.
// Per decision #3, scoped list/detail responses attach a per-record `capabilities`
// object computed from the caller's permission codes. The admin surface is a single
// privileged management surface (course/lesson/test CRUD, access grants, attempt
// admin), so the capabilities mirror the four COURSE codes. Backend stays the
// source of truth; capabilities are a rendering hint only.
import { PERMISSIONS, computeCapabilities, hasPermission } from "@dms/shared";

const COURSE_CAPABILITY_RULES = {
  // create/edit course, lessons, content, tests, questions
  canManage: ({ permissions }) =>
    hasPermission(permissions, PERMISSIONS.COURSE.MANAGE),
  // grant/revoke lesson access, view allowed users/roles
  canManageAccess: ({ permissions }) =>
    hasPermission(permissions, PERMISSIONS.COURSE.ACCESS_MANAGE),
  // increase/decrease attempts, approve answers, view attempt summaries
  canManageAttempts: ({ permissions }) =>
    hasPermission(permissions, PERMISSIONS.COURSE.ATTEMPT_MANAGE),
};

/**
 * Compute the per-record capabilities for an admin course record.
 * @param {{ permissions?: string[] }} ctx
 */
export function computeCourseCapabilities({ permissions } = {}) {
  return computeCapabilities(COURSE_CAPABILITY_RULES, {
    permissions: permissions || [],
  });
}

/**
 * Attach `capabilities` to each course in a list. The course rows are returned
 * VERBATIM otherwise (shape ported from the legacy `getCourses` include) so the
 * admin contract is unchanged apart from the additive capabilities field.
 * @param {object[]} courses
 * @param {{ permissions?: string[] }} ctx
 */
export function decorateCourseList(courses, ctx) {
  const capabilities = computeCourseCapabilities(ctx);
  return (courses || []).map((course) => ({ ...course, capabilities }));
}
