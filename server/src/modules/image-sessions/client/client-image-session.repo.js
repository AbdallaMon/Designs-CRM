// image-sessions/client repository — Prisma I/O ONLY (no business rules, no AppError, no
// legacy-service calls). Its sole job is the OBJECT-SCOPE RESOLUTION the public DELETE
// /images/:imageId path was missing: given a ClientSelectedImage id, resolve the row's
// owning `imageSessionId` (the direct FK to ClientImageSession — schema.prisma model
// ClientSelectedImage l.1712-1720) so the usecase can confirm the image BELONGS to the
// token-resolved session BEFORE invoking the frozen `deleteImage` service.
//
// The scope lookup below is a minimal read used by the usecase via constructor injection.
// The client-facing selection/lookup CRUD (language-scoped reference reads, the client
// save-* writes, the token-keyed extras and image delete) lives in the named exports below,
// moved verbatim from the legacy `image-session-services.js` + `client-image-services.js`
// services and invoked from the usecase via lazy adapters — behavior-preserving.
import prisma from "../../../infra/prisma/prisma.js";
import { deserializeTemplatesDeep } from "../image-sessions.helpers.js";
import { serializeJsonField } from "../../../shared/utility/json-field.js";

class ClientImageSessionRepository {
  // Resolve a ClientSelectedImage → its owning imageSessionId (the scope key). Selects ONLY
  // that field. Returns null if the image does not exist (the usecase maps that to NOT_FOUND).
  async findSelectedImageOwnerSessionId({ imageId }) {
    const row = await prisma.clientSelectedImage.findUnique({
      where: { id: Number(imageId) },
      select: { imageSessionId: true },
    });
    return row;
  }
}

export const clientImageSessionRepository = new ClientImageSessionRepository();

// ── client selection/lookup CRUD (moved verbatim from legacy `image-session-services.js`) ──

export async function getColorsByLng({ lng }) {
  const where = {};
  where.isArchived = false;
  const lngWhere = {};
  if (lng) {
    lngWhere.language = {
      code: lng,
    };
  }
  const rows = await prisma.colorPattern.findMany({
    where,
    orderBy: {
      order: "asc",
    },
    include: {
      title: {
        where: lngWhere,
        select: {
          text: true,
          id: true,
          languageId: true,
          language: {
            select: {
              id: true,
              code: true,
            },
          },
        },
      },
      description: {
        where: lngWhere,
        select: {
          content: true,
          id: true,
          languageId: true,
          language: {
            select: {
              id: true,
              code: true,
            },
          },
        },
      },
      template: true,
      colors: true,
    },
  });
  return deserializeTemplatesDeep(rows);
}

export async function saveClientSelectedColor({
  selectedColor,
  session,
  customColors,
  status,
}) {
  return await prisma.clientImageSession.update({
    where: {
      id: Number(session.id),
    },
    data: {
      colorPatternId: selectedColor.id,
      // customColors is now a String? (LongText) column — store the hex array as a JSON string.
      customColors: serializeJsonField(customColors?.map((color) => color.colorHex)),
      sessionStatus: status,
    },
  });
}

export async function getMaterialsByLng({ lng }) {
  const where = {};
  where.isArchived = false;
  const lngWhere = {};
  if (lng) {
    lngWhere.language = {
      code: lng,
    };
  }

  const rows = await prisma.material.findMany({
    where,
    include: {
      title: {
        where: lngWhere,
        select: {
          text: true,
          id: true,
          languageId: true,
          language: {
            select: {
              id: true,
              code: true,
            },
          },
        },
      },
      description: {
        where: lngWhere,
        select: {
          content: true,
          id: true,
          languageId: true,
          language: {
            select: {
              id: true,
              code: true,
            },
          },
        },
      },
      template: true,
    },
  });
  return deserializeTemplatesDeep(rows);
}

export async function saveClientSelectedMaterials({
  selectedMaterials, // now an array
  session,
  status,
}) {
  const sessionId = Number(session.id);

  // 1. Clear existing materials for this session (optional, if replacing)
  await prisma.materialOnClientImageSession.deleteMany({
    where: { clientImageSessionId: sessionId },
  });

  // 2. Create new relations
  const createData = selectedMaterials.map((material) => ({
    clientImageSessionId: sessionId,
    materialId: material.id,
  }));

  await prisma.materialOnClientImageSession.createMany({
    data: createData,
  });

  // 3. Update session status
  await prisma.clientImageSession.update({
    where: { id: sessionId },
    data: {
      sessionStatus: status,
    },
  });

  return { message: "Materials saved successfully" };
}

