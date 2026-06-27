
export interface InspectionRecord {
  id: string; // Mapped to 'isNumber' (Column A) as unique identifier
  isNumber: string; // Col A: IS
  dataAbertura: string; // Col B: DataAberturaIS
  dataEntrevista: string; // Col C
  horaEntrevista: string; // Col D
  finalidade: string; // Col E
  amp: string; // Col F
  medico: string; // Col G
  om: string; // Col H
  pgq: string; // Col I (P/G/Q)
  nip: string; // Col J
  inspecionado: string; // Col K
  statusIS: string; // Col L
  dataLaudo: string; // Col M
  laudo: string; // Col N
  observacoes: string; // Col O
  restricoes: string; // Col P
  tis: string; // Col Q
  ds1a: string; // Col R (DS-1a)
  msg: string; // Col S
}

export interface Doctor {
  nome: string;
  amp: string;
  diasSemana: string;
}

export interface Finality {
  nome: string;
  amp: string;
}

export interface Organization {
  sigla: string;
}

export interface Rank {
  sigla: string;
}

export interface AppData {
  records: InspectionRecord[];
  lists?: {
      restricoes?: string[];
      finalidades?: string[];
      om?: string[];
      pg?: string[];
      status?: string[];
      msg?: string[];
  }
}