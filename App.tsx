import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { DOCTORS, FINALITIES as MOCK_FINALITIES, ORGANIZATIONS as MOCK_ORGS, RANKS as MOCK_RANKS, RESTRICTIONS_LIST as DEFAULT_RESTRICTIONS } from './services/mockData';
import { api } from './services/api';
import { InspectionRecord, Finality, Organization, Rank } from './types';
import { RecordForm } from './components/RecordForm';
import { CalendarView } from './components/CalendarView';
import { Dashboard } from './components/Dashboard';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { Toast, ToastType } from './components/ui/Toast';
import { Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react';

type Page = 'inspecoes' | 'dashboard' | 'parecer';
type ViewMode = 'list' | 'calendar';
type FilterType = 'all' | 'agendada' | 'concluida' | 'faltas' | 'canceladas' | 'conclusao_pendente' | 'msg_pendente';
type DateFilterOption = 'all' | 'this-week' | 'this-month' | 'last-month' | 'this-quarter' | 'custom';

function App() {
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  
  // Listas Dinâmicas (Inicializadas com Mock, atualizadas pela API)
  const [restrictionsList, setRestrictionsList] = useState<string[]>(DEFAULT_RESTRICTIONS);
  const [omList, setOmList] = useState<Organization[]>(MOCK_ORGS);
  const [ranksList, setRanksList] = useState<Rank[]>(MOCK_RANKS);
  const [statusList, setStatusList] = useState<string[]>(['IS aberta', 'IS Agendada', 'IS Remarcada', 'Conclusão Pendente', 'IS Concluída s/ voto', 'IS Votada s/ assinatura', 'TIS assinado', 'IS Cancelada', 'Faltou', 'Restituída']);
  const [msgList, setMsgList] = useState<string[]>(['MSG ENVIADA', 'MSG PENDENTE', 'MSG ATRASADA']);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InspectionRecord | undefined>(undefined);
  const [isViewMode, setIsViewMode] = useState(false); // Novo estado para modo leitura

  const [activePage, setActivePage] = useState<Page>('inspecoes');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Date Filter States
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterOption>('this-month');
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  const [tempCustomDateRange, setTempCustomDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  const dateMenuRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.fetchData();
      setRecords(data.records);
      
      // Atualiza listas dinâmicas se disponíveis na API
      if (data.lists) {
          if (data.lists.restricoes && data.lists.restricoes.length > 0) {
              setRestrictionsList(data.lists.restricoes);
          }
          if (data.lists.om && data.lists.om.length > 0) {
              setOmList(data.lists.om.map(s => ({ sigla: s })));
          }
          if (data.lists.pg && data.lists.pg.length > 0) {
              setRanksList(data.lists.pg.map(s => ({ sigla: s })));
          }
          if (data.lists.status && data.lists.status.length > 0) {
              setStatusList(data.lists.status);
          }
          if (data.lists.msg && data.lists.msg.length > 0) {
              setMsgList(data.lists.msg);
          }
      }
    } catch (err) {
      setError("Falha ao carregar dados. Verifique a conexão ou a URL da API.");
      console.error(err);
      showToast("Erro ao conectar com o servidor.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Click outside to close date menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target as Node)) {
        setShowDateMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce Search Term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // --- LOGIC: DATE HELPER FUNCTIONS ---
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

  // --- LOGIC: DATA PROCESSING ---
  const recordsInDateRange = useMemo(() => {
      if (dateFilterMode === 'all') return records;
      const range = getDateRangeForFilter(dateFilterMode);
      if (!range) return records;
      return records.filter(r => {
          const dateToCheck = r.dataEntrevista || r.dataAbertura;
          return isDateInRange(dateToCheck, range.start, range.end);
      });
  }, [records, dateFilterMode, customDateRange]);

  const counts = useMemo(() => {
    return {
        all: recordsInDateRange.length,
        agendada: recordsInDateRange.filter(d => ['IS Agendada', 'IS Remarcada'].includes(d.statusIS)).length,
        concluida: recordsInDateRange.filter(d => ['IS Concluída s/ voto', 'IS Votada s/ assinatura', 'TIS assinado', 'Homologada JSD', 'Aprovada AUDITORIA CPMM'].includes(d.statusIS)).length,
        faltas: recordsInDateRange.filter(d => d.statusIS === 'Faltou').length,
        canceladas: recordsInDateRange.filter(d => d.statusIS === 'IS Cancelada').length,
        conclusao_pendente: records.filter(d => d.statusIS === 'Conclusão Pendente').length,
        msg_pendente: records.filter(d => d.msg === 'MSG PENDENTE' || d.msg === 'MSG ATRASADA').length
    };
  }, [records, recordsInDateRange]);

  const filteredRecords = useMemo(() => {
    let result = recordsInDateRange;
    if (debouncedSearchTerm) {
        const lowerSearch = debouncedSearchTerm.toLowerCase();
        result = result.filter(record => 
            String(record.inspecionado || '').toLowerCase().includes(lowerSearch) ||
            String(record.isNumber || '').toLowerCase().includes(lowerSearch) ||
            String(record.nip || '').toLowerCase().includes(lowerSearch)
        );
    }
    switch (activeFilter) {
        case 'agendada': result = result.filter(d => ['IS Agendada', 'IS Remarcada'].includes(d.statusIS)); break;
        case 'concluida': result = result.filter(d => ['IS Concluída s/ voto', 'IS Votada s/ assinatura', 'TIS assinado', 'Homologada JSD', 'Aprovada AUDITORIA CPMM'].includes(d.statusIS)); break;
        case 'faltas': result = result.filter(d => d.statusIS === 'Faltou'); break;
        case 'canceladas': result = result.filter(d => d.statusIS === 'IS Cancelada'); break;
        case 'conclusao_pendente': result = records.filter(d => d.statusIS === 'Conclusão Pendente'); break;
        case 'msg_pendente': result = records.filter(d => d.msg === 'MSG PENDENTE' || d.msg === 'MSG ATRASADA'); break;
        default: break;
    }
    return [...result].sort((a, b) => {
         const da = (a.dataAbertura || '00/00/0000').split('/').reverse().join('');
         const db = (b.dataAbertura || '00/00/0000').split('/').reverse().join('');
         return da.localeCompare(db);
    });
  }, [records, recordsInDateRange, debouncedSearchTerm, activeFilter]);

  // --- ICONS & ACTIONS ---
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
    if (isMsgPend) return <MatIcon cls="st-red" title={m} icon={m==='MSG PENDENTE'?'unsubscribe':'bomb'} />;

    if (s === 'TIS assinado') return <MatIcon cls="st-green" title={s} icon="check_circle" />;
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
    
    return <MatIcon cls="st-gray" title={s} icon="help" />;
  };

  const renderActionButtons = (r: InspectionRecord) => {
    const s = r.statusIS;
    const m = r.msg;
    const isMsgEnviada = (m === 'MSG ENVIADA');
    const isMsgPendOrDelayed = (m === 'MSG PENDENTE' || m === 'MSG ATRASADA');
    const hasDocs = (r.tis && String(r.tis).trim() !== "") && (r.ds1a && String(r.ds1a).trim() !== "");
    
    const ActionBtn = ({ icon, cls, title, onClick }: any) => (
        <button className="border-none bg-none cursor-pointer p-1.5 rounded-full transition-transform hover:bg-gray-200 hover:scale-110 flex items-center justify-center" title={title} onClick={(e) => { e.stopPropagation(); onClick(); }}>
            <span className={`material-symbols-outlined ${cls}`}>{icon}</span>
        </button>
    );

    const buttons = [];

    if(s==='AUDITORIA CPMM' || s==='REVISÃO JSD') {
        buttons.push(<ActionBtn key="restituir" icon="reply" cls="act-reply" title="Registrar IS restituida" onClick={() => handleStatusUpdate(r, 'restituir')} />);
    }
    if(!r.dataEntrevista && ['IS aberta', 'Declínio de competência de MPI', 'Revisão Ex-officio de MPI'].includes(s)) {
        buttons.push(<ActionBtn key="agendar" icon="event_upcoming" cls="act-green" title="Agendar IS" onClick={() => handleEdit(r)} />);
    }
    if (!isMsgEnviada && (isMsgPendOrDelayed || (s==='TIS assinado' && hasDocs))) {
        buttons.push(<ActionBtn key="msg" icon="outgoing_mail" cls="act-green" title="Registrar MSG enviada" onClick={() => handleStatusUpdate(r, 'msg_sent')} />);
    }
    if(['IS aberta','IS Agendada','IS Remarcada','Conclusão Pendente'].includes(s)) {
        buttons.push(<ActionBtn key="cancel" icon="close" cls="act-red" title="Cancelar IS" onClick={() => handleStatusUpdate(r, 'cancel')} />);
    }
    if(['IS Agendada','IS Remarcada','Faltou'].includes(s) && !isMsgEnviada) {
        buttons.push(<ActionBtn key="reagendar" icon="event_repeat" cls="act-yellow" title="Reagendar IS" onClick={() => handleEdit(r)} />);
    }
    const editAllowed = ['Declínio de competência de MPI', 'Revisão Ex-officio de MPI', 'Homologada Ex-officio de MPI', 'IS Agendada', 'IS Remarcada', 'Conclusão Pendente', 'Aprovada AUDITORIA CPMM', 'Restituída AUDITORIA CPMM', 'Restituída JSD', 'IS Concluída s/ voto', 'IS Votada s/ assinatura', 'IS aberta'].includes(s) || isMsgPendOrDelayed;
    if (editAllowed && !isMsgEnviada) {
        buttons.push(<ActionBtn key="edit" icon="edit" cls="act-blue" title="Editar IS" onClick={() => handleEdit(r)} />);
    }
    const notStarted = ['IS aberta', 'Inspecionado atrasado', 'IS Cancelada', 'Faltou'].includes(s);
    const ended = ['Homologada JSD', 'AUDITORIA CPMM', 'REVISÃO JSD', 'TIS assinado'].includes(s) || isMsgEnviada;
    if (notStarted || ended) {
        buttons.push(<ActionBtn key="view" icon="visibility" cls="act-blue" title="Abrir Detalhamento IS" onClick={() => handleView(r)} />);
    }
    return <div className="flex gap-1 justify-end">{buttons}</div>;
  };

  const handleAdd = () => { setEditingRecord(undefined); setIsViewMode(false); setIsModalOpen(true); };
  const handleEdit = (record: InspectionRecord) => { setEditingRecord(record); setIsViewMode(false); setIsModalOpen(true); };
  const handleView = (record: InspectionRecord) => { setEditingRecord(record); setIsViewMode(true); setIsModalOpen(true); };
  
  const handleStatusUpdate = async (record: InspectionRecord, action: string) => { 
      let confirmMsg = '';
      if (action === 'cancel') confirmMsg = 'Tem certeza que deseja CANCELAR esta Inspeção?';
      else if (action === 'msg_sent') confirmMsg = 'Confirmar envio de MENSAGEM?';
      else if (action === 'restituir') confirmMsg = 'Confirmar restituição da Inspeção?';
      else confirmMsg = `Confirmar ação: ${action}?`;
      
      if(!window.confirm(confirmMsg)) return; 
      
      setIsSaving(true);
      try {
        const id = record.id;
        setRecords(prevRecords => prevRecords.map(r => {
            if (r.id === id) {
                const updated = { ...r };
                if (action === 'cancel') {
                    updated.statusIS = 'IS Cancelada';
                    if (updated.msg !== 'MSG ENVIADA') updated.msg = 'MSG PENDENTE';
                } else if (action === 'msg_sent') {
                    updated.msg = 'MSG ENVIADA';
                } else if (action === 'restituir') {
                    if (updated.statusIS === 'AUDITORIA CPMM') updated.statusIS = 'Restituída AUDITORIA CPMM';
                    else if (updated.statusIS === 'REVISÃO JSD') updated.statusIS = 'Restituída JSD';
                }
                return updated;
            }
            return r;
        }));

        if (action === 'cancel') {
            await api.patchRecord(id, { statusIS: 'IS Cancelada', msg: 'MSG PENDENTE' });
        } else if (action === 'msg_sent') {
            await api.patchRecord(id, { msg: 'MSG ENVIADA' });
        } else if (action === 'restituir') {
             let newStatus = record.statusIS;
             if (newStatus === 'AUDITORIA CPMM') newStatus = 'Restituída AUDITORIA CPMM';
             else if (newStatus === 'REVISÃO JSD') newStatus = 'Restituída JSD';
             await api.patchRecord(id, { statusIS: newStatus });
        }
        showToast(`Ação realizada com sucesso!`, 'success');
        setTimeout(() => loadData(), 500);
      } catch (e) {
        console.error(e);
        showToast("Erro ao processar ação. A alteração foi revertida.", "error");
        loadData();
      } finally {
        setIsSaving(false);
      }
  };

  const handleSave = async (record: InspectionRecord) => {
    setIsSaving(true);
    try {
        const isUpdate = (editingRecord && editingRecord.id !== '') || (record.id && records.some(r => r.id === record.id));
        if (isUpdate) {
            await api.updateRecord(record); 
            setRecords(prev => prev.map(r => r.id === record.id ? record : r));
            showToast('Inspeção atualizada com sucesso!', 'success');
        } else {
            await api.createRecord(record);
            showToast('Nova Inspeção criada com sucesso! Atualize a lista em instantes.', 'success');
            setTimeout(() => loadData(), 1500); 
        }
        setIsModalOpen(false);
    } catch (err) { 
        console.error(err);
        showToast("Erro ao salvar o registro. Tente novamente.", "error");
    } finally { 
        setIsSaving(false); 
    }
  };

  const handleDateFilterSelect = (mode: DateFilterOption) => { if (mode === 'custom') { setShowDateMenu(false); setShowCustomDatePicker(true); } else { setDateFilterMode(mode); setShowDateMenu(false); } };
  const applyCustomDateFilter = () => { setCustomDateRange(tempCustomDateRange); setDateFilterMode('custom'); setShowCustomDatePicker(false); };
  const getFilterLabel = () => { switch(dateFilterMode) { case 'this-week': return 'Esta Semana'; case 'this-month': return 'Este Mês'; case 'last-month': return 'Mês Passado'; case 'this-quarter': return 'Este Trimestre'; case 'custom': return 'Personalizado'; default: return 'Todas as Datas'; } };

  const Chip = ({ type, label, count, isAlert = false }: any) => (
      <div onClick={() => { setActiveFilter(type); if (type === 'conclusao_pendente' || type === 'msg_pendente') setDateFilterMode('all'); }} className={`px-4 py-2 bg-white border border-[#ddd] rounded-[20px] cursor-pointer text-[13px] font-semibold text-[#555] whitespace-nowrap transition-all select-none hover:bg-gray-100 flex items-center ${activeFilter === type ? 'bg-[#050F41] text-white border-[#050F41] !bg-navy-primary' : ''} ${isAlert && count > 0 && activeFilter !== type ? 'text-[#B71C1C]' : ''} ${isAlert && activeFilter === type ? '!bg-[#B71C1C] !border-[#B71C1C]' : ''}`}>
        {label} <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] ${activeFilter === type ? 'bg-white/20 text-white' : (isAlert && count > 0 ? 'bg-[#B71C1C] text-white' : 'bg-black/10')}`}>{count}</span>
      </div>
  );

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
        
        {/* Renderiza DASHBOARD ou LISTA dependendo da página ativa */}
        {activePage === 'dashboard' ? (
             <Dashboard records={records} />
        ) : (
            <>
                <div className="bg-navy-primary text-white p-5 rounded-lg mb-5 flex justify-center items-center"><div className="text-center"><h1 className="font-main font-black text-[32px] uppercase m-0">INSPEÇÕES DE SAÚDE</h1></div></div>

                {viewMode === 'list' && (<div className="flex gap-2.5 mb-4 overflow-x-auto pb-1.5"><Chip type="all" label="Todos" count={counts.all} /><Chip type="agendada" label="Agendadas" count={counts.agendada} /><Chip type="concluida" label="Concluídas" count={counts.concluida} /><Chip type="faltas" label="Faltas" count={counts.faltas} /><Chip type="canceladas" label="Canceladas" count={counts.canceladas} /><Chip type="conclusao_pendente" label="Conclusões Pendentes" count={counts.conclusao_pendente} isAlert={true} /><Chip type="msg_pendente" label="MSG Pendentes" count={counts.msg_pendente} isAlert={true} /></div>)}

                <div className="bg-white p-5 rounded-lg shadow-sm mb-5 flex flex-wrap gap-4 items-center justify-between border border-gray-100">
                    <div className="flex gap-4 items-center flex-wrap">
                        <div className="relative w-[250px]">
                            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-gray-400 pointer-events-none text-[20px]">search</span>
                            <input type="text" placeholder="Buscar por nome..." autoComplete="off" className="w-full pl-9 pr-2.5 py-2.5 border border-gray-300 rounded font-main box-border text-sm focus:border-navy-primary outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        {viewMode === 'list' && (<div className="relative" ref={dateMenuRef}>
                            <button onClick={() => setShowDateMenu(!showDateMenu)} className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100 transition min-w-[160px] justify-between"><div className="flex items-center gap-2"><CalendarIcon size={16} className="text-navy-primary" /><span className="font-medium">{getFilterLabel()}</span></div><ChevronDown size={14} className={`transition-transform ${showDateMenu ? 'rotate-180' : ''}`} /></button>
                            {showDateMenu && (<div className="absolute top-full left-0 mt-1 w-[200px] bg-white border border-gray-200 rounded shadow-lg z-20 py-1"><button onClick={() => handleDateFilterSelect('all')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${dateFilterMode === 'all' ? 'text-navy-primary font-bold bg-blue-50' : 'text-gray-700'}`}>Todas as Datas</button><button onClick={() => handleDateFilterSelect('this-week')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${dateFilterMode === 'this-week' ? 'text-navy-primary font-bold bg-blue-50' : 'text-gray-700'}`}>Esta semana</button><button onClick={() => handleDateFilterSelect('this-month')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${dateFilterMode === 'this-month' ? 'text-navy-primary font-bold bg-blue-50' : 'text-gray-700'}`}>Este mês</button><button onClick={() => handleDateFilterSelect('last-month')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${dateFilterMode === 'last-month' ? 'text-navy-primary font-bold bg-blue-50' : 'text-gray-700'}`}>Mês passado</button><button onClick={() => handleDateFilterSelect('this-quarter')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${dateFilterMode === 'this-quarter' ? 'text-navy-primary font-bold bg-blue-50' : 'text-gray-700'}`}>Este trimestre</button><div className="h-px bg-gray-200 my-1"></div><button onClick={() => handleDateFilterSelect('custom')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${dateFilterMode === 'custom' ? 'text-navy-primary font-bold bg-blue-50' : 'text-gray-700'}`}>Selecionar datas...</button></div>)}
                        </div>)}
                        <div className="flex bg-gray-100 p-1 rounded"><button onClick={() => setViewMode('list')} className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold uppercase transition ${viewMode === 'list' ? 'bg-white shadow text-navy-primary' : 'text-gray-500'}`}><span className="material-symbols-outlined text-[18px]">list</span> Lista</button><button onClick={() => setViewMode('calendar')} className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold uppercase transition ${viewMode === 'calendar' ? 'bg-white shadow text-navy-primary' : 'text-gray-500'}`}><span className="material-symbols-outlined text-[18px]">calendar_month</span> Calendário</button></div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setIsLoading(true); localStorage.clear(); loadData(); }} className="h-[40px] px-4 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 flex items-center gap-2 text-[13px] font-bold uppercase" title="Forçar atualização (Limpa Cache)"><span className={`material-symbols-outlined text-[20px] ${isLoading ? 'animate-spin' : ''}`}>refresh</span></button>
                        {viewMode === 'list' && (<button onClick={handleAdd} className="h-[40px] px-5 bg-navy-primary text-white rounded hover:bg-[#0a1a7a] flex items-center gap-2 text-[13px] font-bold uppercase transition shadow-sm"><span className="material-symbols-outlined text-[20px]">add</span> Nova Inspeção</button>)}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-x-auto min-h-[400px] border border-gray-100">
                    {isLoading && records.length === 0 ? (<LoadingSpinner />) : viewMode === 'list' ? (
                        <table className="w-full border-collapse min-w-[1000px]">
                            <thead><tr><th className="bg-navy-primary text-white text-left p-4 font-semibold uppercase text-xs border-b-[3px] border-navy-yellow whitespace-nowrap w-[90px] text-center">STATUS</th><th className="bg-navy-primary text-white text-left p-4 font-semibold uppercase text-xs border-b-[3px] border-navy-yellow whitespace-nowrap w-[120px]">DATA</th><th className="bg-navy-primary text-white text-left p-4 font-semibold uppercase text-xs border-b-[3px] border-navy-yellow">INSPECIONADO</th><th className="bg-navy-primary text-white text-left p-4 font-semibold uppercase text-xs border-b-[3px] border-navy-yellow">FINALIDADE / AÇÕES</th></tr></thead>
                            <tbody>
                                {filteredRecords.length === 0 ? (<tr><td colSpan={4} className="p-8 text-center text-gray-500">Nenhum registro encontrado.</td></tr>) : (
                                    filteredRecords.map((r, i) => (
                                        <tr key={r.id} className="hover:bg-[#f9f9fa] border-b border-gray-100 transition-colors">
                                            <td className="p-3 text-[#333] text-[13px] align-middle text-center w-[90px]">{renderStatusIcon(r)}</td>
                                            <td className="p-3 text-[#333] text-[13px] align-middle"><div className="font-bold text-navy-primary">{r.dataEntrevista || r.dataAbertura}</div><div className="text-gray-500 text-[11px]">{r.horaEntrevista}</div><div className="text-[10px] text-gray-400 mt-1">IS: {r.isNumber}</div></td>
                                            <td className="p-3 text-[#333] text-[13px] align-middle"><div className="font-bold text-gray-800">{r.inspecionado}</div><div className="text-[11px] text-gray-500 mt-0.5 flex items-center">{r.pgq} - {r.nip} <span className="ml-2 text-[10px] text-[#777] bg-gray-100 px-1 rounded border border-gray-200">{r.om}</span></div>{r.medico && (<div className="text-[10px] text-navy-primary mt-1 font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">stethoscope</span> {r.medico}</div>)}</td>
                                            <td className="p-3 text-[#333] text-[13px] align-middle"><div className="flex justify-between items-center w-full h-full"><div className="font-medium text-[#444] mr-2">{r.finalidade}<span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${r.amp === 'JRS' ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800'}`}>{r.amp}</span></div><div className="flex gap-1 justify-end">{renderActionButtons(r)}</div></div></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <CalendarView records={records} onSelectRecord={handleEdit} onSelectDate={(dateStr) => { setEditingRecord({ id: '', isNumber: '', dataAbertura: new Date().toLocaleDateString('pt-BR'), dataEntrevista: dateStr, horaEntrevista: '07:30', finalidade: '', amp: '', medico: '', om: '', pgq: '', nip: '', inspecionado: '', statusIS: 'IS aberta', dataLaudo: '', laudo: '', observacoes: '', restricoes: '', tis: '', ds1a: '', msg: '' }); setIsModalOpen(true); }} />
                    )}
                </div>
                <div className="mt-2 text-xs text-gray-400 text-right px-2">Mostrando {filteredRecords.length} registro(s)</div>
            </>
        )}

        <RecordForm 
            isOpen={isModalOpen} 
            onClose={() => !isSaving && setIsModalOpen(false)} 
            onSave={handleSave} 
            initialData={editingRecord} 
            doctors={DOCTORS} 
            finalities={MOCK_FINALITIES} 
            orgs={omList} 
            ranks={ranksList} 
            restrictions={restrictionsList}
            statusList={statusList}
            msgList={msgList}
            isReadOnly={isViewMode}
        />

        {showCustomDatePicker && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50"><div className="bg-white rounded-lg shadow-xl p-6 w-[350px]"><div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-bold text-navy-primary">Selecionar Intervalo</h3><button onClick={() => setShowCustomDatePicker(false)} className="text-gray-500 hover:text-red-500"><X size={20} /></button></div><div className="flex flex-col gap-4"><div className="flex flex-col"><label className="text-xs font-bold text-gray-600 mb-1">Data Início</label><input type="date" value={tempCustomDateRange.start} onChange={(e) => setTempCustomDateRange(prev => ({ ...prev, start: e.target.value }))} className="border p-2 rounded text-sm focus:border-navy-primary outline-none" /></div><div className="flex flex-col"><label className="text-xs font-bold text-gray-600 mb-1">Data Fim</label><input type="date" value={tempCustomDateRange.end} onChange={(e) => setTempCustomDateRange(prev => ({ ...prev, end: e.target.value }))} className="border p-2 rounded text-sm focus:border-navy-primary outline-none" /></div><div className="flex gap-2 mt-2"><button onClick={() => setShowCustomDatePicker(false)} className="flex-1 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Cancelar</button><button onClick={applyCustomDateFilter} className="flex-1 py-2 text-sm text-white bg-navy-primary rounded hover:bg-[#0a1a7a] font-bold">Aplicar</button></div></div></div></div>)}
        
        {isSaving && (<div className="fixed inset-0 bg-black bg-opacity-30 z-[60] flex items-center justify-center backdrop-blur-sm"><div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center gap-4"><div className="animate-spin h-8 w-8 border-4 border-navy-primary border-t-transparent rounded-full"></div><span className="text-navy-primary font-bold font-header text-lg">PROCESSANDO...</span></div></div>)}

        <Toast 
            message={toast.message} 
            type={toast.type} 
            isVisible={toast.isVisible} 
            onClose={hideToast} 
        />
    </Layout>
  );
}
export default App;