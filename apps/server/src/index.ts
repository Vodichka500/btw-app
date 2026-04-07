import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { renderTrpcPanel } from "trpc-panel"; // 1. Импортируем панель
import { auth } from "./lib/auth";
import { createContext } from "./trpc";
import { appRouter } from "./routers/root";
import { authInjectionHtml } from "./lib/trpx-panel-auth";

const server = Fastify({ logger: true });

server.register(cors, { origin: true, credentials: true });

// Better Auth
server.all("/api/auth/*", async (req, reply) => {
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
  reply.status(res.status);
  res.headers.forEach((value, key) => {
    reply.header(key, value);
  });
  const text = await res.text();
  if (!text) {
    return reply.send();
  }
  try {
    return reply.send(JSON.parse(text));
  } catch {
    return reply.send(text);
  }
});

// tRPC
server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: { router: appRouter, createContext },
});

server.get("/docs", async (_req, reply) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  // Генерируем стандартную панель
  let html = renderTrpcPanel(appRouter, {
    url: `${baseUrl}/trpc`,
    transformer: "superjson",
  });

  if (html.match(/<\/body>/i)) {
    html = html.replace(/<\/body>/i, authInjectionHtml + "\n</body>");
  } else {
    html += authInjectionHtml;
  }

  return reply.type("text/html").send(html);
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
