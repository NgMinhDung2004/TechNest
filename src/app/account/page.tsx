import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/authz";

export default function AccountPage() {
  return (
    <Suspense fallback={<main className="account-page"><p>Đang tải tài khoản...</p></main>}>
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent(): Promise<never> {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(user.role === "ADMIN" ? "/admin" : "/orders");
}
