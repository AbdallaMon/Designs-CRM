// image-sessions/admin style repository — Prisma I/O ONLY. Reference-data CRUD for styles,
// moved verbatim from the legacy `image-session-services.js` service.
import prisma from "../../../infra/prisma/prisma.js";
import {
  createTextAndConnect,
  deserializeTemplatesDeep,
} from "../image-sessions.helpers.js";
import { createAListOfText, editAListOftext } from "./text.repo.js";

export async function getStyles({ notArchived }) {
  const where = {};
  if (notArchived) {
    where.isArchived = false;
  }
  const rows = await prisma.style.findMany({
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

export async function createStyle({ data }) {
  const titles = Object.values(data.titles);
  const descriptions = Object.values(data.descriptions);
  if (!data.templateId) {
    throw new Error("Please select a template");
  }
  if (!data.titles || titles.length === 0) {
    throw new Error("Please Fill all data.");
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
  const newStyle = await prisma.style.create({
    data: dataToSubmit,
  });
  return newStyle;
}

export async function editStyle({ data, styleId }) {
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
    await prisma.style.update({
      where: {
        id: Number(styleId),
      },
      data: dataToSubmit,
    });
  }
  if (translations.creates.titles) {
    await createAListOfText({
      creates: translations.creates.titles,
      id: styleId,
      modelId: "styleId",
      type: "TITLE",
    });
  }
  if (translations.creates.descriptions) {
    await createAListOfText({
      creates: translations.creates.descriptions,
      id: styleId,
      modelId: "styleId",
      type: "DESCRIPTION",
    });
  }
  return true;
}
