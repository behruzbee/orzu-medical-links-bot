"use client";

import { useState } from "react";
import { Branch, BranchNames } from "@/lib/types";
import { Save, CheckCircle, AlertCircle, Loader2, Lock, LogIn } from "lucide-react";

export default function AdminPage() {
  // --- НАСТРОЙКИ ---
  const ADMIN_PASSWORD = "1111"; // 👈 ЗАДАЙТЕ ПАРОЛЬ ЗДЕСЬ
  // ----------------

  const [password, setPassword] = useState("");
  const [isAuth, setIsAuth] = useState(false);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [branch, setBranch] = useState<Branch>(Branch.ALL);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  // Функция проверки пароля
  const checkAuth = (e?: React.FormEvent) => {
    e?.preventDefault(); // Чтобы форма не перезагружалась при Enter
    if (password === ADMIN_PASSWORD) {
      setIsAuth(true);
    } else {
      alert("Неверный пароль! Попробуйте еще раз.");
      setPassword("");
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
          adminId: 777, // Просто фиксированный ID
          adminName: "Администратор", 
        }),
      });

      if (!res.ok) throw new Error("Ошибка сервера");

      setStatus("success");
      setTitle("");
      setUrl("");
      // Сброс статуса успеха через 3 сек
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // ЭКРАН 1: ВВОД ПАРОЛЯ
  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Вход в систему</h2>
            <p className="text-gray-500 text-sm mt-1">Введите пароль администратора</p>
          </div>

          <form onSubmit={checkAuth} className="space-y-4">
            <input 
              type="password" 
              placeholder="Пароль"
              className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <LogIn size={20} />
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ЭКРАН 2: АДМИНКА (ФОРМА)
  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-slate-800 pb-10">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Save className="text-blue-600" />
              Добавить
            </h1>
            <button 
              onClick={() => setIsAuth(false)} 
              className="text-xs text-red-500 font-medium hover:underline"
            >
              Выйти
            </button>
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
              className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer"
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
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98] mt-2 shadow-lg shadow-blue-200"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </form>

        {/* Статусы */}
        {status === "success" && (
          <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-3 animate-in zoom-in duration-300 border border-green-100">
            <CheckCircle size={24} />
            <div>
              <p className="font-bold">Успешно!</p>
              <p className="text-sm opacity-90">Ссылка добавлена в базу.</p>
            </div>
          </div>
        )}
        {status === "error" && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 animate-in zoom-in duration-300 border border-red-100">
            <AlertCircle size={24} />
            <div>
              <p className="font-bold">Ошибка</p>
              <p className="text-sm opacity-90">Не удалось сохранить.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}