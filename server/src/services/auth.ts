import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).max(30),
  displayName: z.string().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export async function registerUser(prisma: PrismaClient, input: RegisterInput) {
  const data = registerSchema.parse(input);
  const hashed = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      displayName: data.displayName || data.username,
      password: hashed,
    },
  });

  return { id: user.id, email: user.email, username: user.username };
}

export async function loginUser(prisma: PrismaClient, input: LoginInput) {
  const data = loginSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw { statusCode: 401, message: "Invalid credentials" };

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) throw { statusCode: 401, message: "Invalid credentials" };

  return { id: user.id, email: user.email, username: user.username };
}
