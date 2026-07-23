import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "url";
import { dirname, join, resolve, extname } from "path";
import { readFileSync, existsSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/users.js";
import { chatRoutes } from "./routes/chats.js";
import { messageRoutes } from "./routes/messages.js";
import { contactRoutes } from "./routes/contacts.js";
import { wsPlugin } from "./plugins/websocket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
  interface FastifyRequest {
    userId: string;
  }
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

export async function buildApp() {
  const prisma = new PrismaClient();

  const app = Fastify({ logger: true });

  app.decorate("prisma", prisma);

  await app.register(cors, { origin: true });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  });

  const uploadsDir = join(__dirname, "..", "uploads");
  if (existsSync(uploadsDir)) {
    await app.register(fastifyStatic, {
      root: uploadsDir,
      prefix: "/uploads/",
    });
  } else {
    console.log("Uploads directory not found, skipping /uploads/ static route");
  }

  app.decorateRequest("userId", "");

  app.addHook("onRequest", async (request) => {
    if (
      request.url === "/" ||
      request.url.startsWith("/api/auth") ||
      request.url.startsWith("/uploads") ||
      request.url.startsWith("/assets/") ||
      request.url.startsWith("/favicon") ||
      request.url === "/ws" ||
      request.url === "/health"
    ) {
      return;
    }
    try {
      const token = request.headers.authorization?.replace("Bearer ", "");
      if (!token) throw new Error("No token");
      const decoded = await request.jwtVerify();
      request.userId = (decoded as { id: string }).id;
    } catch {
      throw { statusCode: 401, message: "Unauthorized" };
    }
  });

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(userRoutes, { prefix: "/api/users" });
  await app.register(chatRoutes, { prefix: "/api/chats" });
  await app.register(messageRoutes, { prefix: "/api/messages" });
  await app.register(contactRoutes, { prefix: "/api/contacts" });
  await app.register(wsPlugin);

  const clientDist = resolve(__dirname, "..", "..", "client", "dist");
  if (existsSync(clientDist)) {
    app.get("/*", (request, reply) => {
      let url = request.url.split("?")[0];
      if (url === "/") url = "/index.html";
      const filePath = join(clientDist, url);
      if (existsSync(filePath)) {
        const ext = extname(filePath);
        reply.type(MIME_TYPES[ext] || "application/octet-stream");
        return reply.send(readFileSync(filePath));
      }
      const indexPath = join(clientDist, "index.html");
      reply.type("text/html");
      return reply.send(readFileSync(indexPath));
    });
    console.log("Serving client from", clientDist);
  }

  return app;
}
