// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css"; // <--- ВОТ ЭТА СТРОКА ОБЯЗАТЕЛЬНА!

export const metadata: Metadata = {
  title: "Orzu Medical Links",
  description: "База знаний клиники",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="bg-gray-50 text-slate-900">{children}</body>
    </html>
  );
}