// Image-sessions feature barrel. THREE surfaces:
//  1. ADMIN reference-data CRUD (AUTHED, gate = IMAGE_SESSION.ADMIN_*)
//  2. SHARED lead-scoped session management (AUTHED, gate = IMAGE_SESSION.SESSION_*)
//  3. PUBLIC client image-selection (UNGATED, per-session token IS the auth)
export { AdminReferenceDataPage } from "./pages/AdminReferenceDataPage.jsx";
export { LeadSessionsPage } from "./pages/LeadSessionsPage.jsx";
export { PublicImageSessionPage } from "./pages/PublicImageSessionPage.jsx";
export { imageSessionsService } from "./imageSessions.service.js";
export { runImageSessionMutation } from "./imageSessions.mutations.js";
export { resolveImageSessionMessage } from "./config/imageSessionsMessages.js";
