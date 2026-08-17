// image-sessions/session repository — Prisma I/O ONLY (no business rules, no AppError, no
// legacy-service calls). Its job is the OBJECT-SCOPE RESOLUTION the legacy SHARED routes
// were missing: given a `:sessionId`, resolve the row's parent `clientLeadId` so the
// usecase can run the leads-module scope checker BEFORE touching the heavy legacy
// image-session service. (The `:clientLeadId` routes are scoped directly — no lookup.)
//
// The scope-resolution lookup below is a minimal id-resolution helper used by the usecase
// via constructor injection. The heavy session lifecycle CRUD (create/edit/regenerate/
// delete + token reads + status change) lives in the named exports below, moved verbatim
// from the legacy `image-session-services.js` service and invoked from the usecase via lazy
// adapters — behavior-preserving.
import { IMAGE_SESSION_STATUSES, imageSessionsMessagesCodes } from "@dms/shared";
import prisma from "../../../infra/prisma/prisma.js";
import { v4 as uuidv4 } from "uuid";
import { deserializeTemplatesDeep } from "../image-sessions.helpers.js";
import { parseJsonField } from "../../../shared/utility/json-field.js";

class ImageSessionRepository {
  // Resolve a ClientImageSession → its parent clientLeadId (the scope key). Returns null if
  // the session does not exist (the usecase maps that to NOT_FOUND / denial).
  async getSessionClientLeadId({ sessionId }) {
    const row = await prisma.clientImageSession.findUnique({
      where: { id: Number(sessionId) },
      select: { id: true, clientLeadId: true },
    });
    return row;
  }
}

export const imageSessionRepository = new ImageSessionRepository();

// ── session lifecycle CRUD (moved verbatim from legacy `image-session-services.js`) ────────

