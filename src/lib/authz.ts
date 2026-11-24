import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  return user?.isActive ? user : null;
}

export async function getCurrentAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}

export async function requireAdminApi() {
  const user = await getCurrentUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Đăng nhập để tiếp tục." }, { status: 401 }) };
  }
  if (user.role !== "ADMIN") {
    return { response: NextResponse.json({ error: "Bạn không có quyền thực hiện thao tác này." }, { status: 403 }) };
  }
  return { user };
}
