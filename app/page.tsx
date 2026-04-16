"use client";

import { useState, useEffect } from "react";
import Image from "next/image"; 
import { Branch, BranchNames, LinkItem } from "@/lib/types";
import { Folder, ArrowLeft, ExternalLink, Loader2, Search, Pin } from "lucide-react";

export default function Home() {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Загрузка ссылок при выборе филиала
  useEffect(() => {
    if (!selectedBranch) return;

    setLoading(true);
    fetch(`/api/links?branch=${selectedBranch}`)
      .then((res) => res.json())
      .then((data) => {
        // Проверка, что пришел массив (защита от ошибок API)
        if (Array.isArray(data)) {
          setLinks(data);
        } else {
          console.error("API Error:", data);
          setLinks([]);
        }
      })
      .catch((err) => {
        console.error("Fetch Error:", err);
        setLinks([]);
      })
      .finally(() => setLoading(false));
  }, [selectedBranch]);

  const handleLinkClick = async (link: LinkItem) => {
    // 1. Отправляем аналитику (не блокируем открытие ссылки)
    try {
        fetch("/api/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: link.id }),
        });
    } catch (e) {
        console.error("Analytics error", e);
    }
    
    // 2. Открываем ссылку
    window.open(link.url, "_blank");
  };

  const filteredLinks = links.filter((l) =>
    l.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-10">
      {/* --- ШАПКА --- */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Логотип */}
          <div className="flex items-center gap-3">
            <div className="relative w-32 h-10"> 
               <Image 
                 src="https://orzumed.uz/wp-content/uploads/2024/07/orzu-med-logo-svg.svg"
                 alt="Orzu Medical Logo"
                 fill
                 className="object-contain object-left" 
                 priority
               />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Base
            </span>
          </div>

          {selectedBranch && (
            <button
              onClick={() => {
                setSelectedBranch(null);
                setSearchTerm("");
                setLinks([]);
              }}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 transition bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg active:scale-95"
            >
              Сменить
            </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        
        {/* --- ЭКРАН 1: ВЫБОР ФИЛИАЛА --- */}
        {!selectedBranch ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">
                  Добро пожаловать
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    Выберите филиал для поиска документов
                </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {(Object.entries(BranchNames) as [Branch, string][]).map(([key, name]) => (
                <button
                  key={key}
                  onClick={() => setSelectedBranch(key)}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md hover:border-blue-400 transition-all active:scale-95 group"
                >
                  <div className="bg-blue-50 p-3.5 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Folder size={24} />
                  </div>
                  <span className="font-semibold text-lg text-slate-700 group-hover:text-blue-700 transition-colors text-left">
                    {name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          
          /* --- ЭКРАН 2: СПИСОК ССЫЛОК --- */
          <div className="animate-in slide-in-from-right-8 duration-300">
            {/* Заголовок раздела */}
            <div className="flex items-center gap-2 mb-4 mt-1">
              <button 
                onClick={() => setSelectedBranch(null)} 
                className="p-2 -ml-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
              >
                <ArrowLeft size={22} />
              </button>
              <div>
                <h2 className="text-xl font-bold leading-tight text-slate-800">
                    {BranchNames[selectedBranch]}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">База знаний филиала</p>
              </div>
            </div>

            {/* Поиск */}
            <div className="relative mb-5 group">
              <Search className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Поиск по названию..." 
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Состояния: Загрузка / Пусто / Список */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-blue-600 gap-3">
                <Loader2 className="animate-spin" size={32} />
                <span className="text-sm text-gray-500 font-medium">Загружаем документов...</span>
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="text-center py-16 px-6 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={32} className="opacity-40" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">Ничего не найдено</h3>
                <p className="text-sm">Попробуйте изменить запрос или выберите другой филиал.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLinks.map((link) => (
                  <div
                    key={link.id}
                    onClick={() => handleLinkClick(link)}
                    className={`group bg-white p-4 rounded-xl shadow-sm border cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 transition-all relative overflow-hidden active:scale-[0.99] ${
                        link.isPinned ? 'border-amber-300 bg-amber-50/20' : 'border-gray-100 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                            {/* Метка "Общее" */}
                            {link.branch === 'all' && (
                                <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded-md font-bold mb-2 inline-flex items-center gap-1 border border-indigo-100/50">
                                    🌐 ДЛЯ ВСЕХ
                                </span>
                            )}
                            
                            <h3 className="font-semibold text-[15px] text-gray-800 group-hover:text-blue-600 transition-colors leading-snug flex items-start gap-1.5">
                                {/* Иконка закрепления */}
                                {link.isPinned && (
                                    <Pin size={16} className="text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
                                )}
                                <span>{link.title}</span>
                            </h3>
                            
                            <div className="flex items-center flex-wrap gap-2 mt-2.5 text-xs text-gray-400">
                                <span className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-gray-500 border border-gray-100">
                                  User: {link.adminName}
                                </span>
                                <span>{new Date(link.createdAt).toLocaleDateString('ru-RU')}</span>
                            </div>
                        </div>

                        {/* Иконка стрелки */}
                        <div className="bg-gray-50 p-2.5 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                            <ExternalLink size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}