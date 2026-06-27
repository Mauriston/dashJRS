
import { InspectionRecord, Doctor, Finality, Organization, Rank } from '../types';

export const DOCTORS: Doctor[] = [
  { nome: "CT MAURISTON", amp: "JRS, MPI", diasSemana: "Quinta, Sexta" },
  { nome: "CT SALYNE", amp: "JRS", diasSemana: "Terça, Quarta, Quinta, Sexta" },
  { nome: "CT LUZ", amp: "JRS", diasSemana: "Terça, Sexta" },
  { nome: "CT JÚLIO CÉSAR", amp: "MPI", diasSemana: "Segunda" },
  { nome: "2T TRINDADE", amp: "MPI", diasSemana: "Segunda, Quarta, Quinta" }
];

export const FINALITIES: Finality[] = [
  { nome: "BENEFÍCIO", amp: "JRS" },
  { nome: "CONCLUSÃO DE CURSO DE FORMAÇÃO DE MILITARES DE CARREIRA", amp: "MPI" },
  { nome: "CONTROLE SEMESTRAL DE RAIO-X", amp: "MPI" },
  { nome: "CONTROLE TRIENAL", amp: "MPI" },
  { nome: "DEIXAR O SAM", amp: "MPI" },
  { nome: "DEIXAR O SMI", amp: "MPI" },
  { nome: "DEIXAR O SMV", amp: "MPI" },
  { nome: "ENGAJAMENTO / DEIXAR O SMI", amp: "MPI" },
  { nome: "INGRESSO CFSD-FN", amp: "JRS" },
  { nome: "INGRESSO NA EAM", amp: "JRS" },
  { nome: "INGRESSO NA EFOMM", amp: "JRS" },
  { nome: "INGRESSO NO CEM", amp: "JRS" },
  { nome: "INGRESSO NO CP-T", amp: "JRS" },
  { nome: "INGRESSO NO CSM-Md", amp: "JRS" },
  { nome: "INGRESSO NO QC-CA-FN-IM", amp: "JRS" },
  { nome: "INGRESSO NO SMV", amp: "JRS" },
  { nome: "INGRESSO NO SMV (ORIUNDO DO SMI)", amp: "MPI" },
  { nome: "LICENÇA PARA TRATAMENTO DE PESSOA DA FAMÍLIA", amp: "JRS" },
  { nome: "LOCALIDADE COM DEFICIÊNCIA EM ASSISTÊNCIA SANITÁRIA", amp: "MPI" },
  { nome: "MISSÃO NO EXTERIOR", amp: "MPI" },
  { nome: "REENGAJAMENTO PARA SMV / DEIXAR O SMV", amp: "MPI" },
  { nome: "TAREFA POR TEMPO CERTO", amp: "MPI" },
  { nome: "TÉRMINO DE INCAPACIDADE", amp: "JRS" },
  { nome: "TÉRMINO DE RESTRIÇÕES", amp: "JRS" },
  { nome: "VERIFICAÇÃO DE APTIDÃO PARA PROSSEGUIMENTO NO CURSO", amp: "JRS" },
  { nome: "VERIFICAÇÃO DE DEFICIÊNCIA FUNCIONAL", amp: "JRS" }
];

export const RESTRICTIONS_LIST: string[] = [
    "Embarque",
    "Embarque em Aeronaves",
    "Manobras Operativas",
    "Marchas",
    "Segurança/Guarda/Escolta",
    "Serviço Armado",
    "TAF/TFM",
    "TAF/TFM (Exceto caminhadas)",
    "TAF/TFM(Exceto Caminhadas e Natação)",
    "TAF/TFM (Exceto natação)",
    "Carregar peso",
    "Dirigir ou manobrar veículos Automotores",
    "Esforços físicos intensos e extenuantes",
    "Exercícios Isométricos",
    "Formatura",
    "Movimentos repetitivos com sobrecarga do __________",
    "Operar Equipamentos de Precisão",
    "Operar máquinas pesadas",
    "Operar quadros de eletricidade",
    "Permanecer em pé ou sentado por período acima de _____ min.",
    "Postura Viciosas",
    "Serviço Noturno",
    "Serviços em locais elevados",
    "Subir e descer escadas repetidamente"
];

export const ORGANIZATIONS: Organization[] = [
    { sigla: "HNRe" }, { sigla: "CPAL" }, { sigla: "EAMPE" }, { sigla: "CPPE" }, { sigla: "CPPB" }, { sigla: "BFNRM" }, { sigla: "CCEM" }, { sigla: "BAENSPA" }, { sigla: "COMGPTPATNAVNE" }
];

