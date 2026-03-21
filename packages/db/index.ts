import { PrismaClient, Prisma } from "./src/generated/client/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;


//console.log("🚀 [DB INIT] Connection String:", connectionString);

if (!connectionString) {
  throw new Error("❌ CRITICAL: Missing DATABASE_URL environment variable!");
}

const adapter = new PrismaPg({
  connectionString
});

const db = new PrismaClient({ adapter });

export { db, Prisma };