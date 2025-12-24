import { message } from "telegram/client/index.js";
import prisma from "../../../prisma/prisma.js";

/**
 * Get all files/attachments from a chat room
 * Supports filtering by type, search, date range, and pagination
 */
export async function getChatRoomFiles({
  roomId,
  userId,
  page = 0,
  limit = 20,
  sort = "newest",
  type = null, // image, video, document, audio, file
  search = "",
  from = null,
  to = null,
}) {
  const parsedRoomId = parseInt(roomId);
  const parsedUserId = parseInt(userId);
  const skip = page * limit;

  // Verify user is a member of the room
  const member = await prisma.chatMember.findFirst({
    where: {
      roomId: parsedRoomId,
      userId: parsedUserId,
      leftAt: null,
    },
  });

  if (!member) {
    throw new Error("You don't have access to this room");
  }

  // Build file type filter
  const typeFilter = buildTypeFilter(type);

  // Build search filter
  const searchFilter =
    search && search !== "undefined" && search?.trim().length > 0
      ? {
          OR: [
            { fileName: { contains: search } },
            { content: { contains: search } },
          ],
        }
      : {};
  // Build date range filter
  const dateFilter = {};
  if (from) {
    dateFilter.gte = new Date(from);
  }
  if (to) {
    dateFilter.lte = new Date(to);
  }

  const where = {
    message: {
      roomId: parsedRoomId,
      isDeleted: false,
      ...typeFilter,
      ...searchFilter,
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
    },
  };

  const [messages, total] = await Promise.all([
    prisma.chatAttachment.findMany({
      where,
      select: {
        id: true,
        fileUrl: true,
        fileName: true,
        fileMimeType: true,
        fileSize: true,
        thumbnailUrl: true,
        content: true,
        message: {
          select: {
            id: true,
            roomId: true,
            type: true,
            fileName: true,
            fileUrl: true,
            fileMimeType: true,
            fileSize: true,
            content: true,
            createdAt: true,
            senderId: true,
            senderClient: true,
            sender: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { message: { createdAt: sort === "newest" ? "desc" : "asc" } },
      skip,
      take: limit,
    }),
    prisma.chatAttachment.count({ where }),
  ]);

  // Format response with month grouping helper
  const formattedFiles = messages.map((msg) => {
    const file = {
      id: msg.id,
      messageId: msg.message.id,
      roomId: msg.message.roomId,
      type: msg.message.type,
      fileName: msg.fileName,
      fileUrl: msg.fileUrl,
      fileMimeType: msg.fileMimeType,
      fileSize: msg.fileSize,
      content: msg.content,
      sender: msg.message.sender
        ? msg.message.sender
        : msg.message.senderClient
        ? {
            id: msg.message.client.id,
            name: msg.message.client.name,
            isClient: true,
          }
        : null,
      createdAt: msg.message.createdAt,
      month: msg.message.createdAt.toISOString().slice(0, 7), // YYYY-MM
    };

    return file;
  });
  const filesByMonth = formattedFiles.reduce((acc, file) => {
    const month = file.month || file.createdAt?.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(file);
    return acc;
  }, {});

  // Sort months descending (newest first)
  const sortedMonths = Object.keys(filesByMonth).sort((a, b) =>
    b.localeCompare(a)
  );
  return {
    data: {
      filesByMonth,
      sortedMonths,
      files: formattedFiles,
    },
    total,
    totalPages: Math.ceil(total / limit),
    page: page,
    limit: limit,
  };
}

/**
 * Build Prisma filter for file types
 */
function buildTypeFilter(type) {
  if (!type) {
    // Return all files/media
    return {
      OR: [
        { type: { in: ["FILE", "IMAGE", "VIDEO", "VOICE"] } },
        { attachments: { some: {} } },
      ],
    };
  }

  const typeMap = {
    image: {
      OR: [
        { type: "IMAGE" },
        {
          fileMimeType: {
            in: ["image/jpeg", "image/png", "image/gif", "image/webp"],
          },
        },
      ],
    },
    video: {
      OR: [
        { type: "VIDEO" },
        {
          fileMimeType: {
            in: ["video/mp4", "video/webm", "video/quicktime"],
          },
        },
      ],
    },
    audio: {
      OR: [
        { type: "VOICE" },
        {
          fileMimeType: {
            in: ["audio/mpeg", "audio/wav", "audio/ogg"],
          },
        },
      ],
    },
    document: {
      fileMimeType: {
        in: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
      },
    },
    file: {
      type: "FILE",
    },
  };

  return typeMap[type.toLowerCase()] || {};
}

/**
 * Get file statistics for a room
 */
export async function getChatRoomFileStats({ roomId, userId }) {
  const parsedRoomId = parseInt(roomId);
  const parsedUserId = parseInt(userId);

  // Verify user is a member
  const member = await prisma.chatMember.findFirst({
    where: {
      roomId: parsedRoomId,
      userId: parsedUserId,
      leftAt: null,
    },
  });

  if (!member) {
    throw new Error("You don't have access to this room");
  }

  const where = {
    roomId: parsedRoomId,
    isDeleted: false,
    OR: [
      { type: { in: ["FILE", "IMAGE", "VIDEO", "VOICE"] } },
      { attachments: { some: {} } },
    ],
  };

  const [total, images, videos, documents, audio] = await Promise.all([
    prisma.chatMessage.count({ where }),
    prisma.chatMessage.count({
      where: {
        ...where,
        OR: [
          { type: "IMAGE" },
          {
            fileMimeType: {
              in: ["image/jpeg", "image/png", "image/gif", "image/webp"],
            },
          },
        ],
      },
    }),
    prisma.chatMessage.count({
      where: {
        ...where,
        OR: [
          { type: "VIDEO" },
          {
            fileMimeType: {
              in: ["video/mp4", "video/webm", "video/quicktime"],
            },
          },
        ],
      },
    }),
    prisma.chatMessage.count({
      where: {
        ...where,
        fileMimeType: {
          in: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ],
        },
      },
    }),
    prisma.chatMessage.count({
      where: {
        ...where,
        OR: [
          { type: "VOICE" },
          {
            fileMimeType: {
              in: ["audio/mpeg", "audio/wav", "audio/ogg"],
            },
          },
        ],
      },
    }),
  ]);

  return {
    total,
    byType: {
      images,
      videos,
      documents,
      audio,
      other: total - (images + videos + documents + audio),
    },
  };
}
