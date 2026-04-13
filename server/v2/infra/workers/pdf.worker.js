import { Worker } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";
import { uploadPdfAndApproveSession } from "../../../services/main/clientServices.js";

export const pdfWorker = new Worker(
  "pdf-approval-queue",
  async (job) => {
    const { sessionData, signatureUrl, lng } = job.data;
    await uploadPdfAndApproveSession({ sessionData, signatureUrl, lng });
  },
  bullmqConnection,
);
