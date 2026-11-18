import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TechNest — Chọn đúng công nghệ",
  description:
    "Laptop và linh kiện được chọn theo nhu cầu của bạn. Nói bạn cần gì, TechNest chọn giúp bạn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
