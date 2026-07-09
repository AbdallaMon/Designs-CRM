// image-sessions/admin design-image repository — Prisma I/O ONLY. Reference-data CRUD for
// design images, moved verbatim from the legacy `image-session-services.js` service.
import prisma from "../../../infra/prisma/prisma.js";

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
  return { data, total, totalPages };
}

export async function createDesignImage({ data }) {
  if (!data.styleId) {
    throw new Error("Select at least one style");
  }
  if (!data.spaceIds || data.spaceIds.length === 0) {
    throw new Error("Select at least one spce");
  }
  if (!data.imageUrl) {
    throw new Error("Upload an image");
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
    throw new Error("Select at least one style");
  }
  if (!data.spaceIds || data.spaceIds.length === 0) {
    throw new Error("Select at least one spce");
  }
  const images = data.imagesUrls;
  if (!images || images.length === 0) {
    throw new Error("Please add at least one image");
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
