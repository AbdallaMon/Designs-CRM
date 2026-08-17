import { IMAGE_SESSION_STATUSES } from "@dms/shared";
import prisma from "../../../infra/prisma/prisma.js";
import { v4 as uuidv4 } from "uuid";
import { uploadToFTPHttpAsBuffer } from "../../../infra/upload/ftp-upload.js";
import {
  sendEmailForStaff,
  sendEmailToClient,
} from "../../../infra/mail/email-templates.js";
import { notifyUsersThatAClientHasSubmittedAPdf } from "../../../infra/telegram/telegram-functions.js";
import { generateImageSessionPdf } from "./generate-image-session-pdf.js";

export async function uploadPdfAndApproveSession({
  sessionData,
  signatureUrl,
  lng = "ar",
}) {
  try {
    const client = await prisma.clientImageSession.findUnique({
      where: {
        id: Number(sessionData.id),
      },
      select: {
        clientLead: {
          select: {
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    const pdfBytes = await generateImageSessionPdf({
      sessionData,
      // Resolved to absolute in fetchImageBuffer (toAbsoluteAssetUrl): relative
      // "/uploads/…" gets the CRM domain prepended, full URLs pass through.
      signatureUrl,
      lng,
      name: client.clientLead.client.name,
    });
    const fileName = `session-${sessionData.id}-${uuidv4()}.pdf`;
    const remotePath = `public_html/uploads/${fileName}`;

    await uploadToFTPHttpAsBuffer(pdfBytes, remotePath, true);

    const publicUrl = `/uploads/${fileName}`;
    console.log(publicUrl, "publicUrl in upload and approve");
    await approveSession({
      token: sessionData.token,
      clientLeadId: sessionData.clientLeadId,
      id: Number(sessionData.id),
      pdfUrl: publicUrl,
    });
  } catch (e) {
    console.log("e in uploadig pdf", e);
    throw e;
  }
}

export async function approveSession({ token, clientLeadId, id, pdfUrl }) {
  // Clear previous selected images and add new ones
  await prisma.clientImageSession.update({
    where: { id: Number(id) },
    data: {
      sessionStatus: IMAGE_SESSION_STATUSES.SUBMITTED,
      pdfUrl: pdfUrl,
    },
  });
  await notifyUsersThatAClientHasSubmittedAPdf({ clientLeadId: clientLeadId });
  await sendSuccessEmailAfterSessionDone({ token, clientLeadId, pdfUrl });
  return true;
}

export async function sendSuccessEmailAfterSessionDone({
  token,
  clientLeadId,
  pdfUrl,
}) {
  const clientLead = await prisma.clientLead.findUnique({
    where: {
      id: Number(clientLeadId),
    },
    select: {
      client: {
        select: {
          name: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
  const adminUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      currentProfile: { isAdminTier: true },
    },
    select: {
      id: true,
      email: true,
    },
  });
  const staffs = [...adminUsers, clientLead.assignedTo];
  try {
    await sendEmailToClient({
      clientName: clientLead.client.name,
      clientEmail: clientLead.client.email,
      pdfUrl,
      token,
    });
  } catch (e) {
    console.log(e, "error in generating email for client");
  }
  try {
    await sendEmailForStaff({
      clientLeadId: clientLeadId,
      clientName: clientLead.client.name,
      pdfDownloadUrl: pdfUrl,
      staffs,
      token: token,
    });
  } catch (e) {
    console.log(e, "error in generating email for staff");
  }
}
