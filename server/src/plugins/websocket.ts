import { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

interface AuthenticatedSocket {
  userId?: string;
}

export async function wsPlugin(app: FastifyInstance) {
  const io = new Server(app.server, {
    cors: { origin: "*" },
    path: "/ws",
  });

  const prisma = app.prisma;

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) return next(new Error("Auth required"));
    try {
      const decoded = app.jwt.verify(token as string) as { id: string };
      (socket as any).userId = decoded.id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = (socket as any).userId;
    console.log(`User connected: ${userId}`);

    await prisma.user.update({ where: { id: userId }, data: { online: true } });
    socket.join(userId);
    io.emit("presence:update", { userId, online: true });

    socket.on("chat:join", (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on("chat:leave", (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on("message:send", async (data: { chatId: string; content?: string; type?: string; mediaUrl?: string; mediaType?: string; replyToId?: string }) => {
      try {
        const message = await prisma.message.create({
          data: {
            chatId: data.chatId,
            senderId: userId,
            content: data.content,
            type: data.type || "text",
            mediaUrl: data.mediaUrl,
            mediaType: data.mediaType,
            replyToId: data.replyToId,
          },
          include: {
            sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          },
        });

        await prisma.chat.update({
          where: { id: data.chatId },
          data: { lastMessageId: message.id, updatedAt: new Date() },
        });

        await prisma.readReceipt.create({
          data: { messageId: message.id, userId, status: "read" },
        });

        io.to(`chat:${data.chatId}`).emit("message:new", message);
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("typing:start", (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit("typing:update", { chatId: data.chatId, userId, typing: true });
    });

    socket.on("typing:stop", (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit("typing:update", { chatId: data.chatId, userId, typing: false });
    });

    socket.on("message:read", async (data: { messageId: string; chatId: string }) => {
      try {
        await prisma.readReceipt.upsert({
          where: { messageId_userId: { messageId: data.messageId, userId } },
          update: { status: "read", readAt: new Date() },
          create: { messageId: data.messageId, userId, status: "read" },
        });
        io.to(`chat:${data.chatId}`).emit("message:readUpdate", { messageId: data.messageId, userId });
      } catch {}
    });

    // WebRTC signaling
    socket.on("signal:offer", (data: { calleeId: string; offer: any }) => {
      io.to(data.calleeId).emit("signal:incoming", { callerId: userId, offer: data.offer });
    });

    socket.on("signal:answer", (data: { callerId: string; answer: any }) => {
      io.to(data.callerId).emit("signal:answer", { calleeId: userId, answer: data.answer });
    });

    socket.on("signal:ice", (data: { peerId: string; candidate: any }) => {
      io.to(data.peerId).emit("signal:ice", { from: userId, candidate: data.candidate });
    });

    socket.on("call:start", (data: { calleeId: string; type: string; chatId?: string }) => {
      io.to(data.calleeId).emit("call:incoming", { callerId: userId, type: data.type, chatId: data.chatId });
    });

    socket.on("call:end", (data: { calleeId: string; duration?: number }) => {
      io.to(data.calleeId).emit("call:ended", { callerId: userId, duration: data.duration });
    });

    socket.on("call:missed", (data: { callerId: string }) => {
      io.to(data.callerId).emit("call:missed", { userId });
    });

    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${userId}`);
      await prisma.user.update({ where: { id: userId }, data: { online: false, lastSeen: new Date() } });
      io.emit("presence:update", { userId, online: false, lastSeen: new Date() });
    });
  });

  app.addHook("onClose", () => {
    io.close();
  });
}
