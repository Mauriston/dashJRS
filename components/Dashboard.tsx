import React, { useState, useMemo, useRef, useEffect } from 'react';
import { InspectionRecord } from '../types';
import { Calendar as CalendarIcon, ChevronDown, X, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, Line, ComposedChart 
} from 'recharts';

interface DashboardProps {
  records: InspectionRecord[];
}

type DateFilterOption = 'all' | 'this-week' | 'this-month' | 'last-month' | 'this-quarter' | 'custom';

// Cores Oficiais
const COLORS = {
    NAVY: '#050F41',
    YELLOW: '#FAB932',
    GREEN: '#079551',
    RED: '#B71C1C',
    GRAY: '#E5E7EB',
    BLUE_LIGHT: '#60A5FA',
    DONUT: ['#050F41', '#FAB932', '#079551', '#B71C1C', '#60A5FA', '#9CA3AF']
};

export const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  // Estado do Filtro de Data (Igual ao App.tsx, padrão 'this-month')
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterOption>('this-month');
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  const [tempCustomDateRange, setTempCustomDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });

  const dateMenuRef = useRef<HTMLDivElement>(null);

  // Fecha menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target as Node)) {
        setShowDateMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LÓGICA DE FILTRAGEM (REUTILIZADA) ---
  const parseRecordDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;
      const parts = dateStr.split('/');
      if (parts.length !== 3) return null;
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  const isDateInRange = (dateStr: string, start: Date, end: Date): boolean => {
      const d = parseRecordDate(dateStr);
      if (!d) return false;
      d.setHours(0,0,0,0);
      const s = new Date(start); s.setHours(0,0,0,0);
      const e = new Date(end); e.setHours(23,59,59,999);
      return d >= s && d <= e;
  };

  const getDateRangeForFilter = (mode: DateFilterOption): { start: Date, end: Date } | null => {
      const now = new Date();
      let start = new Date();
      let end = new Date();

      switch (mode) {
          case 'this-week':
              const day = now.getDay(); 
              const diff = now.getDate() - day; 
              start = new Date(now.setDate(diff));
              end = new Date(now.setDate(start.getDate() + 6));
              break;
          case 'this-month':
              start = new Date(now.getFullYear(), now.getMonth(), 1);
              end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              break;
          case 'last-month':
              start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              end = new Date(now.getFullYear(), now.getMonth(), 0);
              break;
          case 'this-quarter':
              const quarter = Math.floor(now.getMonth() / 3);
              start = new Date(now.getFullYear(), quarter * 3, 1);
              end = new Date(now.getFullYear(), start.getMonth() + 3, 0);
              break;
          case 'custom':
              if (!customDateRange.start || !customDateRange.end) return null;
              start = new Date(customDateRange.start);
              end = new Date(customDateRange.end);
              const sParts = customDateRange.start.split('-');
              const eParts = customDateRange.end.split('-');
              start = new Date(parseInt(sParts[0]), parseInt(sParts[1])-1, parseInt(sParts[2]));
              end = new Date(parseInt(eParts[0]), parseInt(eParts[1])-1, parseInt(eParts[2]));
              break;
          default:
              return null;
      }
      return { start, end };
  };

  // --- DADOS FILTRADOS (Para KPIs e Gráficos Sensíveis ao Filtro) ---
  const filteredRecords = useMemo(() => {
      if (dateFilterMode === 'all') return records;
      const range = getDateRangeForFilter(dateFilterMode);
      if (!range) return records;
      return records.filter(r => {
          const dateToCheck = r.dataEntrevista || r.dataAbertura;
          return isDateInRange(dateToCheck, range.start, range.end);
      });
  }, [records, dateFilterMode, customDateRange]);

  // --- DADOS PARA KPI CARDS ---
  const kpis = useMemo(() => {
      const total = filteredRecords.length;
      const concluded = filteredRecords.filter(r => 
          ['IS Concluída s/ voto', 'IS Votada s/ assinatura', 'TIS assinado', 'Homologada JSD', 'Aprovada AUDITORIA CPMM'].includes(r.statusIS)
      ).length;
      const pending = filteredRecords.filter(r => 
          ['Conclusão Pendente', 'IS Agendada', 'IS Remarcada', 'IS aberta'].includes(r.statusIS)
      ).length;
      const msgPending = filteredRecords.filter(r => 
          r.msg === 'MSG PENDENTE' || r.msg === 'MSG ATRASADA'
      ).length;

      return { total, concluded, pending, msgPending };
  }, [filteredRecords]);

  // --- DADOS PARA GRÁFICO DE FINALIDADES (DONUT) ---
  const finalityData = useMemo(() => {
      const counts: {[key: string]: number} = {};
      filteredRecords.forEach(r => {
          const key = r.finalidade || 'Não Informado';
          counts[key] = (counts[key] || 0) + 1;
      });

      const sorted = Object.entries(counts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
      
      const top5 = sorted.slice(0, 5);
      const others = sorted.slice(5).reduce((acc, curr) => acc + curr.value, 0);

      if (others > 0) {
          top5.push({ name: 'OUTRAS', value: others });
      }

      return top5;
  }, [filteredRecords]);

  // --- DADOS PARA GRÁFICO DE OMs (TOP 5) ---
  const omData = useMemo(() => {
    const counts: {[key: string]: number} = {};
    filteredRecords.forEach(r => {
        const key = r.om || 'S/ OM';
        counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
  }, [filteredRecords]);

  // --- DADOS PARA GRÁFICO ANUAL (IGNORA FILTROS DE DATA) ---
  const yearlyComparisonData = useMemo(() => {
      const currentYear = new Date().getFullYear();
      const prevYear = currentYear - 1;
      
      const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
      const data = months.map(m => ({ name: m, atual: 0, anterior: 0 }));

      records.forEach(r => {
          const d = parseRecordDate(r.dataEntrevista || r.dataAbertura);
          if (d) {
              const monthIdx = d.getMonth();
              const year = d.getFullYear();
              
              if (year === currentYear) {
                  data[monthIdx].atual += 1;
              } else if (year === prevYear) {
                  data[monthIdx].anterior += 1;
              }
          }
      });

      return data;
  }, [records]);

  // --- DADOS PARA WIDGET DE OBSERVAÇÕES PENDENTES ---
  const pendingObservations = useMemo(() => {
      return filteredRecords
          .filter(r => 
              r.observacoes && 
              r.observacoes.trim() !== '' && 
              ['Conclusão Pendente', 'IS Agendada', 'IS Remarcada', 'IS aberta'].includes(r.statusIS)
          )
          .sort((a, b) => {
              const dateA = parseRecordDate(a.dataEntrevista || a.dataAbertura);
              const dateB = parseRecordDate(b.dataEntrevista || b.dataAbertura);
              if (!dateA && !dateB) return 0;
              if (!dateA) return 1;
              if (!dateB) return -1;
              return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 5);
  }, [filteredRecords]);

  // --- HELPERS DE UI ---
  const handleDateFilterSelect = (mode: DateFilterOption) => { if (mode === 'custom') { setShowDateMenu(false); setShowCustomDatePicker(true); } else { setDateFilterMode(mode); setShowDateMenu(false); } };
  const applyCustomDateFilter = () => { setCustomDateRange(tempCustomDateRange); setDateFilterMode('custom'); setShowCustomDatePicker(false); };
  const getFilterLabel = () => { switch(dateFilterMode) { case 'this-week': return 'Esta Semana'; case 'this-month': return 'Este Mês'; case 'last-month': return 'Mês Passado'; case 'this-quarter': return 'Este Trimestre'; case 'custom': return 'Personalizado'; default: return 'Todas as Datas'; } };

  return (
    <div className="flex flex-col gap-6">
       {/* --- HEADER COM FILTRO --- */}
       <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
           <div className="flex items-center gap-3">
               <div className="bg-navy-primary p-2 rounded-lg text-white">
                   <TrendingUp size={24} />
               </div>
               <div>
                   <h2 className="text-xl font-black font-header text-navy-primary leading-none">DASHBOARD</h2>
                   <p className="text-xs text-gray-500 font-semibold mt-1">Visão Geral e Indicadores</p>
               </div>
           </div>

           {/* DATE FILTER BUTTON */}
           <div className="relative mt-3 md:mt-0" ref={dateMenuRef}>
                <button onClick={() => setShowDateMenu(!showDateMenu)} className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100 transition min-w-[180px] justify-between shadow-sm">
                    <div className="flex items-center gap-2"><CalendarIcon size={16} className="text-navy-primary" /><span className="font-bold">{getFilterLabel()}</span></div>
                    <ChevronDown size={14} className={`transition-transform ${showDateMenu ? 'rotate-180' : ''}`} />
                </button>
                {showDateMenu && (<div className="absolute right-0 top-full mt-1 w-[200px] bg-white border border-gray-200 rounded shadow-lg z-20 py-1"><button onClick={() => handleDateFilterSelect('all')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${dateFilterMode === 'all' ? 'text-navy-primary font-bold bg-blue-50' : 'text-gray-700'}`}>Todas as Datas</button><button onClick={() => handleDateFilterSelect('this-week')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${dateFilterMode === 'this-week' ? 'text-navy-primary font-bold bg-blue-50' : 'text-gray-700'}`}>Esta semana</button><button onClick={() => handleDateFilterSelect('this-month')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${dateFilterMode === 'this-month' ? 'text-navy-primary font-bold bg-blue-50' : 'text-gray-700'}`}>Este mês</button><button onClick={() => handleDateFilterSelect('last-month')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${dateFilterMode === 'last-month' ? 'text-navy-primary font-bold bg-blue-50' : 'text-gray-700'}`}>Mês passado</button><button onClick={() => handleDateFilterSelect('this-quarter')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${dateFilterMode === 'this-quarter' ? 'text-navy-primary font-bold bg-blue-50' : 'text-gray-700'}`}>Este trimestre</button><div className="h-px bg-gray-200 my-1"></div><button onClick={() => handleDateFilterSelect('custom')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${dateFilterMode === 'custom' ? 'text-navy-primary font-bold bg-blue-50' : 'text-gray-700'}`}>Selecionar datas...</button></div>)}
           </div>
       </div>

       {/* --- KPI CARDS --- */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {/* TOTAL */}
           <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-navy-primary flex items-center justify-between">
               <div>
                   <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total de Inspeções</p>
                   <p className="text-3xl font-black text-navy-primary mt-1">{kpis.total}</p>
               </div>
               <div className="bg-blue-50 p-3 rounded-full text-navy-primary"><TrendingUp size={24} /></div>
           </div>

           {/* CONCLUIDAS */}
           <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-navy-green flex items-center justify-between">
               <div>
                   <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Concluídas</p>
                   <p className="text-3xl font-black text-navy-green mt-1">{kpis.concluded}</p>
               </div>
               <div className="bg-green-50 p-3 rounded-full text-navy-green"><CheckCircle size={24} /></div>
           </div>

           {/* PENDENTES GERAL */}
           <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-navy-yellow flex items-center justify-between">
               <div>
                   <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Pendentes / Agendadas</p>
                   <p className="text-3xl font-black text-navy-yellow mt-1">{kpis.pending}</p>
               </div>
               <div className="bg-yellow-50 p-3 rounded-full text-navy-yellow"><Clock size={24} /></div>
           </div>

           {/* MSG PENDENTES */}
           <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-navy-red flex items-center justify-between">
               <div>
                   <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">MSG Pendentes</p>
                   <p className="text-3xl font-black text-navy-red mt-1">{kpis.msgPending}</p>
               </div>
               <div className="bg-red-50 p-3 rounded-full text-navy-red"><AlertCircle size={24} /></div>
           </div>
       </div>

       {/* --- GRÁFICOS PRINCIPAIS --- */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
           {/* GRÁFICO COMPARATIVO ANUAL (2/3 da largura) */}
           <div className="lg:col-span-2 bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col">
               <h3 className="font-bold text-navy-primary mb-4 flex items-center gap-2">
                   <span className="material-symbols-outlined">bar_chart</span>
                   COMPARATIVO ANUAL DE INSPEÇÕES
                   <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded ml-auto border font-normal">Ignora Filtros de Data</span>
               </h3>
               <div className="flex-grow">
                   <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={yearlyComparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                           <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                           <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                           <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                cursor={{ fill: '#f9f9fa' }}
                           />
                           <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                           <Bar dataKey="atual" name={`Ano Atual (${new Date().getFullYear()})`} fill={COLORS.NAVY} barSize={30} radius={[4, 4, 0, 0]} />
                           <Line type="monotone" dataKey="anterior" name={`Ano Anterior (${new Date().getFullYear() - 1})`} stroke={COLORS.YELLOW} strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                       </ComposedChart>
                   </ResponsiveContainer>
               </div>
           </div>

           {/* GRÁFICO DE FINALIDADES (1/3 da largura) */}
           <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col">
               <h3 className="font-bold text-navy-primary mb-4 flex items-center gap-2">
                   <span className="material-symbols-outlined">donut_large</span>
                   PRINCIPAIS FINALIDADES
               </h3>
               <div className="flex-grow relative">
                   {finalityData.length > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                               <Pie
                                   data={finalityData}
                                   innerRadius={60}
                                   outerRadius={80}
                                   paddingAngle={5}
                                   dataKey="value"
                               >
                                   {finalityData.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={COLORS.DONUT[index % COLORS.DONUT.length]} />
                                   ))}
                               </Pie>
                               <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                               <Legend 
                                   layout="horizontal" 
                                   verticalAlign="bottom" 
                                   align="center"
                                   iconSize={8}
                                   wrapperStyle={{ fontSize: '10px' }} 
                               />
                           </PieChart>
                       </ResponsiveContainer>
                   ) : (
                       <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados no período</div>
                   )}
                   {/* Centro do Donut */}
                   {finalityData.length > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-12">
                            <span className="text-2xl font-black text-gray-300">IS</span>
                        </div>
                   )}
               </div>
           </div>
       </div>

        {/* --- GRÁFICOS SECUNDÁRIOS E WIDGETS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col h-[300px]">
                <h3 className="font-bold text-navy-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">corporate_fare</span>
                    TOP 5 OM SOLICITANTES
                </h3>
                <div className="flex-grow">
                   {omData.length > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={omData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                               <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                               <XAxis type="number" hide />
                               <YAxis dataKey="name" type="category" tick={{fontSize: 10, width: 100}} interval={0} width={50} />
                               <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                               <Bar dataKey="value" name="Inspeções" fill={COLORS.BLUE_LIGHT} radius={[0, 4, 4, 0]} barSize={20} />
                           </BarChart>
                       </ResponsiveContainer>
                   ) : (
                       <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados no período</div>
                   )}
                </div>
            </div>
            
            {/* WIDGET DE OBSERVAÇÕES PENDENTES */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col h-[300px]">
                <h3 className="font-bold text-navy-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">pending_actions</span>
                    OBSERVAÇÕES PENDENTES
                </h3>
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                    {pendingObservations.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {pendingObservations.map(record => (
                                <div key={record.id} className="p-3 bg-gray-50 rounded border border-gray-100">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-navy-primary text-sm truncate pr-2">{record.inspecionado || 'Sem Nome'}</span>
                                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded whitespace-nowrap">{record.dataEntrevista || record.dataAbertura}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 mb-2 flex gap-2">
                                        <span className="font-semibold">{record.isNumber}</span>
                                        <span>•</span>
                                        <span className="truncate">{record.om}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 line-clamp-2 italic border-l-2 border-navy-yellow pl-2" title={record.observacoes}>
                                        "{record.observacoes}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">Nenhuma observação pendente</div>
                    )}
                </div>
            </div>

            {/* BANNER MARINHA */}
            <div className="bg-navy-primary rounded-lg shadow-sm flex items-center justify-center opacity-90 relative overflow-hidden h-[300px]">
                 <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                 <div className="text-center z-10 p-6">
                     <h2 className="text-white font-header text-2xl mb-2">MARINHA DO BRASIL</h2>
                     <p className="text-yellow-400 font-body text-sm">Junta Regular de Saúde<br/>Sistema de Controle</p>
                 </div>
            </div>
        </div>


       {/* MODAL DE DATA PERSONALIZADA (REUTILIZADA) */}
       {showCustomDatePicker && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50"><div className="bg-white rounded-lg shadow-xl p-6 w-[350px]"><div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-bold text-navy-primary">Selecionar Intervalo</h3><button onClick={() => setShowCustomDatePicker(false)} className="text-gray-500 hover:text-red-500"><X size={20} /></button></div><div className="flex flex-col gap-4"><div className="flex flex-col"><label className="text-xs font-bold text-gray-600 mb-1">Data Início</label><input type="date" value={tempCustomDateRange.start} onChange={(e) => setTempCustomDateRange(prev => ({ ...prev, start: e.target.value }))} className="border p-2 rounded text-sm focus:border-navy-primary outline-none" /></div><div className="flex flex-col"><label className="text-xs font-bold text-gray-600 mb-1">Data Fim</label><input type="date" value={tempCustomDateRange.end} onChange={(e) => setTempCustomDateRange(prev => ({ ...prev, end: e.target.value }))} className="border p-2 rounded text-sm focus:border-navy-primary outline-none" /></div><div className="flex gap-2 mt-2"><button onClick={() => setShowCustomDatePicker(false)} className="flex-1 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Cancelar</button><button onClick={applyCustomDateFilter} className="flex-1 py-2 text-sm text-white bg-navy-primary rounded hover:bg-[#0a1a7a] font-bold">Aplicar</button></div></div></div></div>)}

    </div>
  );
};