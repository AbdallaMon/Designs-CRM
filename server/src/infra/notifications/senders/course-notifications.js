import { courseDashboard } from "../../config/links.js";
import { createNotification } from "../../../modules/notifications/notification.usecase.js";

export async function attemptFailedByUser({ testId, userId }) {
  const notificationHtml = `<div>
       <strong>Test Attempt</strong> A user has failed to finish his last test attempt <a href="${
         courseDashboard +
         "/tests/" +
         testId +
         "/attempts?userId=" +
         userId +
         "&testId=" +
         testId
       }" >#${userId}</a> 
       <q>Action is require u can give him a new attempt from the link<q/>
    </div>
`;
  await createNotification(
    null,
    false,
    notificationHtml,
    null,
    "ATTEMPT_FAILED",
    "Test Attempt",
    true,
    "HTML",
    null,
    userId,
  );
}
