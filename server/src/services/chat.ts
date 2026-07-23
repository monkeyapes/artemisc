import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const createChatSchema = z.object({
  participantIds: z.array(z.string()).min(1).max(1),
});

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  participantIds: z.array(z.string()).min(1),
});

export async function createDirectChat(
  prisma: PrismaClient,
  userId: string,
  input: z.infer<typeof createChatSchema>
) {
  const { participantIds } = createChatSchema.parse(input);
  const otherId = participantIds[0];

  const existing = await prisma.chat.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: otherId } } },
      ],
    },
  });
  if (existing) return existing;

  const chat = await prisma.chat.create({
    data: {
      members: {
        create: [
          { userId, role: "admin" },
          { userId: otherId, role: "member" },
        ],
      },
    },
    include: {
      members: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, online: true, lastSeen: true } } } },
      messages: { take: 50, orderBy: { createdAt: "desc" }, include: { sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
    },
  });

  return chat;
}

export async function createGroupChat(
  prisma: PrismaClient,
  userId: string,
  input: z.infer<typeof createGroupSchema>
) {
  const { name, participantIds } = createGroupSchema.parse(input);
  const allIds = [...new Set([userId, ...participantIds])];

  const chat = await prisma.chat.create({
    data: {
      isGroup: true,
      name,
      members: {
        create: allIds.map((id) => ({
          userId: id,
          role: id === userId ? "admin" : "member",
        })),
      },
    },
    include: {
      members: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, online: true, lastSeen: true } } } },
    },
  });

  return chat;
}

export async function getUserChats(prisma: PrismaClient, userId: string) {
  return prisma.chat.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, online: true, lastSeen: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });
}
