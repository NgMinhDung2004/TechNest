import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();

const adminConfig = z.object({
  ADMIN_EMAIL: z.string().trim().email().transform((email) => email.toLowerCase()),
  ADMIN_NAME: z.string().trim().min(1).max(100),
  ADMIN_PASSWORD: z
    .string()
    .min(8)
    .max(72)
    .refine((password) => Buffer.byteLength(password, "utf8") <= 72),
});

async function main() {
  const parsed = adminConfig.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Set valid ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD in .env: ${parsed.error.issues
        .map((issue) => issue.path.join("."))
        .join(", ")}`,
    );
  }

  const { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = parsed.data;
  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN", isActive: true },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "ADMIN",
    },
    select: { email: true },
  });

  console.log(`Admin account is ready for ${user.email}.`);
}

main()
  .catch((error: unknown) => {
    console.error("Admin account setup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
