// queues/pdfQueue.js
import { Queue } from "bullmq";
import connection from "../redis/bullmqConnection.js";

export const pdfQueue = new Queue("pdf-approval-queue", connection);
