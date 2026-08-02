// image-sessions/admin design-image repository — Prisma I/O ONLY. Reference-data CRUD for
// design images, moved verbatim from the legacy `image-session-services.js` service.
import prisma from "../../../infra/prisma/prisma.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { imageSessionsMessagesCodes } from "@dms/shared";

export async function getDesignImages({ notArchived, skip, limit }) {
  const where = {};
  if (notArchived) {
    where.isArchived = false;
  }
  const data = await prisma.designImage.findMany({
    where,
    skip,
    take: limit,
    include: {
      spaces: {
        select: {
          id: true,
          space: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      style: {
        select: {
          id: true,
          title: {
            select: {
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
  const total = await prisma.designImage.count({ where });

  const totalPages = Math.ceil(total / limit);
  // Return the standardized paginated list shape `{ items, total, ... }` so the FE envelope
  // normalizer (isPaginatedData → Array.isArray(items)) unwraps `data` to the array. The old
  // `{ data, ... }` shape was NOT recognized as a list, so the FE received an object and
  // crashed on `.map` ("h.map is not a function") when the gallery tab first loaded.
  return { items: data, total, totalPages };
}

export async function createDesignImage({ data }) {
  if (!data.styleId) {
    throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_STYLE_REQUIRED, statusCode: 400 });
  }
  if (!data.spaceIds || data.spaceIds.length === 0) {
    throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_SPACE_REQUIRED, statusCode: 400 });
  }
  if (!data.imageUrl) {
    throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_IMAGE_REQUIRED, statusCode: 400 });
  }
  await prisma.designImage.create({
    data: {
      imageUrl: data.imageUrl,
      styleId: data.styleId,
      spaces: {
        create: data.spaceIds.map((spaceId) => ({
          space: {
            connect: { id: spaceId },
          },
        })),
      },
    },
  });
  return true;
}

export async function createBulkDesignImage({ data }) {
  if (!data.styleId) {
    throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_STYLE_REQUIRED, statusCode: 400 });
  }
  if (!data.spaceIds || data.spaceIds.length === 0) {
    throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_SPACE_REQUIRED, statusCode: 400 });
  }
  const images = data.imagesUrls;
  if (!images || images.length === 0) {
    throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_IMAGE_REQUIRED, statusCode: 400 });
  }
  images.forEach(async (image) => {
    await createDesignImage({
      data: { imageUrl: image, styleId: data.styleId, spaceIds: data.spaceIds },
    });
  });
  return true;
}

export async function editDesignImage({ data, imageId }) {
  const sumbitData = {};
  if (data.imageUrl) {
    sumbitData.imageUrl = data.imageUrl;
  }
  if (data.spaceIds) {
    sumbitData.spaces = {
      deleteMany: {},
      create: data.spaceIds.map((spaceId) => ({
        space: {
          connect: { id: spaceId },
        },
      })),
    };
  }
  if (data.styleId) {
    sumbitData.styleId = Number(data.styleId);
  }
  await prisma.designImage.update({
    where: {
      id: Number(imageId),
    },
    data: { ...sumbitData },
  });
  return true;
}
