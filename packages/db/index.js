"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prisma = exports.db = void 0;
var client_js_1 = require("./src/generated/client/client.js");
Object.defineProperty(exports, "Prisma", { enumerable: true, get: function () { return client_js_1.Prisma; } });
var adapter_pg_1 = require("@prisma/adapter-pg");
//const connectionString = process.env.DATABASE_URL;
var connectionString = "postgresql://root:btw_app_2025@localhost:5434/btw_db?schema=public";
console.log("🚀 [DB INIT] Connection String:", connectionString);
if (!connectionString) {
    throw new Error("❌ CRITICAL: Missing DATABASE_URL environment variable!");
}
var adapter = new adapter_pg_1.PrismaPg({
    connectionString: connectionString
});
var db = new client_js_1.PrismaClient({ adapter: adapter });
exports.db = db;
