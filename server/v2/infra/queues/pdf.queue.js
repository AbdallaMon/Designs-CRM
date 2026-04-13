import { Queue } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";

export const pdfQueue = new Queue("pdf-approval-queue", bullmqConnection);
