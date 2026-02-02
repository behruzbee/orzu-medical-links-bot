"use client";

import { useState, useEffect } from "react";
import { Branch, BranchNames } from "@/lib/types";
import { Save, CheckCircle, AlertCircle, Loader2, Lock, Bug } from "lucide-react";

// Типы
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
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Данные формы
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [branch, setBranch] = useState<Branch>(Branch.ALL);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  
  // Данные юзера
  const [userInfo, setUserInfo] = useState<{id: number, name: string} | null>(null);
  
  // ОТЛАДКА: Текст ошибки для вывода на экран
  const [debugMsg, setDebugMsg] = useState("Инициализация...");

  // ⚡️ ПРОВЕРКА С ЗАДЕРЖКОЙ (RETRY)
  useEffect(() => {
    let attempts = 0;
    
    const checkTelegram = () => {
      attempts++;
      setDebugMsg(`Попытка #${attempts}...`);

      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        // УРА! Скрипт найден
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const user = tg.initDataUnsafe?.user;

        if (user) {
          setDebugMsg(`✅ User найден: ${user.id}`);
          setUserInfo({ id: user.id, name: user.first_name });
          verifyAdmin(user.id);
        } else {
          setDebugMsg(`⚠️ WebApp есть, но user пуст. initDataUnsafe: ${JSON.stringify(tg.initDataUnsafe)}`);
          setCheckingAuth(false);
        }
      } else {
        // Скрипта нет, пробуем еще раз через 500мс (максимум 5 раз)
        if (attempts < 5) {
          setTimeout(checkTelegram, 500);
        } else {
          setDebugMsg("❌ Ошибка: window.Telegram не найден. Проверьте layout.tsx");
          setCheckingAuth(false);
        }
      }
    };

    // Запускаем проверку
    checkTelegram();
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
    } catch (error: any) {
      console.error("Ошибка проверки:", error);
      setDebugMsg(`Ошибка API: ${error.message}`);
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
          adminId: userInfo?.id || 0,
          adminName: userInfo?.name || "Admin",
        }),
      });

      if (!res.ok) throw new Error("Ошибка сервера");
      setStatus("success");
      setTitle("");
      setUrl("");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500 gap-3 p-4 text-center">
        <Loader2 className="animate-spin" size={32} />
        <p>Подключение к Telegram...</p>
        <p className="text-xs font-mono bg-gray-100 p-2 rounded">{debugMsg}</p>
      </div>
    );
  }

  // ЭКРАН ОШИБКИ (ЕСЛИ НЕ ПУСТИЛО)
  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
        <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm text-center">
          
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <Lock size={32} />
          </div>
          
          <h2 className="text-xl font-bold mb-2 text-gray-800">Доступ запрещен</h2>

          {/* 👇 БЛОК С ID И ОТЛАДКОЙ */}
          <div className="bg-gray-900 text-green-400 rounded-xl p-4 mb-6 text-left overflow-hidden">
            <p className="text-xs text-gray-400 font-bold mb-2 flex items-center gap-2">
               <Bug size={14}/> ТЕХНИЧЕСКИЕ ДАННЫЕ:
            </p>
            
            {userInfo?.id ? (
                <>
                  <div className="text-xs text-gray-400">Ваш ID:</div>
                  <code className="text-2xl font-mono font-bold text-white block mb-2">
                      {userInfo.id}
                  </code>
                  <div className="text-[10px] text-gray-500">Добавьте этот ID в Vercel Env (ADMIN_IDS)</div>
                </>
            ) : (
                <div className="text-red-400 font-medium text-sm font-mono break-words">
                    {debugMsg}
                </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ЭКРАН АДМИНКИ
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

          <button
            disabled={loading}
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </form>

        {status === "success" && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-xl flex items-center gap-2">
            <CheckCircle size={20} />
            <b>Успешно добавлено!</b>
          </div>
        )}
      </div>
    </div>
  );
}