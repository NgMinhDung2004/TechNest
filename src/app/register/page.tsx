"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Không thể tạo tài khoản. Vui lòng thử lại.");
        return;
      }

      router.push("/login");
    } catch {
      setError("Không thể kết nối. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="account-page">
      <section className="account-card">
        <p className="section-kicker">THAM GIA TECHNEST</p>
        <h1>Tạo tài khoản</h1>
        <form className="account-form" onSubmit={handleSubmit}>
          <label>
            Họ và tên
            <input autoComplete="name" maxLength={100} name="name" required />
          </label>
          <label>
            Email
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label>
            Mật khẩu
            <input autoComplete="new-password" minLength={8} name="password" required type="password" />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary" disabled={submitting} type="submit">
            {submitting ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>
        </form>
        <p className="account-alternate">
          Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
        </p>
      </section>
    </main>
  );
}
