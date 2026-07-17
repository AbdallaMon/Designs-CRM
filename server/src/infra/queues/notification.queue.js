import { Queue } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";

// LAZY singleton (unlike pdf/telegram queues, which instantiate at import time): the
// notification usecase is imported by nearly every module and by unit tests, so the Queue
// (and its Redis connection) must not be created until the first enqueue.
let notificationQueue;

export function getNotificationQueue() {
  if (!notificationQueue) {
    notificationQueue = new Queue("notification-queue", bullmqConnection);
  }
  return notificationQueue;
}
