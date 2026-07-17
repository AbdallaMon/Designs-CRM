import { Worker } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";
import { deliverNotification } from "../../modules/notifications/notification.usecase.js";

export const notificationWorker = new Worker(
  "notification-queue",
  async (job) => {
    await deliverNotification(job.data);
  },
  { ...bullmqConnection, concurrency: 5 },
);

notificationWorker.on("failed", (job, err) => {
  console.error("❌ Failed in Notification worker:", err.message);
});
