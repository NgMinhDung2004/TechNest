import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/authz";
import { categoryInputSchema } from "@/lib/admin-validation";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const body: unknown = await request.json().catch(() => null);
  const parsed = categoryInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Thông tin danh mục không hợp lệ." }, { status: 400 });
  }

  try {
    const category = await prisma.category.create({ data: parsed.data, select: { id: true } });
    return NextResponse.json({ id: category.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Tên hoặc đường dẫn danh mục đã tồn tại." }, { status: 409 });
    }
    throw error;
  }
}
