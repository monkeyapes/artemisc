import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const sendMessageSchema = z.object({
  chatId: z.string(),
  content: z.string().optional(),
  type: z.enum(["text", "image", "file", "system"]).default("text"),
  mediaUrl: z.string().optional(),
  mediaType: z.string().optional(),
  replyToId: z.string().optional(),
});

export async function sendMessage(
  prisma: PrismaClient,
  senderId: string,
  input: z.infer<typeof sendMessageSchema>
) {
  const data = sendMessageSchema.parse(input);

  const member = await prisma.groupMember.findUnique({
    where: { chatId_userId: { chatId: data.chatId, userId: senderId } },
  });
  if (!member) throw { statusCode: 403, message: "Not a member of this chat" };

  const message = await prisma.message.create({
    data: {
      chatId: data.chatId,
      senderId,
      content: data.content,
      type: data.type,
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
    data: { messageId: message.id, userId: senderId, status: "read" },
  });

  return message;
}

export async function getChatMessages(
  prisma: PrismaClient,
  chatId: string,
  userId: string,
  cursor?: string,
  limit = 50
) {
  const member = await prisma.groupMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
  });
  if (!member) throw { statusCode: 403, message: "Not a member of this chat" };

  const where: any = { chatId };
  if (cursor) {
    where.id = { lt: cursor };
  }

  return prisma.message.findMany({
    where,
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      readBy: { include: { user: { select: { id: true, username: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markAsRead(
  prisma: PrismaClient,
  messageId: string,
  userId: string
) {
  return prisma.readReceipt.upsert({
    where: { messageId_userId: { messageId, userId } },
    update: { status: "read", readAt: new Date() },
    create: { messageId, userId, status: "read" },
  });
}
