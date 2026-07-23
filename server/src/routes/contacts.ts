import { FastifyInstance } from "fastify";

export async function contactRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const contacts = await app.prisma.contact.findMany({
      where: { userId: request.userId },
      include: {
        contact: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, online: true, lastSeen: true },
        },
      },
      orderBy: { addedAt: "desc" },
    });
    return { contacts: contacts.map((c) => c.contact) };
  });

  app.post("/add", async (request) => {
    const { contactId } = request.body as any;
    const existing = await app.prisma.contact.findUnique({
      where: { userId_contactId: { userId: request.userId, contactId } },
    });
    if (existing) throw { statusCode: 409, message: "Already a contact" };

    await app.prisma.contact.create({
      data: { userId: request.userId, contactId },
    });
    return { ok: true };
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request) => {
    await app.prisma.contact.delete({
      where: { userId_contactId: { userId: request.userId, contactId: request.params.id } },
    });
    return { ok: true };
  });
}
