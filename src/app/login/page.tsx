"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
        redirectTo: safeReturnPath(new URLSearchParams(window.location.search).get("callbackUrl")),
      });

      if (result?.error) {
        setError("Email hoặc mật khẩu không chính xác.");
      } else if (result?.url) {
        window.location.assign(result.url);
      }

      function safeReturnPath(value: string | null) {
        return value?.startsWith("/") && !value.startsWith("//") ? value : "/account";
      }
    } catch {
      setError("Không thể đăng nhập lúc này. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="account-page">
      <section className="account-card">
        <p className="section-kicker">CHÀO MỪNG TRỞ LẠI</p>
        <h1>Đăng nhập</h1>
        <form className="account-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label>
            Mật khẩu
            <input autoComplete="current-password" minLength={8} name="password" required type="password" />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary" disabled={submitting} type="submit">
            {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
        <p className="account-alternate">
          Chưa có tài khoản? <Link href="/register">Đăng ký</Link>
        </p>
      </section>
    </main>
  );
}
