"use client";

import { useState, useEffect } from "react";
import { Branch, BranchNames, LinkItem } from "@/lib/types";
import { Save, CheckCircle, Loader2, Lock, Bug, Edit, Pin, Trash2, PinOff } from "lucide-react";

// Типы WebApp
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
  
  // Режим редактирования и список
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminLinks, setAdminLinks] = useState<LinkItem[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  // Данные юзера
  const [userInfo, setUserInfo] = useState<{id: number, name: string} | null>(null);
  const [debugMsg, setDebugMsg] = useState("Инициализация...");

  useEffect(() => {
    let attempts = 0;
    const checkTelegram = () => {
      attempts++;
      setDebugMsg(`Попытка #${attempts}...`);

      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const user = tg.initDataUnsafe?.user;

        if (user) {
          setDebugMsg(`✅ User найден: ${user.id}`);
          setUserInfo({ id: user.id, name: user.first_name });
          verifyAdmin(user.id);
        } else {
          setDebugMsg(`⚠️ WebApp есть, но user пуст.`);
          setCheckingAuth(false);
        }
      } else {
        if (attempts < 5) {
          setTimeout(checkTelegram, 500);
        } else {
          setDebugMsg("❌ Ошибка: window.Telegram не найден.");
          setCheckingAuth(false);
        }
      }
    };
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
        fetchAdminLinks(); // 👈 Загружаем список ссылок после авторизации
      }
    } catch (error: any) {
      setDebugMsg(`Ошибка API: ${error.message}`);
    } finally {
      setCheckingAuth(false);
    }
  };

  // Получение ссылок админа
  const fetchAdminLinks = async () => {
    setLoadingLinks(true);
    try {
      // Здесь используем ваш существующий GET запрос (например, все ссылки)
      const res = await fetch(`/api/links?branch=${Branch.ALL}`); 
      const data = await res.json();
      if (Array.isArray(data)) setAdminLinks(data);
    } catch (e) {
      console.error("Ошибка загрузки ссылок", e);
    } finally {
      setLoadingLinks(false);
    }
  };

  // 📝 СОХРАНЕНИЕ / ОБНОВЛЕНИЕ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    try {
      if (editingId) {
        // Обновление существующей ссылки
        const res = await fetch("/api/links", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, title, url, branch }),
        });
        if (!res.ok) throw new Error("Ошибка обновления");
      } else {
        // Добавление новой
        const res = await fetch("/api/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title, url, branch,
            adminId: userInfo?.id || 0,
            adminName: userInfo?.name || "Admin",
          }),
        });
        if (!res.ok) throw new Error("Ошибка сервера");
      }

      setStatus("success");
      resetForm();
      fetchAdminLinks(); // Обновляем список
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle(""); setUrl(""); setBranch(Branch.ALL); setEditingId(null);
  };

  // ✏️ НАЖАТИЕ НА "РЕДАКТИРОВАТЬ"
  const handleEditClick = (link: LinkItem) => {
    setEditingId(link.id);
    setTitle(link.title);
    setUrl(link.url);
    setBranch(link.branch);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Скроллим наверх к форме
  };

  // 📌 ДВОЙНОЙ КЛИК (ЗАКРЕПЛЕНИЕ)
  const handleDoubleClick = async (link: LinkItem) => {
    const newPinnedStatus = !link.isPinned;
    
    // Оптимистичное обновление UI (чтобы не ждать ответа сервера)
    setAdminLinks(prev => prev.map(l => l.id === link.id ? { ...l, isPinned: newPinnedStatus } : l));

    try {
      await fetch("/api/links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link.id, isPinned: newPinnedStatus }),
      });
      // Опционально: можно вызвать fetchAdminLinks() чтобы пересортировать список
      fetchAdminLinks();
    } catch (e) {
      console.error("Ошибка при закреплении", e);
      // Откат при ошибке
      setAdminLinks(prev => prev.map(l => l.id === link.id ? { ...l, isPinned: !newPinnedStatus } : l));
    }
  };

  // 🗑️ УДАЛЕНИЕ (Опционально, но полезно для админа)
  const handleDeleteClick = async (id: string) => {
    if (!confirm("Точно удалить?")) return;
    try {
      await fetch(`/api/links?id=${id}`, { method: "DELETE" });
      setAdminLinks(prev => prev.filter(l => l.id !== id));
    } catch(e) { console.error("Ошибка удаления", e); }
  };

  // ... (Экраны загрузки и ошибки авторизации остаются без изменений)
  if (checkingAuth) return ( <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500 gap-3 p-4"><Loader2 className="animate-spin" size={32} /></div> );
  if (!isAuth) return ( /* Ваш экран ошибки 403 */ <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans"><div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm text-center"><div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><Lock size={32} /></div><h2 className="text-xl font-bold mb-2">Доступ запрещен</h2><div className="bg-gray-900 text-green-400 rounded-xl p-4 text-left overflow-hidden"><code className="text-2xl font-mono font-bold text-white block">{userInfo?.id || debugMsg}</code></div></div></div> );

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-slate-800 pb-20">
      
      {/* ФОРМА ДОБАВЛЕНИЯ/РЕДАКТИРОВАНИЯ */}
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold flex items-center gap-2">
              {editingId ? <Edit className="text-orange-500" /> : <Save className="text-blue-600" />}
              {editingId ? "Редактирование" : "Добавить документ"}
            </h1>
            {editingId && (
                <button onClick={resetForm} className="text-xs text-gray-400 hover:text-gray-800 underline">
                    Отмена
                </button>
            )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название документа</label>
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка (URL)</label>
            <input required type="url" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Филиал</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value as Branch)} className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition">
              {(Object.entries(BranchNames) as [Branch, string][]).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>

          <button disabled={loading} type="submit" className={`w-full py-3.5 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98] ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {loading ? <Loader2 className="animate-spin" /> : (editingId ? <Edit size={20} /> : <Save size={20} />)}
            {loading ? "Сохранение..." : (editingId ? "Сохранить изменения" : "Добавить")}
          </button>
        </form>

        {status === "success" && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle size={20} /> <b>{editingId ? "Обновлено!" : "Добавлено!"}</b>
          </div>
        )}
      </div>

      {/* СПИСОК ССЫЛОК АДМИНА */}
      <div className="max-w-md mx-auto">
        <h2 className="text-lg font-bold text-gray-800 mb-3 px-1 flex justify-between items-end">
            <span>Управление базой</span>
            <span className="text-xs font-normal text-gray-500">Двойной клик = Закрепить</span>
        </h2>
        
        {loadingLinks ? (
             <div className="text-center py-6 text-gray-400"><Loader2 className="animate-spin mx-auto" /></div>
        ) : (
            <div className="space-y-3">
                {adminLinks.map(link => (
                    <div 
                        key={link.id} 
                        onDoubleClick={() => handleDoubleClick(link)}
                        className={`bg-white p-4 rounded-xl shadow-sm border transition-all select-none ${link.isPinned ? 'border-amber-400 bg-amber-50/30' : 'border-gray-200 hover:border-blue-300'}`}
                    >
                        <div className="flex justify-between gap-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    {link.isPinned && <Pin size={14} className="text-amber-500 fill-amber-500" />}
                                    <h3 className="font-semibold text-sm text-gray-800 leading-snug">{link.title}</h3>
                                </div>
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase font-medium tracking-wide">
                                    {BranchNames[link.branch]}
                                </span>
                            </div>

                            {/* Кнопки управления карточкой */}
                            <div className="flex flex-col gap-2">
                                <button onClick={() => handleEditClick(link)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDeleteClick(link.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {adminLinks.length === 0 && <p className="text-center text-sm text-gray-500 py-4">Спикок пуст</p>}
            </div>
        )}
      </div>

    </div>
  );
}