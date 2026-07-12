import prisma from "../../../infra/prisma/prisma.js";

export async function ensureLanguagesExist() {
  const existingLanguages = await prisma.language.findMany();

  if (existingLanguages.length === 0) {
    await prisma.language.createMany({
      data: [
        { code: "en", name: "English" },
        { code: "ar", name: "العربية" },
      ],
    });
  }
}

export async function getLanguages({ notArchived }) {
  await ensureLanguagesExist();
  const where = {};
  if (notArchived) {
    where.isArchived = false;
  }

  return await prisma.language.findMany({
    where,
  });
}
