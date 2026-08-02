// image-sessions/admin pros-and-cons repository — Prisma I/O ONLY. Reference-data CRUD for
// the pro/con lists attached to materials & styles, moved verbatim from the legacy
// `image-session-services.js` service. `getConsAndPros` is also consumed by the public
// client flow.
import prisma from "../../../infra/prisma/prisma.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { imageSessionsMessagesCodes } from "@dms/shared";
import {
  createTextAndConnect,
  getProAndConKey,
  getProAndConItemKey,
} from "../image-sessions.helpers.js";
import { createAListOfText, editAListOftext } from "./text.repo.js";

export async function getConsAndPros({ id, type, lng, isClient }) {
  const key = getProAndConKey(type);
  const textWhere = {};
  if (lng && isClient) {
    textWhere.language = {
      code: lng,
    };
  }

  const pros = await prisma.pro.findMany({
    where: {
      [key]: Number(id),
    },
    include: {
      content: {
        where: textWhere,
        select: {
          languageId: true,
          content: true,
          id: true,
          language: {
            select: {
              id: true,
              code: true,
            },
          },
        },
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  const cons = await prisma.con.findMany({
    where: {
      [key]: Number(id),
    },
    include: {
      content: {
        where: textWhere,

        select: {
          languageId: true,
          content: true,

          language: {
            select: {
              id: true,
              code: true,
            },
          },
        },
      },
    },
    orderBy: {
      order: "asc",
    },
  });
  return { pros, cons };
}

export async function createProOrCon({ type, id, item, itemType }) {
  const key = getProAndConKey(type);
  const itemKey = getProAndConItemKey(itemType);
  const descriptions = Object.values(item.descriptions);

  if (!descriptions || descriptions.length === 0) {
    throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_FIELDS_REQUIRED, statusCode: 400 });
  }
  let descriptionsToCreate = createTextAndConnect(descriptions, "content");
  const lastItem = await prisma[itemKey].findFirst({
    where: {
      [key]: Number(id),
    },
    orderBy: {
      order: "desc",
    },
    select: {
      order: true,
    },
  });
  const nextOrder = lastItem?.order != null ? lastItem.order + 1 : 0;

  const dataToSubmit = {
    [key]: Number(id),
    order: nextOrder,

    content: {
      create: descriptionsToCreate,
    },
  };

  const newItem = await prisma[itemKey].create({
    data: dataToSubmit,
  });
  return newItem;
}

export async function editProOrCon({ type, itemType, item, id }) {
  const itemKey = getProAndConItemKey(itemType);
  const { edits = {}, creates = {} } = item;
  const descriptions = Object.values(item.descriptions);
  if (!descriptions || descriptions.length === 0) {
    throw new AppError({ code: imageSessionsMessagesCodes.IMAGE_SESSION_FIELDS_REQUIRED, statusCode: 400 });
  }

  await editAListOftext({ edits, type: "DESCRIPTION" });

  await createAListOfText({
    creates,
    id: id,
    modelId: itemKey + "id",
    type: "DESCRIPTION",
  });

  return true;
}

export async function deleteProOrCon({ itemType, id }) {
  const itemKey = getProAndConItemKey(itemType);
  await prisma[itemKey].delete({
    where: {
      id: Number(id),
    },
  });
  return true;
}

export async function reorderProsAndCons({ itemType, data }) {
  const itemKey = getProAndConItemKey(itemType);
  data.forEach(async (item) => {
    await prisma[itemKey].update({
      where: {
        id: Number(item.id),
      },
      data: {
        order: item.order,
      },
    });
  });
  return true;
}
