import "server-only";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 * Di development, hot-reload Next.js membuat modul dievaluasi ulang; tanpa
 * cache di globalThis, setiap reload membuka koneksi baru hingga habis.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
