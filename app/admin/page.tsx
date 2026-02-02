"use client";

import { useState } from "react";
import { Branch, BranchNames } from "@/lib/types";
import { Save, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuth, setIsAuth] = useState(false);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [branch, setBranch] = useState<Branch>(Branch.ALL);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  // Простая защита паролем (чтобы кто угодно не зашел)
  // В идеале это делается через проверку Telegram initData, но для начала так проще
  const checkAuth = () => {
    if (password === "admin123") {
      // 👈 ЗАДАЙТЕ СВОЙ ПАРОЛЬ ТУТ
      setIsAuth(true);
    } else {
      alert("Неверный пароль");
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
          adminId: 777, // Фейковый ID, так как добавляем через сайт
          adminName: "Web Admin",
        }),
      });

      if (!res.ok) throw new Error("Ошибка сервера");

      setStatus("success");
      setTitle("");
      setUrl("");
      // Сброс статуса через 3 сек
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4 text-center">Вход в Админку</h2>
          <input
            type="password"
            placeholder="Пароль"
            className="w-full p-3 border rounded-xl mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={checkAuth}
            className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-slate-800">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Save className="text-blue-600" />
          Добавить ссылку
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Название */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название документа
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ссылка (URL)
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Филиал
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value as Branch)}
              className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              {(Object.entries(BranchNames) as [Branch, string][]).map(
                ([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* Кнопка */}
          <button
            disabled={loading}
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save size={20} />
            )}
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
