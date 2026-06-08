// Notifications feature barrel.
export { NotificationsPage, default as NotificationsPageDefault } from "./pages/NotificationsPage.jsx";
export { notificationsService } from "./notifications.service.js";
export { runNotificationsMutation } from "./notifications.mutations.js";
export { useNotifications } from "./hooks/useNotifications.js";
export {
  resolveNotificationsMessage,
  notificationsMessages,
} from "./config/notificationsMessages.js";
