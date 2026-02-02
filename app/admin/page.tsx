"use client";

import { useState, useEffect } from "react";
import { Branch, BranchNames } from "@/lib/types";
import { Save, CheckCircle, AlertCircle, Loader2, Lock } from "lucide-react";

// Объявляем типы для Telegram WebApp, чтобы TypeScript не ругался
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            username?: string;
          };
        };
        expand: () => void;
      };
    };
  }
}

export default function AdminPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true); // Состояние загрузки проверки
  
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [branch, setBranch] = useState<Branch>(Branch.ALL);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [userInfo, setUserInfo] = useState<{id: number, name: string} | null>(null);

  // ⚡️ АВТОМАТИЧЕСКАЯ ПРОВЕРКА АДМИНА
  useEffect(() => {
    console.log("🚀 Запуск проверки Telegram...");

    // Проверяем, загрузился ли объект Telegram
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      console.log("✅ Telegram WebApp найден!");
      
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      const user = tg.initDataUnsafe?.user;
      
      console.log("👤 Данные пользователя:", user); // Посмотрим в консоли браузера

      if (user) {
        setUserInfo({ id: user.id, name: user.first_name });
        verifyAdmin(user.id);
      } else {
        console.warn("⚠️ Пользователь не найден (возможно открыто в браузере)");
        setCheckingAuth(false);
      }
    } else {
      console.error("❌ window.Telegram не найден (проверьте layout.tsx)");
      setCheckingAuth(false);
    }
  }, []);

  const verifyAdmin = async (userId: number) => {
    try {
      const res = await fetch("/api/check-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (data.isAdmin) {
        setIsAuth(true);
      }
    } catch (error) {
      console.error("Ошибка проверки:", error);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          url,
          branch,
          adminId: userInfo?.id || 0, // Берем реальный ID
          adminName: userInfo?.name || "Admin", // Берем реальное имя
        }),
      });

      if (!res.ok) throw new Error("Ошибка сервера");

      setStatus("success");
      setTitle("");
      setUrl("");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // ЭКРАН 1: ЗАГРУЗКА ПРОВЕРКИ
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-400 gap-3">
        <Loader2 className="animate-spin" size={32} />
        <p>Проверка прав доступа...</p>
      </div>
    );
  }

  // ЭКРАН 2: ДОСТУП ЗАПРЕЩЕН
  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm text-center">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-800">Доступ запрещен</h2>
          <p className="text-gray-500 mb-4 text-sm">
            Ваш Telegram ID ({userInfo?.id || "Неизвестно"}) не найден в списке администраторов.
          </p>
          <div className="p-3 bg-gray-100 rounded-lg text-xs text-gray-500 font-mono break-all">
            Добавьте ID в ADMIN_IDS в .env
          </div>
        </div>
      </div>
    );
  }

  // ЭКРАН 3: ФОРМА ДОБАВЛЕНИЯ (ТОЛЬКО ДЛЯ АДМИНОВ)
  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-slate-800 pb-10">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
            <Save className="text-blue-600" />
            Админка
            </h1>
            <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-medium">
                {userInfo?.name}
            </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Название */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название документа</label>
            <input
              required
              type="text"
              placeholder="Например: График отпусков"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Ссылка */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка (URL)</label>
            <input
              required
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Филиал */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Филиал</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value as Branch)}
              className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              {(Object.entries(BranchNames) as [Branch, string][]).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>

          {/* Кнопка */}
          <button
            disabled={loading}
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </form>

        {/* Статусы */}
        {status === "success" && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle size={20} />
            <b>Успешно добавлено!</b>
          </div>
        )}
        {status === "error" && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle size={20} />
            <b>Ошибка при сохранении.</b>
          </div>
        )}
      </div>
    </div>
  );
}