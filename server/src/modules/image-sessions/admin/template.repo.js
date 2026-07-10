// image-sessions/admin template repository — Prisma I/O ONLY. Reference-data CRUD for
// templates, moved verbatim from the legacy `image-session-services.js` service.
import prisma from "../../../infra/prisma/prisma.js";
import {
  serializeTemplateForWrite,
  deserializeTemplatesDeep,
} from "../image-sessions.helpers.js";

export async function getTemplates({ type }) {
  return deserializeTemplatesDeep(
    await prisma.template.findMany({
      where: {
        type,
      },
    })
  );
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
      ...serializeTemplateForWrite(template),
    },
  });
  return true;
}

export async function updateTemplate({ template }) {
  const data = serializeTemplateForWrite(template);
  const id = data.id;
  delete data.id;
  await prisma.template.update({
    where: {
      id: Number(id),
    },
    data: {
      ...data,
    },
  });
  return true;
}
