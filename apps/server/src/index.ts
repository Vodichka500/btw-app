import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { renderTrpcPanel } from "trpc-panel"; // 1. Импортируем панель
import { auth } from "./lib/auth";
import { createContext } from "./trpc";
import { appRouter } from "./routers/root";

const server = Fastify({ logger: true });

server.register(cors, { origin: true, credentials: true });

// Better Auth
server.all("/api/auth/*", async (req, _reply) => {
  const protocol = req.protocol.endsWith(":")
    ? req.protocol
    : `${req.protocol}:`;
  const fullUrl = `${protocol}//${req.hostname}${req.url}`;

  const webReq = new Request(fullUrl, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body:
      req.method !== "GET" && req.method !== "HEAD"
        ? JSON.stringify(req.body)
        : undefined,
  });

  const res = await auth.handler(webReq);
  return res;
});

// tRPC
server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: { router: appRouter, createContext },
});

server.get("/docs", async (_req, reply) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  return reply.type("text/html").send(
    renderTrpcPanel(appRouter, {
      url: `${baseUrl}/trpc`, // 🔥 Добавили /trpc вот сюда!
      transformer: "superjson",
    }),
  );
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: "0.0.0.0" });
    console.log("🚀 Server is running on http://localhost:3000");
    console.log("📝 Documentation available at http://localhost:3000/docs");
  } catch (err) {
    process.exit(1);
  }
};

start();

export type { AppRouter } from "./routers/root";
export { auth } from "./lib/auth.js";