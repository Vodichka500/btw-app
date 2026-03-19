import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "./src/generated/client/client.js";

const connectionString = process.env.DATABASE_URL; 

if (!connectionString) {
  throw new Error("❌ CRITICAL: Missing DATABASE_URL environment variable!");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const db = new PrismaClient({ adapter });

export { db, Prisma }; // Отдаем наружу клиент и утилиты
