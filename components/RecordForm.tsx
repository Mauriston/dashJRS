import React, { useEffect, useState, useMemo, useRef } from 'react';
import { InspectionRecord, Doctor, Finality, Organization, Rank } from '../types';
import { Button } from './ui/Button';
import { X, Calendar as CalendarIcon, ChevronDown, ChevronUp, Printer, FileText, User, Activity, CheckCircle } from 'lucide-react';
import { MILITARY_DATA } from '../services/militaryData';

interface RecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: InspectionRecord) => void;
  initialData?: InspectionRecord;
  doctors: Doctor[];
  finalities: Finality[];
  orgs: Organization[];
  ranks: Rank[];
  restrictions: string[];
  statusList?: string[];
  msgList?: string[];
  isReadOnly?: boolean;
}

export const RecordForm: React.FC<RecordFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  doctors,
  finalities,
  orgs,
  ranks,
  restrictions = [],
  statusList = [],
  msgList = [],
  isReadOnly = false
}) => {
  const [formData, setFormData] = useState<InspectionRecord>({
    id: '', isNumber: '', dataAbertura: '', dataEntrevista: '', horaEntrevista: '',
    finalidade: '', amp: '', medico: '', om: '', pgq: '', nip: '', inspecionado: '',
    statusIS: 'IS aberta', dataLaudo: '', laudo: '', observacoes: '', restricoes: '',
    tis: '', ds1a: '', msg: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Controle de edição manual para novos militares
  // Se false, campos OM e PGQ ficam travados (puxados do banco). Se true, permite edição.
  const [isManualEntry, setIsManualEntry] = useState(false);

  // Restrictions State
  const [isRestrictionsOpen, setIsRestrictionsOpen] = useState(false);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [customRestrictionValues, setCustomRestrictionValues] = useState<{[key: string]: string}>({});

  const datePickerRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  // Reset & Initialize
  useEffect(() => {
    setErrors({});
    setIsRestrictionsOpen(false);
    
    // Default values
    let initialValues = initialData || {
        id: '', isNumber: '', dataAbertura: new Date().toLocaleDateString('pt-BR'),
        dataEntrevista: '', horaEntrevista: '', finalidade: '', amp: '', medico: '',
        om: '', pgq: '', nip: '', inspecionado: '', statusIS: 'IS aberta',
        dataLaudo: '', laudo: '', observacoes: '', restricoes: '', tis: '', ds1a: '', msg: ''
    };
    
    setFormData(initialValues);
    
    // Se estiver editando (tem initialData), permite edição manual por padrão, 
    // ou verifica se já existe no banco para travar (opcional). 
    // Para simplificar a UX de edição: se já existe, deixamos livre ou travado? 
    // A regra diz: "Inicialmente desabilitados. Se não estiver na aba, habilitar".
    // Vamos verificar se o dado inicial bate com o banco.
    if (initialData?.nip) {
        const exists = MILITARY_DATA.some(m => m.nip.replace(/\D/g, '') === initialData.nip.replace(/\D/g, ''));
        setIsManualEntry(!exists);
    } else {
        setIsManualEntry(false); // Novo registro começa travado até digitar algo novo
    }

    // Parse Restrictions Logic
    if (initialValues.restricoes) {
        const currentRestr = initialValues.restricoes.split(',').map(s => s.trim());
        const matched: string[] = [];
        const customVals: {[key: string]: string} = {};

        currentRestr.forEach(val => {
            if (restrictions.includes(val)) {
                matched.push(val);
            } else {
                if (val.startsWith("Movimentos repetitivos com sobrecarga do ")) {
                    const key = "Movimentos repetitivos com sobrecarga do __________";
                    const customContent = val.replace("Movimentos repetitivos com sobrecarga do ", "");
                    matched.push(key);
                    customVals[key] = customContent;
                } else if (val.startsWith("Permanecer em pé ou sentado por período acima de ")) {
                    const key = "Permanecer em pé ou sentado por período acima de _____ min.";
                    const match = val.match(/acima de (.*) min\./);
                    if (match && match[1]) {
                        matched.push(key);
                        customVals[key] = match[1];
                    }
                } else {
                    if (val) matched.push(val);
                }
            }
        });
        setSelectedRestrictions(matched);
        setCustomRestrictionValues(customVals);
    } else {
        setSelectedRestrictions([]);
        setCustomRestrictionValues({});
    }

  }, [initialData, isOpen, restrictions]);

  // Sync Restrictions to formData (Only needed in Edit Mode)
  useEffect(() => {
    if (isReadOnly) return;
    const compiledRestrictions = selectedRestrictions.map(r => {
        if (r === "Movimentos repetitivos com sobrecarga do __________") {
            const val = customRestrictionValues[r] || "__________";
            return `Movimentos repetitivos com sobrecarga do ${val}`;
        }
        if (r === "Permanecer em pé ou sentado por período acima de _____ min.") {
            const val = customRestrictionValues[r] || "_____";
            return `Permanecer em pé ou sentado por período acima de ${val} min.`;
        }
        return r;
    }).join(', ');
    
    setFormData(prev => ({ ...prev, restricoes: compiledRestrictions }));
  }, [selectedRestrictions, customRestrictionValues, isReadOnly]);


  // --- HELPERS ---
  const isValidDateFormat = (dateString: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(dateString);
  const parseDate = (dateString: string): Date | null => {
    if (!isValidDateFormat(dateString)) return null;
    const parts = dateString.split('/');
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };
  const getDayName = (dateString: string) => {
    const date = parseDate(dateString);
    if (!date) return null;
    const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    return days[date.getDay()];
  };

  const getTisPrefix = (dataLaudoStr: string) => {
    let year = new Date().getFullYear().toString();
    if (isValidDateFormat(dataLaudoStr)) {
        const parts = dataLaudoStr.split('/');
        if (parts.length === 3) year = parts[2];
    }
    const suffix = year.slice(-3);
    return `${suffix}.000.`;
  };

  // --- HANDLERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'inspecionado') finalValue = value.toUpperCase();

    let updatedFormData = { ...formData };

    // --- LÓGICA DE AUTOCOMPLETE E TRAVAMENTO DE CAMPOS ---
    if (name === 'nip') {
        let v = value.replace(/\D/g, '');
        if (v.length > 8) v = v.slice(0, 8);
        if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{1,2})/, '$1.$2.$3');
        else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,4})/, '$1.$2');
        finalValue = v;
        
        const cleanTyped = v.replace(/\D/g, '');
        if (cleanTyped.length >= 7) { // Começa a buscar com 7 ou 8 digitos
             const found = MILITARY_DATA.find(m => m.nip.replace(/\D/g, '').includes(cleanTyped));
             if (found && cleanTyped.length >= 8) { // Match exato ou completo
                 updatedFormData.inspecionado = found.inspecionado;
                 updatedFormData.om = found.om;
                 updatedFormData.pgq = found.pgq;
                 setIsManualEntry(false); // Trava campos pois achou no banco
             } else if (cleanTyped.length >= 8) {
                 setIsManualEntry(true); // NIP completo mas não achou: Habilita manual
             }
        }
    }

    if (name === 'inspecionado') {
        // Busca pelo nome exato (ou autocomplete)
        const found = MILITARY_DATA.find(m => m.inspecionado === finalValue);
        if (found) {
            updatedFormData.nip = found.nip;
            updatedFormData.om = found.om;
            updatedFormData.pgq = found.pgq;
            setIsManualEntry(false); // Achou, trava campos
        } else {
            // Se o usuário digitou algo que não está na lista, habilita para cadastro novo
            // Pequeno delay ou verificação de tamanho para não habilitar enquanto digita
            if (finalValue.length > 3) setIsManualEntry(true);
        }
    }

    if (name === 'tis') {
        const prefix = getTisPrefix(formData.dataLaudo);
        if (!value.startsWith(prefix)) {
             const cleanInput = value.replace(/\D/g, '');
             if (cleanInput.length > 0) {
                 const rawNums = value.split('.').join('');
                 const suffixPart = value.replace(prefix, '').replace(/\D/g, '');
                 finalValue = prefix + suffixPart;
             } else {
                 finalValue = prefix;
             }
        } else {
             const suffixPart = value.replace(prefix, '').replace(/\D/g, '');
             finalValue = prefix + suffixPart;
        }
    }

    updatedFormData[name as keyof InspectionRecord] = finalValue;

    if (name === 'isNumber' && !initialData) updatedFormData.id = finalValue;

    if (name === 'finalidade') {
        const selectedFinality = finalities.find(f => f.nome === value);
        if (selectedFinality) updatedFormData.amp = selectedFinality.amp;
    }

    if (name === 'dataLaudo') {
         const oldPrefix = getTisPrefix(formData.dataLaudo);
         const newPrefix = getTisPrefix(finalValue);
         if (updatedFormData.tis === oldPrefix || updatedFormData.tis === '') {
             updatedFormData.tis = newPrefix;
         } else if (updatedFormData.tis.startsWith(oldPrefix)) {
             updatedFormData.tis = updatedFormData.tis.replace(oldPrefix, newPrefix);
         }
    }

    const fieldsAffectingStatus = ['tis', 'ds1a', 'laudo', 'dataEntrevista', 'observacoes'];
    if (fieldsAffectingStatus.includes(name)) {
        const vDS1a = (name === 'ds1a' ? finalValue : updatedFormData.ds1a).trim();
        const vTIS = (name === 'tis' ? finalValue : updatedFormData.tis).trim();
        const vLaudo = (name === 'laudo' ? finalValue : updatedFormData.laudo).trim();
        const vDataEnt = (name === 'dataEntrevista' ? finalValue : updatedFormData.dataEntrevista).trim();
        const vObs = (name === 'observacoes' ? finalValue : updatedFormData.observacoes).trim();
        
        let novoStatus = updatedFormData.statusIS;
        if (vDS1a !== "" && vTIS !== "" && vLaudo !== "") novoStatus = "TIS assinado";
        else if (vTIS !== "" && vLaudo !== "") novoStatus = "IS Votada s/ assinatura";
        else if (vLaudo !== "") novoStatus = "IS Concluída s/ voto";
        else if (vDataEnt !== "") {
            const isEdicao = !!initialData;
            const dataAntiga = initialData?.dataEntrevista;
            if (isEdicao && dataAntiga && vDataEnt !== dataAntiga) novoStatus = "IS Remarcada";
            else if (vObs !== "") novoStatus = "Conclusão Pendente";
            else if (['IS aberta', 'Faltou'].includes(updatedFormData.statusIS) || !updatedFormData.statusIS) novoStatus = "IS Agendada";
        } 
        else {
             if (updatedFormData.statusIS === 'IS Agendada') novoStatus = "IS aberta";
        }
        updatedFormData.statusIS = novoStatus;
        if (novoStatus === "IS Concluída s/ voto" && !updatedFormData.dataLaudo) updatedFormData.dataLaudo = new Date().toLocaleDateString('pt-BR');
        if (novoStatus === "TIS assinado" && updatedFormData.msg !== "MSG ENVIADA") updatedFormData.msg = "MSG PENDENTE";
    }

    setFormData(updatedFormData);
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleDateChange = (name: string, dateValue: string) => {
      if (!dateValue) return;
      const [y, m, d] = dateValue.split('-');
      const formatted = `${d}/${m}/${y}`;
      handleChange({ target: { name, value: formatted } } as any);
  };

  const toggleRestriction = (item: string) => {
      setSelectedRestrictions(prev => {
          if (prev.includes(item)) return prev.filter(i => i !== item);
          return [...prev, item];
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    if (!isValidDateFormat(formData.dataAbertura)) newErrors.dataAbertura = 'Formato inválido. Use DD/MM/AAAA.';
    if (formData.dataEntrevista && !isValidDateFormat(formData.dataEntrevista)) newErrors.dataEntrevista = 'Formato inválido. Use DD/MM/AAAA.';
    if (isValidDateFormat(formData.dataAbertura) && isValidDateFormat(formData.dataEntrevista)) {
        const abert = parseDate(formData.dataAbertura);
        const entre = parseDate(formData.dataEntrevista);
        if (abert && entre && entre < abert) newErrors.dataEntrevista = 'Data da entrevista não pode ser anterior à abertura.';
    }
    if (formData.dataLaudo && !isValidDateFormat(formData.dataLaudo)) newErrors.dataLaudo = 'Formato inválido. Use DD/MM/AAAA.';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    onSave(formData);
  };

  // --- RENDERS ---
  const availableDoctors = useMemo(() => {
    let filtered = doctors;
    if (formData.amp) filtered = filtered.filter(d => d.amp.includes(formData.amp));
    if (formData.dataEntrevista && isValidDateFormat(formData.dataEntrevista)) {
      const dayName = getDayName(formData.dataEntrevista);
      if (dayName) filtered = filtered.filter(d => d.diasSemana.includes(dayName));
    }
    return filtered;
  }, [doctors, formData.amp, formData.dataEntrevista]);

  const showRestrictions = ['VERIFICAÇÃO DE DEFICIÊNCIA FUNCIONAL', 'TÉRMINO DE RESTRIÇÕES', 'TÉRMINO DE INCAPACIDADE'].includes(formData.finalidade);

  // Components for ReadOnly Mode
  const DetailItem = ({ label, value, full = false, highlight = false }: { label: string, value: string | undefined | null, full?: boolean, highlight?: boolean }) => (
      <div className={`flex flex-col ${full ? 'col-span-full' : ''} mb-2`}>
          <span className="text-[10px] font-bold text-navy-primary uppercase tracking-wider mb-1 opacity-70">{label}</span>
          <div className={`text-sm ${highlight ? 'font-bold text-navy-primary bg-blue-50 p-2 rounded border border-blue-100' : 'text-gray-800 font-medium break-words'}`}>
              {value || '-'}
          </div>
      </div>
  );

  const SectionHeader = ({ title, icon }: { title: string, icon?: React.ReactNode }) => (
      <div className="col-span-full mt-4 mb-3 border-b border-gray-200 pb-2 flex items-center gap-2">
          {icon}
          <h4 className="text-sm font-bold text-navy-primary uppercase tracking-wide">
              {title}
          </h4>
      </div>
  );

  // Components for Edit Mode
  const DateInputGroup = ({ label, name, value, error }: any) => {
    const pickerValue = value && isValidDateFormat(value) ? value.split('/').reverse().join('-') : '';
    const handleIconClick = () => { if (datePickerRefs.current[name]) { try { (datePickerRefs.current[name] as any).showPicker(); } catch(e) { datePickerRefs.current[name]?.focus(); } } };
    return (
        <div className="flex flex-col relative group">
            <label className="text-xs font-bold text-navy-primary mb-1">{label}</label>
            <div className="relative flex items-center">
                <input type="text" name={name} value={value} onChange={handleChange} className={`border p-2 rounded text-sm focus:outline-none w-full bg-white z-0 ${error ? 'border-red-500' : 'focus:border-navy-primary'}`} placeholder="DD/MM/AAAA" maxLength={10} />
                <div className="absolute right-0 top-0 h-full w-[40px] flex items-center justify-center cursor-pointer z-10 hover:text-navy-primary text-gray-400" onClick={handleIconClick}><CalendarIcon size={18} /></div>
                <input type="date" ref={(el) => { datePickerRefs.current[name] = el; }} value={pickerValue} onChange={(e) => handleDateChange(name, e.target.value)} className="absolute right-0 top-0 w-[40px] h-full opacity-0 cursor-pointer z-20" tabIndex={-1} />
            </div>
            {error && <span className="text-[10px] text-red-600 mt-0.5">{error}</span>}
        </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black bg-opacity-50 overflow-y-auto py-4 md:py-10">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-2 md:m-4 flex flex-col max-h-[95vh] md:max-h-full">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-navy-primary text-white rounded-t-lg">
          <h3 className="text-lg font-bold font-sans flex items-center gap-2">
              {isReadOnly ? <><FileText size={20} /> Detalhamento da Inspeção</> : (initialData ? 'Editar Inspeção de Saúde' : 'Nova Inspeção de Saúde')}
          </h3>
          <div className="flex gap-2">
              {isReadOnly && <button className="hover:bg-white/10 p-1 rounded transition" title="Imprimir (Simulado)"><Printer size={20} /></button>}
              <button onClick={onClose} className="hover:bg-navy-yellow hover:text-navy-primary rounded p-1 transition"><X size={20} /></button>
          </div>
        </div>

        {isReadOnly ? (
            /* --- READ ONLY VIEW --- */
            <div className="p-4 md:p-8 overflow-y-auto bg-gray-50/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {/* Header Block */}
                    <div className="col-span-full flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-2">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-500 uppercase">Número da IS</span>
                            <span className="text-3xl font-black text-navy-primary">{formData.isNumber || 'N/A'}</span>
                        </div>
                        <div className={`px-4 py-2 rounded-full font-bold text-sm border ${formData.statusIS.includes('Concluída') || formData.statusIS.includes('TIS') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                            {formData.statusIS}
                        </div>
                    </div>

                    {/* Section 1: Inspecionado */}
                    <div className="col-span-full md:col-span-3 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <SectionHeader title="Dados do Inspecionado" icon={<User size={18} />} />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <DetailItem label="NIP" value={formData.nip} />
                            <DetailItem label="Posto/Grad" value={formData.pgq} />
                            <DetailItem label="OM" value={formData.om} />
                            <div className="md:col-span-1"></div>
                            <DetailItem label="Nome Completo" value={formData.inspecionado} full />
                        </div>
                    </div>

                    {/* Section 2: Inspeção */}
                    <div className="col-span-full md:col-span-3 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <SectionHeader title="Dados da Inspeção" icon={<Activity size={18} />} />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <DetailItem label="Data Abertura" value={formData.dataAbertura} />
                            <DetailItem label="Finalidade" value={formData.finalidade} />
                            <DetailItem label="AMP" value={formData.amp} />
                            <DetailItem label="Médico" value={formData.medico} />
                            <DetailItem label="Data Entrevista" value={formData.dataEntrevista} />
                            <DetailItem label="Hora" value={formData.horaEntrevista} />
                        </div>
                    </div>

                    {/* Section 3: Conclusão */}
                    <div className="col-span-full md:col-span-3 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <SectionHeader title="Conclusão e Documentos" icon={<CheckCircle size={18} />} />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <DetailItem label="Data Laudo" value={formData.dataLaudo} />
                            <DetailItem label="Status MSG" value={formData.msg} />
                            <DetailItem label="Nº TIS" value={formData.tis} highlight={!!formData.tis} />
                            <DetailItem label="DS-1A" value={formData.ds1a} highlight={!!formData.ds1a} />
                        </div>
                        
                        <div className="mt-4 bg-gray-50 p-4 rounded border border-gray-200">
                             <span className="text-[10px] font-bold text-navy-primary uppercase tracking-wider mb-2 block">Laudo / Parecer</span>
                             <p className="text-sm text-gray-800 whitespace-pre-wrap">{formData.laudo || 'Sem laudo registrado.'}</p>
                        </div>

                        {formData.restricoes && (
                            <div className="mt-4 bg-yellow-50 p-4 rounded border border-yellow-200">
                                <span className="text-[10px] font-bold text-yellow-800 uppercase tracking-wider mb-2 block">Restrições</span>
                                <p className="text-sm text-gray-800">{formData.restricoes}</p>
                            </div>
                        )}

                        {formData.observacoes && (
                            <div className="mt-4">
                                <span className="text-[10px] font-bold text-navy-primary uppercase tracking-wider mb-1 block">Observações</span>
                                <p className="text-sm text-gray-600 italic">{formData.observacoes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            /* --- EDIT FORM VIEW --- */
            <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* --- CAMPO DESTAQUE: Nº IS --- */}
                <div className="flex flex-col md:col-span-1 p-3 bg-blue-50 rounded border border-blue-100">
                    <label className="text-xs font-black text-navy-primary mb-1">Nº IS (Identificador) *</label>
                    <input required name="isNumber" value={formData.isNumber} onChange={handleChange} className="border p-2 rounded text-sm focus:border-navy-primary outline-none font-bold text-navy-primary" placeholder="Ex: 1127905" />
                </div>
                <div className="hidden md:block md:col-span-2"></div>

                {/* --- SEÇÃO 1: DADOS DO INSPECIONADO --- */}
                <SectionHeader title="Dados do Inspecionado" />
                
                {/* Campo NIP */}
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-navy-primary mb-1">NIP</label>
                    <input 
                        required 
                        name="nip" 
                        value={formData.nip} 
                        onChange={handleChange} 
                        className="border p-2 rounded text-sm focus:border-navy-primary outline-none" 
                        placeholder="00.0000.00" 
                        maxLength={10} 
                    />
                </div>

                {/* Campo P/G/Q - Habilitado somente se entrada manual */}
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-navy-primary mb-1">P/G/Q</label>
                    <input 
                        list="ranks" 
                        name="pgq" 
                        value={formData.pgq} 
                        onChange={handleChange} 
                        className={`border p-2 rounded text-sm focus:border-navy-primary outline-none ${!isManualEntry ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                        disabled={!isManualEntry}
                    />
                    <datalist id="ranks">{ranks.map((r, i) => <option key={i} value={r.sigla} />)}</datalist>
                </div>

                {/* Campo OM - Habilitado somente se entrada manual */}
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-navy-primary mb-1">OM</label>
                    <input 
                        list="orgs" 
                        name="om" 
                        value={formData.om} 
                        onChange={handleChange} 
                        className={`border p-2 rounded text-sm focus:border-navy-primary outline-none ${!isManualEntry ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                        disabled={!isManualEntry}
                    />
                    <datalist id="orgs">{orgs.map((o, i) => <option key={i} value={o.sigla} />)}</datalist>
                </div>

                {/* Campo Inspecionado com Autocomplete */}
                <div className="flex flex-col md:col-span-3">
                    <label className="text-xs font-bold text-navy-primary mb-1">Nome do Inspecionado</label>
                    <input 
                        required 
                        list="military-names"
                        name="inspecionado" 
                        value={formData.inspecionado} 
                        onChange={handleChange} 
                        className="border p-2 rounded text-sm focus:border-navy-primary outline-none uppercase" 
                        placeholder="Digite o nome ou selecione..."
                    />
                    <datalist id="military-names">
                        {MILITARY_DATA.map((m, i) => (
                            <option key={i} value={m.inspecionado} />
                        ))}
                    </datalist>
                </div>

                {/* --- SEÇÃO 2: DADOS DA INSPEÇÃO --- */}
                <SectionHeader title="Dados da Inspeção" />
                <DateInputGroup label="Data Abertura" name="dataAbertura" value={formData.dataAbertura} error={errors.dataAbertura} />
                <div className="flex flex-col md:col-span-2"><label className="text-xs font-bold text-navy-primary mb-1">Finalidade</label><select required name="finalidade" value={formData.finalidade} onChange={handleChange} className="border p-2 rounded text-sm focus:border-navy-primary outline-none bg-white"><option value="">Selecione...</option>{finalities.map((f, i) => <option key={i} value={f.nome}>{f.nome}</option>)}</select></div>
                <div className="flex flex-col"><label className="text-xs font-bold text-navy-primary mb-1">AMP</label><input readOnly name="amp" value={formData.amp} className="border p-2 rounded text-sm bg-gray-100 text-gray-500" /></div>
                <DateInputGroup label="Data Entrevista" name="dataEntrevista" value={formData.dataEntrevista} error={errors.dataEntrevista} />
                <div className="flex flex-col"><label className="text-xs font-bold text-navy-primary mb-1">Hora Entrevista</label><input type="time" name="horaEntrevista" value={formData.horaEntrevista} onChange={handleChange} className="border p-2 rounded text-sm focus:border-navy-primary outline-none" /></div>
                <div className="flex flex-col md:col-span-3"><label className="text-xs font-bold text-navy-primary mb-1">Médico</label><select required name="medico" value={formData.medico} onChange={handleChange} className="border p-2 rounded text-sm focus:border-navy-primary outline-none bg-white"><option value="">Selecione...</option>{availableDoctors.length > 0 ? (availableDoctors.map((d, i) => <option key={i} value={d.nome}>{d.nome}</option>)) : (<option value="" disabled>Nenhum médico disponível para este dia/AMP</option>)}</select>{availableDoctors.length === 0 && formData.amp && formData.dataEntrevista && (<span className="text-[10px] text-red-500 mt-0.5">Sem médicos cadastrados para esta combinação de AMP e Dia.</span>)}</div>

                {/* --- SEÇÃO 3: DADOS PARA CONCLUSÃO --- */}
                <SectionHeader title="Dados para Conclusão" />
                <div className="flex flex-col"><label className="text-xs font-bold text-navy-primary mb-1">Status IS</label><select name="statusIS" value={formData.statusIS} onChange={handleChange} className="border p-2 rounded text-sm focus:border-navy-primary outline-none bg-white">{statusList.length > 0 ? statusList.map((s, i) => <option key={i} value={s}>{s}</option>) : <option value="IS aberta">IS aberta</option>}</select></div>
                <DateInputGroup label="Data Laudo" name="dataLaudo" value={formData.dataLaudo} error={errors.dataLaudo} />
                <div className="flex flex-col"><label className="text-xs font-bold text-navy-primary mb-1">MSG</label><select name="msg" value={formData.msg} onChange={handleChange} className="border p-2 rounded text-sm focus:border-navy-primary outline-none bg-white"><option value="">-</option>{msgList.length > 0 ? msgList.map((m, i) => <option key={i} value={m}>{m}</option>) : <><option value="MSG ENVIADA">MSG ENVIADA</option><option value="MSG PENDENTE">MSG PENDENTE</option><option value="MSG ATRASADA">MSG ATRASADA</option></>}</select></div>
                <div className="flex flex-col"><label className="text-xs font-bold text-navy-primary mb-1">Nº TIS</label><input type="text" name="tis" value={formData.tis} onChange={handleChange} className="border p-2 rounded text-sm focus:border-navy-primary outline-none" placeholder="000.000.0000" /></div>
                <div className="flex flex-col md:col-span-2"><label className="text-xs font-bold text-navy-primary mb-1">DS-1A</label><input type="text" name="ds1a" value={formData.ds1a} onChange={handleChange} className="border p-2 rounded text-sm focus:border-navy-primary outline-none" /></div>
                <div className="flex flex-col md:col-span-3"><label className="text-xs font-bold text-navy-primary mb-1">Laudo / Parecer</label><textarea rows={3} name="laudo" value={formData.laudo} onChange={handleChange} className="border p-2 rounded text-sm focus:border-navy-primary outline-none resize-y" /></div>
                
                {showRestrictions && (
                    <div className="flex flex-col md:col-span-3 border border-gray-200 rounded-md overflow-hidden transition-all">
                        <div className="bg-gray-100 p-2 flex justify-between items-center cursor-pointer hover:bg-gray-200" onClick={() => setIsRestrictionsOpen(!isRestrictionsOpen)}>
                            <label className="text-xs font-bold text-navy-primary cursor-pointer select-none">Restrições ({selectedRestrictions.length} selecionadas)</label>
                            {isRestrictionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        {isRestrictionsOpen && (
                            <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-2 border-t border-gray-200 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {restrictions.map((item, idx) => { 
                                    const isSelected = selectedRestrictions.includes(item); 
                                    const isCustomInput = item.includes("__________") || item.includes("_____ min."); 
                                    return (
                                        <div key={idx} className="flex flex-col text-[12px]">
                                            <div className="flex items-start gap-2 p-1 hover:bg-gray-50 rounded">
                                                <input type="checkbox" checked={isSelected} onChange={() => toggleRestriction(item)} className="mt-0.5" />
                                                <span className="leading-tight text-gray-700">{item}</span>
                                            </div>
                                            {isSelected && isCustomInput && (
                                                <div className="pl-6 pr-2 mb-2"><input type="text" value={customRestrictionValues[item] || ''} onChange={(e) => setCustomRestrictionValues({...customRestrictionValues, [item]: e.target.value})} className="w-full border-b border-gray-300 text-[11px] focus:outline-none focus:border-navy-primary px-1 py-0.5 bg-yellow-50" placeholder="Preencher detalhe..." autoFocus /></div>
                                            )}
                                        </div>
                                    ); 
                                })}
                            </div>
                        )}
                    </div>
                )}
                
                <div className="flex flex-col md:col-span-3"><label className="text-xs font-bold text-navy-primary mb-1">Observações</label><textarea rows={2} name="observacoes" value={formData.observacoes} onChange={handleChange} className="border p-2 rounded text-sm focus:border-navy-primary outline-none resize-y" /></div>
            </form>
        )}

        {/* Footer actions - Only show Save in Edit Mode */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
            <Button variant="ghost" onClick={onClose}>{isReadOnly ? 'Fechar' : 'Cancelar'}</Button>
            {!isReadOnly && <Button variant="primary" onClick={(e) => handleSubmit(e as any)}>Salvar</Button>}
        </div>
      </div>
    </div>
  );
};