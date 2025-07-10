// pdfWorker.js
import { Worker } from "bullmq";

import connection from "../redis/bullmqConnection.js";
import { uploadPdfAndApproveSession } from "../main/clientServices.js";

const worker = new Worker(
  "pdf-approval-queue",
  async (job) => {
    try {
      const { sessionData, signatureUrl, lng } = job.data;
      await uploadPdfAndApproveSession({ sessionData, signatureUrl, lng });
    } catch (e) {
      console.log(e, "e in queue worker");
    }
  },
  connection // ✅ this is correct now
);
