import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import CheckoutForm from "@/components/CheckoutForm";
import { getCurrentUser } from "@/lib/authz";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main className="checkout-page"><p>Đang tải thanh toán...</p></main>}>
      <CheckoutContent />
    </Suspense>
  );
}

async function CheckoutContent() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=%2Fcheckout");
  return <CheckoutForm name={user.name} />;
}
