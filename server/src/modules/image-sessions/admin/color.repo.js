// image-sessions/admin color repository — Prisma I/O ONLY. Reference-data CRUD for color
// palettes, moved verbatim from the legacy `image-session-services.js` service.
import prisma from "../../../infra/prisma/prisma.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { imageSessionsMessagesCodes as M } from "@dms/shared";
import {
  createTextAndConnect,
  deserializeTemplatesDeep,
} from "../image-sessions.helpers.js";
import { createAListOfText, editAListOftext } from "./text.repo.js";

export async function getColors({ notArchived }) {
  const where = {};
  if (notArchived) {
    where.isArchived = false;
  }
  const rows = await prisma.colorPattern.findMany({
    where,
    orderBy: {
      order: "asc",
    },
    include: {
      title: {
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

export async function createColorPallete({ data }) {
  const titles = Object.values(data.titles);
  const descriptions = Object.values(data.descriptions);
  if (!data.colors || data.colors.length === 0) {
    throw new AppError(M.IMAGE_SESSION_COLORS_REQUIRED, 400);
  }
  if (!data.templateId) {
    throw new AppError(M.IMAGE_SESSION_TEMPLATE_REQUIRED, 400);
  }
  if (!data.titles || titles.length === 0) {
    throw new AppError(M.IMAGE_SESSION_TITLE_REQUIRED, 400);
  }
  if (!data.background) {
    throw new AppError(M.IMAGE_SESSION_BACKGROUND_REQUIRED, 400);
  }

  const titlesToCreate = createTextAndConnect(titles, "text");
  let descriptionsToCreate = createTextAndConnect(descriptions, "content");

  const dataToSubmit = {
    templateId: Number(data.templateId),
    title: {
      create: titlesToCreate,
    },
    background: data.background,
    colors: {
      create: data.colors.map((color, index) => ({
        colorHex: color.colorHex,
        order: index,
        isEditableByClient: color.isEditableByClient || false,
      })),
    },
  };
  if (data.isFullWidth) {
    dataToSubmit.isFullWidth = data.isFullWidth;
  }
  if (data.order) {
    dataToSubmit.order = data.order;
  }

  if (descriptionsToCreate && descriptionsToCreate.length > 0) {
    dataToSubmit.description = {
      create: descriptionsToCreate,
    };
  }
  if (data.imageUrl) {
    dataToSubmit.imageUrl = data.imageUrl;
  }

  const newStyle = await prisma.colorPattern.create({
    data: dataToSubmit,
  });
  return newStyle;
}

export async function editColorPallete({ data, colorId }) {
  const translations = data.translations;
  const dataToSubmit = {};
  if (data.templateId) {
    dataToSubmit.templateId = data.templateId;
  }
  if (data.background) {
    dataToSubmit.background = data.background;
  }
  dataToSubmit.isFullWidth = data.isFullWidth;

  if (data.imageUrl) {
    dataToSubmit.imageUrl = data.imageUrl;
  }
  if (data.order) {
    dataToSubmit.order = data.order;
  }
  if (translations.edits.titles) {
    await editAListOftext({ edits: translations.edits.titles, type: "TITLE" });
  }

  if (translations.edits.descriptions) {
    await editAListOftext({
      edits: translations.edits.descriptions,
      type: "DESCRIPTION",
    });
  }

  if (Object.keys(dataToSubmit).length > 0) {
    await prisma.colorPattern.update({
      where: {
        id: Number(colorId),
      },
      data: dataToSubmit,
    });
  }

  if (data.editedColors && data.editedColors.length > 0) {
    data.editedColors.forEach(async (color) => {
      await prisma.colorPatternColor.update({
        where: {
          id: Number(color.id),
        },
        data: {
          colorHex: color.colorHex,
          isEditableByClient: color.isEditableByClient || false,
          order: color.order,
        },
      });
    });
  }
  if (translations.creates.titles) {
    await createAListOfText({
      creates: translations.creates.titles,
      id: colorId,
      modelId: "colorPatternId",
      type: "TITLE",
    });
  }

  if (translations.creates.descriptions) {
    await createAListOfText({
      creates: translations.creates.descriptions,
      id: colorId,
      modelId: "colorPatternId",
      type: "DESCRIPTION",
    });
  }

  const lastColor = await prisma.colorPatternColor.findFirst({
    where: {
      colorPatternId: Number(colorId),
    },
    orderBy: {
      order: "desc",
    },
    select: {
      order: true,
    },
  });
  let nextOrder = lastColor?.order != null ? lastColor.order + 1 : 0;
  if (data.newColors && data.newColors.length > 0) {
    await prisma.colorPatternColor.createMany({
      data: data.newColors.map((color) => ({
        colorHex: color.colorHex,
        isEditableByClient: color.isEditableByClient || false,
        order: nextOrder++,
        colorPatternId: Number(colorId),
      })),
    });
  }
  if (data.deletedColors && data.deletedColors.length > 0) {
    await prisma.colorPatternColor.deleteMany({
      where: {
        id: {
          in: data.deletedColors,
        },
      },
    });
  }

  return true;
}
