import React, { useState, useMemo } from 'react';
import { InspectionRecord } from '../types';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, ArrowLeft, Clock } from 'lucide-react';

interface CalendarViewProps {
  records: InspectionRecord[];
  onSelectRecord: (record: InspectionRecord) => void;
  onSelectDate: (date: string) => void;
}

// Reuse Icon Helper logic within CalendarView component
const renderStatusIcon = (r: InspectionRecord) => {
    const s = r.statusIS;
    const m = r.msg;
    const isMsgEnviada = (m === 'MSG ENVIADA');
    const isMsgPend = (m === 'MSG PENDENTE' || m === 'MSG ATRASADA');
    
    const MatIcon = ({ cls, title, icon }: { cls: string, title: string, icon: string }) => (
        <span className={`material-symbols-outlined ${cls}`} title={title}>{icon}</span>
    );

    if (s === 'Homologada JSD') return <MatIcon cls="st-green-folder" title={s} icon="folder_check" />;
    
    if (s === 'Faltou' || s === 'IS Cancelada') {
        let cls = (s === 'Faltou') ? 'st-red' : 'st-red-heavy';
        let ico = (s === 'Faltou') ? 'person_cancel' : 'folder_delete';
        const baseIcon = <MatIcon cls={cls} title={s} icon={ico} />;
        
        if (isMsgEnviada) return <div className="double-icon-container">{baseIcon}<MatIcon cls="st-green" title="MSG ENVIADA" icon="mark_email_read" /></div>;
        if (isMsgPend) return <div className="double-icon-container">{baseIcon}<MatIcon cls="st-red" title={m} icon={m==='MSG PENDENTE'?'unsubscribe':'bomb'} /></div>;
        return baseIcon;
    }

    if (isMsgEnviada) return <MatIcon cls="st-green" title="MSG ENVIADA" icon="mark_email_read" />;
    
    if (s === 'TIS assinado' && r.tis && r.ds1a && String(r.tis).trim() !== "" && String(r.ds1a).trim() !== "") {
        if (isMsgPend) return <MatIcon cls="st-red" title={m} icon={m==='MSG PENDENTE'?'unsubscribe':'bomb'} />;
        return <MatIcon cls="st-green" title="TIS assinado" icon="check_circle" />;
    }

    if(s==='IS aberta') return <MatIcon cls="st-blue" title={s} icon="folder_open" />;
    if(s==='IS Agendada') return <MatIcon cls="st-green" title={s} icon="calendar_check" />;
    if(s==='IS Remarcada') return <MatIcon cls="st-yellow" title={s} icon="calendar_clock" />;
    if(s==='Conclusão Pendente') return <MatIcon cls="st-red-outlined" title={s} icon="unknown_document" />;
    if(s==='Declínio de competência de MPI') return <MatIcon cls="st-blue-heavy" title={s} icon="input" />;
    if(s==='Revisão Ex-officio de MPI') return <MatIcon cls="st-blue-heavy" title={s} icon="document_search" />;
    if(s==='Homologada Ex-officio de MPI') return <MatIcon cls="st-blue-heavy" title={s} icon="gavel" />;
    if(s==='Inspecionado atrasado') return <MatIcon cls="st-red-acute" title={s} icon="acute" />;
    if(s==='AUDITORIA CPMM') return <MatIcon cls="st-yellow-light" title={s} icon="document_search" />;
    if(s==='Aprovada AUDITORIA CPMM') return <MatIcon cls="st-green-task" title={s} icon="task" />;
    if(s==='REVISÃO JSD') return <MatIcon cls="st-yellow-heavy" title={s} icon="gavel" />;
    if(s==='Restituída AUDITORIA CPMM' || s==='Restituída JSD') return <MatIcon cls="st-yellow-reply" title={s} icon="assignment_return" />;
    if(s==='IS Concluída s/ voto') return <MatIcon cls="st-red" title={s} icon="how_to_vote" />;
    if(s==='IS Votada s/ assinatura') return <MatIcon cls="st-red-heavy-48" title={s} icon="signature" />;
    if(s==='TIS assinado') return <MatIcon cls="st-green" title={s} icon="check_circle" />;
    
    return <MatIcon cls="st-gray" title={s} icon="help" />;
};

