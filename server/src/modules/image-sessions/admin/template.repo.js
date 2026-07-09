// image-sessions/admin template repository — Prisma I/O ONLY. Reference-data CRUD for
// templates, moved verbatim from the legacy `image-session-services.js` service.
import prisma from "../../../infra/prisma/prisma.js";

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
