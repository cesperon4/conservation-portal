import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.js";

export function createTestPrisma() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for integration tests");

  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter, log: ["error"] });
}
