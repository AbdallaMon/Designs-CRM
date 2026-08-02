// image-sessions/admin page-info repository — Prisma I/O ONLY. Reference-data CRUD for
// page-info blocks, moved verbatim from the legacy `image-session-services.js` service.
// `getPageInfo` (singular) is also consumed by the public client flow.
import prisma from "../../../infra/prisma/prisma.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { imageSessionsMessagesCodes } from "@dms/shared";
import { createTextAndConnect } from "../image-sessions.helpers.js";
import { createAListOfText, editAListOftext } from "./text.repo.js";

export async function getPageInfos({ notArchived, lng, type }) {
  const where = {};
  if (notArchived) {
    where.isArchived = false;
  }
  const lngWhere = {};
  if (lng) {
    lngWhere.language = {
      code: lng,
    };
  }
  if (type) {
    where.type = type;
  }
  return await prisma.pageInfo.findMany({
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
      content: {
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
    },
  });
}

export async function getPageInfo({ notArchived, lng, type }) {
  const where = {};
  if (notArchived) {
    where.isArchived = false;
  }
  const lngWhere = {};
  if (lng) {
    lngWhere.language = {
      code: lng,
    };
  }
  where.type = type;

  const data = await prisma.pageInfo.findUnique({
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
      content: {
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
    },
  });

  return data;
}

export async function createPageInfo({ data }) {
  const titles = Object.values(data.titles);
  const descriptions = Object.values(data.descriptions);
  if (!data.type) {
    throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_TYPE_REQUIRED, statusCode: 400 });
  }
  if (!data.titles || titles.length === 0) {
    throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_TITLES_REQUIRED, statusCode: 400 });
  }
  if (!data.descriptions || descriptions.length === 0) {
    throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_DESCRIPTIONS_REQUIRED, statusCode: 400 });
  }

  const titlesToCreate = createTextAndConnect(titles, "text");
  let descriptionsToCreate = createTextAndConnect(descriptions, "content");

  const dataToSubmit = {
    type: data.type,
    title: {
      create: titlesToCreate,
    },
  };
  if (descriptionsToCreate && descriptionsToCreate.length > 0) {
    dataToSubmit.content = {
      create: descriptionsToCreate,
    };
  }

  const newPageInfo = await prisma.pageInfo.create({
    data: dataToSubmit,
  });
  return newPageInfo;
}

export async function editPageInfo({ data, pageInfoId }) {
  const translations = data.translations;
  const dataToSubmit = {};
  if (data.type) {
    dataToSubmit.type = data.type;
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
    await prisma.pageInfo.update({
      where: {
        id: Number(pageInfoId),
      },
      data: dataToSubmit,
    });
  }
  if (translations.creates.titles) {
    await createAListOfText({
      creates: translations.creates.titles,
      id: pageInfoId,
      modelId: "pageInfoId",
      type: "TITLE",
    });
  }
  if (translations.creates.descriptions) {
    await createAListOfText({
      creates: translations.creates.descriptions,
      id: pageInfoId,
      modelId: "pageInfoId",
      type: "DESCRIPTION",
    });
  }
  return true;
}
