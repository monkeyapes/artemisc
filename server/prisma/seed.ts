import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@test.com" },
    update: {},
    create: { email: "alice@test.com", username: "alice", displayName: "Alice", password },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@test.com" },
    update: {},
    create: { email: "bob@test.com", username: "bob", displayName: "Bob", password },
  });

  console.log("Seeded users:", alice.username, bob.username);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
