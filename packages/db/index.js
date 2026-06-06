// @dms/db barrel — re-exports the singleton Prisma client.
// Both named (`import { prisma } from "@dms/db"`) and default
// (`import prisma from "@dms/db"`) forms are supported so existing call sites
// can migrate without churn.
export { prisma, default } from "./prisma.client.js";
