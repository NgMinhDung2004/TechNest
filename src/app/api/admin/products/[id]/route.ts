import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/authz";
import { productInputSchema, productSlug } from "@/lib/admin-validation";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Thông tin sản phẩm không hợp lệ." }, { status: 400 });
  }
  if (!(await prisma.category.findUnique({ where: { id: parsed.data.categoryId }, select: { id: true } }))) {
    return NextResponse.json({ error: "Danh mục không tồn tại." }, { status: 400 });
  }

  try {
    await prisma.product.update({
      where: { id },
      data: { ...parsed.data, slug: productSlug(parsed.data.name, parsed.data.sku) },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Sản phẩm không tồn tại." }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "SKU hoặc slug sản phẩm đã tồn tại." }, { status: 409 });
    }
    throw error;
  }
}
