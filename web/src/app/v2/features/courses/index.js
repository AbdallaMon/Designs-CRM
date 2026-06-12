// Courses / LMS feature barrel. Two surfaces share one feature folder:
//  • ADMIN authoring → coursesService + CoursesPage (PERMISSIONS.COURSE)
//  • STAFF learner   → staffCoursesService + MyCoursesPage (PERMISSIONS.STAFF_COURSE)
export { CoursesPage, default as CoursesPageDefault } from "./pages/CoursesPage.jsx";
export { MyCoursesPage } from "./pages/MyCoursesPage.jsx";
export { coursesService } from "./courses.service.js";
export { staffCoursesService } from "./staffCourses.service.js";
export { runCoursesMutation } from "./courses.mutations.js";
export { resolveCoursesMessage, coursesMessages } from "./config/coursesMessages.js";