export async function getStyleByLng({ lng }) {
  const where = {};
  where.isArchived = false;
  const lngWhere = {};
  if (lng) {
    lngWhere.language = {
      code: lng,
    };
  }

  const rows = await prisma.style.findMany({
    where,
    include: {
      title: {
        where: lngWhere,
        select: {
          text: true,
          id: true,
          languageId: true,
          language: {
            select: {
              id: true,
              code: true,
            },
          },
        },
      },
      description: {
        where: lngWhere,
        select: {
          content: true,
          id: true,
          languageId: true,
          language: {
            select: {
              id: true,
              code: true,
            },
          },
        },
      },
      template: true,
    },
  });
  return deserializeTemplatesDeep(rows);
}

export async function saveClientSelectedStyle({
  selectedStyle,
  session,
  status,
}) {
  return await prisma.clientImageSession.update({
    where: {
      id: Number(session.id),
    },
    data: {
      styleId: selectedStyle.id,
      sessionStatus: status,
    },
  });
}

export async function getImagesByStyleAndSpaces({ styleId, spaceIds }) {
  const spaceIdsArray =
    typeof spaceIds === "string"
      ? spaceIds
          .split(",")
          .map((id) => Number(id.trim()))
          .filter(Boolean)
      : [];
  return await prisma.designImage.findMany({
    where: {
      styleId: Number(styleId),
      isArchived: false,
      spaces: {
        some: {
          spaceId: {
            in: spaceIdsArray,
          },
        },
      },
    },
  });
}

export async function saveClientSelectedImages({
  selectedImages,
  session,
  status,
}) {
  const sessionId = Number(session.id);

  // Extract image IDs
  const selectedImageIds = selectedImages.map((image) => image.id);

  return await prisma.$transaction([
    prisma.note.deleteMany({
      where: {
        clientSelectedImage: {
          imageSessionId: sessionId,
        },
      },
    }),
    prisma.clientSelectedImage.deleteMany({
      where: {
        imageSessionId: sessionId,
      },
    }),

    ...selectedImageIds.map((designImageId) =>
      prisma.clientSelectedImage.create({
        data: {
          imageSessionId: sessionId,
          designImageId,
        },
      })
    ),

    prisma.clientImageSession.update({
      where: {
        id: sessionId,
      },
      data: {
        sessionStatus: status,
      },
    }),
  ]);
}

export async function deleteImage({ imageId }) {
  await prisma.note.deleteMany({
    where: {
      clientSelectedImage: {
        id: Number(imageId),
      },
    },
  }),
    await prisma.clientSelectedImage.delete({
      where: {
        id: Number(imageId),
      },
    });
  return true;
}

// ── token-keyed extras (moved verbatim from legacy `client-image-services.js`) ─────────────
// NOTE: this `changeSessionStatus({ token, status, extra })` is DISTINCT from the session
// repo's `changeSessionStatus({ token, id, sessionStatus, extra })` — kept in separate files
// to avoid a merge hazard. `submitSelectedPatterns`/`submitSelectedImages` reference a bare
// `getSessionByToken` that the original module never imported; preserved verbatim.

export async function submitSelectedPatterns({ token, patternIds }) {
  await prisma.clientImageSession.update({
    where: { token },
    data: {
      preferredPatterns: {
        set: [],
        connect: patternIds.map((id) => ({ id })),
      },
    },
  });

  return await getSessionByToken(token);
}

export async function submitSelectedImages({ token, imageIds }) {
  // Clear previous selected images and add new ones
  await prisma.clientImageSession.update({
    where: { token },
    data: {
      selectedImages: {
        deleteMany: {},
        create: imageIds.map((id) => ({
          image: { connect: { id } },
        })),
      },
    },
  });

  return await getSessionByToken(token);
}

// ── EXTRAS generic-model reads (moved verbatim from legacy `shared/legacy/shared-utility-
// services.js`). The usecase hardens `getImageSesssionModel` with UTILITY_MODEL_ALLOWLIST
// before it is ever reached; the query shapes are preserved 1:1.
export async function getImageSesssionModel({ model, searchParams }) {
  const data = await prisma[model].findMany();
  return data;
}

export async function getImages({ patternIds, spaceIds }) {
  const patternIdList = patternIds
    ? patternIds
        .split(",")
        .map((id) => Number(id))
        .filter(Boolean)
    : [];

  const spaceIdList = spaceIds
    ? spaceIds
        .split(",")
        .map((id) => Number(id))
        .filter(Boolean)
    : [];

  const where = {
    isArchived: false,
    ...(patternIdList.length > 0 && {
      patterns: {
        some: {
          id: { in: patternIdList },
        },
      },
    }),
    ...(spaceIdList.length > 0 && {
      spaces: {
        some: {
          id: { in: spaceIdList },
        },
      },
    }),
  };

  const images = await prisma.image.findMany({
    where,
    include: {
      patterns: true,
      spaces: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return images;
}

export async function changeSessionStatus({ token, status, extra }) {
  // Clear previous selected images and add new ones
  let data = {
    sessionStatus: status,
  };
  if (extra) {
    data = { ...data, ...extra };
  }
  await prisma.clientImageSession.update({
    where: { token },
    data,
  });

  return await getSessionByToken(token);
}