export const CalendarView: React.FC<CalendarViewProps> = ({ records, onSelectRecord, onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'day'>('month');
  
  // Filters
  const [filterAmp, setFilterAmp] = useState<string>('');
  const [filterDoctor, setFilterDoctor] = useState<string>('');

  // Helper para formatar data DD/MM/AAAA para comparação
  const formatDateKey = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const parseDateStr = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  const isPastDate = (d: Date) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(d);
    target.setHours(0,0,0,0);
    return target < today;
  };

  // --- FILTER LOGIC ---
  const currentMonthRecords = useMemo(() => {
    const monthStr = currentDate.getMonth();
    const yearStr = currentDate.getFullYear();
    return records.filter(r => {
        const d = parseDateStr(r.dataEntrevista);
        return d && d.getMonth() === monthStr && d.getFullYear() === yearStr;
    });
  }, [records, currentDate]);

  const filteredRecords = useMemo(() => {
      let data = currentMonthRecords;
      if (filterAmp) data = data.filter(r => r.amp.includes(filterAmp));
      if (filterDoctor) data = data.filter(r => r.medico === filterDoctor);
      return data;
  }, [currentMonthRecords, filterAmp, filterDoctor]);

  const availableDoctors = useMemo(() => {
    // Only show doctors that have appointments in the current month view
    const docs = new Set(currentMonthRecords.map(r => r.medico).filter(Boolean));
    return Array.from(docs).sort();
  }, [currentMonthRecords]);


  // --- NAVIGATION ---
  const next = () => {
    if (view === 'month') {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setCurrentDate(nextDay);
    }
  };

  const prev = () => {
    if (view === 'month') {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
        const prevDay = new Date(currentDate);
        prevDay.setDate(prevDay.getDate() - 1);
        setCurrentDate(prevDay);
    }
  };

  const goToday = () => {
      const today = new Date();
      setCurrentDate(today);
      if (view === 'month') setView('day');
  };

  const headerTitle = view === 'month' 
      ? currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()
      : currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();


  // --- MONTH GRID LOGIC ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Domingo

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

  const getEventsForDay = (date: Date) => {
    const dateKey = formatDateKey(date);
    return filteredRecords.filter(r => r.dataEntrevista === dateKey);
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('cancelada') || s.includes('faltou')) return 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100';
    if (s.includes('assinado') || s.includes('concluída')) return 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100';
    return 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100';
  };

  // --- DAY VIEW LOGIC ---
  const dayRecords = useMemo(() => {
    const dateKey = formatDateKey(currentDate);
    return filteredRecords.filter(r => r.dataEntrevista === dateKey);
  }, [filteredRecords, currentDate]);

  const recordsByDoctor = useMemo(() => {
      const groups: {[key: string]: InspectionRecord[]} = {};
      
      // Agrupa por médico
      dayRecords.forEach(r => {
          const doc = r.medico || 'SEM MÉDICO';
          if (!groups[doc]) groups[doc] = [];
          groups[doc].push(r);
      });
      
      // Ordena cada grupo por horário
      Object.keys(groups).forEach(doc => {
          groups[doc].sort((a,b) => (a.horaEntrevista || '00:00').localeCompare(b.horaEntrevista || '00:00'));
      });
      
      return groups;
  }, [dayRecords]);

  // --- RENDERS ---

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col h-[800px] overflow-hidden">
      {/* Header */}
      <div className="flex flex-col border-b border-gray-200 bg-navy-neutral rounded-t-lg">
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
                 {view === 'day' && (
                    <button onClick={() => setView('month')} className="p-1 hover:bg-gray-200 rounded text-navy-primary" title="Voltar ao Mês">
                        <ArrowLeft size={20} />
                    </button>
                 )}
                 <h2 className="text-xl font-bold text-navy-primary font-sans">{headerTitle}</h2>

                 {/* Filters inline next to Title */}
                 {view === 'month' && (
                    <div className="flex gap-2 ml-4">
                        <select 
                            value={filterAmp} 
                            onChange={(e) => setFilterAmp(e.target.value)}
                            className="border p-1.5 rounded text-xs text-navy-primary font-bold focus:outline-none focus:border-navy-primary bg-white min-w-[120px]"
                        >
                            <option value="">TODOS AMPS</option>
                            <option value="JRS">JRS</option>
                            <option value="MPI">MPI</option>
                        </select>

                        <select 
                            value={filterDoctor} 
                            onChange={(e) => setFilterDoctor(e.target.value)}
                            className="border p-1.5 rounded text-xs text-navy-primary font-bold focus:outline-none focus:border-navy-primary bg-white min-w-[200px]"
                        >
                            <option value="">TODOS MÉDICOS</option>
                            {availableDoctors.map(doc => <option key={doc} value={doc}>{doc}</option>)}
                        </select>
                    </div>
                 )}
            </div>
            
            <div className="flex gap-2">
            <button onClick={prev} className="p-2 hover:bg-gray-200 rounded-full text-navy-primary transition"><ChevronLeft size={24} /></button>
            <button onClick={goToday} className="px-3 py-1 text-sm font-bold text-navy-primary border border-navy-primary rounded hover:bg-navy-primary hover:text-white transition">HOJE</button>
            <button onClick={next} className="p-2 hover:bg-gray-200 rounded-full text-navy-primary transition"><ChevronRight size={24} /></button>
            </div>
        </div>
      </div>

      {view === 'month' ? (
          <>
            {/* Custom Grid Header - Sábado e Domingo menores */}
            <div className="grid grid-cols-[0.4fr_1fr_1fr_1fr_1fr_1fr_0.4fr] bg-navy-primary text-white font-bold text-center py-2 text-sm uppercase tracking-wider">
                <div>Dom</div>
                <div>Seg</div>
                <div>Ter</div>
                <div>Qua</div>
                <div>Qui</div>
                <div>Sex</div>
                <div>Sáb</div>
            </div>

            {/* Custom Grid Body */}
            <div className="grid grid-cols-[0.4fr_1fr_1fr_1fr_1fr_1fr_0.4fr] flex-grow auto-rows-fr bg-gray-200 gap-px border-b border-gray-200 overflow-y-auto">
                {days.map((date, index) => {
                    const isWeekend = index % 7 === 0 || index % 7 === 6;
                    
                    if (!date) return <div key={`empty-${index}`} className={`${isWeekend ? 'bg-gray-100' : 'bg-gray-50'} min-h-[100px]`} />;

                    const dayEvents = getEventsForDay(date);
                    const isToday = formatDateKey(new Date()) === formatDateKey(date);
                    const isPast = isPastDate(date);
                    
                    return (
                        <div 
                        key={index} 
                        className={`${isWeekend ? 'bg-gray-100' : 'bg-white'} min-h-[100px] p-1 flex flex-col group hover:bg-blue-50 transition relative ${isToday ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                            setCurrentDate(date);
                            setView('day');
                        }}
                        >
                        <div className="flex justify-between items-start mb-1 px-1">
                            <span 
                                className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-navy-primary text-white' : 'text-gray-700'}`}
                            >
                                {date.getDate()}
                            </span>
                            {!isWeekend && !isPast && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onSelectDate(formatDateKey(date)); }}
                                    className="opacity-0 group-hover:opacity-100 text-navy-primary hover:bg-navy-yellow rounded-full p-0.5 transition"
                                    title="Nova IS"
                                >
                                    <Plus size={14} />
                                </button>
                            )}
                        </div>

                        <div className="flex-grow flex flex-col gap-1 overflow-y-auto max-h-[100px] custom-scrollbar px-1">
                            {dayEvents.map(record => (
                            <button
                                key={record.id}
                                onClick={(e) => { e.stopPropagation(); onSelectRecord(record); }}
                                className={`text-left text-[10px] p-1 rounded border mb-0.5 truncate transition hover:shadow-sm ${getStatusColor(record.statusIS)}`}
                                title={`${record.horaEntrevista} ${record.inspecionado}`}
                            >
                                <span className="font-bold mr-1">{record.horaEntrevista}</span>
                                <span className="uppercase">{record.inspecionado}</span>
                            </button>
                            ))}
                        </div>
                        </div>
                    );
                })}
            </div>
          </>
      ) : (
          /* DAY VIEW OPTIMIZED */
          <div className="flex-grow overflow-y-auto p-4 bg-gray-50 custom-scrollbar">
             {Object.keys(recordsByDoctor).length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400">
                     <CalendarIcon size={48} className="mb-2 opacity-50"/>
                     <p>Nenhuma inspeção agendada para este dia.</p>
                     {!isPastDate(currentDate) && (
                         <button onClick={() => onSelectDate(formatDateKey(currentDate))} className="mt-4 px-4 py-2 bg-navy-primary text-white rounded font-bold text-sm hover:bg-[#0a1a7a] transition">
                            Agendar Inspeção
                         </button>
                     )}
                 </div>
             ) : (
                 <div className="flex flex-col gap-6">
                     {Object.entries(recordsByDoctor).map(([doctor, doctorRecords]) => (
                         <div key={doctor} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                             {/* Doctor Header */}
                             <div className="bg-navy-primary text-white px-4 py-3 font-bold text-sm flex justify-between items-center sticky top-0 z-10 shadow-sm">
                                 <div className="flex items-center gap-2">
                                     <span className="material-symbols-outlined text-[20px]">stethoscope</span>
                                     <span className="text-base tracking-wide">{doctor}</span>
                                 </div>
                                 <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">{doctorRecords.length} Inspeções</span>
                             </div>
                             
                             {/* Time Slots Grid */}
                             <div className="divide-y divide-gray-100">
                                 {doctorRecords.map(record => (
                                     <div 
                                        key={record.id} 
                                        className="hover:bg-gray-50 transition cursor-pointer flex items-stretch group"
                                        onClick={() => onSelectRecord(record)}
                                     >
                                         {/* Time Column */}
                                         <div className="w-[85px] bg-gray-50 border-r border-gray-200 flex flex-col justify-center items-center p-3 group-hover:bg-blue-50/50 transition-colors">
                                             <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                                                <Clock size={12} />
                                             </div>
                                             <div className="text-lg font-black text-navy-primary tracking-tight">{record.horaEntrevista || '--:--'}</div>
                                             <div className={`text-[9px] font-bold px-1.5 rounded mt-1 border ${record.amp === 'JRS' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200'}`}>{record.amp}</div>
                                         </div>
                                         
                                         {/* Info Column */}
                                         <div className="flex-grow p-3 pl-4 flex flex-col justify-center">
                                             <div className="flex items-center gap-2 mb-1">
                                                 <span className="font-bold text-gray-500 text-xs px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">{record.pgq}</span>
                                                 <span className="font-bold text-navy-primary text-sm uppercase leading-tight line-clamp-1">{record.inspecionado}</span>
                                             </div>
                                             <div className="text-xs text-gray-500 flex items-center gap-2">
                                                 <span className="truncate max-w-[300px]" title={record.finalidade}>{record.finalidade}</span>
                                                 <span className="text-gray-300">•</span>
                                                 <span className="text-gray-400 font-mono text-[10px]">{record.isNumber}</span>
                                             </div>
                                         </div>

                                         {/* Status Column */}
                                         <div className="flex flex-col items-center justify-center px-4 border-l border-gray-50 group-hover:bg-gray-50">
                                             {renderStatusIcon(record)}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     ))}
                 </div>
             )}
          </div>
      )}
    </div>
  );
};