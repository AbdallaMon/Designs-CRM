// image-sessions shared helpers — PURE (no Prisma, no I/O). Multilingual text-payload
// builders and pro/con key resolvers extracted verbatim from the legacy
// `image-session-services.js` service so the per-entity admin repos can share them without
// duplicating Prisma logic. The DB-touching text helpers live in `admin/text.repo.js`.

export function createTextAndConnect(texts, key = "text") {
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

export function getProAndConKey(type) {
  return type === "MATERIAL" ? "materialId" : "styleId";
}

export function getProAndConItemKey(itemType) {
  return itemType === "PRO" ? "pro" : "con";
}
