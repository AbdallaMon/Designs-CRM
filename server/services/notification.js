// import {
//   createNotification,
//   getUserDetailsWithSpecificFields,
// } from "../services/main/"
import {
  courseDashboard,
  dashboardLink,
  dealsLink,
  newLeadLink,
  projectLink,
  taskLink,
  threeDworkStageLink,
  twoDworkStageLink,
  userLink,
  workStagesLink,
} from "./links.js";
import dayjs from "dayjs";
import { sendEmail } from "./sendMail.js";
import {
  createNotification,
  getUserDetailsWithSpecificFields,
} from "./main/utility.js";
import { arEngName, engName } from "./constants.js";

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
export async function newMeetingNotification(leadId, meetingReminder) {
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
    null,
    true,
    notificationHtml,
    null,
    "CALL_REMINDER_CREATED",
    "New meeting reminder",
    true,
    "HTML",
    null,
    meetingReminder.userId
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
export async function updateMettingNotification(
  leadId,
  meetingReminder,
  userId
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
    "CALL_REMINDER_STATUS",
    "Meeting reminder status changed",
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
export async function newClientLeadNotification(leadId, client, isAdmin) {
  const leadHref = `${dealsLink + leadId}`;
  const notificationHtml = `<div>
       <strong>New Client submit initial form</strong> <a href="${leadHref}" >#${leadId}</a> 
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
export async function newTaskCreatedNotification(
  taskId,
  userId,
  projectId,
  title,
  isAdmin,
  isModifcationTask
) {
  const name = isModifcationTask ? "Modification" : "Task";

  const extra = projectId
    ? `With projectId <a href="${
        projectLink + "/" + projectId
      }" >#${projectId}</a> `
    : "";
  const notificationHtml = `<div>
       <strong>New ${name} created</strong><a href="${
    taskLink + "/" + taskId
  }" >#${taskId}</a> 
       <div class="sub-text">
  A ${name} with title ${title} has been created with ${extra}
</div>
    </div>`;
  await createNotification(
    userId,
    !isAdmin,
    notificationHtml,
    null,
    "OTHER",
    `New ${name} created`,
    true,
    "HTML",
    null,
    !isAdmin && userId ? userId : null,
    null,
    false
  );
}

export async function updateTaskNotification(
  taskId,
  userId,
  projectId,
  title,
  isAdmin,
  isModifcationTask
) {
  const name = isModifcationTask ? "Modification" : "Task";

  const extra = projectId
    ? `With projectId <a href="${
        projectLink + "/" + projectId
      }" >#${projectId}</a> `
    : "";
  const notificationHtml = `<div>
     <strong>A ${name} has been updated</strong>${name} with id <a href="${
    taskLink + "/" + taskId
  }" >#${taskId}</a> 
     <div class="sub-text">
and with title ${title} has been updated ${extra}
</div>
  </div>`;

  await createNotification(
    userId,
    !isAdmin,
    notificationHtml,
    null,
    "OTHER",
    "Task updated",
    true,
    "HTML",
    null,
    !isAdmin && userId ? userId : null,
    null,
    false
  );
}

export async function updateProjectNotification(
  projectId,
  userId,
  content,
  isAdmin
) {
  const notificationHtml = `<div>
     <strong>A Project has been updated</strong> Project with id <a href="${
       projectLink + "/" + projectId
     }" >#${projectId}</a> 
     <div class="sub-text">
     ${content}
</div>
  </div>`;

  await createNotification(
    userId,
    !isAdmin,
    notificationHtml,
    null,
    "OTHER",
    "Project updated",
    true,
    "HTML",
    null,
    !isAdmin && userId ? userId : null,
    null,
    false
  );
}

export async function newProjectAssingmentNotification(
  projectId,
  userId,
  content
) {
  const notificationHtml = `<div>
     <strong>A Project has been assigned</strong> Project with id <a href="${
       projectLink + "/" + projectId
     }" >#${projectId}</a> 
     <div class="sub-text">
     ${content}
</div>
  </div>`;

  await createNotification(
    userId,
    false,
    notificationHtml,
    null,
    "OTHER",
    "Project updated",
    true,
    "HTML",
    null,
    null,
    null,
    false
  );
}

export async function sendPaymentSuccessEmail(
  clientEmail,
  clientName,
  leadId,
  lng = "ar"
) {
  const completeRegistrationLink = `${process.env.ORIGIN}/register/complete?leadId=${leadId}&lng=${lng}`;
  const whatsappLink = "https://wa.me/+971585564778";

  const content = {
    en: {
      subject: "Payment Confirmation",
      greeting: `Hello ${clientName || "there"},`,
      message: `Your payment was successful. Thank you for choosing our services.`,
      timeline: [
        {
          label: "Payment Received",
          description: "We’ve received your payment.",
        },
        {
          label: "Processing",
          description: "Our team will reach out within 48 hours.",
        },
        {
          label: "Next Step",
          description: "Complete your registration to get started.",
        },
      ],
      buttonText: "Complete Registration",
      closing: "We look forward to supporting your journey.",
      regards: "Best regards,",
      team: "Eng. Ahmed's Design Team",
      footer: {
        copyright: `© ${new Date().getFullYear()} ${engName}. All rights reserved.`,
        automated:
          "This is an automated message, please do not reply directly.",
      },
      contactUs: "Need help? Chat with us on WhatsApp",
      footerNote: "This is an automated message. Please do not reply directly.",
    },
    ar: {
      subject: "تأكيد الدفع",
      greeting: `مرحباً ${clientName || "بك"},`,
      message: `تم استلام دفعتك بنجاح. شكراً لاختيارك خدماتنا.`,
      timeline: [
        { label: "تم الاستلام", description: "تم استلام دفعتك." },
        {
          label: "قيد المعالجة",
          description: "سيتواصل معك فريقنا خلال 48 ساعة.",
        },
        { label: "الخطوة التالية", description: "يرجى إكمال التسجيل للبدء." },
      ],
      buttonText: "إكمال التسجيل",
      closing: "نتطلع للعمل معك.",
      regards: "مع أطيب التحيات،",
      team: `فريق التصميم ${arEngName}`,
      footer: {
        copyright: `© ${new Date().getFullYear()} ${arEngName}. جميع الحقوق محفوظة.`,
      },
      contactUs: "تواصل معنا عبر واتساب",
      footerNote: "هذه رسالة آلية، يرجى عدم الرد عليها مباشرة.",
    },
  };

  const langContent = content[lng] || content.ar;
  const direction = lng === "en" ? "ltr" : "rtl";
  const textAlign = lng === "en" ? "left" : "right";
  const fontFamily =
    lng === "ar"
      ? "'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      : "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="${lng}" dir="${direction}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${langContent.subject}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: ${fontFamily};
          line-height: 1.6;
          color: #584d3f;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f2ee;
          text-align: ${textAlign};
          direction: ${direction};
        }
        .email-container {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          text-align: ${textAlign};
          direction: ${direction};
        }
        .header {
          background: linear-gradient(135deg, #be975c 0%, #d3ac71 100%);
          color: white;
          padding: 20px;
          text-align: center;
        }
        .content {
          background-color: #fcfbf9;
          padding: 30px;
        }
        .footer {
          background-color: #eae7e2;
          padding: 15px;
          text-align: center;
          font-size: 14px;
          color: #584d3f;
        }
        .btn {
          display: inline-block;
          background-color: #d3ac71;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .timeline {
          margin: 30px 0;
          padding: 20px;
          background-color: #f7eedd;
          border-radius: 6px;
        }
        .timeline-item {
          margin-bottom: 12px;
          display: flex;
          flex-direction: ${direction === "rtl" ? "row-reverse" : "row"};
        }
        .timeline-icon {
          margin: ${direction === "rtl" ? "0 0 0 10px" : "0 10px 0 0"};
          color: #be975c;
        }
        .highlight {
          font-weight: bold;
          color: #d3ac71;
        }
        .contact-links {
          display: flex;
          justify-content: center;
          margin-top: 20px;
          gap: 15px;
        }
        .contact-btn {
          display: inline-block;
          padding: 10px 15px;
          background-color: #fcfbf9;
          border: 2px solid #d3ac71;
          color: #584d3f;
          text-decoration: none;
          border-radius: 4px;
          font-size: 14px;
          text-align: center;
        }
        .contact-btn img {
          vertical-align: middle;
          margin-${direction === "rtl" ? "left" : "right"}: 5px;
          height: 16px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>${langContent.subject}</h1>
        </div>
        <div class="content">
      <p>${langContent.greeting}</p>
      <p>${langContent.message}</p>          
          
          <div class="timeline">
             ${langContent.timeline
               .map(
                 (step) => `
          <div class="timeline-item">
                        <div class="timeline-icon">✓</div>

          <div>
            <strong>${step.label}</strong>
            <span>${step.description}</span>
            </div>
          </div>
        `
               )
               .join("")}
  
          </div>
          
          
          <div style="text-align: center;">
            <a href="${completeRegistrationLink}" class="btn">${
    langContent.buttonText
  }</a>
          </div>
                    
          <p>${langContent.closing}</p>
          
          <div class="contact-links">
            <a href="${whatsappLink}" class="contact-btn">
              <img src="https://cdnjs.cloudflare.com/ajax/libs/simple-icons/3.0.1/whatsapp.svg" alt="WhatsApp">
              ${langContent.contactUs}
            </a>
      
          </div>
          
          <p>${langContent.regards}<br>${langContent.team}</p>
        </div>
        <div class="footer">
          <p>${langContent.footer.copyright}</p>
          <p>${langContent.footerNote}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(clientEmail, langContent.subject, emailHtml, true);
  return `Payment confirmation email sent successfully in ${lng}`;
}

export async function sendPaymentReminderEmail(
  clientEmail,
  clientName,
  sessionUrl,
  lng = "ar" // Default to English if not specified
) {
  // Generate payment link
  const paymentLink = sessionUrl;
  const whatsappLink = "https://wa.me/+971585564778"; // Replace with your actual WhatsApp number

  // Content based on language
  const content = {
    en: {
      subject: "One Step Away from Meeting the Design Consultant",
      heading: "Almost There!",
      greeting: `Hello ${clientName || "there"}`,
      message: `Thank you for submitting your information. <span class="highlight">You're just one step away</span> from consulting with ${engName} about your design project.`,
      actionNeeded: "To proceed with your consultation:",
      paymentInfo:
        "Secure your consultation with a $39 payment - fully deductible from your future contract.",
      buttonText: "Make Payment",
      benefits: "Benefits of your consultation:",
      benefit1: "Professional design analysis of your project",
      benefit2: "Expert recommendations tailored to your needs",
      benefit3: `Priority scheduling with ${engName}`,
      closing: "We're looking forward to bringing your design vision to life!",
      regards: "Best regards,",
      team: `${engName}'s Design Team`,
      footer: {
        copyright: `© ${new Date().getFullYear()} ${engName}. All rights reserved.`,
        automated:
          "This is an automated message, please do not reply directly.",
      },
      contactUs: "Contact us on WhatsApp",
    },
    ar: {
      subject: "خطوة واحدة تفصلك عن الاجتماع مع استشاري التصميم",
      heading: "أنت على وشك الوصول!",
      greeting: `مرحباً ${clientName || "بك"}`,
      message: `شكراً لتقديم معلوماتك. <span class="highlight">أنت على بعد خطوة واحدة فقط</span> من استشارة ${arEngName} بشأن مشروع التصميم الخاص بك.`,
      actionNeeded: "للمتابعة مع استشارتك:",
      paymentInfo:
        "احجز استشارتك بدفع ٣٩ دولار - تُخصم بالكامل من عقدك المستقبلي.",
      buttonText: "إتمام الدفع",
      benefits: "فوائد استشارتك:",
      benefit1: "تحليل تصميم احترافي لمشروعك",
      benefit2: "توصيات خبراء مخصصة لاحتياجاتك",
      benefit3: `جدولة ذات أولوية مع ${arEngName}`,
      closing: "نتطلع إلى تحويل رؤية التصميم الخاصة بك إلى حقيقة!",
      regards: "مع أطيب التحيات،",
      team: `فريق التصميم ${arEngName}`,
      footer: {
        copyright: `© ${new Date().getFullYear()} ${arEngName}. جميع الحقوق محفوظة.`,
        automated: "هذه رسالة آلية، يرجى عدم الرد عليها مباشرة.",
      },
      contactUs: "تواصل معنا عبر واتساب",
    },
  };

  // Use English as fallback if the requested language isn't available
  const langContent = content[lng] || content.ar;

  // Set direction based on language
  const direction = lng === "en" ? "ltr" : "rtl";
  const textAlign = lng === "en" ? "left" : "right";
  const fontFamily =
    lng === "ar"
      ? "'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      : "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="${lng}" dir="${direction}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${langContent.subject}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: ${fontFamily};
          line-height: 1.6;
          color: #584d3f;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f2ee;
          text-align: ${textAlign};
          direction: ${direction};
        }
        .email-container {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          text-align: ${textAlign};
          direction: ${direction};
        }
        .header {
          background: linear-gradient(135deg, #be975c 0%, #d3ac71 100%);
          color: white;
          padding: 20px;
          text-align: center;
        }
        .content {
          background-color: #fcfbf9;
          padding: 30px;
        }
        .footer {
          background-color: #eae7e2;
          padding: 15px;
          text-align: center;
          font-size: 14px;
          color: #584d3f;
        }
        .btn {
          display: inline-block;
          background-color: #d3ac71;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .benefits-box {
          margin: 30px 0;
          padding: 20px;
          background-color: #f7eedd;
          border-radius: 6px;
        }
        .benefit-item {
          margin-bottom: 12px;
          display: flex;
          flex-direction: ${direction === "rtl" ? "row-reverse" : "row"};
        }
        .benefit-icon {
          margin: ${direction === "rtl" ? "0 0 0 10px" : "0 10px 0 0"};
          color: #be975c;
        }
        .highlight {
          font-weight: bold;
          color: #d3ac71;
        }
        .contact-links {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }
        .contact-btn {
          display: inline-block;
          padding: 10px 15px;
          background-color: #fcfbf9;
          border: 2px solid #d3ac71;
          color: #584d3f;
          text-decoration: none;
          border-radius: 4px;
          font-size: 14px;
          text-align: center;
        }
        .contact-btn img {
          vertical-align: middle;
          margin-${direction === "rtl" ? "left" : "right"}: 5px;
          height: 16px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>${langContent.heading}</h1>
        </div>
        <div class="content">
          <p>${langContent.greeting},</p>
          
          <p>${langContent.message}</p>
          
          <h3 style="color: #383028;">${langContent.actionNeeded}</h3>
          <p>${langContent.paymentInfo}</p>
          
          <div style="text-align: center;">
            <a href="${paymentLink}" class="btn">${langContent.buttonText}</a>
          </div>
          
          <div class="benefits-box">
            <h3 style="color: #383028;">${langContent.benefits}</h3>
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div>${langContent.benefit1}</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div>${langContent.benefit2}</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div>${langContent.benefit3}</div>
            </div>
          </div>
          
          <p>${langContent.closing}</p>
          
          <div class="contact-links">
            <a href="${whatsappLink}" class="contact-btn">
              <img src="https://cdnjs.cloudflare.com/ajax/libs/simple-icons/3.0.1/whatsapp.svg" alt="WhatsApp">
              ${langContent.contactUs}
            </a>
          </div>
          
          <p>${langContent.regards}<br>${langContent.team}</p>
        </div>
        <div class="footer">
          <p>${langContent.footer.copyright}</p>
          <p>${langContent.footer.automated}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(clientEmail, langContent.subject, emailHtml, true);
  return `Payment reminder email sent successfully in ${lng} language`;
}
export async function sendPaymentReminderEmailByStaff(
  clientEmail,
  clientName,
  sessionUrl,
  lng = "ar" // Default to English if not specified
) {
  // Generate payment link
  const paymentLink = sessionUrl;
  const whatsappLink = "https://wa.me/+971585564778"; // Replace with your actual WhatsApp number

  // Content based on language
  const content = {
    en: {
      subject: "Payment Reminder – Reserve Your Consultation Slot",
      heading: "Friendly Reminder",
      greeting: `Hello ${clientName || "there"}`,
      message:
        `💡 We offer an in‑depth analysis of your project before you begin.<br>` +
        `✅ Together, we’ll discover the best space planning solutions and avoid maintenance issues and budget waste.<br>` +
        `🎯 So your home execution is smooth, well‑planned, and reflects your style precisely.`,
      actionNeeded: "Don’t miss your chance… reserve your slot now!",
      paymentInfo:
        "Complete your payment to confirm your consultation booking.",
      buttonText: "Complete Payment",
      benefits: "What you’ll get:",
      benefit1: "In‑depth design analysis tailored to your project",
      benefit2: "Clear, practical recommendations before execution",
      benefit3: "Confidence in budget and maintenance decisions",
      closing: "We’re excited to help you plan it right from the start!",
      regards: "Best regards,",
      team: "Eng. Ahmed’s Design Team",
      footer: {
        copyright: `© ${new Date().getFullYear()} ${engName}, All rights reserved.`,
        automated:
          "This is an automated message, please do not reply directly.",
      },
      contactUs: "Contact us on WhatsApp",
    },
    ar: {
      subject: "تذكير بالدفع – احجز مقعد استشارتك الآن",
      heading: "تذكير ودي",
      greeting: `مرحباً ${clientName || "بك"}`,
      message:
        `💡 نحن نقدّم لك تحليلًا معمّقًا لمشروعك قبل أن تبدأ،<br>` +
        `✅ لنكتشف معًا أفضل الحلول لتوزيع المساحات وتفادي مشاكل الصيانة وهدر الميزانية،<br>` +
        `🎯 حتى يكون تنفيذ بيتك سلسًا، مدروسًا، ويعكس أسلوبك بدقة.`,
      actionNeeded: "لا تفوّت فرصتك… احجز مقعدك الآن!",
      paymentInfo: "أكمل الدفع لتأكيد حجز جلسة الاستشارة.",
      buttonText: "إتمام الدفع",
      benefits: "ماذا ستحصل عليه:",
      benefit1: "تحليل تصميم معمّق لمشروعك",
      benefit2: "توصيات عملية واضحة قبل التنفيذ",
      benefit3: "ثقة أكبر في الميزانية وتجنّب مشاكل الصيانة",
      closing: "متحمّسون لمساعدتك على التخطيط الصحيح من البداية!",
      regards: "مع أطيب التحيات،",
      team: `فريق التصميم ${arEngName}`,
      footer: {
        copyright: `© ${new Date().getFullYear()}  ${arEngName}. جميع الحقوق محفوظة.`,
        automated: "هذه رسالة آلية، يرجى عدم الرد عليها مباشرة.",
      },
      contactUs: "تواصل معنا عبر واتساب",
    },
  };

  // Use English as fallback if the requested language isn't available
  const langContent = content[lng] || content.ar;

  // Set direction based on language
  const direction = lng === "en" ? "ltr" : "rtl";
  const textAlign = lng === "en" ? "left" : "right";
  const fontFamily =
    lng === "ar"
      ? "'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      : "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="${lng}" dir="${direction}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${langContent.subject}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: ${fontFamily};
          line-height: 1.6;
          color: #584d3f;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f2ee;
          text-align: ${textAlign};
          direction: ${direction};
        }
        .email-container {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          text-align: ${textAlign};
          direction: ${direction};
        }
        .header {
          background: linear-gradient(135deg, #be975c 0%, #d3ac71 100%);
          color: white;
          padding: 20px;
          text-align: center;
        }
        .content {
          background-color: #fcfbf9;
          padding: 30px;
        }
        .footer {
          background-color: #eae7e2;
          padding: 15px;
          text-align: center;
          font-size: 14px;
          color: #584d3f;
        }
        .btn {
          display: inline-block;
          background-color: #d3ac71;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .benefits-box {
          margin: 30px 0;
          padding: 20px;
          background-color: #f7eedd;
          border-radius: 6px;
        }
        .benefit-item {
          margin-bottom: 12px;
          display: flex;
          flex-direction: ${direction === "rtl" ? "row-reverse" : "row"};
        }
        .benefit-icon {
          margin: ${direction === "rtl" ? "0 0 0 10px" : "0 10px 0 0"};
          color: #be975c;
        }
        .highlight {
          font-weight: bold;
          color: #d3ac71;
        }
        .contact-links {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }
        .contact-btn {
          display: inline-block;
          padding: 10px 15px;
          background-color: #fcfbf9;
          border: 2px solid #d3ac71;
          color: #584d3f;
          text-decoration: none;
          border-radius: 4px;
          font-size: 14px;
          text-align: center;
        }
        .contact-btn img {
          vertical-align: middle;
          margin-${direction === "rtl" ? "left" : "right"}: 5px;
          height: 16px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>${langContent.heading}</h1>
        </div>
        <div class="content">
          <p>${langContent.greeting},</p>
          
          <p>${langContent.message}</p>
          
          <h3 style="color: #383028;">${langContent.actionNeeded}</h3>
          <p>${langContent.paymentInfo}</p>
          
          <div style="text-align: center;">
            <a href="${paymentLink}" class="btn">${langContent.buttonText}</a>
          </div>
          
          <div class="benefits-box">
            <h3 style="color: #383028;">${langContent.benefits}</h3>
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div>${langContent.benefit1}</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div>${langContent.benefit2}</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div>${langContent.benefit3}</div>
            </div>
          </div>
          
          <p>${langContent.closing}</p>
          
          <div class="contact-links">
            <a href="${whatsappLink}" class="contact-btn">
              <img src="https://cdnjs.cloudflare.com/ajax/libs/simple-icons/3.0.1/whatsapp.svg" alt="WhatsApp">
              ${langContent.contactUs}
            </a>
          </div>
          
          <p>${langContent.regards}<br>${langContent.team}</p>
        </div>
        <div class="footer">
          <p>${langContent.footer.copyright}</p>
          <p>${langContent.footer.automated}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(clientEmail, langContent.subject, emailHtml, true);
  return `Payment reminder email sent successfully in ${lng} language`;
}

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
    true,
    notificationHtml,
    null,
    "ATTEMPT_FAILED",
    "Test Attempt",
    true,
    "HTML",
    null,
    userId
  );
}
