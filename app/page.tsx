"use client";

import { useState, useEffect } from "react";
import Image from "next/image"; // <--- Импортируем компонент для картинок
import { Branch, BranchNames, LinkItem } from "@/lib/types";
import { Folder, ArrowLeft, ExternalLink, Loader2, Search } from "lucide-react";

export default function Home() {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Загрузка ссылок
  useEffect(() => {
    if (!selectedBranch) return;

    setLoading(true);
    fetch(`/api/links?branch=${selectedBranch}`)
      .then((res) => res.json())
      .then((data) => {
        setLinks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedBranch]);

  const handleLinkClick = async (link: LinkItem) => {
    // Отправляем аналитику
    fetch("/api/track", {
      method: "POST",
      body: JSON.stringify({ id: link.id }),
    });
    // Открываем ссылку
    window.open(link.url, "_blank");
  };

  const filteredLinks = links.filter((l) =>
    l.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans">
      {/* ШАПКА (HEADER)
          Я изменил фон на белый (bg-white), чтобы логотип Orzu Med хорошо читался.
          Текст теперь синий/серый.
      */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Логотип + Название */}
          <div className="flex items-center gap-3">
            <div className="relative w-28 h-10"> 
               {/* Логотип */}
               <Image 
                 src="https://orzumed.uz/wp-content/uploads/2024/07/orzu-med-logo-svg.svg"
                 alt="Orzu Medical Logo"
                 fill
                 className="object-contain object-left" // object-left выравнивает лого по левому краю
                 priority
               />
            </div>
            {/* Можно добавить текст "Base", если логотип не содержит текста, 
                но этот SVG вроде содержит текст, поэтому лишнее убрал */}
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Base
            </span>
          </div>

          {selectedBranch && (
            <button
              onClick={() => {
                setSelectedBranch(null);
                setSearchTerm("");
              }}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 transition bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
            >
              Сменить
            </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        {/* ЭКРАН 1: ВЫБОР ФИЛИАЛА */}
        {!selectedBranch ? (
          <div className="space-y-4 animate-in fade-in duration-500 mt-4">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">
                Добро пожаловать
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    Единая база знаний клиники
                </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {(Object.entries(BranchNames) as [Branch, string][]).map(([key, name]) => (
                <button
                  key={key}
                  onClick={() => setSelectedBranch(key)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md hover:border-blue-400 transition active:scale-95 group"
                >
                  <div className="bg-blue-50 p-3 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Folder size={24} />
                  </div>
                  <span className="font-medium text-lg text-slate-700">{name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ЭКРАН 2: СПИСОК ССЫЛОК */
          <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-4 mt-2">
              <button onClick={() => setSelectedBranch(null)} className="p-2 -ml-2 text-gray-400 hover:text-blue-600 transition">
                <ArrowLeft />
              </button>
              <div>
                <h2 className="text-xl font-bold leading-tight text-slate-800">{BranchNames[selectedBranch]}</h2>
                <p className="text-xs text-gray-500">Документы филиала</p>
              </div>
            </div>

            {/* Поиск */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Поиск документа..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-blue-500 gap-3">
                <Loader2 className="animate-spin" size={40} />
                <span className="text-sm text-gray-400">Загрузка данных...</span>
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
                <Folder size={48} className="mx-auto mb-3 opacity-20" />
                <p>В этом разделе пока нет документов</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLinks.map((link) => (
                  <div
                    key={link.id}
                    onClick={() => handleLinkClick(link)}
                    className="group bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-blue-500 hover:shadow-md transition relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                            {link.branch === 'all' && (
                                <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-bold mb-2 inline-block border border-indigo-100">
                                    🌐 ОБЩЕЕ
                                </span>
                            )}
                            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                            {link.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                <span className="bg-gray-50 px-1.5 py-0.5 rounded text-gray-500">
                                  {link.adminName}
                                </span>
                                <span>•</span>
                                <span>{new Date(link.createdAt).toLocaleDateString('ru-RU')}</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <ExternalLink size={20} className="text-gray-400 group-hover:text-blue-600" />
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