import dayjs from "dayjs";
import { dealsLink } from "../../config/links.js";
import { createNotification } from "../../../modules/notifications/notification.usecase.js";
import {
  NOTIFICATION_CONTENT_TYPES,
  NOTIFICATION_TYPES,
} from "@dms/shared";

export async function newNoteNotification(leadId, content, userId) {
  const notificationHtml = `<div>
       <strong>Note</strong> was added to Lead <a href="${
         dealsLink + leadId
       }" >#${leadId}</a> 
       <q>${content}<q/>
    </div>
`;
  await createNotification(
    null,
    false,
    notificationHtml,
    null,
    NOTIFICATION_TYPES.NEW_NOTE,
    "New note",
    false,
    NOTIFICATION_CONTENT_TYPES.HTML,
    null,
    userId,
  );
}

export async function newCallNotification(leadId, callReminder) {
  const notificationHtml = `<div>
       <strong>Call reminder</strong> was added to Lead <a href="${
         dealsLink + leadId
       }" >#${leadId}</a> 
       <div class="sub-text">
    Call time: ${dayjs(callReminder.time).format("YYYY-MM-DD HH:mm")}
</div>
     <div class="sub-text">
    Reason of the call : ${callReminder.reminderReason}
</div>
    </div>`;
  await createNotification(
    null,
    false,
    notificationHtml,
    null,
    NOTIFICATION_TYPES.CALL_REMINDER_CREATED,
    "New call reminder",
    false,
    NOTIFICATION_CONTENT_TYPES.HTML,
    null,
    callReminder.userId,
  );
}

export async function newMeetingNotification(leadId, meetingReminder) {
  const isAdmin = meetingReminder.isAdmin;

  const notificationHtml = `<div>
       <strong>Meeting reminder</strong> was added to Lead <a href="${
         dealsLink + leadId
       }" >#${leadId}</a> 
       <div class="sub-text">
    Meeting time: ${dayjs(meetingReminder.time).format("YYYY-MM-DD HH:mm")}
</div>
     <div class="sub-text">
    Reason of the meeting : ${meetingReminder.reminderReason}
</div>
    </div>`;
  await createNotification(
    isAdmin ? meetingReminder.adminId : meetingReminder.userId,
    false,
    notificationHtml,
    null,
    NOTIFICATION_TYPES.CALL_REMINDER_CREATED,
    "New meeting reminder",
    true,
    NOTIFICATION_CONTENT_TYPES.HTML,
    null,
    meetingReminder.userId,
  );
}

export async function newPriceOffer(leadId, priceOffer) {
  const notificationHtml = `<div>
       <strong>New Price offer</strong> was added to Lead <a href="${
         dealsLink + leadId
       }" >#${leadId}</a> 
       <div class="sub-text">
    Price range: ${priceOffer.minPrice} : ${priceOffer.maxPrice}
</div>
    </div>`;
  await createNotification(
    null,
    false,
    notificationHtml,
    null,
    NOTIFICATION_TYPES.PRICE_OFFER_SUBMITTED,
    "New price offer",
    false,
    NOTIFICATION_CONTENT_TYPES.HTML,
    null,
    priceOffer.user.id,
  );
}

export async function newFileUploaded(leadId, file, userId) {
  const notificationHtml = `<div>
       <strong>New File</strong> was added to Lead <a href="${
         dealsLink + leadId
       }" >#${leadId}</a> 
       <div class="sub-text">
       <a href="${file.url}">
    File name: ${file.name} 
</a>
</div>
     <div class="sub-text">
    File description: ${file.description} 
</div>
    </div>`;
  await createNotification(
    null,
    false,
    notificationHtml,
    null,
    NOTIFICATION_TYPES.NEW_FILE,
    "New file upload",
    false,
    NOTIFICATION_CONTENT_TYPES.HTML,
    null,
    Number(userId),
  );
}

export async function updateCallNotification(leadId, callReminder, userId) {
  const notificationHtml = `<div>
       <strong>Call reminder</strong> updated in Lead <a href="${
         dealsLink + leadId
       }" >#${leadId}</a> 
       <div class="sub-text">
    Call time: ${dayjs(callReminder.time).format("YYYY-MM-DD HH:mm")}
</div>
     <div class="sub-text">
    Reason of the call : ${callReminder.reminderReason}
</div>
     <div class="sub-text">
    Result of the call : ${callReminder.callResult}
</div>
    </div>`;
  await createNotification(
    null,
    false,
    notificationHtml,
    null,
    NOTIFICATION_TYPES.CALL_REMINDER_STATUS,
    "Call reminder status changed",
    false,
    NOTIFICATION_CONTENT_TYPES.HTML,
    null,
    Number(userId),
  );
}

export async function updateMettingNotification(
  leadId,
  meetingReminder,
  userId,
) {
  const notificationHtml = `<div>
       <strong>Meeting reminder</strong> updated in Lead <a href="${
         dealsLink + leadId
       }" >#${leadId}</a> 
       <div class="sub-text">
    Call time: ${dayjs(meetingReminder.time).format("YYYY-MM-DD HH:mm")}
</div>
     <div class="sub-text">
    Reason of the meeting : ${meetingReminder.reminderReason}
</div>
     <div class="sub-text">
    Result of the meeting : ${meetingReminder.meetingResult}
</div>
    </div>`;
  await createNotification(
    null,
    true,
    notificationHtml,
    null,
    NOTIFICATION_TYPES.CALL_REMINDER_STATUS,
    "Meeting reminder status changed",
    false,
    NOTIFICATION_CONTENT_TYPES.HTML,
    null,
    Number(userId),
  );
}
