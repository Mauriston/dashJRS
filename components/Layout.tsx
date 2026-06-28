import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

type Page = 'inspecoes' | 'dashboard' | 'parecer';

interface LayoutProps {
  children: React.ReactNode;
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { key: Page; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'chart_data' },
  { key: 'inspecoes', label: 'Inspeções', icon: 'clinical_notes' },
  { key: 'parecer', label: 'Parecer', icon: 'lab_profile' },
];

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const activeLabel = NAV_ITEMS.find(i => i.key === activePage)?.label ?? '';

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    setIsMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#f4f4f9] font-main">
      {/* ===== SIDEBAR DESKTOP (rail fixo que expande no hover) ===== */}
      <nav
        className={`hidden md:flex fixed top-0 left-0 h-full bg-[#050F41] z-50 flex-col overflow-hidden transition-all duration-400 ease-in-out ${isHovered ? 'w-[260px]' : 'w-[70px]'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex justify-center items-center h-[80px] pt-[15px] mb-4">
          <img
            src="https://i.imgur.com/KUbQz08.png"
            alt="Logo HNRe"
            className={`transition-all duration-300 ${isHovered ? 'w-[90px]' : 'w-[40px]'}`}
          />
        </div>

        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            onClick={() => handleNavigate(item.key)}
            className={`w-full h-[50px] flex items-center px-0 text-gray-200 hover:text-white hover:bg-white/10 border-l-4 transition-all ${activePage === item.key ? 'border-[#FAB932] bg-white/10 text-white' : 'border-transparent'}`}
          >
            <div className="min-w-[70px] flex justify-center">
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
            </div>
            <span className={`whitespace-nowrap font-semibold ml-2 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              {item.label}
            </span>
          </button>
        ))}

        <div className={`mt-auto pb-5 flex justify-center opacity-70 transition-all duration-300 ${isHovered ? 'opacity-100' : ''}`}>
          <img
            src="https://i.imgur.com/XHPXHdt.png"
            className={`transition-all duration-300 ${isHovered ? 'w-[140px]' : 'w-[40px]'}`}
          />
        </div>
      </nav>

      {/* ===== TOPBAR MOBILE ===== */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-[56px] bg-[#050F41] z-40 flex items-center justify-between px-2 shadow-md">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-white hover:bg-white/10 rounded transition"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <img src="https://i.imgur.com/KUbQz08.png" alt="Logo HNRe" className="h-[30px] w-auto" />
          <span className="text-white font-semibold text-sm uppercase tracking-wide truncate">{activeLabel}</span>
        </div>
        {/* Espaçador para manter o título centralizado */}
        <div className="w-[40px] shrink-0" />
      </header>

      {/* ===== OVERLAY MOBILE ===== */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      />

      {/* ===== DRAWER MOBILE (off-canvas) ===== */}
      <nav
        className={`md:hidden fixed top-0 left-0 h-full w-[260px] bg-[#050F41] z-50 flex flex-col transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between h-[72px] px-4 border-b border-white/10">
          <img src="https://i.imgur.com/KUbQz08.png" alt="Logo HNRe" className="w-[64px]" />
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 text-white hover:bg-white/10 rounded transition"
            aria-label="Fechar menu"
          >
            <X size={24} />
          </button>
        </div>

        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            onClick={() => handleNavigate(item.key)}
            className={`w-full h-[52px] flex items-center text-gray-200 hover:text-white hover:bg-white/10 border-l-4 transition-all ${activePage === item.key ? 'border-[#FAB932] bg-white/10 text-white' : 'border-transparent'}`}
          >
            <div className="min-w-[60px] flex justify-center">
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
            </div>
            <span className="whitespace-nowrap font-semibold">{item.label}</span>
          </button>
        ))}

        <div className="mt-auto pb-6 flex justify-center">
          <img src="https://i.imgur.com/XHPXHdt.png" className="w-[140px]" />
        </div>
      </nav>

      {/* ===== ÁREA DE CONTEÚDO ===== */}
      <main className="flex-1 md:ml-[70px] min-w-0 p-4 md:p-5 pt-[72px] md:pt-5 flex flex-col transition-all duration-400">
        {children}

        {/* Footer */}
        <footer className="mt-auto p-4 md:p-5 flex flex-wrap justify-center items-center gap-8 md:gap-20 border-t border-gray-200">
          <img src="https://i.imgur.com/mPObmH0.png" className="h-[50px] md:h-[70px] w-auto object-contain" alt="Logo HNRe" />
          <img src="https://i.imgur.com/lYp37Ar.png" className="h-[50px] md:h-[70px] w-auto object-contain" alt="Logo Marinha" />
        </footer>
      </main>
    </div>
  );
};
