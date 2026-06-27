import { InspectionRecord, AppData } from '../types';

// SUBSTITUA ESTA URL PELA URL DA SUA IMPLANTAÇÃO WEB DO APPS SCRIPT
const API_URL = 'https://script.google.com/macros/s/AKfycbwlp-33d8GkhdKR8IewFMRfgWXrmaAN2giSMZv9wovgMz1ualF6VwUJUNGbjkUGxaLJDg/exec'; 

const CACHE_KEY = 'inspection_records_cache';
const CACHE_TS_KEY = 'inspection_records_ts';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos

const clearCache = () => {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TS_KEY);
};

const normalizeRecord = (item: any): InspectionRecord => ({
    id: String(item.id || ''),
    isNumber: String(item.isNumber || ''),
    inspecionado: String(item.inspecionado || ''),
    nip: String(item.nip || ''),
    finalidade: String(item.finalidade || ''),
    amp: String(item.amp || ''),
    medico: String(item.medico || ''),
    om: String(item.om || ''),
    pgq: String(item.pgq || ''),
    statusIS: String(item.statusIS || ''),
    laudo: String(item.laudo || ''),
    observacoes: String(item.observacoes || ''),
    restricoes: String(item.restricoes || ''),
    tis: String(item.tis || ''),
    ds1a: String(item.ds1a || ''),
    dataAbertura: item.dataAbertura ? String(item.dataAbertura) : '',
    dataEntrevista: item.dataEntrevista ? String(item.dataEntrevista) : '',
    horaEntrevista: item.horaEntrevista ? String(item.horaEntrevista) : '',
    dataLaudo: item.dataLaudo ? String(item.dataLaudo) : '',
    msg: item.msg ? String(item.msg) : '' // Garante string vazia se undefined
});

export const api = {
  // Ler todos os dados (Registros + Listas)
  fetchData: async (): Promise<AppData> => {
    try {
      // Verificação do Cache
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTs = localStorage.getItem(CACHE_TS_KEY);

      if (cachedData && cachedTs) {
        const age = Date.now() - parseInt(cachedTs, 10);
        if (age < CACHE_DURATION) {
          console.log('Serving from cache');
          return JSON.parse(cachedData);
        }
      }

      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Erro ao buscar dados');
      
      const jsonResponse = await response.json();
      let result: AppData = { records: [] };

      // Verifica se a resposta é o formato novo { records: [], lists: {} } ou o antigo []
      if (Array.isArray(jsonResponse)) {
          // Formato Antigo (apenas array de registros)
          result.records = jsonResponse.map(normalizeRecord);
      } else if (jsonResponse && typeof jsonResponse === 'object') {
          // Formato Novo
          result.records = (jsonResponse.records || []).map(normalizeRecord);
          result.lists = jsonResponse.lists || {};
      }

      // Atualiza Cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
      localStorage.setItem(CACHE_TS_KEY, Date.now().toString());

      return result;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  // Mantido para compatibilidade, mas agora usa fetchData internamente se possível
  fetchRecords: async (): Promise<InspectionRecord[]> => {
      const data = await api.fetchData();
      return data.records;
  },

  // Criar registro (Create)
  createRecord: async (record: InspectionRecord): Promise<void> => {
    const cleanRecord = normalizeRecord(record);
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'create', record: cleanRecord }),
    });
    clearCache();
  },

  // Atualizar registro (Update)
  updateRecord: async (record: InspectionRecord): Promise<void> => {
    const cleanRecord = normalizeRecord(record);
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'update', record: cleanRecord }),
    });
    clearCache();
  },

  // Patch registro (Partial Update - New!)
  patchRecord: async (id: string, updates: Partial<InspectionRecord>): Promise<void> => {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'patch', id: id, updates: updates }),
    });
    clearCache();
  },

  // Deletar registro (Delete)
  deleteRecord: async (id: string): Promise<void> => {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', id }),
    });
    clearCache();
  }
};