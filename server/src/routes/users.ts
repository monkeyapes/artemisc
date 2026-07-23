import { FastifyInstance } from "fastify";

export async function userRoutes(app: FastifyInstance) {
  app.get("/search", async (request) => {
    const query = (request.query as any).q || "";
    const users = await app.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { displayName: { contains: query } },
        ],
        NOT: { id: request.userId },
      },
      select: { id: true, username: true, displayName: true, avatarUrl: true, online: true },
      take: 20,
    });
    return { users };
  });

  app.get<{ Params: { id: string } }>("/:id", async (request) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.params.id },
      select: { id: true, username: true, displayName: true, avatarUrl: true, online: true, lastSeen: true },
    });
    if (!user) throw { statusCode: 404, message: "User not found" };
    return { user };
  });

  app.patch("/profile", async (request) => {
    const { displayName, avatarUrl } = request.body as any;
    const user = await app.prisma.user.update({
      where: { id: request.userId },
      data: { ...(displayName && { displayName }), ...(avatarUrl && { avatarUrl }) },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });
    return { user };
  });

  app.post("/fcm-token", async (request) => {
    const { fcmToken } = request.body as any;
    await app.prisma.user.update({
      where: { id: request.userId },
      data: { fcmToken },
    });
    return { ok: true };
  });
}
