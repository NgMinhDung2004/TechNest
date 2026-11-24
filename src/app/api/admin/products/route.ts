import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/authz";
import { productInputSchema, productSlug } from "@/lib/admin-validation";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const body: unknown = await request.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Thông tin sản phẩm không hợp lệ." }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) return NextResponse.json({ error: "Danh mục không tồn tại." }, { status: 400 });

  try {
    const product = await prisma.product.create({
      data: { ...parsed.data, slug: productSlug(parsed.data.name, parsed.data.sku) },
      select: { id: true },
    });
    return NextResponse.json({ id: product.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "SKU hoặc slug sản phẩm đã tồn tại." }, { status: 409 });
    }
    throw error;
  }
}
