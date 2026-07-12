import { Worker } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";
import { uploadPdfAndApproveSession } from "../../modules/image-sessions/services/client-services.js";

export const pdfWorker = new Worker(
  "pdf-approval-queue",
  async (job) => {
    const { sessionData, signatureUrl, lng } = job.data;
    await uploadPdfAndApproveSession({ sessionData, signatureUrl, lng });
  },
  bullmqConnection,
);
