"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function LogoutButton() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    setSubmitting(true);
    setError("");
    try {
      await signOut({ redirectTo: "/" });
    } catch {
      setError("Không thể đăng xuất lúc này. Vui lòng thử lại.");
      setSubmitting(false);
    }
  }

  return (
    <div className="logout-control">
      <button
        className="button button-secondary logout-button"
        disabled={submitting}
        onClick={() => void handleSignOut()}
        type="button"
      >
        {submitting ? "Đang đăng xuất..." : "Đăng xuất"}
      </button>
      {error && <span className="logout-error" role="alert">{error}</span>}
    </div>
  );
}
