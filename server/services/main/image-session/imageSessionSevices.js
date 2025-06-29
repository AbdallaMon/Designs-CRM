import prisma from "../../../prisma/prisma.js";

export async function getSpaces({ notArchived }) {
  const where = {};
  if (notArchived) {
    where.isArchived = false;
  }
  return await prisma.space.findMany({
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
    },
  });
}

export async function createSpace({ data }) {
  const titles = Object.values(data.titles);
  if (!data.titles || titles.length === 0) {
    throw new Error("Please Fill all data.");
  }
  const titlesToCreate = titles.map((title) => ({
    text: title.text,
    language: {
      connect: {
        id: title.langId,
      },
    },
  }));
  const newSpace = await prisma.space.create({
    data: {
      title: {
        create: titlesToCreate,
      },
    },
  });
  return newSpace;
}

export async function updateSpace({ data, spaceId }) {
  const { edits = {}, creates = {} } = data;

  const titles = Object.values(data.titles);
  if (!data.titles || titles.length === 0) {
    throw new Error("Please Fill all data.");
  }

  await editAListOftext({ edits, type: "TITLE" });

  await createAListOfText({
    creates,
    id: spaceId,
    modelId: "spaceId",
    type: "TITLE",
  });

  return true;
}

export async function createAListOfText({ creates, type, modelId, id }) {
  if (type === "TITLE") {
    Object.values(creates).map(async (entry) => {
      return await prisma.textShort.create({
        data: {
          text: entry.text,
          languageId: entry.languageId,
          [modelId]: Number(id),
        },
      });
    });
  } else {
    Object.values(creates).map(async (entry) => {
      return await prisma.textLong.create({
        data: {
          content: entry.text,
          languageId: entry.languageId,
          [modelId]: Number(id),
        },
      });
    });
  }
  return true;
}

export async function editAListOftext({ edits, type }) {
  if (type === "TITLE") {
    Object.values(edits).map(async (entry) => {
      return await prisma.textShort.update({
        where: { id: entry.id },
        data: {
          text: entry.text,
        },
      });
    });
  } else {
    Object.values(edits).map(async (entry) => {
      return await prisma.textLong.update({
        where: { id: entry.id },
        data: {
          text: entry.text,
        },
      });
    });
  }
  return true;
}
