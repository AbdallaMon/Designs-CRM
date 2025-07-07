import prisma from "../../../prisma/prisma.js";
import { v4 as uuidv4 } from "uuid";

function createTextAndConnect(texts, key = "text") {
  let result = [];

  texts.forEach((item) => {
    if (!item.text || item.text.length === 0) return;
    result.push({
      [key]: item.text,
      language: {
        connect: {
          id: item.langId,
        },
      },
    });
  });
  return result;
}
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
  const titlesToCreate = createTextAndConnect(titles, "text");
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
  console.log(data, "data");
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
          content: entry.text || entry.content,
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
          content: entry.text || entry.content,
        },
      });
    });
  }
  return true;
}

export async function getTemplates({ type }) {
  return await prisma.template.findMany({
    where: {
      type,
    },
  });
}

export async function getTemplatesIds({ type }) {
  return await prisma.template.findMany({
    where: {
      type,
    },
    select: {
      id: true,
    },
  });
}
export async function createTemplate({ template }) {
  await prisma.template.create({
    data: {
      ...template,
    },
  });
  return true;
}

export async function updateTemplate({ template }) {
  const id = template.id;
  delete template.id;
  await prisma.template.update({
    where: {
      id: Number(id),
    },
    data: {
      ...template,
    },
  });
  return true;
}

export async function getMaterials({ notArchived }) {
  const where = {};
  if (notArchived) {
    where.isArchived = false;
  }
  return await prisma.material.findMany({
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
}

export async function createMaterial({ data }) {
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

export async function getStyles({ notArchived }) {
  const where = {};
  if (notArchived) {
    where.isArchived = false;
  }
  return await prisma.style.findMany({
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
function getProAndConKey(type) {
  return type === "MATERIAL" ? "materialId" : "styleId";
}
function getProAndConItemKey(itemType) {
  return itemType === "PRO" ? "pro" : "con";
}
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
    throw new Error("Please Fill all data.");
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
    throw new Error("Please Fill all data.");
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

export async function getColors({ notArchived }) {
  const where = {};
  if (notArchived) {
    where.isArchived = false;
  }
  return await prisma.colorPattern.findMany({
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
}

export async function createColorPallete({ data }) {
  const titles = Object.values(data.titles);
  const descriptions = Object.values(data.descriptions);
  if (!data.colors || data.colors.length === 0) {
    throw new Error("Please add colors.");
  }
  if (!data.templateId) {
    throw new Error("Please select a template");
  }
  if (!data.titles || titles.length === 0) {
    throw new Error("Please Fill all data.");
  }
  console.log(data.fullWidth, "full");

  const titlesToCreate = createTextAndConnect(titles, "text");
  let descriptionsToCreate = createTextAndConnect(descriptions, "content");

  const dataToSubmit = {
    templateId: Number(data.templateId),
    title: {
      create: titlesToCreate,
    },
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
  console.log(data, "data");
  const dataToSubmit = {};
  if (data.templateId) {
    dataToSubmit.templateId = data.templateId;
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

// images
export async function getDesignImages({ notArchived }) {
  const where = {};
  if (notArchived) {
    where.isArchived = false;
  }
  return await prisma.designImage.findMany({
    where,
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
        },
      },
    },
  });
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

// page info
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
  console.log(data, "data");

  return data;
}

export async function createPageInfo({ data }) {
  const titles = Object.values(data.titles);
  const descriptions = Object.values(data.descriptions);
  if (!data.type) {
    throw new Error("Please select a type");
  }
  if (!data.titles || titles.length === 0) {
    throw new Error("Please Fill all titles.");
  }
  if (!data.descriptions || descriptions.length === 0) {
    throw new Error("Please Fill all descripitons.");
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

// user

export async function getClientImageSessions(clientLeadId) {
  const sessions = await prisma.clientImageSession.findMany({
    where: { clientLeadId: Number(clientLeadId) },
    include: {
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
                },
              },
            },
          },
        },
      },
      selectedImages: {
        include: {
          designImage: true,
        },
      },
      material: {
        select: {
          id: true,
          title: {
            select: {
              text: true,
              id: true,
              languageId: true,
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
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return sessions;
}

export async function createClientImageSession({
  clientLeadId,
  userId,
  selectedSpaceIds,
}) {
  if (!selectedSpaceIds || selectedSpaceIds.length === 0) {
    throw new Error("At least one space must be selected");
  }

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

  if (!session) throw new Error("Session not found");

  const newToken = uuidv4();

  const updated = await prisma.clientImageSession.update({
    where: { id: sessionId },
    data: {
      token: newToken,
    },
  });

  return {
    token: updated.token,
    url: `${process.env.OLDORIGIN}/image-session?token=${updated.token}`,
  };
}

export async function deleteInProgressSession(sessionId) {
  const session = await prisma.clientImageSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) throw new Error("Session not found");
  if (session.sessionStatus !== "INITIAL") {
    throw new Error("Only sessions that are in initial can be deleted");
  }

  await prisma.clientImageSession.delete({
    where: { id: sessionId },
  });

  return { message: "Deleted succssfully" };
}

// client
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
      selectedImages: {
        include: {
          designImage: true,
        },
      },
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
    throw new Error("Session not found or expired");
  }

  return session;
}

export async function changeSessionStatus({ token, id, sessionStatus }) {
  const key = token ? "token" : "id";
  const keyId = token || Number(id);

  return await prisma.clientImageSession.update({
    where: {
      [key]: keyId,
    },
    data: {
      sessionStatus,
    },
  });
}

export async function getColorsByLng({ lng }) {
  const where = {};
  where.isArchived = false;
  const lngWhere = {};
  if (lng) {
    lngWhere.language = {
      code: lng,
    };
  }
  return await prisma.colorPattern.findMany({
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
}

export async function saveClientSelectedColor({
  selectedColor,
  session,
  customColors,
  status,
}) {
  console.log(selectedColor, "selectedColor");
  return await prisma.clientImageSession.update({
    where: {
      id: Number(session.id),
    },
    data: {
      colorPatternId: selectedColor.id,
      customColors: customColors?.map((color) => color.colorHex),
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

  return await prisma.material.findMany({
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
}

export async function saveClientSelectedMaterial({
  selectedMaterial,
  session,
  status,
}) {
  return await prisma.clientImageSession.update({
    where: {
      id: Number(session.id),
    },
    data: {
      materialId: selectedMaterial.id,
      sessionStatus: status,
    },
  });
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

  return await prisma.style.findMany({
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
  console.log(session, "session");
  console.log(selectedImages, "selectedImages");

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
