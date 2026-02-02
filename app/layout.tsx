import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script"; // 👈 Импортируем компонент скрипта

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Orzu Medical Base",
  description: "База знаний клиники",
};

// 📱 Настройка для мобильных устройств (чтобы не зумилось при нажатии)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        {/* 👇 ЭТО САМОЕ ГЛАВНОЕ: Подключаем Telegram SDK */}
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive" 
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}