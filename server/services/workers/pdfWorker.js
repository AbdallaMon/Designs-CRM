// pdfWorker.js
import { Worker } from "bullmq";

import connection from "../redis/bullmqConnection.js";

import { uploadPdfAndApproveSession } from "../clientServices.js";

const worker = new Worker(
  "pdf-approval-queue",
  async (job) => {
    const { sessionData, signatureUrl } = job.data;
    await uploadPdfAndApproveSession({ sessionData, signatureUrl });
  },
  connection // ✅ this is correct now
);