export async function getClientImageSessions(clientLeadId) {
  const sessions = await prisma.clientImageSession.findMany({
    where: { clientLeadId: Number(clientLeadId) },
    include: {
      note: true,

      createdBy: true,
      selectedSpaces: {
        select: {
          space: {
            select: {
              id: true,
              title: {
                select: {
                  text: true,
                  id: true,
                  languageId: true,
                  language: {
                    select: {
                      code: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      selectedImages: {
        include: {
          designImage: true,
          note: true,
        },
      },
      materials: {
        select: {
          material: {
            select: {
              id: true,
              title: {
                select: {
                  text: true,
                  id: true,
                  languageId: true,
                  language: {
                    select: {
                      code: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      colorPattern: {
        select: {
          title: {
            select: {
              text: true,
              language: {
                select: {
                  code: true,
                },
              },
            },
          },
          colors: {
            select: {
              id: true,
              colorHex: true,
            },
          },
        },
      },
      style: {
        select: {
          id: true,
          title: {
            select: {
              text: true,
              id: true,
              languageId: true,
              language: {
                select: {
                  code: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // customColors is a String? (LongText) JSON column — decode to the hex array callers expect.
  for (const s of sessions) s.customColors = parseJsonField(s.customColors);
  return sessions;
}

export async function createClientImageSession({
  clientLeadId,
  userId,
  selectedSpaceIds,
}) {
  const token = uuidv4();

  const session = await prisma.clientImageSession.create({
    data: {
      clientLeadId: Number(clientLeadId),
      createdById: Number(userId),
      token,
      selectedSpaces: {
        create: selectedSpaceIds.map((spaceId) => ({
          space: { connect: { id: spaceId } },
        })),
      },
    },
  });

  return session;
}

export async function regenerateSessionToken(sessionId) {
  const session = await prisma.clientImageSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) return null;

  const newToken = uuidv4();

  const updated = await prisma.clientImageSession.update({
    where: { id: sessionId },
    data: {
      token: newToken,
    },
  });

  return {
    token: updated.token,
    url: `${process.env.DASHBOARD_ORIGIN}/image-session?token=${updated.token}`,
  };
}

export async function editSessionFileds({ sessionId, data }) {
  await prisma.clientImageSession.update({
    where: {
      id: Number(sessionId),
    },
    data,
  });
}

export async function deleteInProgressSession(sessionId, user) {
  const session = await prisma.clientImageSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) return { notFound: true };
  if (!user.isAdminTier) {
    if ([IMAGE_SESSION_STATUSES.PDF_GENERATED, IMAGE_SESSION_STATUSES.SUBMITTED].includes(session.sessionStatus)) {
      return { locked: true };
    }
  }
  // await prisma
  await prisma.materialOnClientImageSession.deleteMany({
    where: { clientImageSessionId: sessionId },
  });

  await prisma.clientImageSessionToSpace.deleteMany({
    where: { clientImageSessionId: sessionId },
  });
  await prisma.note.deleteMany({
    where: {
      clientSelectedImage: {
        imageSessionId: sessionId,
      },
    },
  }),
    await prisma.clientSelectedImage.deleteMany({
      where: { imageSessionId: sessionId },
    });

  await prisma.note.deleteMany({
    where: { imageSessionId: sessionId }, // if this relation exists
  });
  await prisma.clientImageSession.delete({
    where: { id: sessionId },
  });

  return { message: imageSessionsMessagesCodes.IMAGE_SESSION_DELETED };
}

export async function getSessionByToken({ token }) {
  const session = await prisma.clientImageSession.findUnique({
    where: { token },
    include: {
      selectedSpaces: {
        select: {
          space: {
            select: {
              id: true,
              title: {
                select: {
                  text: true,
                  id: true,
                  languageId: true,
                  language: {
                    select: {
                      code: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      note: true,
      selectedImages: {
        include: {
          designImage: true,
          note: true,
        },
      },
      materials: {
        select: {
          material: {
            include: {
              template: true,
              title: {
                select: {
                  text: true,
                  id: true,
                  languageId: true,
                  language: {
                    select: {
                      code: true,
                    },
                  },
                },
              },
              description: {
                select: {
                  content: true,
                  id: true,
                  languageId: true,
                  language: {
                    select: {
                      code: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      style: {
        include: {
          template: true,
          title: {
            select: {
              text: true,
              id: true,
              languageId: true,
              language: {
                select: {
                  code: true,
                },
              },
            },
          },
          description: {
            select: {
              content: true,
              id: true,
              languageId: true,
              language: {
                select: {
                  code: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  // customColors is a String? (LongText) JSON column — decode to the hex array callers expect.
  session.customColors = parseJsonField(session.customColors);
  return deserializeTemplatesDeep(session);
}

export async function changeSessionStatus({ token, id, sessionStatus, extra }) {
  const key = token ? "token" : "id";
  const keyId = token || Number(id);

  return await prisma.clientImageSession.update({
    where: {
      [key]: keyId,
    },
    data: {
      sessionStatus,
      ...(extra && extra),
    },
  });
}

export async function advanceClientSessionStatus({ token, fromStatus, toStatus }) {
  const changed = await prisma.clientImageSession.updateMany({
    where: { token, sessionStatus: fromStatus },
    data: { sessionStatus: toStatus },
  });
  if (changed.count !== 1) return null;
  return getSessionByToken({ token });
}

export async function claimPdfGeneration({ token, signatureUrl, staleBefore }) {
  const claimed = await prisma.clientImageSession.updateMany({
    where: {
      token,
      pdfUrl: null,
      OR: [
        { sessionStatus: IMAGE_SESSION_STATUSES.SELECTED_IMAGES },
        { sessionStatus: IMAGE_SESSION_STATUSES.PDF_GENERATED, updatedAt: { lt: staleBefore } },
      ],
    },
    data: { sessionStatus: IMAGE_SESSION_STATUSES.PDF_GENERATED, signatureUrl },
  });
  if (claimed.count !== 1) return null;
  return getSessionByToken({ token });
}

export function releasePdfGenerationClaim({ token, claimUpdatedAt }) {
  return prisma.clientImageSession.updateMany({
    where: {
      token,
      sessionStatus: IMAGE_SESSION_STATUSES.PDF_GENERATED,
      pdfUrl: null,
      updatedAt: claimUpdatedAt,
    },
    data: { sessionStatus: IMAGE_SESSION_STATUSES.SELECTED_IMAGES },
  });
}

// Generic global reference-data pick-list read (legacy `getModelIds`). Moved VERBATIM from
// the legacy `admin-services.js` god-file. The usecase validates `model` against the
// allow-list and guards the JSON.parse BEFORE calling this (mass-read hardening).
export async function getModelIds({ searchParams, model }) {
  let queryWhere =
    searchParams?.where && searchParams.where !== "undefined"
      ? JSON.parse(searchParams.where)
      : {};
  const where = {};

  const select = {};
  const include = {};
  if (searchParams.select) {
    const selectFields = searchParams.select.split(",");
    selectFields.forEach((field) => {
      if (!select.select) {
        select.select = {};
      }
      select.select = {
        ...select.select,
        [field]: true,
      };
    });
  }
  if (searchParams.isLanguage && searchParams.isLanguage === "true") {
    if (!select.select) {
      select.select = {};
    }
    select.select.title = {
      select: {
        id: true,
        text: true,
        language: {
          select: {
            code: true,
          },
        },
      },
    };
    if (!select.select.id) {
      select.select.id = true;
    }
  }
  if (searchParams.include) {
    const includeFields = searchParams.include.split(",");
    includeFields.forEach((field) => {
      if (!include.include) {
        include.include = {};
      }
      include.include = {
        ...select.include,
        [field]: true,
      };
    });
  }
  if (searchParams) {
    Object.keys(queryWhere).forEach((key) => {
      where[key] = queryWhere[key];
    });
  }
  return await prisma[model].findMany({
    where: {
      ...where,
    },
    ...(select && select),
    ...(include && include),
  });
}
