import { FastifyInstance } from "fastify";
import { createDirectChat, createGroupChat, getUserChats } from "../services/chat.js";

export async function chatRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const chats = await getUserChats(app.prisma, request.userId);
    return { chats };
  });

  app.post("/direct", async (request, reply) => {
    const chat = await createDirectChat(app.prisma, request.userId, request.body as any);
    return { chat };
  });

  app.post("/group", async (request, reply) => {
    const chat = await createGroupChat(app.prisma, request.userId, request.body as any);
    return { chat };
  });

  app.get<{ Params: { id: string } }>("/:id", async (request) => {
    const chat = await app.prisma.chat.findUnique({
      where: { id: request.params.id },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true, online: true, lastSeen: true } },
          },
        },
      },
    });
    if (!chat) throw { statusCode: 404, message: "Chat not found" };
    return { chat };
  });

  app.post<{ Params: { id: string } }>("/:id/members", async (request) => {
    const { userIds } = request.body as any;
    const chat = await app.prisma.chat.findUnique({ where: { id: request.params.id } });
    if (!chat?.isGroup) throw { statusCode: 400, message: "Not a group chat" };

    for (const userId of userIds) {
      await app.prisma.groupMember.upsert({
        where: { chatId_userId: { chatId: request.params.id, userId } },
        update: {},
        create: { chatId: request.params.id, userId, role: "member" },
      });
    }
    return { ok: true };
  });

  app.delete<{ Params: { id: string; userId: string } }>("/:id/members/:userId", async (request) => {
    await app.prisma.groupMember.delete({
      where: { chatId_userId: { chatId: request.params.id, userId: request.params.userId } },
    });
    return { ok: true };
  });
}
