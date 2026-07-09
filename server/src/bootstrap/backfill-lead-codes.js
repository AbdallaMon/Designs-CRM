// One-off maintenance BATCH (NOT a runtime layer): (re)compute the per-client
// `ClientLead.code` sequence. Ported VERBATIM from the former
// leads/legacy/client-leads-service.js `backfillLeadCodes`. It groups leads by client,
// derives the stable `<oldest-id>.<seq>` code, and writes updates in batched
// `$transaction`s. Kept out of the layered module (it is a batch script, like
// backfill-profiles.js) and not wired into boot — invoke it explicitly when needed.
import prisma from "../infra/prisma/prisma.js";

export async function backfillLeadCodes({
  rewriteAll = false,
  limitClientIds = null,
} = {}) {
  let processedClients = 0;
  let updatedLeads = 0;

  const groups = await prisma.clientLead.groupBy({ by: ["clientId"] });
  const clientIds =
    Array.isArray(limitClientIds) && limitClientIds.length
      ? limitClientIds
      : groups.map((g) => g.clientId);

  const pad7 = (n) => String(n).padStart(7, "0");

  for (const clientId of clientIds) {
    const leads = await prisma.clientLead.findMany({
      where: { clientId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, code: true, createdAt: true },
    });

    if (!leads.length) continue;
    processedClients++;

    const baseId = leads[0].id;
    const prefix = pad7(baseId);

    const taken = new Set();
    if (!rewriteAll) {
      for (const l of leads) {
        if (typeof l.code === "string") {
          const [p, s] = l.code.split(".");
          const idx = Number(s);
          if (p === prefix && Number.isInteger(idx) && idx > 0) taken.add(idx);
        }
      }
    }

    const ops = [];
    let nextIdx = 1;

    for (let pos = 0; pos < leads.length; pos++) {
      const lead = leads[pos];

      const targetIdx = rewriteAll
        ? pos + 1
        : (() => {
            while (taken.has(nextIdx)) nextIdx++;
            return nextIdx++;
          })();

      const targetCode = `${prefix}.${targetIdx}`;

      if (rewriteAll) {
        if (lead.code !== targetCode) {
          ops.push(
            prisma.clientLead.update({
              where: { id: lead.id },
              data: { code: targetCode },
            })
          );
          updatedLeads++;
        }
      } else {
        if (!lead.code) {
          ops.push(
            prisma.clientLead.update({
              where: { id: lead.id },
              data: { code: targetCode },
            })
          );
          updatedLeads++;
          taken.add(targetIdx);
        }
      }
    }

    if (ops.length) {
      const BATCH = 500;
      for (let i = 0; i < ops.length; i += BATCH) {
        await prisma.$transaction(ops.slice(i, i + BATCH));
      }
    }
  }

  return { processedClients, updatedLeads };
}
