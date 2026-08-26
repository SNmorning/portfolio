import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALBANO | AI 产品运营作品集",
  description:
    "一份采用西班牙语构建的 AI 产品运营作品集。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
