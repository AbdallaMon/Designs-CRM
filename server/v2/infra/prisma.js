// import { PrismaClient } from "@prisma/client";

// let prisma;

// if (process.env.NODE_ENV === "production") {
//   prisma = new PrismaClient();
// } else {
//   if (!globalThis.__v2Prisma) {
//     globalThis.__v2Prisma = new PrismaClient();
//   }

//   prisma = globalThis.__v2Prisma;
// }

// export default prisma;
import prisma from "../../prisma/prisma.js";

export default prisma;
