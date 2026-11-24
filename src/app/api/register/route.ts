import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  name: z.string().trim().min(1).max(100),
  password: z
    .string()
    .min(8)
    .max(72)
    .refine((password) => Buffer.byteLength(password, "utf8") <= 72),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const { email, name, password } = parsed.data;
  try {
    await prisma.user.create({
      data: { email, name, passwordHash: await bcrypt.hash(password, 10) },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email đã tồn tại" }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
