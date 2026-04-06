// Infra adapter: re-exports the shared email sender so v2 modules
// never need to import from outside the v2 tree.
export { sendEmail } from "../../services/sendMail.js";
