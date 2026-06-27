import React, { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: 'inspecoes' | 'dashboard' | 'parecer';
  onNavigate: (page: 'inspecoes' | 'dashboard' | 'parecer') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f4f4f9] font-main">
      {/* SIDEBAR (Sidenav) */}
      <nav 
        className={`fixed top-0 left-0 h-full bg-[#050F41] z-50 flex flex-col overflow-hidden transition-all duration-400 ease-in-out ${isHovered ? 'w-[260px]' : 'w-[70px]'}`}
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

        <button 
          onClick={() => onNavigate('dashboard')}
          className={`w-full h-[50px] flex items-center px-0 text-gray-200 hover:text-white hover:bg-white/10 border-l-4 transition-all ${activePage === 'dashboard' ? 'border-[#FAB932] bg-white/10 text-white' : 'border-transparent'}`}
        >
            <div className="min-w-[70px] flex justify-center">
                 <span className="material-symbols-outlined text-[24px]">chart_data</span>
            </div>
            <span className={`whitespace-nowrap font-semibold ml-2 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                Dashboard
            </span>
        </button>

        <button 
          onClick={() => onNavigate('inspecoes')}
          className={`w-full h-[50px] flex items-center px-0 text-gray-200 hover:text-white hover:bg-white/10 border-l-4 transition-all ${activePage === 'inspecoes' ? 'border-[#FAB932] bg-white/10 text-white' : 'border-transparent'}`}
        >
            <div className="min-w-[70px] flex justify-center">
                <span className="material-symbols-outlined text-[24px]">clinical_notes</span>
            </div>
            <span className={`whitespace-nowrap font-semibold ml-2 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                Inspeções
            </span>
        </button>

        <button 
          onClick={() => onNavigate('parecer')}
          className={`w-full h-[50px] flex items-center px-0 text-gray-200 hover:text-white hover:bg-white/10 border-l-4 transition-all ${activePage === 'parecer' ? 'border-[#FAB932] bg-white/10 text-white' : 'border-transparent'}`}
        >
            <div className="min-w-[70px] flex justify-center">
                <span className="material-symbols-outlined text-[24px]">lab_profile</span>
            </div>
            <span className={`whitespace-nowrap font-semibold ml-2 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                Parecer
            </span>
        </button>

        <div className={`mt-auto pb-5 flex justify-center opacity-70 transition-all duration-300 ${isHovered ? 'opacity-100' : ''}`}>
           <img 
            src="https://i.imgur.com/XHPXHdt.png" 
            className={`transition-all duration-300 ${isHovered ? 'w-[140px]' : 'w-[40px]'}`}
           />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 ml-[70px] p-5 flex flex-col transition-all duration-400">
        {children}
        
        {/* Footer */}
        <footer className="mt-auto p-5 flex justify-center items-center gap-20 border-t border-gray-200">
            <img src="https://i.imgur.com/mPObmH0.png" className="h-[70px] w-auto object-contain" alt="Logo HNRe" />
            <img src="https://i.imgur.com/lYp37Ar.png" className="h-[70px] w-auto object-contain" alt="Logo Marinha" />
        </footer>
      </main>
    </div>
  );
};