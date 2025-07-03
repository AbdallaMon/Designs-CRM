import prisma from "../../../prisma/prisma.js";

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
  console.log(template, "template in createTemplate");
  await prisma.template.create({
    data: {
      ...template,
    },
  });
  return true;
}

export async function updateTemplate({ template }) {
  console.log(template, "template in updateTemplate");

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
  console.log(dataToSubmit, "dataToSubmit");
  if (Object.keys(dataToSubmit).length > 0) {
    await prisma.material.update({
      where: {
        id: Number(materialId),
      },
      data: dataToSubmit,
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
  if (Object.keys(dataToSubmit).length > 0) {
    await prisma.style.update({
      where: {
        id: Number(styleId),
      },
      data: dataToSubmit,
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
export async function getConsAndPros({ id, type, lngId }) {
  const key = getProAndConKey(type);
  const textWhere = {};
  if (lngId) {
    textWhere.id = Number(lngId);
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
