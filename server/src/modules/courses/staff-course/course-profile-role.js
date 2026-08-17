// Course visibility is stored against the legacy CourseRole enum, while identity is
// now expressed as an active profile. Keep the translation explicit and course-local:
// learner callers never supply a role and no legacy user role/flag is consulted.
import { COURSE_ROLES, PROFILES } from "@dms/shared";

export const COURSE_ROLE_BY_PROFILE_KEY = Object.freeze({
  [PROFILES.ADMIN]: COURSE_ROLES.ADMIN,
  [PROFILES.SUPER_ADMIN]: COURSE_ROLES.SUPER_ADMIN,
  [PROFILES.NORMAL_SALES]: COURSE_ROLES.STAFF,
  [PROFILES.PRIMARY_SALES]: COURSE_ROLES.STAFF,
  [PROFILES.SUPER_SALES]: COURSE_ROLES.STAFF,
  [PROFILES.ACCOUNTANT]: COURSE_ROLES.ACCOUNTANT,
  [PROFILES.DESIGNER_3D]: COURSE_ROLES.THREE_D_DESIGNER,
  [PROFILES.DESIGNER_2D]: COURSE_ROLES.TWO_D_DESIGNER,
  [PROFILES.EXECUTOR_2D]: COURSE_ROLES.TWO_D_EXECUTOR,
  // CourseRole has no CONTACT_INITIATOR value. Master therefore had no course-role
  // row that could make a course visible to this profile; preserve that closed scope.
  [PROFILES.CONTACT_INITIATOR]: null,
});

export function courseRoleForAuthUser(authUser) {
  return COURSE_ROLE_BY_PROFILE_KEY[authUser?.currentProfileKey] ?? null;
}
