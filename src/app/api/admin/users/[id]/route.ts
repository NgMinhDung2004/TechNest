import { Prisma, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  role: z.enum(["CUSTOMER", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
}).refine((value) => value.role !== undefined || value.isActive !== undefined);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Vai trò không hợp lệ." }, { status: 400 });
  if (id === guard.user.id && (parsed.data.role === UserRole.CUSTOMER || parsed.data.isActive === false)) {
    return NextResponse.json({ error: "Không thể tự hạ quyền hoặc khóa tài khoản admin của chính mình." }, { status: 409 });
  }

  const outcome = await prisma.$transaction(
    async (transaction) => {
      const target = await transaction.user.findUnique({
        where: { id },
        select: { role: true, isActive: true },
      });
      if (!target) return "not-found";
      const nextRole = parsed.data.role ?? target.role;
      const nextIsActive = parsed.data.isActive ?? target.isActive;
      if (target.role === nextRole && target.isActive === nextIsActive) return "unchanged";

      if (
        target.role === UserRole.ADMIN
        && target.isActive
        && (nextRole === UserRole.CUSTOMER || !nextIsActive)
      ) {
        const admins = await transaction.user.count({
          where: { role: UserRole.ADMIN, isActive: true },
        });
        if (admins <= 1) return "last-admin";
      }

      await transaction.user.update({
        where: { id },
        data: { role: nextRole, isActive: nextIsActive },
      });
      return "updated";
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  if (outcome === "not-found") return NextResponse.json({ error: "Tài khoản không tồn tại." }, { status: 404 });
  if (outcome === "last-admin") return NextResponse.json({ error: "Phải luôn có ít nhất một admin." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
