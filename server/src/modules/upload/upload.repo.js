import prisma from "../../infra/prisma/prisma.js";

class UploadRepository {
  findContractByToken({ token }) {
    return prisma.contract.findFirst({
      where: { OR: [{ arToken: token }, { enToken: token }] },
      select: { id: true },
    });
  }

  findImageSessionByToken({ token }) {
    return prisma.clientImageSession.findUnique({
      where: { token },
      select: { id: true },
    });
  }

  findChatRoomByToken({ token }) {
    return prisma.chatRoom.findFirst({
      where: { chatAccessToken: token },
      select: { id: true },
    });
  }

  findCalendarSessionByToken({ token }) {
    return prisma.meetingReminder.findUnique({
      where: { token },
      select: { id: true },
    });
  }

  findPublicLeadDraftById({ id }) {
    return prisma.clientLead.findFirst({
      where: {
        id: Number(id),
        description: "Didn't complete register yet",
      },
      select: { id: true },
    });
  }
}

export const uploadRepository = new UploadRepository();
export { UploadRepository };
