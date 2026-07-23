import { FastifyInstance } from "fastify";
import { registerUser, loginUser } from "../services/auth.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (request, reply) => {
    const user = await registerUser(app.prisma, request.body as any);
    const token = app.jwt.sign({ id: user.id });
    return { user, token };
  });

  app.post("/login", async (request, reply) => {
    const user = await loginUser(app.prisma, request.body as any);
    const token = app.jwt.sign({ id: user.id });
    return { user, token };
  });

  app.get("/me", async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace("Bearer ", "");
      if (!token) throw new Error("No token");
      const decoded = app.jwt.verify(token) as { id: string };
      const user = await app.prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, username: true, displayName: true, avatarUrl: true, online: true, lastSeen: true, createdAt: true },
      });
      return { user };
    } catch {
      throw { statusCode: 401, message: "Unauthorized" };
    }
  });
}
