import {
  dashboardLink,
  dealsLink,
  threeDworkStageLink,
  twoDworkStageLink,
  userLink,
  workStagesLink,
} from "../../config/links.js";
import { createNotification } from "../../../modules/notifications/notification.usecase.js";
import { userRepository } from "../../../modules/users/user/user.repo.js";

export async function convertALeadNotification(lead) {
  const user = await userRepository.getUserDetailsWithSpecificFields(lead.userId);
  const notificationHtml = `<div>
    <a href="${userLink + user.id}">#${
      user.name
    }</a> has marked their lead <a href="${dealsLink + lead.id}">#${
      lead.id
    }</a> as overdue. It is now on hold for another user to take it.
</div>`;
  await createNotification(
    null,
    false,
    notificationHtml,
    null,
    "LEAD_STATUS_CHANGE",
    "Lead on hold",
    false,
    "HTML",
    null,
    lead.userId,
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
    false,
    notificationHtml,
    null,
    "LEAD_TRANSFERRED",
    "Lead transferred",
    false,
    "HTML",
    null,
    newClientLead.userId,
  );
}

export async function assignLeadNotification(
  clientLeadId,
  userId,
  updatedClientLead,
) {
  const user = await userRepository.getUserDetailsWithSpecificFields(userId);
  const notificationHtml = `<div>
    Lead <a href="${
      dealsLink + clientLeadId
    }" >#${clientLeadId}</a> assigned to user <a href="${userLink + userId}">#${
      user.name
    }</a> 
    </div>`;

  await createNotification(
    null,
    true,
    notificationHtml,
    null,
    "LEAD_TRANSFERRED",
    "Lead transferred",
    false,
    "HTML",
    null,
    Number(userId),
  );
}

export async function assignMultipleLeadsNotification(leadIds, userId) {
  const leadLinks = leadIds
    .map((id) => `<a href="${dealsLink + id}"> #${id}</a>`)
    .join(", ");
  // render each lead as list of links instead
  const user = await userRepository.getUserDetailsWithSpecificFields(userId);
  const notificationHtml = `<div>Leads numbers ${leadLinks} assigned to user <a href="${
    userLink + userId
  }">#${user.name}</a></div>`;

  await createNotification(
    userId,
    true,
    notificationHtml,
    null,
    "LEAD_TRANSFERRED",
    "Leads transferred",
    true,
    "HTML",
    null,
    Number(userId),
  );
}

export async function assignWorkStageNotification(
  clientLeadId,
  userId,
  updatedClientLead,
  type,
) {
  const user = await userRepository.getUserDetailsWithSpecificFields(userId);
  const notificationHtml = `<div>
    Lead <a href="${
      dealsLink + clientLeadId
    }" >#${clientLeadId}</a> assigned to user <a href="${userLink + userId}">#${
      user.name
    }</a> 
    </div>`;

  await createNotification(
    null,
    false,
    notificationHtml,
    null,
    "LEAD_TRANSFERRED",
    "Lead transferred",
    false,
    "HTML",
    null,
    Number(userId),
  );
}

export async function updateLeadStatusNotification(
  leadId,
  heading,
  content,
  type,
  userId,
  isAdmin,
  staffId,
  sendToAdmin,
) {
  // if (!sendToAdmin && !userId) return;
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
    true,
    notificationHtml,
    null,
    type ? "LEAD_STATUS_CHANGE" : "LEAD_UPDATED",
    "Lead updated",
    sendToAdmin,
    "HTML",
    null,
    staffId,
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
  workType,
) {
  if (!userId) return;
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
    staffId,
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
    false,
    notificationHtml,
    null,
    "NEW_LEAD",
    "New lead",
    false,
    "HTML",
    leadId,
  );
}

export async function newClientLeadNotification(leadId, client, isAdmin) {
  const leadHref = `${dealsLink + leadId}`;
  console.log(leadHref, "leadhref");
  const notificationHtml = `<div>
       <strong>New Client submit initial form</strong> <a href="${leadHref}" >#${leadId}</a> 
       <div class="sub-text">
       New lead created by 
       ${client.name} - 
</div>
    </div>`;

  await createNotification(
    null,
    false,
    notificationHtml,
    null,
    "NEW_LEAD",
    "New lead",
    false,
    "HTML",
    leadId,
  );
}

export async function newLeadCompletedNotification(leadId, client, isAdmin) {
  const leadHref = `${dealsLink + leadId}`;
  const notificationHtml = `<div>
       <strong>New lead register completed with sucussfull payment </strong> <a href="${leadHref}" >#${leadId}</a> 
       <div class="sub-text">
      Lead register completed 
       ${client.name} - 
</div>
    </div>`;

  await createNotification(
    null,
    false,
    notificationHtml,
    null,
    "NEW_LEAD",
    "New lead",
    false,
    "HTML",
    leadId,
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
    false,
    notificationHtml,
    null,
    "PAYMENT_STATUS_UPDATED",
    "Payment process done successfully",
    false,
    "HTML",
    leadId,
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
      ? ["DESIGNER_2D"]
      : type === "TWO_D_EXACUTER"
        ? ["EXECUTOR_2D"]
        : ["DESIGNER_3D", "ACCOUNTANT"],
    true,
  );
}
