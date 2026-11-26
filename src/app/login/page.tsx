"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";

function safeReturnPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export default function LoginPage() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      if (result?.error || !result?.url) {
        setError("Sai tài khoản hoặc mật khẩu, vui lòng nhập lại.");
      } else {
        window.location.assign(result.url);
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
          <div className="account-password-field">
            <label htmlFor="login-password">Mật khẩu</label>
            <div className="password-input-wrap">
              <input
                autoComplete="current-password"
                id="login-password"
                name="password"
                required
                type={showPassword ? "text" : "password"}
              />
              <button
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={showPassword}
                className="password-visibility-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  {showPassword ? (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 5.2A10.7 10.7 0 0112 5c6.4 0 10 7 10 7a14.8 14.8 0 01-3.2 4.1" />
                      <path d="M6.2 6.2A15.4 15.4 0 002 12s3.6 7 10 7a10.7 10.7 0 004.1-.8" />
                    </>
                  ) : (
                    <>
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
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
