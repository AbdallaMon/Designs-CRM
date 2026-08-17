import { NOTIFICATION_TYPES, PROFILES } from "@dms/shared";
import prisma from "../../prisma/prisma.js";
import { dealsLink } from "../../config/links.js";
import { sendEmail } from "../../mail/send-mail.js";

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
    NOTIFICATION_TYPES.NEW_FILE,
    "New file upload",
    true,
    "HTML",
    null,
    Number(userId),
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
    NOTIFICATION_TYPES.NEW_NOTE,
    "New note",
    true,
    "HTML",
    null,
    userId,
  );
}

export async function createNotification(
  userId,
  isAdmin,
  content,
  href,
  type,
  emailSubject,
  withEmail,
  contentType = "TEXT",
  clientLeadId,
  staffId,
  profileKeys = [PROFILES.NORMAL_SALES],
  specificProfiles,
) {
  let subAdmins = [];
  const forAll = !userId && !isAdmin && !staffId;
  if (specificProfiles) {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        currentProfile: { key: { in: profileKeys } },
      },
      select: {
        id: true,
      },
    });
    users?.map(async (user) => {
      await sendNotification(
        user.id,
        content,
        href,
        type,
        emailSubject,
        withEmail,
        contentType,
        clientLeadId,
      );
    });
  } else if (forAll) {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        currentProfile: {
          key: {
            in: [
              PROFILES.NORMAL_SALES,
              PROFILES.PRIMARY_SALES,
              PROFILES.SUPER_SALES,
              PROFILES.ADMIN,
              PROFILES.SUPER_ADMIN,
            ],
          },
        },
      },
      select: {
        id: true,
      },
    });
    users?.map(async (user) => {
      await sendNotification(
        user.id,
        content,
        href,
        type,
        emailSubject,
        withEmail,
        contentType,
        clientLeadId,
      );
    });
  } else {
    if (isAdmin) {
      const admin = await prisma.user.findFirst({
        where: {
          currentProfile: { key: PROFILES.ADMIN },
        },
        select: {
          id: true,
        },
      });
      subAdmins = await prisma.user.findMany({
        where: {
          currentProfile: { key: PROFILES.SUPER_ADMIN },
        },
        select: {
          id: true,
        },
      });

      userId = admin.id;
    }

    await sendNotification(
      userId,
      content,
      href,
      type,
      emailSubject,
      withEmail,
      contentType,
      clientLeadId,
      staffId,
    );
    if (subAdmins?.length > 0) {
      subAdmins.forEach(async (admin) => {
        await sendNotification(
          admin.id,
          content,
          href,
          type,
          emailSubject,
          withEmail,
          contentType,
          clientLeadId,
          staffId,
        );
      });
    }
  }
}

async function sendNotification(
  userId,
  content,
  href,
  type,
  emailSubject,
  withEmail,
  contentType = "TEXT",
  clientLeadId,
  staffId,
) {
  const link = href
    ? `<a href="${process.env.DASHBOARD_ORIGIN}${href}" style="color: #1a73e8; text-decoration: none;">See details from here</a>`
    : "";
  const emailContent = `
        <div style=" color: #333; direction: ltr; text-align: left;">
            <h2 style="color: #444; margin-bottom: 16px;">${emailSubject}</h2>
            <p style="font-size: 16px; line-height: 1.5;">${content}</p>
            ${link ? `<p>${link}</p>` : ""}
        </div>
    `;
  const notification = await prisma.notification.create({
    data: {
      userId: userId,
      content: content,
      type,
      link: href,
      contentType,
      clientLeadId: clientLeadId && Number(clientLeadId),
      staffId: staffId && Number(staffId),
    },
  });
  // await publishToSocket("notification", `user:${userId}`, notification);
  if (withEmail) {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { email: true },
    });
    if (user && user.email) {
      const email = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
    <div>
        ${emailContent}
    </div>
    <div style="margin-top: 10px;">
        <a href="${process.env.DASHBOARD_ORIGIN}/dashboard/notifications" style="color: #007bff; text-decoration: none;">
            Go to notifications?
        </a>
    </div>
</div>
`;

      setImmediate(() => {
        sendEmail(user.email, emailSubject, email).catch(() => {});
      });
    }
  }
}
