// src/config/prisma.js
// Singleton Prisma client — prevents exhausting DB connections via hot-reload
// duplicate instantiation in dev.
const { PrismaClient } = require("@prisma/client");
const { isProd } = require("./env");

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: isProd ? ["error", "warn"] : ["error", "warn", "query"],
  });

if (!isProd) globalForPrisma.prisma = prisma;

module.exports = prisma;
