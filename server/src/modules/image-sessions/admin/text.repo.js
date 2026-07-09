// image-sessions/admin text repository — Prisma I/O ONLY. The multilingual short/long-text
// create/edit helpers shared by the space/material/style/color/page-info/pros-cons admin
// repos. Moved verbatim from the legacy `image-session-services.js` service (behavior-
// preserving); the pure, non-DB payload builders live in `../image-sessions.helpers.js`.
import prisma from "../../../infra/prisma/prisma.js";

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