export const RANKS: Rank[] = [
    { sigla: "CT" }, { sigla: "1T" }, { sigla: "2T" }, { sigla: "SO" }, { sigla: "1SG" }, { sigla: "2SG" }, { sigla: "3SG" }, { sigla: "CB" }, { sigla: "MN" }, { sigla: "SD" }, { sigla: "GR" }, { sigla: "CANDIDATO" }, { sigla: "ALUNO" }, { sigla: "DEP" }
];

// Sample of the provided data
export const INITIAL_RECORDS: InspectionRecord[] = [
  {
    id: "1127905", // ID Matches IS
    isNumber: "1127905",
    dataAbertura: "05/06/2025",
    dataEntrevista: "11/06/2025",
    horaEntrevista: "07:30",
    finalidade: "BENEFÍCIO",
    amp: "JRS",
    medico: "CT LUZ",
    om: "CPAL",
    pgq: "DEP",
    nip: "03.8589.61",
    inspecionado: "MARIA DALVA LEITE TITO",
    statusIS: "TIS assinado",
    dataLaudo: "26/08/2025",
    laudo: "A doença especificada em Lei...",
    observacoes: "",
    restricoes: "",
    tis: "250.005.8169",
    ds1a: "2025Z1135E1",
    msg: "MSG ENVIADA"
  },
  {
    id: "1114725",
    isNumber: "1114725",
    dataAbertura: "28/06/2025",
    dataEntrevista: "04/07/2025",
    horaEntrevista: "07:30",
    finalidade: "BENEFÍCIO",
    amp: "JRS",
    medico: "CT LUZ",
    om: "EAMPE",
    pgq: "DEP",
    nip: "113.207.654-40",
    inspecionado: "SAMUEL LUCAS MOURA E SILVA",
    statusIS: "TIS assinado",
    dataLaudo: "09/07/2025",
    laudo: "É portador(a) de Esquizofrenia...",
    observacoes: "",
    restricoes: "",
    tis: "250.003.3018",
    ds1a: "2025Z110265",
    msg: "MSG ENVIADA"
  },
  {
    id: "1125268",
    isNumber: "1125268",
    dataAbertura: "19/08/2025",
    dataEntrevista: "25/08/2025",
    horaEntrevista: "07:30",
    finalidade: "TÉRMINO DE INCAPACIDADE",
    amp: "JRS",
    medico: "CT LUZ",
    om: "HNRe",
    pgq: "3SG-AD",
    nip: "13.1308.46",
    inspecionado: "HELOIZA GLÓRIA MOREIRA DE MATOS",
    statusIS: "TIS assinado",
    dataLaudo: "28/08/2025",
    laudo: "Incapaz temporariamente para o SAM...",
    observacoes: "",
    restricoes: "",
    tis: "",
    ds1a: "",
    msg: "MSG ENVIADA"
  },
  {
      id: "1074354",
      isNumber: "1074354",
      dataAbertura: "29/08/2025",
      dataEntrevista: "04/09/2025",
      horaEntrevista: "07:30",
      finalidade: "CONTROLE TRIENAL",
      amp: "MPI",
      medico: "2T TRINDADE",
      om: "HNRe",
      pgq: "1T (MD)",
      nip: "19.0294.11",
      inspecionado: "NELIA NOGUEIRA VIEIRA",
      statusIS: "TIS assinado",
      dataLaudo: "04/09/2025",
      laudo: "Apto para o SAM com restrições",
      observacoes: "",
      restricoes: "",
      tis: "",
      ds1a: "",
      msg: "MSG ENVIADA"
  },
   {
      id: "1131561",
      isNumber: "1131561",
      dataAbertura: "04/09/2025",
      dataEntrevista: "10/09/2025",
      horaEntrevista: "07:30",
      finalidade: "TÉRMINO DE RESTRIÇÕES",
      amp: "JRS",
      medico: "CT SALYNE",
      om: "HNRe",
      pgq: "2SG-AE",
      nip: "12.1391.49",
      inspecionado: "MARCELLY PALLAS MARTINS DA SILVA",
      statusIS: "TIS assinado",
      dataLaudo: "10/09/2025",
      laudo: "Apto para o SAM com restrições de 30 dias.",
      observacoes: "",
      restricoes: "Marchas, TAF/TFM(Exceto Caminhadas e Natação), Formatura",
      tis: "",
      ds1a: "",
      msg: "MSG ENVIADA"
  }
];
