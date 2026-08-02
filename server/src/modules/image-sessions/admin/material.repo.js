// image-sessions/admin material repository — Prisma I/O ONLY. Reference-data CRUD for
// materials, moved verbatim from the legacy `image-session-services.js` service.
import prisma from "../../../infra/prisma/prisma.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { imageSessionsMessagesCodes } from "@dms/shared";
import {
  createTextAndConnect,
  deserializeTemplatesDeep,
} from "../image-sessions.helpers.js";
import { createAListOfText, editAListOftext } from "./text.repo.js";

export async function getMaterials({ notArchived }) {
  const where = {};
  if (notArchived) {
    where.isArchived = false;
  }
  const rows = await prisma.material.findMany({
    where,
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
    },
  });
  return deserializeTemplatesDeep(rows);
}

export async function createMaterial({ data }) {
  const titles = Object.values(data.titles);
  const descriptions = Object.values(data.descriptions);
  if (!data.templateId) {
    throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_TEMPLATE_REQUIRED, statusCode: 400 });
  }
  if (!data.titles || titles.length === 0) {
    throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_FIELDS_REQUIRED, statusCode: 400 });
  }

  const titlesToCreate = createTextAndConnect(titles, "text");
  let descriptionsToCreate = createTextAndConnect(descriptions, "content");

  const dataToSubmit = {
    templateId: Number(data.templateId),
    title: {
      create: titlesToCreate,
    },
  };
  if (descriptionsToCreate && descriptionsToCreate.length > 0) {
    dataToSubmit.description = {
      create: descriptionsToCreate,
    };
  }
  if (data.imageUrl) {
    dataToSubmit.imageUrl = data.imageUrl;
  }
  const newMaterial = await prisma.material.create({
    data: dataToSubmit,
  });
  return newMaterial;
}

export async function editMaterial({ data, materialId }) {
  const translations = data.translations;
  const dataToSubmit = {};
  if (data.templateId) {
    dataToSubmit.templateId = data.templateId;
  }
  if (data.imageUrl) {
    dataToSubmit.imageUrl = data.imageUrl;
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
    await prisma.material.update({
      where: {
        id: Number(materialId),
      },
      data: dataToSubmit,
    });
  }
  if (translations.creates.titles) {
    await createAListOfText({
      creates: translations.creates.titles,
      id: materialId,
      modelId: "materialId",
      type: "TITLE",
    });
  }
  if (translations.creates.descriptions) {
    await createAListOfText({
      creates: translations.creates.descriptions,
      id: materialId,
      modelId: "materialId",
      type: "DESCRIPTION",
    });
  }
  return true;
}
