export interface AppSettings {
  rootFolder: string | null;
  tiposDeVisita: string[];
  tecnicoNome: string;
  tecnicoEmpresa: string;
}

export interface VisitaRef {
  empresa: string;
  /** Formato AAAA-MM, ex: "2026-08" */
  mes: string;
  /** Formato DD, ex: "13" */
  dia: string;
  tipoVisita: string;
}

export interface LaudoData {
  empresa: string;
  data: string;
  tipoVisita: string;
  equipamento: string;
  problemaRelatado: string;
  diagnostico: string;
  servicoExecutado: string;
  pecasTrocadas: string;
  observacoes: string;
  tecnicoResponsavel: string;
  geradoEm: string;
}

export interface FileEntry {
  name: string;
  path: string;
  sizeBytes: number;
  mimeType: string;
}

export interface AppApi {
  settings: {
    get(): Promise<AppSettings>;
    save(settings: AppSettings): Promise<AppSettings>;
    chooseRootFolder(): Promise<string | null>;
  };
  empresas: {
    list(): Promise<string[]>;
    create(nome: string): Promise<void>;
  };
  visitas: {
    listMeses(empresa: string): Promise<string[]>;
    listDias(empresa: string, mes: string): Promise<string[]>;
    listTipos(empresa: string, mes: string, dia: string): Promise<string[]>;
    create(ref: VisitaRef): Promise<void>;
  };
  arquivos: {
    list(ref: VisitaRef, categoria: "fotos" | "videos"): Promise<FileEntry[]>;
    pickFiles(categoria: "fotos" | "videos"): Promise<string[]>;
    add(ref: VisitaRef, categoria: "fotos" | "videos", sourcePaths: string[]): Promise<FileEntry[]>;
    remove(ref: VisitaRef, categoria: "fotos" | "videos", fileName: string): Promise<void>;
    openInExplorer(ref: VisitaRef): Promise<void>;
  };
  laudo: {
    get(ref: VisitaRef): Promise<LaudoData | null>;
    generate(ref: VisitaRef, data: LaudoData): Promise<string>;
  };
}

declare global {
  interface Window {
    app: AppApi;
  }
}
