import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/authz";
import { categoryInputSchema } from "@/lib/admin-validation";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = categoryInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Thông tin danh mục không hợp lệ." }, { status: 400 });
  }

  try {
    await prisma.category.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Danh mục không tồn tại." }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Tên hoặc đường dẫn danh mục đã tồn tại." }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, _count: { select: { products: true } } },
  });
  if (!category) return NextResponse.json({ error: "Danh mục không tồn tại." }, { status: 404 });
  if (category._count.products > 0) {
    return NextResponse.json({ error: "Không thể xóa danh mục còn sản phẩm." }, { status: 409 });
  }

  try {
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "Danh mục đang được sử dụng." }, { status: 409 });
    }
    throw error;
  }
}
