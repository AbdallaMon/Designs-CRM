import {
  createNotification,
  getUserDetailsWithSpecificFields,
} from "./utility.js";
import {
  dashboardLink,
  dealsLink,
  newLeadLink,
  threeDworkStageLink,
  twoDworkStageLink,
  userLink,
  workStagesLink,
} from "./links.js";
import dayjs from "dayjs";

export async function convertALeadNotification(lead) {
  const user = await getUserDetailsWithSpecificFields(lead.userId);
  const notificationHtml = `<div>
    <a href="${userLink + user.id}">#${
    user.name
  }</a> has marked their lead <a href="${dealsLink + lead.id}">#${
    lead.id
  }</a> as overdue. It is now on hold for another user to take it.
</div>`;
  await createNotification(
    null,
    true,
    notificationHtml,
    null,
    "LEAD_STATUS_CHANGE",
    "Lead on hold",
    true,
    "HTML",
    null,
    lead.userId
  );
}
export async function overdueALeadNotification(convertedLead, newClientLead) {
  const notificationHtml = `<div>
Deal <a href="${dealsLink + convertedLead.id}" >#${
    convertedLead.id
  }</a> is overdue and converted from user <a href="${
    userLink + convertedLead.userId
  }">#${convertedLead.userId}</a> to 
<a href="${userLink + convertedLead.userId}">#${
    convertedLead.userId
  }</a> with new id #<a href="${dealsLink + newClientLead.id}" >#${
    newClientLead.id
  }</a>
</div>`;
  await createNotification(
    null,
    true,
    notificationHtml,
    null,
    "LEAD_TRANSFERRED",
    "Lead transferred",
    true,
    "HTML",
    null,
    newClientLead.userId
  );
}
export async function assignLeadNotification(
  clientLeadId,
  userId,
  updatedClientLead
) {
  const notificationHtml = `<div>
    Lead <a href="${
      dealsLink + clientLeadId
    }" >#${clientLeadId}</a> assigned to user <a href="${userLink + userId}">#${
    updatedClientLead.assignedTo.name
  }</a> 
    </div>`;

  await createNotification(
    null,
    true,
    notificationHtml,
    null,
    "LEAD_TRANSFERRED",
    "Lead transferred",
    true,
    "HTML",
    null,
    Number(userId)
  );
}
export async function assignWorkStageNotification(
  clientLeadId,
  userId,
  updatedClientLead,
  type
) {
  const notificationHtml = `<div>
    Lead <a href="${
      dealsLink + clientLeadId
    }" >#${clientLeadId}</a> assigned to user <a href="${userLink + userId}">#${
    type === "three-d"
      ? updatedClientLead.threeDDesigner.name
      : type === "two-d"
      ? updatedClientLead.twoDDesigner.name
      : updatedClientLead.twoDExacuter.name
  }</a> 
    </div>`;

  await createNotification(
    null,
    true,
    notificationHtml,
    null,
    "LEAD_TRANSFERRED",
    "Lead transferred",
    true,
    "HTML",
    null,
    Number(userId)
  );
}
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
    true,
    notificationHtml,
    null,
    "NEW_NOTE",
    "New note",
    true,
    "HTML",
    null,
    userId
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
    true,
    notificationHtml,
    null,
    "CALL_REMINDER_CREATED",
    "New call reminder",
    true,
    "HTML",
    null,
    callReminder.userId
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
    true,
    notificationHtml,
    null,
    "PRICE_OFFER_SUBMITTED",
    "New price offer",
    true,
    "HTML",
    null,
    priceOffer.user.id
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
    true,
    notificationHtml,
    null,
    "NEW_FILE",
    "New file upload",
    true,
    "HTML",
    null,
    Number(userId)
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
    true,
    notificationHtml,
    null,
    "CALL_REMINDER_STATUS",
    "Call reminder status changed",
    true,
    "HTML",
    null,
    Number(userId)
  );
}
export async function updateLeadStatusNotification(
  leadId,
  heading,
  content,
  type,
  userId,
  isAdmin,
  staffId
) {
  const notificationHtml = `<div>
       <strong>${heading}</strong> updated in Lead <a href="${
    dealsLink + leadId
  }" >#${leadId}</a> 
       <div class="sub-text">
  ${content}
</div>
    </div>`;
  await createNotification(
    isAdmin ? userId : null,
    !isAdmin,
    notificationHtml,
    null,
    type ? "LEAD_STATUS_CHANGE" : "LEAD_UPDATED",
    "Lead updated",
    true,
    "HTML",
    null,
    staffId
  );
}
export async function updateWorkStageStatusNotification(
  leadId,
  heading,
  content,
  type,
  userId,
  isAdmin,
  staffId,
  workType
) {
  const link = isAdmin
    ? workStagesLink
    : workType === "THREE_D"
    ? threeDworkStageLink
    : twoDworkStageLink;
  const notificationHtml = `<div>
       <strong>${heading}</strong> updated in Lead <a href="${
    link + leadId
  }" >#${leadId}</a> 
       <div class="sub-text">
  ${content}
</div>
    </div>`;
  await createNotification(
    isAdmin ? userId : null,
    !isAdmin,
    notificationHtml,
    null,
    type ? "LEAD_STATUS_CHANGE" : "LEAD_UPDATED",
    "Lead updated",
    true,
    "HTML",
    null,
    staffId
  );
}
export async function newLeadNotification(leadId, client, isAdmin) {
  const leadHref = `${dealsLink + leadId}`;
  const notificationHtml = `<div>
       <strong>New lead created</strong> <a href="${leadHref}" >#${leadId}</a> 
       <div class="sub-text">
       New lead created by 
       ${client.name} - 
</div>
    </div>`;

  await createNotification(
    null,
    isAdmin,
    notificationHtml,
    null,
    "NEW_LEAD",
    "New lead",
    true,
    "HTML",
    leadId
  );
}
export async function leadPaymentSuccessed(leadId) {
  const leadHref = `${dealsLink + leadId}`;
  const notificationHtml = `<div>
       <strong>New lead payment successed </strong> <a href="${leadHref}" >#${leadId}</a> 
       <div class="sub-text">
       Lead id 
       ${leadId} - 
</div>
    </div>`;

  await createNotification(
    null,
    true,
    notificationHtml,
    null,
    "PAYMENT_STATUS_UPDATED",
    "Payment process done successfully",
    true,
    "HTML",
    leadId
  );
}

export async function finalizedLeadCreated(leadId, userId, type = "THREE_D") {
  const notificationHtml = `<div>
       <strong>New lead finalized</strong>  Lead <a href="${dashboardLink}" >#${leadId}</a> 
       <div class="sub-text">
  A lead has been finalized and u can now take it for a work stage
</div>
    </div>`;
  await createNotification(
    userId,
    false,
    notificationHtml,
    null,
    "NEW_LEAD",
    "New Lead finalized",
    true,
    "HTML",
    null,
    null,
    type === "TWO_D"
      ? ["TWO_D_DESIGNER"]
      : type === "TWO_D_EXACUTER"
      ? ["TWO_D_EXECUTOR"]
      : ["THREE_D_DESIGNER", "ACCOUNTANT"],
    true
  );
}
