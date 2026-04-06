// Infra adapter: re-exports Socket.IO helpers so v2 modules
// never need to import from outside the v2 tree.
export { getIo, initSocket } from "../../services/socket.js";
