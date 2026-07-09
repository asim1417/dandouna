import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7: إعداد الاتصال ومحوّل pg خارج المخطط
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // يُقرأ رابط الاتصال من متغيّر البيئة DATABASE_URL
    url: process.env.DATABASE_URL,
  },
});
