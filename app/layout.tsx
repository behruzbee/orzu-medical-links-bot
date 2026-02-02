import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Orzu Medical Base",
  description: "База знаний",
};

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
        {/* 👇 ЖЕЛЕЗОБЕТОННЫЙ ВАРИАНТ ЗАГРУЗКИ СКРИПТА */}
        <script 
          src="https://telegram.org/js/telegram-web-app.js" 
          async 
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}