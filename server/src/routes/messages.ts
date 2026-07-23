import { FastifyInstance } from "fastify";
import { sendMessage, getChatMessages, markAsRead } from "../services/message.js";

export async function messageRoutes(app: FastifyInstance) {
  app.get<{ Params: { chatId: string } }>("/:chatId", async (request) => {
    const q = request.query as any;
    const messages = await getChatMessages(app.prisma, request.params.chatId, request.userId, q.cursor, parseInt(q.limit) || 50);
    return { messages };
  });

  app.post("/", async (request) => {
    const message = await sendMessage(app.prisma, request.userId, request.body as any);
    return { message };
  });

  app.post<{ Params: { messageId: string } }>("/read/:messageId", async (request) => {
    const receipt = await markAsRead(app.prisma, request.params.messageId, request.userId);
    return { receipt };
  });
}
