// admin-residual feature barrel.
export { AdminResidualPage, default as AdminResidualPageDefault } from "./pages/AdminResidualPage.jsx";
export { adminResidualService } from "./adminResidual.service.js";
export { runAdminResidualMutation } from "./adminResidual.mutations.js";
export { downloadFileFromPost } from "./lib/download.js";
export {
  resolveAdminResidualMessage,
  adminResidualMessages,
} from "./config/adminResidualMessages.js";
export { ADMIN_SURFACES } from "./config/adminResidualConstants.js";
